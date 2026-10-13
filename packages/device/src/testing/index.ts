/**
 * `@its/glowup-device/testing` — in-memory adapters for apps' tests, injected
 * through `DeviceAdaptersProvider` rather than by mocking Expo modules. Nothing
 * here may import a native module or need Jest.
 */
export {
  createMockDeviceInfoAdapter,
  MOCK_DEVICE_INFO,
  type DeviceInfoOverrides,
} from "./deviceInfo";
export {
  buildPosition,
  createMockLocationAdapter,
  type MockLocationAdapter,
  type MockLocationOptions,
} from "./location";
export {
  createMockCameraAdapter,
  MOCK_PICTURE,
  MOCK_VIDEO,
  type MockCameraAdapter,
  type MockCameraOptions,
} from "./camera";
export {
  createMockNetworkAdapter,
  MOCK_NETWORK,
  OFFLINE_NETWORK,
  type MockNetworkAdapter,
} from "./network";
export {
  createMockBatteryAdapter,
  MOCK_BATTERY,
  type MockBatteryAdapter,
} from "./battery";
export {
  createMockKeepAwakeAdapter,
  type MockKeepAwakeAdapter,
} from "./keepAwake";
