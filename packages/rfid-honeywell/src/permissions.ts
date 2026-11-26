import type { PermissionState } from "@its/glowup-device/rfid";
import { PermissionsAndroid, Platform, type Permission } from "react-native";

const GRANTED: PermissionState = { status: "granted", canAskAgain: false };
const UNDETERMINED: PermissionState = {
  status: "undetermined",
  canAskAgain: true,
};
const UNSUPPORTED: PermissionState = {
  status: "unsupported",
  canAskAgain: false,
};

/**
 * What the reader's link needs at run time. From Android 12: the nearby
 * devices permissions (the plugin declares the scan `neverForLocation`). Up to
 * Android 11 connecting needs nothing at run time, but finding readers is a
 * Bluetooth scan, which needs the precise location.
 */
function androidPermissions(): Permission[] {
  const { BLUETOOTH_SCAN, BLUETOOTH_CONNECT, ACCESS_FINE_LOCATION } =
    PermissionsAndroid.PERMISSIONS;
  return (Platform.Version as number) >= 31
    ? [BLUETOOTH_SCAN, BLUETOOTH_CONNECT]
    : [ACCESS_FINE_LOCATION];
}

export function createAndroidPermissions() {
  // Android tells "never ask again" only in a request's answer: kept for this
  // launch, so a later read does not claim the prompt can show.
  let answer: PermissionState | null = null;

  return {
    unsupported: async () => UNSUPPORTED,

    async read(): Promise<PermissionState> {
      const checks = await Promise.all(
        androidPermissions().map((permission) =>
          PermissionsAndroid.check(permission),
        ),
      );
      if (checks.every(Boolean)) return GRANTED;
      return answer?.status === "denied" ? answer : UNDETERMINED;
    },

    async request(): Promise<PermissionState> {
      const permissions = androidPermissions();
      const answers = await PermissionsAndroid.requestMultiple(permissions);
      const results = permissions.map((permission) => answers[permission]);
      const { GRANTED: YES, NEVER_ASK_AGAIN } = PermissionsAndroid.RESULTS;
      answer = results.every((result) => result === YES)
        ? GRANTED
        : {
            status: "denied",
            canAskAgain: !results.includes(NEVER_ASK_AGAIN),
          };
      return answer;
    },
  };
}
