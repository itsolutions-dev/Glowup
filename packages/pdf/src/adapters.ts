// The Expo implementations of the viewer's adapters. Every Expo module is loaded
// when first used, inside a try: an app that ships only a website installs none of
// them, and one that forgot to add the package to its dependencies gets a readable
// `native-missing` error instead of a crash at start-up (spike 0.3).
import { requireOptionalNativeModule } from "expo";
import { createPdfError, isPdfError, toPdfError } from "./errors";
import type {
  PdfActions,
  PdfCapabilities,
  PdfFiles,
  PdfMatch,
  PdfNative,
  PdfPageSize,
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

export const expoFiles: PdfFiles = {
  async download(uri, headers) {
    const { File, Paths } = await fileSystem();
    const target = new File(Paths.cache, `${uniqueName()}.pdf`);
    const file = await File.downloadFileAsync(uri, target, {
      headers,
      idempotent: true,
    });
    return file.uri;
  },
  async write(bytes) {
    const { File, Paths } = await fileSystem();
    const target = new File(Paths.cache, `${uniqueName()}.pdf`);
    target.create({ overwrite: true });
    target.write(bytes);
    return target.uri;
  },
  async remove(uri) {
    try {
      const { File } = await fileSystem();
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      // The cache is the system's to clean: failing to remove a copy is not worth an error.
    }
  },
};

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

export const expoActions: PdfActions = {
  async print(uri) {
    const Print = await load(() => import("expo-print"), "expo-print");
    await Print.printAsync({ uri });
  },
  async save(uri, name) {
    const Sharing = await load(() => import("expo-sharing"), "expo-sharing");
    if (!(await Sharing.isAvailableAsync())) {
      throw createPdfError("unsupported", "Sharing is not available here.");
    }
    let target = uri;
    if (name) {
      // The cached copy has a made-up name; the share sheet shows the file's own.
      const { File, Paths } = await fileSystem();
      const copy = new File(Paths.cache, name.replace(/[\\/:*?"<>|]/g, "_"));
      await new File(uri).copy(copy, { overwrite: true });
      target = copy.uri;
    }
    await Sharing.shareAsync(target, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: name,
    });
  },
};
