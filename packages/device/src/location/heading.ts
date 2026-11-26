import { useEffect, useState } from "react";
import { AppState, type NativeEventSubscription } from "react-native";

import type { Unsubscribe } from "../core/types";
import { LocationError, toError } from "../core/geo";
import { getOrCreate } from "../core/shared";
import type { Heading, LocationAdapter } from "./types";
import { useLocationAdapter } from "./hooks";

interface Reader {
  onHeading: (heading: Heading) => void;
  onError: (error: LocationError) => void;
}

interface HeadingStream {
  subscribe(reader: Reader): Unsubscribe;
}

/**
 * One native heading watch per adapter however many components read it:
 * Android keeps a single watch, and a second one would take the events away
 * from the first. It stops while the app is in the background (iOS would
 * keep the compass running there) and closes with the last reader: a reader
 * subscribes only after an asynchronous permission read, so a grace period
 * would not keep it open for a remounted one anyway. A failure ends the
 * watch and is told to every reader; it is not reopened until a reader
 * subscribes again.
 */
function createHeadingStream(adapter: LocationAdapter): HeadingStream {
  const readers = new Set<Reader>();
  let stopPlatform: Unsubscribe | null = null;
  let appState: NativeEventSubscription | null = null;
  let foreground = true;
  let failed = false;
  let last: Heading | null = null;

  const stop = () => {
    stopPlatform?.();
    stopPlatform = null;
  };

  const emit = (heading: Heading) => {
    last = heading;
    [...readers].forEach((reader) => reader.onHeading(heading));
  };

  const fail = (error: LocationError) => {
    failed = true;
    last = null;
    stop();
    [...readers].forEach((reader) => reader.onError(error));
  };

  const close = () => {
    stop();
    appState?.remove();
    appState = null;
    last = null;
  };

  function update() {
    if (readers.size === 0) {
      close();
      return;
    }
    if (!appState) {
      foreground = AppState.currentState !== "background";
      appState = AppState.addEventListener("change", (next) => {
        // `inactive` (the control centre, a call banner) keeps the compass.
        foreground = next !== "background";
        update();
      });
    }
    if (!foreground) {
      stop();
      // A reading from before the pause would be stale on return.
      last = null;
    } else if (!stopPlatform && !failed && adapter.watchHeading) {
      stopPlatform = adapter.watchHeading(emit, fail);
    }
  }

  return {
    subscribe(reader) {
      readers.add(reader);
      failed = false;
      if (last) reader.onHeading(last);
      update();
      return () => {
        readers.delete(reader);
        update();
      };
    },
  };
}

const streams = new WeakMap<LocationAdapter, HeadingStream>();

function getHeadingStream(adapter: LocationAdapter): HeadingStream {
  return getOrCreate(streams, adapter, () => createHeadingStream(adapter));
}

/**
 * Support and permission, never a prompt. Not the location services: the
 * compass is the magnetometer, which works with them switched off.
 */
async function ensureHeadingReady(adapter: LocationAdapter): Promise<void> {
  if (!adapter.isSupported() || !adapter.watchHeading) {
    throw new LocationError("unsupported", "No compass heading here.");
  }
  const permission = await adapter.getPermission();
  if (permission.status === "unsupported") {
    throw new LocationError("unsupported");
  }
  if (permission.status !== "granted") {
    throw new LocationError("permission-denied");
  }
}

export interface UseHeadingOptions {
  /** Follow the heading while true (default true). */
  enabled?: boolean;
}

export interface UseHeading {
  /** The latest reading; `null` until the first, and after a pause. */
  heading: Heading | null;
  /**
   * `permission-denied` (the compass needs the location permission; the
   * hook never prompts), `unsupported` (the web) or `unavailable` (no
   * magnetometer on iOS). Cleared by the next reading.
   */
  error: LocationError | null;
}

/**
 * The compass: where the top edge of the device points. Shares one native
 * watch with every other reader and stops while the app is in the
 * background. On Android a device without a magnetometer reports nothing at
 * all: `heading` stays `null`.
 */
export function useHeading({
  enabled = true,
}: UseHeadingOptions = {}): UseHeading {
  const adapter = useLocationAdapter();
  const [heading, setHeading] = useState<Heading | null>(null);
  const [error, setError] = useState<LocationError | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let unsubscribe: Unsubscribe | null = null;
    ensureHeadingReady(adapter).then(
      () => {
        if (!active) return;
        unsubscribe = getHeadingStream(adapter).subscribe({
          onHeading(next) {
            setHeading(next);
            setError(null);
          },
          onError(failure) {
            setHeading(null);
            setError(failure);
          },
        });
      },
      (failure) => {
        if (active) setError(toError(failure));
      },
    );
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [adapter, enabled]);

  return { heading, error };
}
