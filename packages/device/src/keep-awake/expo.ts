import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";

import { isNativePlatform } from "../core/support";
import type { KeepAwakeAdapter } from "./types";

/** The native default: expo-keep-awake, which counts tags natively. */
export const expoKeepAwakeAdapter: KeepAwakeAdapter = {
  isSupported: () => isNativePlatform,
  activate: (tag) => activateKeepAwakeAsync(tag),
  deactivate: (tag) => deactivateKeepAwake(tag).catch(() => {}),
};
