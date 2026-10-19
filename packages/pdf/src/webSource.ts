import { createPdfError } from "./errors";
import { decodeBase64 } from "./source";
import type { PdfSource } from "./types";

/**
 * The PDF as a Blob, for the browser's own viewer. It checks that the file starts like a
 * PDF: a login page or an error body that came back with a 200 is reported as what it is, not
 * handed to the viewer to show a blank page.
 */
export const loadPdfBlob = async (
  source: PdfSource,
  fetchImpl: typeof fetch = fetch,
): Promise<Blob> => {
  let blob: Blob;
  if ("uri" in source) {
    let response: Response;
    try {
      response = await fetchImpl(source.uri, { headers: source.headers });
    } catch (error) {
      throw createPdfError(
        "network",
        error instanceof Error ? error.message : String(error),
      );
    }
    if (!response.ok) {
      throw createPdfError(
        "network",
        `${response.status} ${response.statusText}`.trim(),
      );
    }
    blob = await response.blob();
  } else {
    const bytes =
      "base64" in source ? decodeBase64(source.base64) : source.bytes;
    blob = new Blob([bytes as BlobPart]);
  }
  // The specification lets junk come before the header, within the first 1024 bytes.
  const head = await blob.slice(0, 1024).text();
  if (!head.includes("%PDF-")) {
    throw createPdfError("format", "The file does not start like a PDF.");
  }
  // Without the type the browser may offer a download instead of showing it.
  return blob.type === "application/pdf"
    ? blob
    : blob.slice(0, blob.size, "application/pdf");
};
