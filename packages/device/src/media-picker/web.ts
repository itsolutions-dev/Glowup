import { hasDOM } from "../core/support";
import type {
  MediaKind,
  MediaPickerAdapter,
  PickedMedia,
  PickRequest,
  PickResult,
} from "./types";

/**
 * The web default, on a hidden `<input type="file">`, rather than
 * expo-image-picker's web build: that one reports video durations in
 * seconds (ms on native), ignores `selectionLimit`, and in a browser that
 * never fires the input's `cancel` event leaves its promise pending and its
 * input in the page.
 *
 * A browser opens the dialog only inside the user's gesture, so `pick()`
 * reaches `input.click()` synchronously. Nothing says when a dialog closed
 * without `cancel`: a new pick settles the previous one as `cancelled`
 * instead of answering `busy` forever.
 */

const ACCEPT: Record<MediaKind, string> = {
  image: "image/*",
  video: "video/*",
};

const CANCELLED: PickResult = { status: "cancelled" };
const UNSUPPORTED: PickResult = { status: "unsupported" };

function kindOf(file: File): MediaKind | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

function imageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () =>
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({ width: 0, height: 0 });
    image.src = url;
  });
}

function videoInfo(
  url: string,
): Promise<{ width: number; height: number; duration: number | null }> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () =>
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: Number.isFinite(video.duration)
          ? Math.round(video.duration * 1000)
          : null,
      });
    video.onerror = () => resolve({ width: 0, height: 0, duration: null });
    video.src = url;
  });
}

async function toMedia(file: File, type: MediaKind): Promise<PickedMedia> {
  const uri = URL.createObjectURL(file);
  const { width, height, duration } =
    type === "video"
      ? await videoInfo(uri)
      : { ...(await imageSize(uri)), duration: null };
  return {
    uri,
    type,
    width,
    height,
    mimeType: file.type || null,
    fileName: file.name || null,
    fileSize: file.size,
    duration,
    assetId: null,
    exif: null,
    file,
  };
}

async function read(
  files: readonly File[],
  request: PickRequest,
): Promise<PickResult> {
  // The dialog's "All files" choice lets anything through `accept`.
  const accepted = files.flatMap((file) => {
    const type = kindOf(file);
    return type && request.mediaTypes.includes(type) ? [{ file, type }] : [];
  });
  const kept = !request.multiple
    ? accepted.slice(0, 1)
    : request.limit > 0
      ? accepted.slice(0, request.limit)
      : accepted;
  if (kept.length === 0) {
    return {
      status: "failed",
      detail: `No selected file is of an accepted type (${request.mediaTypes.join(", ")}).`,
    };
  }
  return {
    status: "picked",
    assets: await Promise.all(
      kept.map(({ file, type }) => toMedia(file, type)),
    ),
  };
}

export function createWebMediaPickerAdapter(): MediaPickerAdapter {
  let settleCurrent: ((result: PickResult) => void) | null = null;

  return {
    isSupported: () => hasDOM(),
    pick(request) {
      if (!hasDOM()) return Promise.resolve(UNSUPPORTED);
      settleCurrent?.(CANCELLED);
      return new Promise<PickResult>((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = request.mediaTypes.map((kind) => ACCEPT[kind]).join(",");
        input.multiple = request.multiple;
        input.style.display = "none";

        // Settling twice (a late event on a replaced input) changes nothing:
        // the promise keeps its first value and the input is already gone.
        const settle = (result: PickResult) => {
          if (settleCurrent === settle) settleCurrent = null;
          input.remove();
          resolve(result);
        };
        settleCurrent = settle;

        input.addEventListener("change", () => {
          const files = Array.from(input.files ?? []);
          if (files.length === 0) {
            settle(CANCELLED);
            return;
          }
          read(files, request).then(settle, (error: unknown) =>
            settle({ status: "failed", detail: String(error) }),
          );
        });
        input.addEventListener("cancel", () => settle(CANCELLED));
        document.body.appendChild(input);
        input.click();
      });
    },
    getPendingResult: async () => null,
  };
}

export const webMediaPickerAdapter: MediaPickerAdapter =
  createWebMediaPickerAdapter();
