import { AppState, type NativeEventSubscription } from "react-native";

import type { Unsubscribe } from "../core/types";
import type { SensorName, SensorReadings, SensorsAdapter } from "./types";

/** Whether a sensor exists, asked once per adapter and sensor. */
export interface Availability {
  /** `null` until the adapter answers. */
  getSnapshot(): boolean | null;
  subscribe(listener: () => void): Unsubscribe;
  /** Asks the adapter if nobody has yet. */
  check(): Promise<boolean>;
}

function createAvailability(
  adapter: SensorsAdapter,
  sensor: SensorName,
): Availability {
  let value: boolean | null = null;
  let pending: Promise<boolean> | null = null;
  const listeners = new Set<() => void>();

  const check = () => {
    pending ??= (
      adapter.isSupported()
        ? adapter.isAvailable(sensor).catch(() => false)
        : Promise.resolve(false)
    ).then((available) => {
      value = available;
      listeners.forEach((listener) => listener());
      return available;
    });
    return pending;
  };

  return {
    getSnapshot: () => value,
    subscribe(listener) {
      listeners.add(listener);
      check();
      return () => {
        listeners.delete(listener);
      };
    },
    check,
  };
}

/**
 * Readings that arrive this much early still count as on time: Android's
 * own throttle drops events against a millisecond clock, so a reader asking
 * for exactly the native interval would otherwise lose every other one.
 */
const TOLERANCE = 0.1;

interface Reader<R> {
  interval: number;
  listener: (reading: R) => void;
  last: number | null;
}

export interface SensorStream<R> {
  /** Calls `listener` at most every `interval` ms while the app is active. */
  subscribe(interval: number, listener: (reading: R) => void): Unsubscribe;
}

/**
 * One platform subscription per sensor however many readers listen. It runs
 * at the fastest interval asked for, throttles each reader to its own, opens
 * only once the sensor is known to exist, and stops while the app is in the
 * background (iOS keeps CoreMotion running there; `inactive` is not left).
 *
 * It closes a microtask after the last reader leaves: a reader replaced in
 * the same commit (a new interval, one screen swapped for another) keeps the
 * sensor running instead of restarting it.
 */
function createSensorStream<S extends SensorName>(
  adapter: SensorsAdapter,
  sensor: S,
  availability: Availability,
): SensorStream<SensorReadings[S]> {
  type R = SensorReadings[S];
  const readers = new Set<Reader<R>>();
  let available = false;
  let foreground = true;
  let appState: NativeEventSubscription | null = null;
  let stopPlatform: Unsubscribe | null = null;
  let interval: number | null = null;
  let closing = false;

  const emit = (reading: R) => {
    for (const reader of [...readers]) {
      // A listener may have removed another during this loop.
      if (!readers.has(reader)) continue;
      if (
        reader.last !== null &&
        reading.timestamp - reader.last < reader.interval * (1 - TOLERANCE)
      ) {
        continue;
      }
      reader.last = reading.timestamp;
      reader.listener(reading);
    }
  };

  const stop = () => {
    stopPlatform?.();
    stopPlatform = null;
  };

  const close = () => {
    closing = false;
    if (readers.size > 0) return;
    stop();
    appState?.remove();
    appState = null;
    interval = null;
  };

  function update() {
    if (readers.size === 0) {
      if (!closing) {
        closing = true;
        queueMicrotask(close);
      }
      return;
    }
    if (!available) {
      // A sensor the device lacks is never opened.
      availability.check().then((ok) => {
        if (ok && !available) {
          available = true;
          update();
        }
      });
      return;
    }
    if (!appState) {
      foreground = AppState.currentState !== "background";
      appState = AppState.addEventListener("change", (next) => {
        if (next === "inactive") return;
        foreground = next !== "background";
        update();
      });
    }
    const fastest = Math.min(...[...readers].map((reader) => reader.interval));
    if (!foreground) {
      stop();
    } else if (!stopPlatform) {
      interval = fastest;
      adapter.setInterval(sensor, fastest);
      stopPlatform = adapter.subscribe(sensor, emit);
    } else if (fastest !== interval) {
      interval = fastest;
      adapter.setInterval(sensor, fastest);
    }
  }

  return {
    subscribe(readerInterval, listener) {
      const reader: Reader<R> = {
        interval: readerInterval,
        listener,
        last: null,
      };
      readers.add(reader);
      update();
      return () => {
        readers.delete(reader);
        update();
      };
    },
  };
}

interface AdapterSensors {
  availability: Map<SensorName, Availability>;
  streams: Map<SensorName, SensorStream<never>>;
}

const registries = new WeakMap<SensorsAdapter, AdapterSensors>();

function registryFor(adapter: SensorsAdapter): AdapterSensors {
  let registry = registries.get(adapter);
  if (!registry) {
    registry = { availability: new Map(), streams: new Map() };
    registries.set(adapter, registry);
  }
  return registry;
}

export function getAvailability(
  adapter: SensorsAdapter,
  sensor: SensorName,
): Availability {
  const { availability } = registryFor(adapter);
  let store = availability.get(sensor);
  if (!store) {
    store = createAvailability(adapter, sensor);
    availability.set(sensor, store);
  }
  return store;
}

export function getSensorStream<S extends SensorName>(
  adapter: SensorsAdapter,
  sensor: S,
): SensorStream<SensorReadings[S]> {
  const { streams } = registryFor(adapter);
  let stream = streams.get(sensor);
  if (!stream) {
    stream = createSensorStream(
      adapter,
      sensor,
      getAvailability(adapter, sensor),
    ) as SensorStream<never>;
    streams.set(sensor, stream);
  }
  return stream as SensorStream<SensorReadings[S]>;
}
