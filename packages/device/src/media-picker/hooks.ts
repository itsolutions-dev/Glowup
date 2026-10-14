import { useCallback, useSyncExternalStore } from "react";
import { Platform } from "react-native";

import { useDeviceAdapter } from "../core/adapters";
import { systemSheet } from "../core/systemSheet";
import type { Unsubscribe } from "../core/types";
import { expoMediaPickerAdapter } from "./expo";
import type {
  MediaKind,
  MediaPickerAdapter,
  PickOptions,
  PickRequest,
  PickResult,
} from "./types";
import { webMediaPickerAdapter } from "./web";

const defaultMediaPickerAdapter =
  Platform.OS === "web" ? webMediaPickerAdapter : expoMediaPickerAdapter;

const KINDS: readonly MediaKind[] = ["image", "video"];
const UNSUPPORTED: PickResult = { status: "unsupported" };

function fail(message: string): never {
  throw new TypeError(`useMediaPicker().pick(): ${message}`);
}

function isFlag(value: unknown): value is boolean | undefined {
  return value === undefined || typeof value === "boolean";
}

/** Checks the options and fills in the defaults. Throws a `TypeError`. */
export function toPickRequest(options: PickOptions = {}): PickRequest {
  const {
    mediaTypes = ["image"],
    multiple = false,
    limit = 0,
    edit = false,
    aspect,
    quality = 1,
    exif = false,
  } = options;

  if (
    !Array.isArray(mediaTypes) ||
    mediaTypes.length === 0 ||
    !mediaTypes.every((kind) => KINDS.includes(kind))
  ) {
    fail(`mediaTypes must list "image", "video" or both.`);
  }
  if (!isFlag(multiple) || !isFlag(edit) || !isFlag(exif)) {
    fail("multiple, edit and exif are booleans.");
  }
  if (!Number.isInteger(limit) || limit < 0) {
    fail(`limit must be a whole number, 0 or more (got ${String(limit)}).`);
  }
  if (limit > 0 && !multiple) fail("limit needs multiple: true.");
  if (edit && multiple) fail("edit works on one item: not with multiple.");
  // iOS reads the EXIF of an edited image from the photo library itself
  // (PhotoKit), which prompts for full library access just for that.
  if (edit && exif) fail("edit cannot be combined with exif.");
  if (aspect !== undefined) {
    if (!edit) fail("aspect needs edit: true.");
    if (
      !Array.isArray(aspect) ||
      aspect.length !== 2 ||
      !aspect.every((side) => Number.isFinite(side) && side > 0)
    ) {
      fail("aspect must be [width, height], two positive numbers.");
    }
  }
  if (typeof quality !== "number" || !(quality >= 0 && quality <= 1)) {
    fail(`quality must be between 0 and 1 (got ${String(quality)}).`);
  }

  return {
    mediaTypes: KINDS.filter((kind) => mediaTypes.includes(kind)),
    multiple,
    limit,
    edit,
    aspect: aspect ? [aspect[0], aspect[1]] : null,
    quality,
    exif,
  };
}

/** How many picks are open on an adapter, for `isPicking`. */
interface PickingStore {
  isPicking(): boolean;
  subscribe(listener: () => void): Unsubscribe;
  run(call: () => Promise<PickResult>): Promise<PickResult>;
}

function createPickingStore(): PickingStore {
  let open = 0;
  const listeners = new Set<() => void>();
  const change = (delta: number) => {
    open += delta;
    listeners.forEach((listener) => listener());
  };
  return {
    isPicking: () => open > 0,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async run(call) {
      change(1);
      try {
        return await call();
      } finally {
        change(-1);
      }
    },
  };
}

const pickingStores = new WeakMap<MediaPickerAdapter, PickingStore>();

function getPickingStore(adapter: MediaPickerAdapter): PickingStore {
  let store = pickingStores.get(adapter);
  if (!store) {
    store = createPickingStore();
    pickingStores.set(adapter, store);
  }
  return store;
}

const subscribeNothing = () => () => {};
const getServerSupport = () => null;
const getServerPicking = () => false;

function toFailure(error: unknown): PickResult {
  return { status: "failed", detail: String(error) };
}

export interface UseMediaPicker {
  /** `null` while a static page hydrates. */
  isSupported: boolean | null;
  /** A pick is open (from any component using this adapter). */
  isPicking: boolean;
  /**
   * Opens the system picker. No permission is needed on any platform.
   * Resolves every outcome; rejects with a `TypeError` only for invalid
   * options. On the web call it synchronously from a press handler: the
   * browser opens its file dialog only inside the user's gesture.
   */
  pick: (options?: PickOptions) => Promise<PickResult>;
  /**
   * Android: the result of a pick interrupted when the system stopped the
   * app behind the picker. Call it once at start-up; `null` when there is
   * none and on other platforms.
   */
  getPendingResult: () => Promise<PickResult | null>;
}

/** The system photo and video picker, `@its/glowup-device/media-picker`. */
export function useMediaPicker(): UseMediaPicker {
  const adapter = useDeviceAdapter("mediaPicker") ?? defaultMediaPickerAdapter;
  const store = getPickingStore(adapter);

  const getSupport = useCallback(() => adapter.isSupported(), [adapter]);
  const isSupported = useSyncExternalStore(
    subscribeNothing,
    getSupport,
    getServerSupport,
  );
  const isPicking = useSyncExternalStore(
    store.subscribe,
    store.isPicking,
    getServerPicking,
  );

  const pick = useCallback(
    (options?: PickOptions): Promise<PickResult> => {
      let request: PickRequest;
      try {
        request = toPickRequest(options);
      } catch (error) {
        return Promise.reject(error);
      }
      if (!adapter.isSupported()) return Promise.resolve(UNSUPPORTED);
      // Synchronous down to the adapter: the web needs the gesture.
      return store.run(() =>
        systemSheet.run(() => {
          try {
            return adapter.pick(request).catch(toFailure);
          } catch (error) {
            return Promise.resolve(toFailure(error));
          }
        }),
      );
    },
    [adapter, store],
  );

  const getPendingResult = useCallback(
    () => adapter.getPendingResult().catch(toFailure),
    [adapter],
  );

  return { isSupported, isPicking, pick, getPendingResult };
}
