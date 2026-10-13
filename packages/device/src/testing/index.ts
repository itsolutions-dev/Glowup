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
