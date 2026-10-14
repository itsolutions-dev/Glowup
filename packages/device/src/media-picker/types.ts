export type MediaKind = "image" | "video";

export interface PickOptions {
  /** What the picker offers. Default `["image"]`. */
  mediaTypes?: readonly MediaKind[];
  /** Several items at once. Default false. */
  multiple?: boolean;
  /**
   * With `multiple`, the most items the user may pick; 0 (default) leaves it
   * to the platform. The web cannot cap its file dialog: it keeps the first
   * `limit` files.
   */
  limit?: number;
  /**
   * The platform's crop screen after picking one item (iOS crops a square,
   * Android to `aspect`). Not with `multiple`, nor with `exif` (iOS would
   * read it from the photo library, prompting for full library access just
   * for that). Ignored on the web.
   */
  edit?: boolean;
  /** Android, with `edit`: the crop's aspect ratio, `[width, height]`. */
  aspect?: readonly [number, number];
  /**
   * Native: the compression of picked images, 0 to 1. Default 1; iOS keeps
   * PNG and BMP files as they are.
   */
  quality?: number;
  /** Native: the images' EXIF data in `exif`. Default false. */
  exif?: boolean;
}

/** `PickOptions` checked and completed: what an adapter receives. */
export interface PickRequest {
  mediaTypes: readonly MediaKind[];
  multiple: boolean;
  limit: number;
  edit: boolean;
  aspect: readonly [number, number] | null;
  quality: number;
  exif: boolean;
}

export interface PickedMedia {
  /**
   * A local copy (native: in the app's cache, which the app cleans up) or,
   * on the web, a `blob:` URL that lives until the page unloads or
   * `URL.revokeObjectURL()`.
   */
  uri: string;
  type: MediaKind;
  /** 0 when the platform could not tell. */
  width: number;
  height: number;
  mimeType: string | null;
  fileName: string | null;
  /** In bytes. */
  fileSize: number | null;
  /** Videos, in ms; `null` for images. */
  duration: number | null;
  /**
   * The library's identifier, for `/media-library`. `null` on the web, and
   * where the platform withholds it (Android's legacy document picker).
   */
  assetId: string | null;
  /** With `exif: true`, the image's EXIF tags; otherwise `null`. */
  exif: Record<string, unknown> | null;
  /** The web's `File`, to upload with `FormData`. Absent on native. */
  file?: File;
}

/**
 * - `picked`: one item or more, in the order the user picked them.
 * - `cancelled`: the user closed the picker, or (web) a newer pick replaced
 *   this one.
 * - `busy`: another pick is still open; this one never started.
 * - `unsupported`: no picker here (a static page rendering in Node).
 * - `failed`: the platform could not deliver the files.
 */
export type PickResult =
  | { status: "picked"; assets: PickedMedia[] }
  | { status: "cancelled" }
  | { status: "busy" }
  | { status: "unsupported" }
  | {
      status: "failed";
      /** The platform's own code and message, for logs. Not for display. */
      detail?: string;
    };

export interface MediaPickerAdapter {
  isSupported(): boolean;
  /**
   * Opens the system picker and resolves with the outcome; never rejects.
   * It must reach the platform synchronously (the web opens its dialog only
   * inside the user's gesture), and one pick runs at a time: a second call
   * resolves `busy`, or settles the first as `cancelled` where the platform
   * cannot tell when its dialog closed (the web).
   */
  pick(request: PickRequest): Promise<PickResult>;
  /**
   * Android: the result of a pick the system interrupted by stopping the
   * app; `null` everywhere else and when there is none. Read once.
   */
  getPendingResult(): Promise<PickResult | null>;
}
