import { useCallback, useEffect, useId, useSyncExternalStore } from "react";
import { Platform } from "react-native";

import { useDeviceAdapter } from "../core/adapters";
import { expoKeepAwakeAdapter } from "./expo";
import type { KeepAwakeAdapter } from "./types";
import { webKeepAwakeAdapter } from "./web";

const defaultKeepAwakeAdapter =
  Platform.OS === "web" ? webKeepAwakeAdapter : expoKeepAwakeAdapter;

function useKeepAwakeAdapter(): KeepAwakeAdapter {
  return useDeviceAdapter("keepAwake") ?? defaultKeepAwakeAdapter;
}

export interface UseKeepAwakeOptions {
  /** Hold the screen on while true (default true). */
  enabled?: boolean;
}

/**
 * Keeps the screen on while the component is mounted (and `enabled`): a
 * scanner, a navigation screen, a video. Every mounted hook holds its own tag,
 * so the screen sleeps again only once the last one lets go.
 */
export function useKeepAwake({ enabled = true }: UseKeepAwakeOptions = {}) {
  const adapter = useKeepAwakeAdapter();
  const tag = `glowup-keep-awake${useId()}`;

  useEffect(() => {
    if (!enabled || !adapter.isSupported()) return;
    adapter.activate(tag).catch(() => {});
    return () => {
      adapter.deactivate(tag).catch(() => {});
    };
  }, [adapter, enabled, tag]);
}

const subscribeNothing = () => () => {};
const getServerSupport = () => false;

/**
 * Whether the screen can be kept on here (false in browsers without the Wake
 * Lock API). False while a statically exported page hydrates.
 */
export function useKeepAwakeSupport(): boolean {
  const adapter = useKeepAwakeAdapter();
  const getSupport = useCallback(() => adapter.isSupported(), [adapter]);
  return useSyncExternalStore(subscribeNothing, getSupport, getServerSupport);
}
