import React, { useCallback, useState } from "react";
import { Platform, Share, type StyleProp, type ViewStyle } from "react-native";
import Button, { type ButtonVariant } from "./Button";
import { type ColorRole } from "./internal/colorRole";
import { type MaterialCommunityIconsGlyphs } from "./types";

/** A file ready to be saved. */
export interface DownloadFile {
  /** The file's name, extension included. */
  name: string;
  /** The media type, `application/json`, `text/csv`... */
  mimeType: string;
  /** The content: text, or a `Blob`. Missing for a `url` handed to a native `save`, see `DownloadProps.url`. */
  data?: string | Blob;
  /** The address the file comes from, when it was given as one. */
  url?: string;
}

/** Saves a file. The app wires `expo-file-system` and `expo-sharing` here on native. Throw (or reject) if it could not be saved. */
export type DownloadSaver = (file: DownloadFile) => void | Promise<void>;

/** What to save: the content (`data`) or where to fetch it from (`url`), as `DownloadProps` describes them. */
export type DownloadSource = Pick<
  DownloadProps,
  "data" | "url" | "filename" | "mimeType"
>;

const MIME_BY_EXTENSION: Record<string, string> = {
  json: "application/json",
  csv: "text/csv",
  txt: "text/plain",
  html: "text/html",
  xml: "application/xml",
  md: "text/markdown",
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  zip: "application/zip",
};

const mimeFromName = (name: string | undefined) =>
  name ? MIME_BY_EXTENSION[name.split(".").pop()!.toLowerCase()] : undefined;

const isBlob = (value: unknown): value is Blob =>
  typeof Blob !== "undefined" && value instanceof Blob;

// The last part of an address, without its query: `.../report.pdf?x=1` is `report.pdf`.
const nameFromUrl = (url: string) =>
  decodeURIComponent(url.split(/[?#]/)[0].split("/").pop() ?? "") || "download";

/** Turns what the caller gave into a file: serialises an object, fetches a `url` on web. */
const resolveFile = async ({
  data,
  url,
  filename,
  mimeType,
}: DownloadSource): Promise<DownloadFile> => {
  if (data !== undefined) {
    if (isBlob(data)) {
      const name = filename ?? "download";
      return {
        name,
        mimeType:
          mimeType ??
          (data.type || mimeFromName(name)) ??
          "application/octet-stream",
        data,
      };
    }
    const text =
      typeof data === "string" ? data : JSON.stringify(data, null, 2);
    const fallback =
      typeof data === "string" ? "text/plain" : "application/json";
    const name =
      filename ?? (typeof data === "string" ? "download.txt" : "download.json");
    return {
      name,
      mimeType: mimeType ?? mimeFromName(filename) ?? fallback,
      data: text,
    };
  }
  if (url === undefined) throw new Error("Download needs `data` or a `url`");

  const name = filename ?? nameFromUrl(url);
  if (Platform.OS !== "web") {
    return {
      name,
      mimeType: mimeType ?? mimeFromName(name) ?? "application/octet-stream",
      url,
    };
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not fetch ${name} (${response.status})`);
  }
  const blob = await response.blob();
  return {
    name,
    mimeType:
      mimeType ??
      (blob.type || mimeFromName(name)) ??
      "application/octet-stream",
    data: blob,
    url,
  };
};

// The web default: a temporary link with `download`, clicked.
const saveOnWeb = (file: DownloadFile) => {
  if (typeof document === "undefined" || !document.body) {
    throw new Error("There is no page to save the file from");
  }
  const href = URL.createObjectURL(
    new Blob([file.data ?? ""], { type: file.mimeType }),
  );
  const link = document.createElement("a");
  link.href = href;
  link.download = file.name;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // After the browser has started the download.
  setTimeout(() => URL.revokeObjectURL(href), 1000);
};

// The native default: the system share sheet, with the text (or the link).
const saveOnNative = async (file: DownloadFile) => {
  if (typeof file.data === "string") {
    await Share.share({ message: file.data, title: file.name });
  } else if (file.url) {
    // `url` is iOS only; Android shares the link as the message.
    await Share.share(
      Platform.OS === "ios"
        ? { url: file.url, title: file.name }
        : { message: file.url, title: file.name },
    );
  } else {
    throw new Error(
      "Saving a binary file on this platform needs a `save` writer",
    );
  }
};

/** What `useDownload` takes: the `save`, `onDownload` and `onError` of `DownloadProps`. */
export type UseDownloadOptions = Pick<
  DownloadProps,
  "save" | "onDownload" | "onError"
>;

export interface UseDownloadResult {
  /** Saves a file. Resolves `true` once it was saved, `false` if it failed (the reason is `error`, and `onError`'s). */
  download: (source: DownloadSource) => Promise<boolean>;
  /** True while a file is being fetched and saved. */
  downloading: boolean;
  /** Why the last download failed; cleared by the next one. */
  error: Error | undefined;
}

/**
 * Saving a file from an event handler: `download({ data, filename })`, with
 * `downloading` for a spinner and `error` for what went wrong.
 *
 * ```tsx
 * const { download, downloading } = useDownload();
 * <Button loading={downloading} onClick={() => download({ data: rows, filename: "rows.json" })}>Export</Button>
 * ```
 */
export const useDownload = ({
  save,
  onDownload,
  onError,
}: UseDownloadOptions = {}): UseDownloadResult => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<Error>();

  const download = useCallback(
    async (source: DownloadSource) => {
      setDownloading(true);
      setError(undefined);
      try {
        const file = await resolveFile(source);
        await (save ?? (Platform.OS === "web" ? saveOnWeb : saveOnNative))(
          file,
        );
        onDownload?.(file);
        return true;
      } catch (reason) {
        const failure =
          reason instanceof Error ? reason : new Error(String(reason));
        setError(failure);
        onError?.(failure);
        return false;
      } finally {
        setDownloading(false);
      }
    },
    [save, onDownload, onError],
  );

  return { download, downloading, error };
};

export interface DownloadProps {
  /**
   * The content: a string (saved as text), an object (saved as JSON) or a
   * `Blob` (any binary file). Wins over `url` when both are given.
   */
  data?: string | object | Blob;
  /**
   * A file to fetch. On web it is fetched into a `Blob` first, as browsers
   * ignore `download` on a cross-origin link. On native it is not fetched: the
   * `save` writer gets it as `file.url` and downloads it its own way
   * (`expo-file-system`), and without a writer it is shared as a link.
   */
  url?: string;
  /** The saved file's name. Defaults to the last part of `url`, else `download` (`download.json`, `download.txt` for `data`). */
  filename?: string;
  /**
   * The media type. Defaults to the one the extension of `filename` tells,
   * else `application/json` for an object, `text/plain` for a string, the
   * `Blob`'s own type or the response's.
   */
  mimeType?: string;
  /**
   * Saves the file. On web it defaults to a temporary `<a download>` link; on
   * native to the system share sheet with the text (or the link), which is
   * enough for text and links. Pass one to write real files
   * (`expo-file-system` + `expo-sharing`) and for a `Blob`.
   */
  save?: DownloadSaver;
  /** Called with the file after it was saved. */
  onDownload?: (file: DownloadFile) => void;
  /** Called when fetching or saving failed. */
  onError?: (error: Error) => void;
  /**
   * The button's label, `"Download"` if left out. A function draws your own
   * trigger instead of the button: it gets `{ download, downloading }`,
   * `download` saving this file, and is drawn as returned.
   */
  children?:
    | React.ReactNode
    | ((state: {
        download: () => Promise<boolean>;
        downloading: boolean;
      }) => React.ReactNode);
  /** The button's icon. Defaults to `"download"`. */
  icon?: MaterialCommunityIconsGlyphs;
  /** The button's variant. Defaults to `"filled"`. */
  variant?: ButtonVariant;
  /** The button's colour role. Defaults to `"primary"`. */
  color?: ColorRole;
  disabled?: boolean;
  /** Style of the button. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * A button that saves a file: the `data` you hold (text, an object as JSON, a
 * `Blob`) or the file at a `url`. On web it just works; on native text and
 * links go to the share sheet, and a `save` writer (`expo-file-system`) saves
 * real files.
 *
 * ```tsx
 * <Download data={rows} filename="rows.json">Export rows</Download>
 * <Download url="https://example.com/report.pdf" />
 * ```
 */
const Download = ({
  data,
  url,
  filename,
  mimeType,
  save,
  onDownload,
  onError,
  children,
  icon = "download",
  variant = "filled",
  color = "primary",
  disabled,
  style,
  testID,
}: DownloadProps) => {
  const { download, downloading } = useDownload({ save, onDownload, onError });
  const run = () => download({ data, url, filename, mimeType });

  if (typeof children === "function") {
    return <>{children({ download: run, downloading })}</>;
  }
  return (
    <Button
      iconName={icon}
      variant={variant}
      color={color}
      loading={downloading}
      disabled={disabled}
      onClick={() => void run()}
      style={style as object}
      testID={testID}
    >
      {children ?? "Download"}
    </Button>
  );
};

export default Download;
