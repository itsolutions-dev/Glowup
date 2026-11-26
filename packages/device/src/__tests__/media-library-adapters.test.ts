import {
  Asset,
  getPermissionsAsync,
  requestPermissionsAsync,
} from "expo-media-library";
import { Platform } from "react-native";

import { expoMediaLibraryAdapter } from "../media-library/expo";
import * as WebSplit from "../media-library/expo.web";
import { webMediaLibraryAdapter } from "../media-library/web";

jest.mock("expo-media-library", () => ({
  Asset: { create: jest.fn() },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

const create = jest.mocked(Asset.create);
const getPermissions = jest.mocked(getPermissionsAsync);
const requestPermissions = jest.mocked(requestPermissionsAsync);

const original = { OS: Platform.OS, Version: Platform.Version };
function onPlatform(OS: "ios" | "android", Version: number | string) {
  Object.defineProperty(Platform, "OS", { value: OS, configurable: true });
  Object.defineProperty(Platform, "Version", {
    value: Version,
    configurable: true,
  });
}

afterEach(() => {
  onPlatform(original.OS as "ios", original.Version);
  jest.clearAllMocks();
});

const response = (status: "granted" | "denied" | "undetermined") =>
  ({
    status,
    granted: status === "granted",
    canAskAgain: status === "undetermined",
    expires: "never",
  }) as never;

describe("expoMediaLibraryAdapter", () => {
  it("asks iOS for add-only access", async () => {
    onPlatform("ios", "18.0");
    const adapter = expoMediaLibraryAdapter;
    expect(adapter.isSupported()).toBe(true);
    expect(adapter.requiresPermission()).toBe(true);
    getPermissions.mockResolvedValueOnce(response("undetermined"));
    await expect(adapter.getPermission()).resolves.toEqual({
      status: "undetermined",
      canAskAgain: true,
    });
    expect(getPermissions).toHaveBeenCalledWith(true);
    requestPermissions.mockResolvedValueOnce(response("denied"));
    await expect(adapter.requestPermission()).resolves.toEqual({
      status: "denied",
      canAskAgain: false,
    });
    expect(requestPermissions).toHaveBeenCalledWith(true);
  });

  it("asks Android before 11 for storage, and Android 11+ for nothing", async () => {
    onPlatform("android", 29);
    const adapter = expoMediaLibraryAdapter;
    expect(adapter.requiresPermission()).toBe(true);
    requestPermissions.mockResolvedValueOnce(response("granted"));
    await expect(adapter.requestPermission()).resolves.toMatchObject({
      status: "granted",
    });

    onPlatform("android", 30);
    expect(adapter.requiresPermission()).toBe(false);
    await expect(adapter.getPermission()).resolves.toEqual({
      status: "granted",
      canAskAgain: false,
    });
    await expect(adapter.requestPermission()).resolves.toMatchObject({
      status: "granted",
    });
    expect(getPermissions).not.toHaveBeenCalled();
    expect(requestPermissions).toHaveBeenCalledTimes(1);
  });

  it("saves through Asset.create and returns the new id", async () => {
    create.mockResolvedValueOnce({ id: "ph://ABC/L0/001" } as never);
    await expect(
      expoMediaLibraryAdapter.save("file:///cache/a.jpg"),
    ).resolves.toEqual({ status: "saved", assetId: "ph://ABC/L0/001" });
    expect(create).toHaveBeenCalledWith("file:///cache/a.jpg");
  });

  it("answers failed with expo's code and message", async () => {
    const adapter = expoMediaLibraryAdapter;
    create.mockRejectedValueOnce(
      Object.assign(new Error("File does not exist"), {
        code: "ERR_FAILED_TO_CREATE_ASSET",
      }),
    );
    await expect(adapter.save("file:///gone.jpg")).resolves.toEqual({
      status: "failed",
      detail: "ERR_FAILED_TO_CREATE_ASSET: File does not exist",
    });
    create.mockRejectedValueOnce("odd");
    await expect(adapter.save("file:///x.jpg")).resolves.toEqual({
      status: "failed",
      detail: "odd",
    });
  });
});

describe("the web", () => {
  it("has no library: unsupported, nothing asked", async () => {
    expect(webMediaLibraryAdapter.isSupported()).toBe(false);
    expect(webMediaLibraryAdapter.requiresPermission()).toBe(false);
    await expect(webMediaLibraryAdapter.getPermission()).resolves.toEqual({
      status: "unsupported",
      canAskAgain: false,
    });
    await expect(webMediaLibraryAdapter.requestPermission()).resolves.toEqual({
      status: "unsupported",
      canAskAgain: false,
    });
    await expect(webMediaLibraryAdapter.save("blob:1")).resolves.toEqual({
      status: "unsupported",
    });
  });

  it("bundles the web adapter in place of the Expo one", () => {
    expect(WebSplit.expoMediaLibraryAdapter).toBe(webMediaLibraryAdapter);
    expect(WebSplit.expoMediaLibraryAdapter.isSupported()).toBe(false);
  });
});
