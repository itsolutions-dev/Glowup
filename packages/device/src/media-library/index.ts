/**
 * `@its/glowup-device/media-library` — saving photos and videos to the
 * device's photo library. Needs `expo-media-library` on iOS and Android;
 * unsupported on the web, which never loads that module.
 */
export { useMediaLibrary, type UseMediaLibrary } from "./hooks";
export { expoMediaLibraryAdapter } from "./expo";
export { webMediaLibraryAdapter } from "./web";
export type { MediaLibraryAdapter, SaveResult } from "./types";
