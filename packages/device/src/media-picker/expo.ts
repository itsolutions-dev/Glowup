import * as ImagePicker from "expo-image-picker";

import type {
  MediaKind,
  MediaPickerAdapter,
  PickedMedia,
  PickRequest,
  PickResult,
} from "./types";

const EXPO_TYPES: Record<MediaKind, ImagePicker.MediaType> = {
  image: "images",
  video: "videos",
};

const BUSY: PickResult = { status: "busy" };
const CANCELLED: PickResult = { status: "cancelled" };

function toOptions(request: PickRequest): ImagePicker.ImagePickerOptions {
  return {
    mediaTypes: request.mediaTypes.map((kind) => EXPO_TYPES[kind]),
    allowsMultipleSelection: request.multiple,
    // 0 is the platform's own maximum, as in expo.
    selectionLimit: request.multiple ? request.limit : 1,
    // iOS numbers the picked items and returns them in that order.
    orderedSelection: request.multiple,
    allowsEditing: request.edit,
    ...(request.aspect && { aspect: [request.aspect[0], request.aspect[1]] }),
    quality: request.quality,
    exif: request.exif,
    // An iCloud-only photo is downloaded rather than failing the pick.
    shouldDownloadFromNetwork: true,
  };
}

function toKind(asset: ImagePicker.ImagePickerAsset): MediaKind {
  if (asset.type === "video" || asset.type === "pairedVideo") return "video";
  if (asset.type == null && asset.mimeType?.startsWith("video/")) {
    return "video";
  }
  return "image";
}

function toMedia(asset: ImagePicker.ImagePickerAsset): PickedMedia {
  const type = toKind(asset);
  return {
    uri: asset.uri,
    type,
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType ?? null,
    fileName: asset.fileName ?? null,
    fileSize: asset.fileSize ?? null,
    // Already in ms on both platforms.
    duration: type === "video" ? (asset.duration ?? null) : null,
    assetId: asset.assetId ?? null,
    exif: asset.exif ?? null,
  };
}

function toResult(result: ImagePicker.ImagePickerResult): PickResult {
  if (result.canceled) return CANCELLED;
  return { status: "picked", assets: result.assets.map(toMedia) };
}

function toFailure(error: unknown): PickResult {
  const { code, message } = (error ?? {}) as {
    code?: unknown;
    message?: unknown;
  };
  const text = typeof message === "string" ? message : String(error);
  return {
    status: "failed",
    detail: typeof code === "string" ? `${code}: ${text}` : text,
  };
}

/**
 * The native default, on expo-image-picker's library picker. Neither
 * platform asks for a permission to pick. expo keeps one picking context:
 * a second call would leave the first promise unsettled on iOS and answer
 * `canceled` on Android, so it is refused here with `busy`.
 */
export function createExpoMediaPickerAdapter(): MediaPickerAdapter {
  let picking = false;
  return {
    isSupported: () => true,
    async pick(request) {
      if (picking) return BUSY;
      picking = true;
      try {
        return toResult(
          await ImagePicker.launchImageLibraryAsync(toOptions(request)),
        );
      } catch (error) {
        return toFailure(error);
      } finally {
        picking = false;
      }
    },
    async getPendingResult() {
      try {
        const pending = await ImagePicker.getPendingResultAsync();
        if (pending == null) return null;
        if ("canceled" in pending) return toResult(pending);
        return toFailure(pending);
      } catch (error) {
        return toFailure(error);
      }
    },
  };
}

export const expoMediaPickerAdapter: MediaPickerAdapter =
  createExpoMediaPickerAdapter();
