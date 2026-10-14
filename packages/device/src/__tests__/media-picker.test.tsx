import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AppState } from "react-native";
import { renderToString } from "react-dom/server";

import { DeviceAdaptersProvider, type DeviceAdapters } from "..";
import { useAppLock } from "../biometrics";
import { useMediaPicker, type PickOptions } from "../media-picker";
import { toPickRequest } from "../media-picker/hooks";
import {
  buildPickedMedia,
  createMockBiometricsAdapter,
  createMockMediaPickerAdapter,
  type MockMediaPickerAdapter,
} from "../testing";

jest.mock("expo-image-picker", () => ({}));
jest.mock("expo-local-authentication", () => ({ SecurityLevel: { NONE: 0 } }));

function wrapperFor(adapters: Partial<DeviceAdapters>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <DeviceAdaptersProvider adapters={adapters}>
        {children}
      </DeviceAdaptersProvider>
    );
  };
}

async function setup(mediaPicker: MockMediaPickerAdapter) {
  return renderHook(() => useMediaPicker(), {
    wrapper: wrapperFor({ mediaPicker }),
  });
}

describe("useMediaPicker", () => {
  it("picks with the defaults filled in", async () => {
    const mediaPicker = createMockMediaPickerAdapter();
    const { result } = await setup(mediaPicker);
    expect(result.current).toMatchObject({
      isSupported: true,
      isPicking: false,
    });

    let picked: unknown;
    await act(async () => {
      picked = await result.current.pick();
    });
    expect(picked).toEqual({ status: "picked", assets: [buildPickedMedia()] });
    expect(mediaPicker.requests).toEqual([
      {
        mediaTypes: ["image"],
        multiple: false,
        limit: 0,
        edit: false,
        aspect: null,
        quality: 1,
        exif: false,
      },
    ]);
  });

  it("passes the options on, media types in a fixed order", async () => {
    const mediaPicker = createMockMediaPickerAdapter();
    const { result } = await setup(mediaPicker);
    await act(async () => {
      await result.current.pick({
        mediaTypes: ["video", "image", "video"],
        multiple: true,
        limit: 3,
        quality: 0.7,
        exif: true,
      });
      await result.current.pick({ edit: true, aspect: [4, 3] });
    });
    expect(mediaPicker.requests).toEqual([
      {
        mediaTypes: ["image", "video"],
        multiple: true,
        limit: 3,
        edit: false,
        aspect: null,
        quality: 0.7,
        exif: true,
      },
      expect.objectContaining({ edit: true, aspect: [4, 3] }),
    ]);
  });

  it("reports an open pick, and refuses a second one with busy", async () => {
    const mediaPicker = createMockMediaPickerAdapter();
    mediaPicker.holdNext();
    const { result } = await setup(mediaPicker);

    let first!: Promise<unknown>;
    await act(async () => {
      first = result.current.pick();
    });
    expect(result.current.isPicking).toBe(true);
    await act(async () => {
      await expect(result.current.pick()).resolves.toEqual({ status: "busy" });
    });
    expect(mediaPicker.requests).toHaveLength(1);

    await act(async () => mediaPicker.close({ status: "cancelled" }));
    await expect(first).resolves.toEqual({ status: "cancelled" });
    expect(result.current.isPicking).toBe(false);
  });

  it("reaches the adapter synchronously, inside the press", async () => {
    const mediaPicker = createMockMediaPickerAdapter();
    const pick = jest.spyOn(mediaPicker, "pick");
    const { result } = await setup(mediaPicker);
    await act(async () => {
      const pending = result.current.pick();
      // Before any await: the web opens its dialog only in the gesture.
      expect(pick).toHaveBeenCalledTimes(1);
      await pending;
    });
  });

  it("answers unsupported without reaching the adapter", async () => {
    const mediaPicker = createMockMediaPickerAdapter({ supported: false });
    const { result } = await setup(mediaPicker);
    expect(result.current.isSupported).toBe(false);
    await expect(result.current.pick()).resolves.toEqual({
      status: "unsupported",
    });
    expect(mediaPicker.requests).toEqual([]);
  });

  it("turns an adapter that throws or rejects into failed", async () => {
    const mediaPicker = createMockMediaPickerAdapter();
    const { result } = await setup(mediaPicker);
    jest.spyOn(mediaPicker, "pick").mockImplementationOnce(() => {
      throw new Error("boom");
    });
    await act(async () => {
      await expect(result.current.pick()).resolves.toEqual({
        status: "failed",
        detail: "Error: boom",
      });
    });
    jest
      .spyOn(mediaPicker, "pick")
      .mockImplementationOnce(() => Promise.reject(new Error("late")));
    await act(async () => {
      await expect(result.current.pick()).resolves.toEqual({
        status: "failed",
        detail: "Error: late",
      });
    });
    expect(result.current.isPicking).toBe(false);
  });

  it("returns the pending result once", async () => {
    const pending = {
      status: "picked" as const,
      assets: [buildPickedMedia({ type: "video" })],
    };
    const mediaPicker = createMockMediaPickerAdapter({ pending });
    const { result } = await setup(mediaPicker);
    await expect(result.current.getPendingResult()).resolves.toEqual(pending);
    await expect(result.current.getPendingResult()).resolves.toBeNull();

    jest
      .spyOn(mediaPicker, "getPendingResult")
      .mockRejectedValueOnce(new Error("lost"));
    await expect(result.current.getPendingResult()).resolves.toEqual({
      status: "failed",
      detail: "Error: lost",
    });
  });

  it("renders unknown support on the server", () => {
    let seen: ReturnType<typeof useMediaPicker> | undefined;
    function Probe() {
      seen = useMediaPicker();
      return null;
    }
    renderToString(
      <DeviceAdaptersProvider
        adapters={{ mediaPicker: createMockMediaPickerAdapter() }}
      >
        <Probe />
      </DeviceAdaptersProvider>,
    );
    expect(seen).toMatchObject({ isSupported: null, isPicking: false });
  });
});

describe("pick options", () => {
  it.each<[string, PickOptions]>([
    ["no media type", { mediaTypes: [] }],
    ["an unknown media type", { mediaTypes: ["audio" as never] }],
    ["a media type that is not a list", { mediaTypes: "image" as never }],
    ["a list-like media type", { mediaTypes: { length: 1 } as never }],
    ["a non-boolean flag", { multiple: "yes" as never }],
    ["a fractional limit", { multiple: true, limit: 1.5 }],
    ["a negative limit", { multiple: true, limit: -1 }],
    ["a limit without multiple", { limit: 2 }],
    ["edit with multiple", { edit: true, multiple: true }],
    ["edit with exif", { edit: true, exif: true }],
    ["aspect without edit", { aspect: [1, 1] }],
    ["a zero aspect side", { edit: true, aspect: [0, 1] }],
    ["an aspect of one side", { edit: true, aspect: [1] as never }],
    ["quality above 1", { quality: 1.2 }],
    ["quality below 0", { quality: -0.1 }],
    ["quality that is not a number", { quality: NaN }],
  ])("rejects %s", (_, options) => {
    expect(() => toPickRequest(options)).toThrow(TypeError);
    expect(() => toPickRequest(options)).toThrow(
      /^useMediaPicker\(\)\.pick\(\): /,
    );
  });

  it("accepts the edges", () => {
    expect(() =>
      toPickRequest({ multiple: true, limit: 0, quality: 0 }),
    ).not.toThrow();
    expect(() => toPickRequest({ quality: 1, edit: false })).not.toThrow();
  });

  it("rejects the pick's promise, without opening anything", async () => {
    const mediaPicker = createMockMediaPickerAdapter();
    const { result } = await setup(mediaPicker);
    await expect(result.current.pick({ limit: 2 })).rejects.toThrow(
      "limit needs multiple: true.",
    );
    expect(mediaPicker.requests).toEqual([]);
    expect(result.current.isPicking).toBe(false);
  });
});

describe("with the app lock", () => {
  let listeners: ((state: string) => void)[] = [];
  const original = AppState.addEventListener;
  const originalState = AppState.currentState;

  beforeEach(() => {
    listeners = [];
    AppState.currentState = "active";
    AppState.addEventListener = ((_: string, listener: never) => {
      listeners.push(listener);
      return {
        remove: () => {
          listeners = listeners.filter((l) => l !== listener);
        },
      };
    }) as never;
  });

  afterEach(() => {
    AppState.addEventListener = original;
    AppState.currentState = originalState;
  });

  const moveTo = async (...states: string[]) => {
    for (const state of states) {
      await act(async () => listeners.forEach((l) => l(state)));
    }
  };

  it("does not lock after a trip to the picker, but after one away", async () => {
    const mediaPicker = createMockMediaPickerAdapter();
    const biometrics = createMockBiometricsAdapter();
    const { result } = await renderHook(
      () => ({
        lock: useAppLock({
          prompt: { promptMessage: "Sblocca", cancelLabel: "Annulla" },
        }),
        picker: useMediaPicker(),
      }),
      { wrapper: wrapperFor({ mediaPicker, biometrics }) },
    );
    await waitFor(() => expect(result.current.lock.isLoading).toBe(false));
    await act(async () => {
      await result.current.lock.unlock();
    });
    expect(result.current.lock.isLocked).toBe(false);

    // Android stops the app behind the picker.
    mediaPicker.holdNext();
    let picked!: Promise<unknown>;
    await act(async () => {
      picked = result.current.picker.pick();
    });
    await moveTo("background");
    await act(async () => mediaPicker.close());
    await moveTo("active");
    await expect(picked).resolves.toMatchObject({ status: "picked" });
    expect(result.current.lock.isLocked).toBe(false);

    await moveTo("background", "active");
    expect(result.current.lock.isLocked).toBe(true);
  });
});

describe("createMockMediaPickerAdapter", () => {
  const REQUEST = toPickRequest();

  it("answers what it is told, and the pending result once", async () => {
    const mock = createMockMediaPickerAdapter();
    mock.respondWith({ status: "cancelled" });
    await expect(mock.pick(REQUEST)).resolves.toEqual({ status: "cancelled" });
    mock.setPending({ status: "failed", detail: "x" });
    await expect(mock.getPendingResult()).resolves.toEqual({
      status: "failed",
      detail: "x",
    });
    await expect(mock.getPendingResult()).resolves.toBeNull();
  });

  it("holds one pick until closed, with the configured answer by default", async () => {
    const mock = createMockMediaPickerAdapter({
      result: { status: "cancelled" },
    });
    mock.close(); // nothing open: no effect
    mock.holdNext();
    const held = mock.pick(REQUEST);
    expect(mock.isOpen).toBe(true);
    mock.close();
    await expect(held).resolves.toEqual({ status: "cancelled" });
    expect(mock.isOpen).toBe(false);
    // Only the next pick was held.
    await expect(mock.pick(REQUEST)).resolves.toEqual({ status: "cancelled" });
  });

  it("builds videos with a duration and images without", () => {
    expect(buildPickedMedia({ type: "video" })).toMatchObject({
      type: "video",
      mimeType: "video/mp4",
      duration: 12_000,
    });
    expect(buildPickedMedia({ fileName: "x.heic" })).toMatchObject({
      type: "image",
      fileName: "x.heic",
      duration: null,
    });
  });
});
