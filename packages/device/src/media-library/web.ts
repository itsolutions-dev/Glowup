import { UNSUPPORTED } from "../core/permissions";
import type { MediaLibraryAdapter } from "./types";

/**
 * The web default: a browser has no photo library to save into. An app
 * that wants a download offers one itself (an `<a download>` on the file).
 */
export function createWebMediaLibraryAdapter(): MediaLibraryAdapter {
  return {
    isSupported: () => false,
    requiresPermission: () => false,
    getPermission: async () => UNSUPPORTED,
    requestPermission: async () => UNSUPPORTED,
    save: async () => ({ status: "unsupported" }),
  };
}

export const webMediaLibraryAdapter: MediaLibraryAdapter =
  createWebMediaLibraryAdapter();
