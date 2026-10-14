import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Linking } from "react-native";
import { renderToString } from "react-dom/server";

import { DeviceAdaptersProvider } from "..";
import { useMediaLibrary } from "../media-library";
import {
  createMockMediaLibraryAdapter,
  type MockMediaLibraryAdapter,
  type MockMediaLibraryOptions,
} from "../testing";

jest.mock("expo-media-library", () => ({}));

const PHOTO = "file:///cache/ImagePicker/photo.jpg";

async function setup(
  options: MockMediaLibraryOptions = {},
  prepare?: (adapter: MockMediaLibraryAdapter) => void,
) {
  const mediaLibrary = createMockMediaLibraryAdapter(options);
  prepare?.(mediaLibrary);
  const hook = await renderHook(() => useMediaLibrary(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <DeviceAdaptersProvider adapters={{ mediaLibrary }}>
        {children}
      </DeviceAdaptersProvider>
    ),
  });
  return { mediaLibrary, ...hook };
}

async function save(
  result: { current: ReturnType<typeof useMediaLibrary> },
  uri = PHOTO,
) {
  let outcome: unknown;
  await act(async () => {
    outcome = await result.current.save(uri);
  });
  return outcome;
}

describe("useMediaLibrary", () => {
  it("asks for the permission on the first save, then saves", async () => {
    const { result, mediaLibrary } = await setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject({
      isSupported: true,
      isRequired: true,
      status: "undetermined",
      canAskAgain: true,
    });
    // Reading it never prompts.
    expect(mediaLibrary.permissionRequests).toBe(0);

    await expect(save(result)).resolves.toEqual({
      status: "saved",
      assetId: "mock-asset-1",
    });
    expect(mediaLibrary.permissionRequests).toBe(1);
    expect(result.current.status).toBe("granted");

    await expect(save(result, "file:///clip.mp4")).resolves.toMatchObject({
      status: "saved",
    });
    expect(mediaLibrary.permissionRequests).toBe(1);
    expect(mediaLibrary.saved).toEqual([PHOTO, "file:///clip.mp4"]);
  });

  it("answers denied when the prompt is refused, and never asks again", async () => {
    const { result, mediaLibrary } = await setup({ requestAnswer: "denied" });
    await expect(save(result)).resolves.toEqual({ status: "denied" });
    expect(result.current).toMatchObject({
      status: "denied",
      canAskAgain: false,
    });
    await expect(save(result)).resolves.toEqual({ status: "denied" });
    expect(mediaLibrary.permissionRequests).toBe(1);
    expect(mediaLibrary.saved).toEqual([]);
  });

  it("reads the permission again before saving: a change in the settings counts", async () => {
    const { result, mediaLibrary } = await setup({ permission: "granted" });
    mediaLibrary.setPermission("denied");
    await expect(save(result)).resolves.toEqual({ status: "denied" });
    expect(mediaLibrary.permissionRequests).toBe(0);
    mediaLibrary.setPermission("granted");
    await expect(save(result)).resolves.toMatchObject({ status: "saved" });
  });

  it("saves without a permission where none is needed", async () => {
    let getPermission!: jest.SpyInstance;
    const { result, mediaLibrary } = await setup({ gated: false }, (mock) => {
      getPermission = jest.spyOn(mock, "getPermission");
    });
    expect(result.current).toMatchObject({
      isRequired: false,
      isLoading: false,
      status: "granted",
    });
    await expect(result.current.request()).resolves.toEqual({
      status: "granted",
      canAskAgain: false,
    });
    await expect(result.current.refresh()).resolves.toMatchObject({
      status: "granted",
    });
    await expect(save(result)).resolves.toMatchObject({ status: "saved" });
    expect(getPermission).not.toHaveBeenCalled();
    expect(mediaLibrary.permissionRequests).toBe(0);
  });

  it("is unsupported without asking anything", async () => {
    const { result, mediaLibrary } = await setup({ supported: false });
    expect(result.current).toMatchObject({
      isSupported: false,
      isRequired: false,
      isLoading: false,
      status: "unsupported",
      canAskAgain: false,
    });
    await expect(result.current.request()).resolves.toMatchObject({
      status: "unsupported",
    });
    await expect(result.current.refresh()).resolves.toMatchObject({
      status: "unsupported",
    });
    await expect(save(result)).resolves.toEqual({ status: "unsupported" });
    expect(mediaLibrary.permissionRequests).toBe(0);
  });

  it("does not prompt for a permission that is already granted", async () => {
    const { result, mediaLibrary } = await setup({}, (mock) => {
      // An adapter that reports granted but still offers the prompt.
      jest
        .spyOn(mock, "getPermission")
        .mockResolvedValue({ status: "granted", canAskAgain: true });
    });
    await expect(save(result)).resolves.toMatchObject({ status: "saved" });
    expect(mediaLibrary.permissionRequests).toBe(0);
  });

  it("reports a failed save, and an adapter that throws as failed", async () => {
    const { result, mediaLibrary } = await setup({ permission: "granted" });
    mediaLibrary.failNext("ERR_SAVE: missing file");
    await expect(save(result)).resolves.toEqual({
      status: "failed",
      detail: "ERR_SAVE: missing file",
    });
    jest.spyOn(mediaLibrary, "save").mockRejectedValueOnce(new Error("boom"));
    await expect(save(result)).resolves.toEqual({
      status: "failed",
      detail: "Error: boom",
    });
  });

  it("rejects a missing URI before anything else", async () => {
    const { result, mediaLibrary } = await setup();
    await expect(result.current.save("")).rejects.toThrow(TypeError);
    await expect(result.current.save(undefined as never)).rejects.toThrow(
      "uri must be a non-empty string",
    );
    expect(mediaLibrary.permissionRequests).toBe(0);
  });

  it("requests and opens the settings on demand", async () => {
    const { result, mediaLibrary } = await setup();
    await act(async () => {
      await result.current.request();
    });
    expect(mediaLibrary.permissionRequests).toBe(1);
    expect(result.current.status).toBe("granted");

    const openSettings = jest
      .spyOn(Linking, "openSettings")
      .mockResolvedValue(undefined);
    await result.current.openSettings();
    expect(openSettings).toHaveBeenCalledTimes(1);
    openSettings.mockRestore();
  });

  it("renders unknown support and permission on the server", () => {
    let seen: ReturnType<typeof useMediaLibrary> | undefined;
    function Probe() {
      seen = useMediaLibrary();
      return null;
    }
    renderToString(
      <DeviceAdaptersProvider
        adapters={{ mediaLibrary: createMockMediaLibraryAdapter() }}
      >
        <Probe />
      </DeviceAdaptersProvider>,
    );
    expect(seen).toMatchObject({
      isSupported: null,
      isRequired: null,
      isLoading: true,
    });
  });
});

describe("createMockMediaLibraryAdapter", () => {
  let mock: MockMediaLibraryAdapter;
  beforeEach(() => {
    mock = createMockMediaLibraryAdapter({ permission: "denied" });
  });

  it("keeps a refusal: a request changes only an undetermined permission", async () => {
    await expect(mock.requestPermission()).resolves.toEqual({
      status: "denied",
      canAskAgain: false,
    });
    expect(mock.permissionRequests).toBe(1);
  });

  it("fails once, with a default detail", async () => {
    mock.failNext();
    await expect(mock.save(PHOTO)).resolves.toEqual({
      status: "failed",
      detail: "Failed to save the asset",
    });
    await expect(mock.save(PHOTO)).resolves.toEqual({
      status: "saved",
      assetId: "mock-asset-1",
    });
  });
});
