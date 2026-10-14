import type { PermissionState } from "../core/types";

/**
 * - `saved`: the file is in the device's photo library (on Android, its
 *   Pictures or Movies collection).
 * - `denied`: the permission saving needs was refused (now or before).
 * - `unsupported`: no photo library here (the web).
 * - `failed`: the platform could not save the file (a missing file, a
 *   format the library does not take).
 */
export type SaveResult =
  | {
      status: "saved";
      /**
       * The library's identifier of the new item: iOS's local identifier,
       * Android's `content://` URI.
       */
      assetId: string;
    }
  | { status: "denied" }
  | { status: "unsupported" }
  | {
      status: "failed";
      /** The platform's own code and message, for logs. Not for display. */
      detail?: string;
    };

export interface MediaLibraryAdapter {
  isSupported(): boolean;
  /**
   * Whether saving needs a permission here: iOS's add-only access, and
   * Android's storage permission before Android 11. Elsewhere the state
   * reads `granted` and nothing is asked.
   */
  requiresPermission(): boolean;
  getPermission(): Promise<PermissionState>;
  /** Shows the system prompt. */
  requestPermission(): Promise<PermissionState>;
  /**
   * Saves a local image or video (a `file://` URI, as the camera and the
   * picker return). Called once the permission allows it. Resolves with the
   * outcome; never rejects.
   */
  save(uri: string): Promise<SaveResult>;
}
