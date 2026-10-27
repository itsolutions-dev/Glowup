// Saving the .xlsx on iOS and Android: the file goes to the cache and the share sheet hands it on
// (Files, Drive, mail…). expo-file-system and expo-sharing are optional peers, loaded when first
// used, as in @its/glowup-pdf: an app without them gets a readable `native-missing` error, not a
// crash at start-up. The web has its own file (save.web.ts), which downloads.
import { PivotExportError } from "./errors";
import { XLSX_MIME } from "./xlsx";

export { PivotExportError } from "./errors";

/** How the Expo modules are loaded (fakes in the tests: jest has no dynamic `import()`). */
export type SaveModules = {
  files: () => Promise<typeof import("expo-file-system")>;
  sharing: () => Promise<typeof import("expo-sharing")>;
};

const missing = (name: string) => (): never => {
  throw new PivotExportError(
    "native-missing",
    `${name} is not installed: add it to the app's dependencies and make a new development build.`,
  );
};

// The `.catch` sits on the `import()` itself: that is what makes Metro treat the module as optional, so an
// app without it still bundles (a `try` in another function does not count; optionalPeers.test.ts).
const EXPO: SaveModules = {
  files: () => import("expo-file-system").catch(missing("expo-file-system")),
  sharing: () => import("expo-sharing").catch(missing("expo-sharing")),
};

const load = <T>(importer: () => Promise<T>, name: string): Promise<T> =>
  importer().catch(missing(name));

export const saveXlsx = async (
  bytes: Uint8Array,
  fileName: string,
  modules: SaveModules = EXPO,
): Promise<"downloaded" | "shared"> => {
  const Sharing = await load(modules.sharing, "expo-sharing");
  if (!(await Sharing.isAvailableAsync())) {
    throw new PivotExportError("unsupported", "Sharing is not available here.");
  }
  const { File, Paths } = await load(modules.files, "expo-file-system");
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(bytes);
  await Sharing.shareAsync(file.uri, {
    mimeType: XLSX_MIME,
    UTI: "org.openxmlformats.spreadsheetml.sheet",
    dialogTitle: fileName,
  });
  return "shared";
};
