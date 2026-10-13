/**
 * The `@its/glowup-device` half of the smoke test. What only the published
 * package can prove:
 *
 *  - every subpath in the export map resolves for a bundler and for `tsc`
 *    (`/info`, `/location`, `/camera`, `/testing`), with its own published
 *    `.d.ts` — the types annotated below fail `tsc --noEmit` if one stops
 *    resolving,
 *  - the root entry loads without any capability's Expo module,
 *  - the config plugin (`./app.plugin.js`, listed in app.json) resolves, which
 *    `expo export` checks when it reads the app config.
 */
import { Typography, useTheme } from "@its/glowup-ui";
import {
  DeviceAdaptersProvider,
  type PermissionState,
} from "@its/glowup-device";
import { CameraView, useCameraPermission } from "@its/glowup-device/camera";
import type { CameraHandle } from "@its/glowup-device/camera";
import { useDeviceInfo, type DeviceInfo } from "@its/glowup-device/info";
import {
  useLocationPermission,
  type LocationErrorCode,
} from "@its/glowup-device/location";
import { createMockDeviceInfoAdapter } from "@its/glowup-device/testing";
import { useRef } from "react";

const FIRST_CODE: LocationErrorCode = "permission-denied";

const Readout = () => {
  const { theme } = useTheme();
  const info: DeviceInfo = useDeviceInfo();
  const location: PermissionState = useLocationPermission();
  const camera = useCameraPermission();
  const handle = useRef<CameraHandle>(null);

  return (
    <>
      <Typography
        variant="bodyMedium"
        style={{ color: theme.colors.onSurface }}
      >
        {`Device: ${info.model ?? "unknown"} · ${info.platform}`}
      </Typography>
      <Typography
        variant="bodyMedium"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {`Location ${location.status} · camera ${camera.status} · ${FIRST_CODE}`}
      </Typography>
      {camera.status === "granted" ? (
        <CameraView ref={handle} style={{ height: theme.spacing.xl * 4 }} />
      ) : null}
    </>
  );
};

/** Device info through the in-memory adapter, everything else on Expo's. */
export const DeviceSmoke = () => (
  <DeviceAdaptersProvider
    adapters={{ info: createMockDeviceInfoAdapter({ model: "Smoke test" }) }}
  >
    <Readout />
  </DeviceAdaptersProvider>
);
