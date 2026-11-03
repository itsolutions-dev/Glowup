// Saving the .xlsx on the web: a Blob behind a link with `download`, clicked once, as AuraPivot does.
// The phone has its own file (save.ts), which shares.
import { XLSX_MIME } from "./xlsx";

export { PivotExportError } from "./errors";

export const saveXlsx = async (
  bytes: Uint8Array,
  fileName: string,
): Promise<"downloaded" | "shared"> => {
  const url = URL.createObjectURL(
    new Blob([bytes as BlobPart], { type: XLSX_MIME }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked after a while, not on the next turn: some Firefox and Safari versions read the file only after
  // the click has returned, and cancel the download if its URL is gone (FileSaver.js waits 40 s too).
  setTimeout(() => URL.revokeObjectURL(url), 40_000);
  return "downloaded";
};
