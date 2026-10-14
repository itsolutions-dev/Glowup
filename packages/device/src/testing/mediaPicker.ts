import type {
  MediaPickerAdapter,
  PickedMedia,
  PickRequest,
  PickResult,
} from "../media-picker/types";

/** A picked item, with what was not given filled in as a 1080 × 1440 JPEG. */
export function buildPickedMedia(
  overrides: Partial<PickedMedia> = {},
): PickedMedia {
  const type = overrides.type ?? "image";
  return {
    uri: `file:///cache/ImagePicker/${type === "video" ? "clip.mp4" : "photo.jpg"}`,
    type,
    width: 1080,
    height: 1440,
    mimeType: type === "video" ? "video/mp4" : "image/jpeg",
    fileName: type === "video" ? "clip.mp4" : "photo.jpg",
    fileSize: type === "video" ? 4_200_000 : 850_000,
    duration: type === "video" ? 12_000 : null,
    assetId: null,
    exif: null,
    ...overrides,
  };
}

export interface MockMediaPickerOptions {
  /** Default true. */
  supported?: boolean;
  /** What every pick answers. Default: one picked image (`buildPickedMedia()`). */
  result?: PickResult;
  /** What `getPendingResult()` answers once. Default `null`. */
  pending?: PickResult | null;
}

export interface MockMediaPickerAdapter extends MediaPickerAdapter {
  /** Every request the package sent, options checked and completed. */
  readonly requests: readonly PickRequest[];
  /** A pick is open (held by `holdNext()`). */
  readonly isOpen: boolean;
  /** Changes what the next picks answer. */
  respondWith(result: PickResult): void;
  /**
   * Keeps the next pick open until `close()`, as a user still choosing
   * would: meanwhile another pick resolves `busy`.
   */
  holdNext(): void;
  /** Settles the open pick with `result`, or with the configured answer. */
  close(result?: PickResult): void;
  /** Changes what `getPendingResult()` answers once. */
  setPending(result: PickResult | null): void;
}

/**
 * An in-memory `MediaPickerAdapter`. Inject it with
 * `<DeviceAdaptersProvider adapters={{ mediaPicker }}>`.
 */
export function createMockMediaPickerAdapter({
  supported = true,
  result = { status: "picked", assets: [buildPickedMedia()] },
  pending = null,
}: MockMediaPickerOptions = {}): MockMediaPickerAdapter {
  let answer = result;
  let pendingResult = pending;
  let hold = false;
  let open: ((result: PickResult) => void) | null = null;
  const requests: PickRequest[] = [];

  return {
    requests,
    get isOpen() {
      return open !== null;
    },
    respondWith(next) {
      answer = next;
    },
    holdNext() {
      hold = true;
    },
    close(next) {
      const settle = open;
      open = null;
      settle?.(next ?? answer);
    },
    setPending(next) {
      pendingResult = next;
    },
    isSupported: () => supported,
    pick(request) {
      if (open) return Promise.resolve({ status: "busy" });
      requests.push(request);
      if (!hold) return Promise.resolve(answer);
      hold = false;
      return new Promise((resolve) => {
        open = resolve;
      });
    },
    async getPendingResult() {
      const next = pendingResult;
      pendingResult = null;
      return next;
    },
  };
}
