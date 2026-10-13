/**
 * The static web export prerenders in Node: CameraView must not mount the
 * adapter's preview there (no camera, and a mismatch on hydration).
 */
import { renderToString } from "react-dom/server";

import { DeviceAdaptersProvider } from "..";
import { CameraView, type CameraAdapter } from "../camera";
import { createMockCameraAdapter } from "../testing";

jest.mock("expo-camera", () => ({ CameraView: () => null, Camera: {} }));

it("prerenders without the preview", () => {
  const Preview = jest.fn(() => null);
  const camera: CameraAdapter = { ...createMockCameraAdapter(), Preview };
  renderToString(
    <DeviceAdaptersProvider adapters={{ camera }}>
      <CameraView />
    </DeviceAdaptersProvider>,
  );
  expect(Preview).not.toHaveBeenCalled();
});
