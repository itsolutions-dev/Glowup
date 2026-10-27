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
  // Revoked on the next turn: some browsers start the download only after the click returns.
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return "downloaded";
};
