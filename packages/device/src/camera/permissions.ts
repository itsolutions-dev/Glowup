import { useCallback } from "react";
import { Linking } from "react-native";

import { combinePermissions, UNKNOWN, UNSUPPORTED } from "../core/permissions";
import {
  createPermissionStore,
  usePermissionSnapshot,
  type PermissionStore,
} from "../core/permissionStore";
import type { PermissionState } from "../core/types";
import { useCameraAdapter } from "./adapter";
import type { CameraAdapter, CameraPermissionKind } from "./types";

type Stores = Record<CameraPermissionKind, PermissionStore<PermissionState>>;

// One pair of stores per adapter, so every component sees the same answer.
const stores = new WeakMap<CameraAdapter, Stores>();

function getStores(adapter: CameraAdapter): Stores {
  let pair = stores.get(adapter);
  if (!pair) {
    const create = (kind: CameraPermissionKind) =>
      createPermissionStore({
        isSupported: () => adapter.isSupported(),
        read: () => adapter.getPermission(kind),
        request: () => adapter.requestPermission(kind),
        unsupported: UNSUPPORTED,
        unknown: UNKNOWN,
      });
    pair = { camera: create("camera"), microphone: create("microphone") };
    stores.set(adapter, pair);
  }
  return pair;
}

export interface UseCameraPermissionOptions {
  /**
   * Also need the microphone (to record video with sound). Ignored where the
   * adapter cannot record (web). Default false.
   */
  microphone?: boolean;
}

export interface UseCameraPermission extends PermissionState {
  /** True until the first read answers (`status` reads `"undetermined"` meanwhile). */
  isLoading: boolean;
  camera: PermissionState;
  /** `null` when the microphone is not needed. */
  microphone: PermissionState | null;
  /**
   * Asks for the camera, then — once it is granted — the microphone. Once
   * `canAskAgain` is false the OS ignores it: call `openSettings()`.
   */
  request: () => Promise<PermissionState>;
  refresh: () => Promise<PermissionState>;
  /** Opens this app's page in the system settings (native only). */
  openSettings: () => Promise<void>;
}

/**
 * The camera permission (and the microphone's, with `microphone: true`),
 * shared by every component that asks and re-read on foreground. The
 * top-level `status` is the weaker of the two.
 */
export function useCameraPermission({
  microphone = false,
}: UseCameraPermissionOptions = {}): UseCameraPermission {
  const adapter = useCameraAdapter();
  const pair = getStores(adapter);
  const needsMicrophone = microphone && adapter.supportsVideo();
  const cameraState = usePermissionSnapshot(pair.camera);
  const microphoneState = usePermissionSnapshot(
    needsMicrophone ? pair.microphone : null,
  );

  const request = useCallback(async () => {
    const cam = await pair.camera.request();
    if (!needsMicrophone) return cam;
    // Only ask for the microphone once the camera is allowed: two prompts
    // for a camera the user refused would be noise.
    const sound =
      cam.status === "granted"
        ? await pair.microphone.request()
        : (pair.microphone.getSnapshot() ?? UNKNOWN);
    return combinePermissions(cam, sound);
  }, [pair, needsMicrophone]);

  const refresh = useCallback(async () => {
    const [cam, sound] = await Promise.all([
      pair.camera.refresh(),
      needsMicrophone ? pair.microphone.refresh() : null,
    ]);
    return sound ? combinePermissions(cam, sound) : cam;
  }, [pair, needsMicrophone]);

  const camera = cameraState ?? UNKNOWN;
  const mic = needsMicrophone ? (microphoneState ?? UNKNOWN) : null;
  const combined = mic ? combinePermissions(camera, mic) : camera;

  return {
    ...combined,
    isLoading:
      cameraState === null || (needsMicrophone && microphoneState === null),
    camera,
    microphone: mic,
    request,
    refresh,
    openSettings: () => Linking.openSettings(),
  };
}
