import { useDeviceAdapter } from "../core/adapters";
import { expoCameraAdapter } from "./expo";
import type { CameraAdapter } from "./types";

export function useCameraAdapter(): CameraAdapter {
  return useDeviceAdapter("camera") ?? expoCameraAdapter;
}
