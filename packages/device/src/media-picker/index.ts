/**
 * `@its/glowup-device/media-picker` — the system photo and video picker.
 * Needs `expo-image-picker` on iOS and Android, and no permission anywhere;
 * the web uses a file input.
 */
export { useMediaPicker, type UseMediaPicker } from "./hooks";
export { expoMediaPickerAdapter } from "./expo";
export { webMediaPickerAdapter } from "./web";
export type {
  MediaKind,
  MediaPickerAdapter,
  PickedMedia,
  PickOptions,
  PickRequest,
  PickResult,
} from "./types";
