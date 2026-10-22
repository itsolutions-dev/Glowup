/** Where a file in an `Upload` list is. */
export type UploadStatus = "pending" | "uploading" | "done" | "error";

/** A file in an `Upload` list. */
export interface UploadFile {
  /** Unique in the list. */
  id: string;
  /** The file's name, extension included. */
  name: string;
  /** Size in bytes. */
  size: number;
  /** Media type (`image/png`); empty when the platform does not know it. */
  type: string;
  /** Where a picked file lives on native (`file://...`), for an upload or a preview. */
  uri?: string;
  /** The browser's `File`, on web: what you put in a `FormData`. */
  file?: File;
  /** `"pending"` until uploaded (or for good, with no `onUpload`). */
  status: UploadStatus;
  /** How much of the upload is done, from 0 to 1, while it is `"uploading"`. */
  progress?: number;
  /** Why the upload failed, while it is `"error"`. */
  error?: string;
}

/**
 * A file as picked: an `UploadFile` that may leave out its `id` and `status`,
 * which `Upload` fills in (a fresh id, `"pending"`).
 */
export type PickedFile = Pick<UploadFile, "name" | "size" | "type"> &
  Partial<Omit<UploadFile, "name" | "size" | "type">>;

/** Why a file was not added. */
export type UploadRejectionReason = "too-large" | "wrong-type" | "too-many";

/** A file that was not added, and why. */
export interface UploadRejection<T extends PickedFile = PickedFile> {
  file: T;
  reason: UploadRejectionReason;
  /** A sentence saying it, in English: "report.pdf is larger than 5 MB". */
  message: string;
}

const UNITS = ["B", "KB", "MB", "GB", "TB"];

/**
 * A size in bytes as people read it, in powers of 1024: `formatBytes(1536)` is
 * `"1.5 KB"`, `formatBytes(5 * 1024 * 1024)` is `"5 MB"`. Whole bytes stay
 * whole; larger sizes get up to `decimals` decimals (1 by default), trailing
 * zeros dropped. A negative or non-numeric size is `"0 B"`.
 */
export const formatBytes = (bytes: number, decimals = 1): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  let value = bytes;
  let unit = 0;
  // Rounded first, so 1023.99 KB reads "1 MB" and not "1024 KB".
  while (unit < UNITS.length - 1 && Number(value.toFixed(decimals)) >= 1024) {
    value /= 1024;
    unit++;
  }
  return `${Number(value.toFixed(unit === 0 ? 0 : decimals))} ${UNITS[unit]}`;
};

/**
 * Whether a file passes an `accept` filter written like the `accept` of an
 * `<input type="file">`: a comma-separated list (or an array) of extensions
 * (`.pdf`), media types (`application/json`) and wildcards (`image/*`). No
 * filter accepts everything. Case-insensitive; a file with no media type only
 * matches by extension.
 *
 * ```ts
 * acceptMatches({ name: "a.PNG", type: "image/png" }, "image/*,.pdf"); // true
 * ```
 */
export const acceptMatches = (
  file: Pick<UploadFile, "name" | "type">,
  accept?: string | readonly string[],
): boolean => {
  const tokens = (
    typeof accept === "string" ? accept.split(",") : (accept ?? [])
  )
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (!tokens.length) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) =>
    token === "*" || token === "*/*"
      ? true
      : token.startsWith(".")
        ? name.endsWith(token)
        : token.endsWith("/*")
          ? type.startsWith(token.slice(0, -1))
          : type === token,
  );
};

/** What `validateFiles` checks. */
export interface UploadRules {
  /** An `accept` filter, see `acceptMatches`. */
  accept?: string | readonly string[];
  /** The largest file, in bytes. */
  maxSize?: number;
  /** How many files the list may hold in all. */
  maxFiles?: number;
  /** How many files the list already holds. Defaults to 0. */
  count?: number;
}

/**
 * Splits picked files into the ones that fit the rules and the ones that do
 * not, each with its reason. A file is checked for its type, then its size,
 * then for room in the list, in the order given.
 */
export const validateFiles = <T extends PickedFile>(
  files: readonly T[],
  { accept, maxSize, maxFiles, count = 0 }: UploadRules = {},
): { accepted: T[]; rejected: UploadRejection<T>[] } => {
  const accepted: T[] = [];
  const rejected: UploadRejection<T>[] = [];
  const reject = (file: T, reason: UploadRejectionReason, message: string) =>
    rejected.push({ file, reason, message });

  for (const file of files) {
    if (!acceptMatches(file, accept)) {
      reject(file, "wrong-type", `${file.name} is not an accepted file type`);
    } else if (maxSize !== undefined && file.size > maxSize) {
      reject(
        file,
        "too-large",
        `${file.name} is larger than ${formatBytes(maxSize)}`,
      );
    } else if (maxFiles !== undefined && count + accepted.length >= maxFiles) {
      reject(
        file,
        "too-many",
        maxFiles === 1
          ? "Only one file is allowed"
          : `You can add up to ${maxFiles} files`,
      );
    } else {
      accepted.push(file);
    }
  }
  return { accepted, rejected };
};
