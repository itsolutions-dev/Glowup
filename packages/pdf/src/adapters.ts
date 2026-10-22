// The Expo implementations of the viewer's adapters. Every Expo module is loaded
// when first used, inside a try: an app that ships only a website installs none of
// them, and one that forgot to add the package to its dependencies gets a readable
// `native-missing` error instead of a crash at start-up (spike 0.3).
import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";
import { createPdfError, isPdfError, toPdfError } from "./errors";
import { looksLikePdf } from "./source";
import type {
  PdfActions,
  PdfCapabilities,
  PdfFiles,
  PdfMatch,
  PdfNative,
  PdfPageSize,
  PdfSaveResult,
} from "./types";

const load = async <T>(
  importer: () => Promise<T>,
  name: string,
): Promise<T> => {
  try {
    return await importer();
  } catch {
    throw createPdfError(
      "native-missing",
      `${name} is not installed: add it to the app's dependencies and make a new development build.`,
    );
  }
};

const fileSystem = () =>
  load(() => import("expo-file-system"), "expo-file-system");

const uniqueName = () =>
  `glowup-pdf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** The file operations over expo-file-system; `system` is how it is loaded (a fake one in the tests: jest has no dynamic `import()`). */
export const createExpoFiles = (system: typeof fileSystem): PdfFiles => ({
  async download(uri, headers, options) {
    const { File, Paths } = await system();
    const name = uniqueName();
    // It lands in a `.part` and gets its name only when it is whole and is a PDF: an aborted or failed
    // transfer, or a login page served with a 200, never reaches the native module as "the document".
    const part = new File(Paths.cache, `${name}.pdf.part`);
    try {
      await File.downloadFileAsync(uri, part, {
        headers,
        idempotent: true,
        signal: options?.signal,
        onProgress: options?.onProgress
          ? ({ bytesWritten, totalBytes }) =>
              options.onProgress!(
                totalBytes > 0 ? Math.min(1, bytesWritten / totalBytes) : null,
              )
          : undefined,
      });
      const handle = part.open();
      let head: Uint8Array;
      try {
        head = handle.readBytes(Math.min(1024, part.size));
      } finally {
        handle.close();
      }
      if (!looksLikePdf(head)) {
        throw createPdfError("format", "The downloaded file is not a PDF.");
      }
      const target = new File(Paths.cache, `${name}.pdf`);
      await part.move(target);
      return target.uri;
    } catch (error) {
      try {
        if (part.exists) part.delete();
      } catch {
        // Nothing more to do: the cache is the system's to clean.
      }
      throw error;
    }
  },
  async write(bytes) {
    const { File, Paths } = await system();
    const target = new File(Paths.cache, `${uniqueName()}.pdf`);
    target.create({ overwrite: true });
    target.write(bytes);
    return target.uri;
  },
  async remove(uri) {
    try {
      const { File } = await system();
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      // The cache is the system's to clean: failing to remove a copy is not worth an error.
    }
  },
});

export const expoFiles = createExpoFiles(fileSystem);

/** What a native error from the module means to the viewer. Expo reports a `code` on its exceptions. */
const fromNativeError = (error: unknown) => {
  if (isPdfError(error)) return error;
  const text = `${(error as { code?: unknown })?.code ?? ""} ${
    error instanceof Error ? error.message : String(error)
  }`.toUpperCase();
  if (text.includes("PASSWORD")) return toPdfError(error, "password");
  if (text.includes("FORMAT") || text.includes("INVALID")) {
    return toPdfError(error, "format");
  }
  return toPdfError(error, "unsupported");
};

type NativeModuleShape = {
  capabilities(): Promise<PdfCapabilities>;
  open(uri: string): Promise<{ pages: PdfPageSize[] }>;
  renderPage(uri: string, index: number, width: number): Promise<string>;
  searchPage(uri: string, page: number, query: string): Promise<PdfMatch[]>;
  close(uri: string): Promise<void>;
  /** Android only. Resolves to false where there is no Downloads folder to write to (before Android 10). */
  saveToDownloads(uri: string, name: string): Promise<boolean>;
};

const withModule = async <T>(
  run: (module: NativeModuleShape) => Promise<T>,
): Promise<T> => {
  const module = requireOptionalNativeModule<NativeModuleShape>("GlowupPdf");
  if (!module) {
    throw createPdfError(
      "native-missing",
      "The GlowupPdf native module is not in this app: add @its/glowup-pdf to the app's dependencies and make a new development build.",
    );
  }
  try {
    return await run(module);
  } catch (error) {
    throw fromNativeError(error);
  }
};

export const expoNative: PdfNative = {
  capabilities: async () => {
    // A missing module answers "no search": the error comes with `open`, where it can be shown.
    const module = requireOptionalNativeModule<NativeModuleShape>("GlowupPdf");
    return module ? module.capabilities() : { search: false };
  },
  open: (uri) => withModule((m) => m.open(uri)),
  renderPage: (uri, index, width) =>
    withModule((m) => m.renderPage(uri, index, width)),
  searchPage: (uri, page, query) =>
    withModule((m) => m.searchPage(uri, page, query)),
  close: (uri) => withModule((m) => m.close(uri)),
};

const withPdfExtension = (name = "document.pdf") =>
  /\.pdf$/i.test(name) ? name : `${name}.pdf`;

export const expoActions: PdfActions = {
  async print(uri) {
    const Print = await load(() => import("expo-print"), "expo-print");
    await Print.printAsync({ uri });
  },
  async save(uri, name): Promise<PdfSaveResult> {
    const fileName = name ? name.replace(/[\\/:*?"<>|]/g, "_") : undefined;
    // Android: straight into Downloads, the one place a person looks for a file they saved.
    if (Platform.OS === "android") {
      // A failed copy (no room, no module) is not worth an error while the share sheet can still hand the file over.
      const saved = await withModule((m) =>
        m.saveToDownloads(uri, withPdfExtension(fileName)),
      ).catch(() => false);
      if (saved) return "downloads";
    }
    const Sharing = await load(() => import("expo-sharing"), "expo-sharing");
    if (!(await Sharing.isAvailableAsync())) {
      throw createPdfError("unsupported", "Sharing is not available here.");
    }
    let target = uri;
    if (fileName) {
      // The cached copy has a made-up name; the share sheet shows the file's own.
      const { File, Paths } = await fileSystem();
      const copy = new File(Paths.cache, fileName);
      await new File(uri).copy(copy, { overwrite: true });
      target = copy.uri;
    }
    await Sharing.shareAsync(target, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: name,
    });
    return "shared";
  },
};
