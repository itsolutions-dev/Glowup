import type { PermissionState } from "./types";

/**
 * The permission response every Expo module returns (expo-modules-core's
 * `PermissionResponse`), spelled out structurally so the core never imports a
 * native module: each capability's Expo adapter passes its own response here.
 */
export interface PermissionResponseLike {
  status: "granted" | "denied" | "undetermined";
  granted: boolean;
  canAskAgain: boolean;
}

export const UNSUPPORTED: PermissionState = {
  status: "unsupported",
  canAskAgain: false,
};

export const UNKNOWN: PermissionState = {
  status: "undetermined",
  canAskAgain: true,
};

export function toPermissionState(
  raw: PermissionResponseLike,
): PermissionState {
  if (raw.granted || raw.status === "granted") {
    return { status: "granted", canAskAgain: false };
  }
  return {
    status: raw.status === "denied" ? "denied" : "undetermined",
    canAskAgain: raw.canAskAgain,
  };
}

/** The strictest of several states: a camera that records video needs both
 * the camera and the microphone, and is only as granted as the weaker one. */
export function combinePermissions(
  ...states: PermissionState[]
): PermissionState {
  const rank = { unsupported: 0, denied: 1, undetermined: 2, granted: 3 };
  if (states.length === 0) return UNKNOWN;
  const weakest = states.reduce((a, b) =>
    rank[b.status] < rank[a.status] ? b : a,
  );
  if (weakest.status === "granted" || weakest.status === "unsupported") {
    return { status: weakest.status, canAskAgain: false };
  }
  return {
    status: weakest.status,
    // Asking again only helps if every refused or unasked part can be asked.
    canAskAgain: states.every((s) => s.status === "granted" || s.canAskAgain),
  };
}
