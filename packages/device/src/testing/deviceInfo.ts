import type { DeviceInfo, DeviceInfoAdapter } from "../info/types";

/** A plausible phone, so a test only spells out what it is about. */
export const MOCK_DEVICE_INFO: DeviceInfo = {
  platform: "ios",
  model: "iPhone 15",
  brand: "Apple",
  manufacturer: "Apple",
  os: { name: "iOS", version: "18.0" },
  deviceType: "phone",
  isEmulator: false,
  app: {
    id: "com.example.app",
    name: "Example",
    version: "1.0.0",
    build: "1",
  },
};

export type DeviceInfoOverrides = Partial<Omit<DeviceInfo, "os" | "app">> & {
  os?: Partial<DeviceInfo["os"]>;
  app?: Partial<DeviceInfo["app"]>;
};

/**
 * A `DeviceInfoAdapter` answering `MOCK_DEVICE_INFO` with your overrides
 * merged in (`os` and `app` field by field):
 *
 *   <DeviceAdaptersProvider adapters={{ info: createMockDeviceInfoAdapter({ deviceType: "tablet" }) }}>
 */
export function createMockDeviceInfoAdapter(
  overrides: DeviceInfoOverrides = {},
): DeviceInfoAdapter {
  const info: DeviceInfo = {
    ...MOCK_DEVICE_INFO,
    ...overrides,
    os: { ...MOCK_DEVICE_INFO.os, ...overrides.os },
    app: { ...MOCK_DEVICE_INFO.app, ...overrides.app },
  };
  return { getDeviceInfo: () => info };
}
