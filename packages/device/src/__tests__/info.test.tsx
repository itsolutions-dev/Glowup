import { renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { DeviceAdaptersProvider } from "..";
import {
  expoDeviceInfoAdapter,
  useDeviceInfo,
  type DeviceInfoAdapter,
} from "../info";
import { createMockDeviceInfoAdapter, MOCK_DEVICE_INFO } from "../testing";

// Getters over a mutable object, so a test can change one constant without
// re-importing the modules (they are read when the adapter is called).
const mockDevice: Record<string, unknown> = {};
const mockApplication: Record<string, unknown> = {};

jest.mock("expo-device", () => {
  const DeviceType = { UNKNOWN: 0, PHONE: 1, TABLET: 2, DESKTOP: 3, TV: 4 };
  const fields = [
    "isDevice",
    "brand",
    "manufacturer",
    "modelName",
    "deviceType",
    "osName",
    "osVersion",
  ];
  const mod: Record<string, unknown> = { DeviceType };
  for (const field of fields) {
    Object.defineProperty(mod, field, {
      get: () => mockDevice[field],
      enumerable: true,
    });
  }
  return mod;
});

jest.mock("expo-application", () => {
  const fields = [
    "applicationId",
    "applicationName",
    "nativeApplicationVersion",
    "nativeBuildVersion",
  ];
  const mod: Record<string, unknown> = {};
  for (const field of fields) {
    Object.defineProperty(mod, field, {
      get: () => mockApplication[field],
      enumerable: true,
    });
  }
  return mod;
});

beforeEach(() => {
  Object.assign(mockDevice, {
    isDevice: true,
    brand: "google",
    manufacturer: "Google",
    modelName: "Pixel 8",
    deviceType: 1,
    osName: "Android",
    osVersion: "15",
  });
  Object.assign(mockApplication, {
    applicationId: "it.itsolutions.glowup",
    applicationName: "Glowup",
    nativeApplicationVersion: "2.1.0",
    nativeBuildVersion: "42",
  });
});

describe("expoDeviceInfoAdapter", () => {
  it("maps expo-device and expo-application", () => {
    expect(expoDeviceInfoAdapter.getDeviceInfo()).toEqual({
      platform: "ios",
      model: "Pixel 8",
      brand: "google",
      manufacturer: "Google",
      os: { name: "Android", version: "15" },
      deviceType: "phone",
      isEmulator: false,
      app: {
        id: "it.itsolutions.glowup",
        name: "Glowup",
        version: "2.1.0",
        build: "42",
      },
    });
  });

  it("maps every device type, and an unknown one to unknown", () => {
    const types = [0, 1, 2, 3, 4, null, 99].map((deviceType) => {
      mockDevice.deviceType = deviceType;
      return expoDeviceInfoAdapter.getDeviceInfo().deviceType;
    });
    expect(types).toEqual([
      "unknown",
      "phone",
      "tablet",
      "desktop",
      "tv",
      "unknown",
      "unknown",
    ]);
  });

  it("reports a simulator as an emulator", () => {
    mockDevice.isDevice = false;
    expect(expoDeviceInfoAdapter.getDeviceInfo().isEmulator).toBe(true);
  });

  it("turns the empty strings expo-device answers on web into null", () => {
    Object.assign(mockDevice, { osName: "", osVersion: "", brand: null });
    mockApplication.nativeApplicationVersion = null;
    const info = expoDeviceInfoAdapter.getDeviceInfo();
    expect(info.os).toEqual({ name: null, version: null });
    expect(info.brand).toBeNull();
    expect(info.app.version).toBeNull();
  });
});

describe("useDeviceInfo", () => {
  const withAdapters =
    (...layers: { info?: DeviceInfoAdapter }[]) =>
    ({ children }: { children: ReactNode }) =>
      layers.reduceRight<ReactNode>(
        (inner, adapters) => (
          <DeviceAdaptersProvider adapters={adapters}>
            {inner}
          </DeviceAdaptersProvider>
        ),
        children,
      );

  it("reads the Expo adapter without a provider", async () => {
    const { result } = await renderHook(() => useDeviceInfo());
    expect(result.current.model).toBe("Pixel 8");
    expect(result.current.app.build).toBe("42");
  });

  it("reads the provided adapter", async () => {
    const { result } = await renderHook(() => useDeviceInfo(), {
      wrapper: withAdapters({
        info: createMockDeviceInfoAdapter({ deviceType: "tablet" }),
      }),
    });
    expect(result.current).toEqual({
      ...MOCK_DEVICE_INFO,
      deviceType: "tablet",
    });
  });

  it("inherits an adapter an inner provider does not set", async () => {
    const outer = createMockDeviceInfoAdapter({ model: "Outer" });
    const { result } = await renderHook(() => useDeviceInfo(), {
      wrapper: withAdapters({ info: outer }, {}),
    });
    expect(result.current.model).toBe("Outer");
  });

  it("lets an inner provider override an outer one", async () => {
    const { result } = await renderHook(() => useDeviceInfo(), {
      wrapper: withAdapters(
        { info: createMockDeviceInfoAdapter({ model: "Outer" }) },
        { info: createMockDeviceInfoAdapter({ model: "Inner" }) },
      ),
    });
    expect(result.current.model).toBe("Inner");
  });

  it("reads the adapter once and returns the same object", async () => {
    const adapter = createMockDeviceInfoAdapter();
    const getDeviceInfo = jest.spyOn(adapter, "getDeviceInfo");
    const { result, rerender } = await renderHook(() => useDeviceInfo(), {
      wrapper: withAdapters({ info: adapter }),
    });
    const first = result.current;
    await rerender({});
    expect(result.current).toBe(first);
    expect(getDeviceInfo).toHaveBeenCalledTimes(1);
  });
});

describe("createMockDeviceInfoAdapter", () => {
  it("merges os and app field by field", () => {
    const info = createMockDeviceInfoAdapter({
      os: { version: "17.5" },
      app: { build: "7" },
    }).getDeviceInfo();
    expect(info.os).toEqual({ name: "iOS", version: "17.5" });
    expect(info.app).toEqual({ ...MOCK_DEVICE_INFO.app, build: "7" });
  });
});
