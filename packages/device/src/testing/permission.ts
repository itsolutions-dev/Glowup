import type { PermissionState, PermissionStatus } from "../core/types";

/** As the platforms answer: only an undetermined permission can be asked by default. */
export function mockPermission(
  status: PermissionStatus,
  canAskAgain = status === "undetermined",
): PermissionState {
  return { status, canAskAgain };
}
