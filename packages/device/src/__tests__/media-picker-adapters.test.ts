/**
 * @jest-environment jsdom
 */
import * as ImagePicker from "expo-image-picker";

import { createExpoMediaPickerAdapter } from "../media-picker/expo";
import type { PickRequest } from "../media-picker/types";
import { createWebMediaPickerAdapter } from "../media-picker/web";

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(),
  getPendingResultAsync: jest.fn(async () => null),
}));

// The web adapter reads `hasDOM()`, false under the native jest preset.
let mockDOM = true;
jest.mock("../core/support", () => ({
  ...jest.requireActual("../core/support"),
  hasDOM: () => mockDOM,
}));

const launch = jest.mocked(ImagePicker.launchImageLibraryAsync);
const pending = jest.mocked(ImagePicker.getPendingResultAsync);

const REQUEST: PickRequest = {
  mediaTypes: ["image"],
  multiple: false,
  limit: 0,
  edit: false,
  aspect: null,
  quality: 1,
  exif: false,
};

const expoAsset = (
  overrides: Partial<ImagePicker.ImagePickerAsset> = {},
): ImagePicker.ImagePickerAsset => ({
  uri: "file:///cache/ImagePicker/a.jpg",
  width: 3024,
  height: 4032,
  type: "image",
  mimeType: "image/jpeg",
  fileName: "IMG_0001.JPG",
  fileSize: 2_100_000,
  assetId: "A1",
  duration: null,
  exif: null,
  ...overrides,
});

beforeEach(() => {
  launch.mockReset();
  pending.mockReset();
  mockDOM = true;
});

describe("createExpoMediaPickerAdapter", () => {
  it("maps the request onto expo's options", async () => {
    launch.mockResolvedValue({ canceled: true, assets: null });
    const adapter = createExpoMediaPickerAdapter();
    await adapter.pick({
      ...REQUEST,
      mediaTypes: ["image", "video"],
      multiple: true,
      limit: 4,
      quality: 0.5,
      exif: true,
    });
    await adapter.pick({ ...REQUEST, edit: true, aspect: [16, 9] });
    expect(launch.mock.calls).toEqual([
      [
        {
          mediaTypes: ["images", "videos"],
          allowsMultipleSelection: true,
          selectionLimit: 4,
          orderedSelection: true,
          allowsEditing: false,
          quality: 0.5,
          exif: true,
          shouldDownloadFromNetwork: true,
        },
      ],
      [
        {
          mediaTypes: ["images"],
          allowsMultipleSelection: false,
          selectionLimit: 1,
          orderedSelection: false,
          allowsEditing: true,
          aspect: [16, 9],
          quality: 1,
          exif: false,
          shouldDownloadFromNetwork: true,
        },
      ],
    ]);
  });

  it("normalises the picked assets", async () => {
    launch.mockResolvedValue({
      canceled: false,
      assets: [
        expoAsset(),
        expoAsset({
          uri: "file:///cache/ImagePicker/b.mp4",
          type: "video",
          mimeType: "video/mp4",
          duration: 12_345,
          assetId: null,
          fileName: null,
          fileSize: undefined,
          exif: undefined,
        }),
        // Some Android providers report no type.
        expoAsset({ type: null, mimeType: "video/quicktime", duration: 900 }),
        expoAsset({ type: undefined, mimeType: undefined, duration: 5 }),
        // The reported type wins over the MIME type.
        expoAsset({ type: "image", mimeType: "video/mp4", duration: 7 }),
      ],
    });
    const result = await createExpoMediaPickerAdapter().pick(REQUEST);
    expect(result).toEqual({
      status: "picked",
      assets: [
        {
          uri: "file:///cache/ImagePicker/a.jpg",
          type: "image",
          width: 3024,
          height: 4032,
          mimeType: "image/jpeg",
          fileName: "IMG_0001.JPG",
          fileSize: 2_100_000,
          duration: null,
          assetId: "A1",
          exif: null,
        },
        {
          uri: "file:///cache/ImagePicker/b.mp4",
          type: "video",
          width: 3024,
          height: 4032,
          mimeType: "video/mp4",
          fileName: null,
          fileSize: null,
          duration: 12_345,
          assetId: null,
          exif: null,
        },
        expect.objectContaining({ type: "video", duration: 900 }),
        expect.objectContaining({
          type: "image",
          mimeType: null,
          duration: null,
        }),
        expect.objectContaining({ type: "image", duration: null }),
      ],
    });
  });

  it("answers cancelled, and failed with expo's code", async () => {
    const adapter = createExpoMediaPickerAdapter();
    launch.mockResolvedValueOnce({ canceled: true, assets: null });
    await expect(adapter.pick(REQUEST)).resolves.toEqual({
      status: "cancelled",
    });
    launch.mockRejectedValueOnce(
      Object.assign(new Error("Failed to read picked image"), {
        code: "ERR_FAILED_TO_READ_IMAGE",
      }),
    );
    await expect(adapter.pick(REQUEST)).resolves.toEqual({
      status: "failed",
      detail: "ERR_FAILED_TO_READ_IMAGE: Failed to read picked image",
    });
    launch.mockRejectedValueOnce("odd");
    await expect(adapter.pick(REQUEST)).resolves.toEqual({
      status: "failed",
      detail: "odd",
    });
  });

  it("refuses a second pick while one is open", async () => {
    let finish!: (result: ImagePicker.ImagePickerResult) => void;
    launch.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    const adapter = createExpoMediaPickerAdapter();
    const first = adapter.pick(REQUEST);
    await expect(adapter.pick(REQUEST)).resolves.toEqual({ status: "busy" });
    expect(launch).toHaveBeenCalledTimes(1);
    finish({ canceled: true, assets: null });
    await expect(first).resolves.toEqual({ status: "cancelled" });

    // Free again, also after a failure.
    launch.mockRejectedValueOnce(new Error("x"));
    await adapter.pick(REQUEST);
    launch.mockResolvedValueOnce({ canceled: true, assets: null });
    await expect(adapter.pick(REQUEST)).resolves.toEqual({
      status: "cancelled",
    });
  });

  it("reads the pending result of an interrupted pick", async () => {
    const adapter = createExpoMediaPickerAdapter();
    pending.mockResolvedValueOnce(null);
    await expect(adapter.getPendingResult()).resolves.toBeNull();
    pending.mockResolvedValueOnce({ canceled: false, assets: [expoAsset()] });
    await expect(adapter.getPendingResult()).resolves.toMatchObject({
      status: "picked",
      assets: [{ assetId: "A1" }],
    });
    pending.mockResolvedValueOnce({
      code: "ERR_FAILED_TO_PICK",
      message: "Lost",
    });
    await expect(adapter.getPendingResult()).resolves.toEqual({
      status: "failed",
      detail: "ERR_FAILED_TO_PICK: Lost",
    });
    pending.mockRejectedValueOnce(new Error("gone"));
    await expect(adapter.getPendingResult()).resolves.toEqual({
      status: "failed",
      detail: "gone",
    });
  });
});

describe("createWebMediaPickerAdapter", () => {
  const OriginalImage = window.Image;
  const urlDescriptor = Object.getOwnPropertyDescriptor(globalThis, "URL");
  const setObjectURL = (create: (blob: Blob) => string) =>
    Object.defineProperty(globalThis, "URL", {
      value: { createObjectURL: jest.fn(create) },
      configurable: true,
      writable: true,
    });
  const createElement = document.createElement.bind(document);
  let clicks: HTMLInputElement[];
  let urls: Blob[];

  beforeEach(() => {
    clicks = [];
    urls = [];
    jest
      .spyOn(HTMLInputElement.prototype, "click")
      .mockImplementation(function (this: HTMLInputElement) {
        clicks.push(this);
      });
    // expo's runtime installs a lazy URL that jsdom cannot build.
    setObjectURL((blob: Blob) => {
      urls.push(blob);
      return `blob:${urls.length}`;
    });
    // jsdom loads no media: answer like a browser would.
    window.Image = class {
      naturalWidth = 640;
      naturalHeight = 480;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(url: string) {
        setTimeout(() => (url === "blob:bad" ? this.onerror : this.onload)?.());
      }
    } as never;
    jest.spyOn(document, "createElement").mockImplementation(((tag: string) => {
      if (tag !== "video") return createElement(tag);
      const video = {
        videoWidth: 1920,
        videoHeight: 1080,
        duration: 3.2,
        preload: "",
        onloadedmetadata: null as (() => void) | null,
        onerror: null,
        set src(_url: string) {
          setTimeout(() => video.onloadedmetadata?.());
        },
      };
      return video;
    }) as never);
  });

  afterEach(() => {
    window.Image = OriginalImage;
    if (urlDescriptor) Object.defineProperty(globalThis, "URL", urlDescriptor);
    jest.restoreAllMocks();
    document.body.innerHTML = "";
  });

  const file = (name: string, type: string, size = 10) =>
    new File([new Uint8Array(size)], name, { type });

  function choose(input: HTMLInputElement, files: File[]) {
    Object.defineProperty(input, "files", { value: files, configurable: true });
    input.dispatchEvent(new Event("change"));
  }

  it("opens a file input synchronously, configured from the request", () => {
    const adapter = createWebMediaPickerAdapter();
    void adapter.pick({
      ...REQUEST,
      mediaTypes: ["image", "video"],
      multiple: true,
    });
    // Clicked before pick() returned: inside the user's gesture.
    expect(clicks).toHaveLength(1);
    const [input] = clicks;
    expect(input.type).toBe("file");
    expect(input.accept).toBe("image/*,video/*");
    expect(input.multiple).toBe(true);
    expect(input.parentNode).toBe(document.body);
  });

  it("reads the chosen files, durations in ms", async () => {
    const adapter = createWebMediaPickerAdapter();
    const picked = adapter.pick({
      ...REQUEST,
      mediaTypes: ["image", "video"],
      multiple: true,
    });
    const photo = file("photo.png", "image/png", 300);
    const clip = file("clip.mp4", "video/mp4", 900);
    choose(clicks[0], [photo, clip]);
    await expect(picked).resolves.toEqual({
      status: "picked",
      assets: [
        {
          uri: "blob:1",
          type: "image",
          width: 640,
          height: 480,
          mimeType: "image/png",
          fileName: "photo.png",
          fileSize: 300,
          duration: null,
          assetId: null,
          exif: null,
          file: photo,
        },
        expect.objectContaining({
          uri: "blob:2",
          type: "video",
          width: 1920,
          height: 1080,
          duration: 3200,
          file: clip,
        }),
      ],
    });
    // The input leaves the page.
    expect(document.body.querySelector("input")).toBeNull();
  });

  it("keeps the requested types, one item or the first `limit`", async () => {
    const adapter = createWebMediaPickerAdapter();
    const files = [
      file("notes.txt", "text/plain"),
      file("a.jpg", "image/jpeg"),
      file("b.mov", "video/quicktime"),
      file("c.jpg", "image/jpeg"),
      file("d.jpg", "image/jpeg"),
    ];

    const one = adapter.pick(REQUEST);
    choose(clicks[0], files);
    expect(await one).toMatchObject({ assets: [{ fileName: "a.jpg" }] });

    const two = adapter.pick({ ...REQUEST, multiple: true, limit: 2 });
    choose(clicks[1], files);
    expect(await two).toMatchObject({
      assets: [{ fileName: "a.jpg" }, { fileName: "c.jpg" }],
    });

    const all = adapter.pick({ ...REQUEST, multiple: true });
    choose(clicks[2], files);
    expect(await all).toMatchObject({
      assets: [
        { fileName: "a.jpg" },
        { fileName: "c.jpg" },
        { fileName: "d.jpg" },
      ],
    });

    const none = adapter.pick(REQUEST);
    choose(clicks[3], [file("notes.txt", "text/plain")]);
    await expect(none).resolves.toEqual({
      status: "failed",
      detail: "No selected file is of an accepted type (image).",
    });
  });

  it("answers cancelled on the cancel event or an empty choice", async () => {
    const adapter = createWebMediaPickerAdapter();
    const first = adapter.pick(REQUEST);
    clicks[0].dispatchEvent(new Event("cancel"));
    await expect(first).resolves.toEqual({ status: "cancelled" });
    expect(document.body.querySelector("input")).toBeNull();

    const second = adapter.pick(REQUEST);
    choose(clicks[1], []);
    await expect(second).resolves.toEqual({ status: "cancelled" });
  });

  it("settles an unanswered pick as cancelled when a new one opens", async () => {
    const adapter = createWebMediaPickerAdapter();
    const stale = adapter.pick(REQUEST);
    const fresh = adapter.pick(REQUEST);
    await expect(stale).resolves.toEqual({ status: "cancelled" });
    expect(document.body.querySelectorAll("input")).toHaveLength(1);

    // A late event on the old input changes nothing.
    choose(clicks[0], [file("late.jpg", "image/jpeg")]);
    choose(clicks[1], [file("now.jpg", "image/jpeg")]);
    await expect(fresh).resolves.toMatchObject({
      assets: [{ fileName: "now.jpg" }],
    });
  });

  it("reads zero sizes for media the browser cannot decode", async () => {
    setObjectURL(() => "blob:bad");
    const adapter = createWebMediaPickerAdapter();
    const picked = adapter.pick(REQUEST);
    choose(clicks[0], [file("broken.jpg", "image/jpeg")]);
    await expect(picked).resolves.toMatchObject({
      assets: [{ width: 0, height: 0 }],
    });
  });

  it("is unsupported without a DOM", async () => {
    mockDOM = false;
    const adapter = createWebMediaPickerAdapter();
    expect(adapter.isSupported()).toBe(false);
    await expect(adapter.pick(REQUEST)).resolves.toEqual({
      status: "unsupported",
    });
    expect(clicks).toHaveLength(0);
    await expect(adapter.getPendingResult()).resolves.toBeNull();
  });
});
