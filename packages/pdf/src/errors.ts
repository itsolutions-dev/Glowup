import type { PdfError, PdfErrorCode } from "./types";

export const createPdfError = (code: PdfErrorCode, message: string): PdfError =>
  Object.assign(new Error(message), { name: "PdfError", code });

export const isPdfError = (error: unknown): error is PdfError =>
  error instanceof Error &&
  typeof (error as { code?: unknown }).code === "string" &&
  error.name === "PdfError";

/** Keeps a PdfError as it is; anything else becomes one with the given code. */
export const toPdfError = (error: unknown, code: PdfErrorCode): PdfError =>
  isPdfError(error)
    ? error
    : createPdfError(
        code,
        error instanceof Error ? error.message : String(error),
      );
