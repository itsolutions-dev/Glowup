import { createContext, type ReactNode, useContext, useMemo } from "react";

import type { CameraAdapter } from "../camera/types";
import type { DeviceInfoAdapter } from "../info/types";
import type { LocationAdapter } from "../location/types";

/**
 * Every capability's adapter contract. Type imports only: the root entry must
 * never load a capability, or it would require that capability's Expo peer.
 */
export interface DeviceAdapters {
  info: DeviceInfoAdapter;
  location: LocationAdapter;
  camera: CameraAdapter;
}

const DeviceAdaptersContext = createContext<Partial<DeviceAdapters>>({});

export interface DeviceAdaptersProviderProps {
  /** Adapters replacing a capability's Expo default. Missing ones inherit
   * from an outer provider, then fall back to Expo. */
  adapters: Partial<DeviceAdapters>;
  children?: ReactNode;
}

/**
 * Optional. Every capability works without it, on its Expo adapter; mount it
 * to swap an implementation, typically with `@its/glowup-device/testing`'s
 * in-memory adapters in tests.
 */
export function DeviceAdaptersProvider({
  adapters,
  children,
}: DeviceAdaptersProviderProps) {
  const parent = useContext(DeviceAdaptersContext);
  // One dependency per adapter rather than `adapters`, which is usually an
  // inline literal: a new object every render must not reset the consumers.
  const { info, location, camera } = adapters;
  const value = useMemo(
    () => ({
      ...parent,
      ...(info && { info }),
      ...(location && { location }),
      ...(camera && { camera }),
    }),
    [parent, info, location, camera],
  );
  return (
    <DeviceAdaptersContext.Provider value={value}>
      {children}
    </DeviceAdaptersContext.Provider>
  );
}

/** The provided adapter for a capability, or `undefined` for its default. */
export function useDeviceAdapter<K extends keyof DeviceAdapters>(
  key: K,
): DeviceAdapters[K] | undefined {
  return useContext(DeviceAdaptersContext)[key];
}
