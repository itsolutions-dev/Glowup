import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import type { Unsubscribe } from "../core/types";
import { BluetoothError, isBluetoothError } from "./errors";
import { ensureBluetoothReady, useBluetoothAdapter } from "./hooks";
import type {
  BluetoothAdapter,
  BluetoothService,
  BluetoothValueEvent,
} from "./types";
import { toBluetoothUuid } from "./uuid";

/**
 * - `disconnected`: no connection (also after a failed attempt: see `error`).
 * - `connecting`: opening it and discovering the services.
 * - `connected`: open, services known: reads, writes and notifications work.
 * - `disconnecting`: closing it.
 */
export type BluetoothConnectionStatus =
  "disconnected" | "connecting" | "connected" | "disconnecting";

export interface BluetoothNotificationState {
  /** True while the device has notifications on for this reader. */
  isActive: boolean;
  /** Why the device refused to turn them on; `null` otherwise. */
  error: BluetoothError | null;
}

export interface BluetoothDeviceSnapshot {
  status: BluetoothConnectionStatus;
  /**
   * Why the latest connection failed or dropped (`timeout`, `disconnected`,
   * …); `null` after a `disconnect()` the app asked for.
   */
  error: BluetoothError | null;
  /** The device's services, once connected; `null` otherwise. */
  services: BluetoothService[] | null;
  /** The MTU after `requestMtu()`; `null` until then. */
  mtu: number | null;
  /** The notifications components read, by `"<service>/<characteristic>"`. */
  notifications: Readonly<Record<string, BluetoothNotificationState>>;
}

export const DEFAULT_CONNECT_TIMEOUT = 10_000;
/** How long a read, a write or another GATT call may take. */
export const GATT_TIMEOUT = 10_000;

const DISCONNECTED: BluetoothDeviceSnapshot = {
  status: "disconnected",
  error: null,
  services: null,
  mtu: null,
  notifications: {},
};

const INACTIVE: BluetoothNotificationState = { isActive: false, error: null };

interface Notification {
  service: string;
  characteristic: string;
  listeners: Set<(value: Uint8Array) => void>;
}

interface Entry {
  snapshot: BluetoothDeviceSnapshot;
  listeners: Set<() => void>;
  /** Bumped by every connect and disconnect: older work is dropped. */
  session: number;
  pending: Promise<void> | null;
  notifications: Map<string, Notification>;
  /** Mounted hooks, each with its `disconnectOnUnmount`. */
  holders: Map<symbol, boolean>;
}

function toError(error: unknown): BluetoothError {
  return isBluetoothError(error)
    ? error
    : new BluetoothError("failed", String(error), error);
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  what: string,
): Promise<T> {
  if (ms === 0) return promise;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new BluetoothError("timeout", `The device did not ${what} in time.`),
        ),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

const keyOf = (service: string, characteristic: string) =>
  `${service}/${characteristic}`;

function checkValue(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (
    Array.isArray(value) &&
    value.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)
  ) {
    return Uint8Array.from(value);
  }
  throw new TypeError(
    "write(): the value must be a Uint8Array or an array of bytes (integers 0–255).",
  );
}

// ATT's smallest MTU, and the largest Android negotiates.
const MIN_MTU = 23;
const MAX_MTU = 517;

export interface ConnectOptions {
  /**
   * Give up after this many milliseconds (default 10000; 0 waits forever).
   * iOS never gives up on its own.
   */
  timeout?: number;
}

export interface WriteOptions {
  /**
   * Wait for the device to acknowledge. Default: true when the
   * characteristic allows it, false when it only allows writes without
   * response.
   */
  withResponse?: boolean;
}

interface ConnectionStore {
  getSnapshot(deviceId: string): BluetoothDeviceSnapshot;
  subscribe(deviceId: string, listener: () => void): Unsubscribe;
  hold(deviceId: string, disconnectOnUnmount: boolean): Unsubscribe;
  connect(deviceId: string, options?: ConnectOptions): Promise<void>;
  disconnect(deviceId: string): Promise<void>;
  read(
    deviceId: string,
    service: string,
    characteristic: string,
  ): Promise<Uint8Array>;
  write(
    deviceId: string,
    service: string,
    characteristic: string,
    value: Uint8Array | number[],
    options?: WriteOptions,
  ): Promise<void>;
  notify(
    deviceId: string,
    service: string,
    characteristic: string,
    listener: (value: Uint8Array) => void,
  ): Unsubscribe;
  requestMtu(deviceId: string, mtu: number): Promise<number>;
  readRssi(deviceId: string): Promise<number>;
  bond(deviceId: string): Promise<void>;
}

/**
 * Every connection of one adapter, by device: components using the same
 * device share its connection, its services and its notifications.
 */
function createConnectionStore(adapter: BluetoothAdapter): ConnectionStore {
  const entries = new Map<string, Entry>();
  let platform: Unsubscribe | null = null;

  function entryFor(deviceId: string): Entry {
    let entry = entries.get(deviceId);
    if (!entry) {
      entry = {
        snapshot: DISCONNECTED,
        listeners: new Set(),
        session: 0,
        pending: null,
        notifications: new Map(),
        holders: new Map(),
      };
      entries.set(deviceId, entry);
    }
    return entry;
  }

  function update(entry: Entry, next: Partial<BluetoothDeviceSnapshot>) {
    entry.snapshot = { ...entry.snapshot, ...next };
    entry.listeners.forEach((listener) => listener());
  }

  function setNotification(
    entry: Entry,
    key: string,
    state: BluetoothNotificationState | null,
  ) {
    const notifications = { ...entry.snapshot.notifications };
    if (state) notifications[key] = state;
    else delete notifications[key];
    update(entry, { notifications });
  }

  /** The state a closed connection leaves: notifications kept, inactive. */
  function closed(entry: Entry, error: BluetoothError | null) {
    const notifications: Record<string, BluetoothNotificationState> = {};
    for (const key of entry.notifications.keys()) notifications[key] = INACTIVE;
    update(entry, {
      status: "disconnected",
      error,
      services: null,
      mtu: null,
      notifications,
    });
  }

  function onValue(event: BluetoothValueEvent) {
    const notification = entries
      .get(event.deviceId)
      ?.notifications.get(keyOf(event.service, event.characteristic));
    if (!notification) return;
    let failure: unknown = null;
    for (const listener of [...notification.listeners]) {
      try {
        listener(event.value);
      } catch (error) {
        failure ??= error;
      }
    }
    // Every reader heard the value; the first failure is the app's to see.
    if (failure) throw failure;
  }

  function onDisconnect(deviceId: string) {
    const entry = entries.get(deviceId);
    // Closing, closed or still opening (connect() reports that failure).
    if (entry?.snapshot.status !== "connected") return;
    entry.session++;
    closed(entry, new BluetoothError("disconnected"));
  }

  function listen() {
    if (platform) return;
    const values = adapter.subscribeValues(onValue);
    const disconnects = adapter.subscribeDisconnects(onDisconnect);
    platform = () => {
      values();
      disconnects();
    };
  }

  async function enable(
    deviceId: string,
    entry: Entry,
    key: string,
    notification: Notification,
  ) {
    const session = entry.session;
    const current = () =>
      session === entry.session &&
      entry.notifications.get(key) === notification;
    try {
      await withTimeout(
        adapter.startNotifications(
          deviceId,
          notification.service,
          notification.characteristic,
        ),
        GATT_TIMEOUT,
        "turn notifications on",
      );
      if (current())
        setNotification(entry, key, { isActive: true, error: null });
      else if (
        session === entry.session &&
        entry.snapshot.status === "connected"
      ) {
        // Every reader left while it was being turned on.
        adapter
          .stopNotifications(
            deviceId,
            notification.service,
            notification.characteristic,
          )
          .catch(() => {});
      }
    } catch (error) {
      if (current()) {
        setNotification(entry, key, { isActive: false, error: toError(error) });
      }
    }
  }

  function connect(
    deviceId: string,
    { timeout = DEFAULT_CONNECT_TIMEOUT } = {},
  ) {
    if (
      typeof timeout !== "number" ||
      !(timeout >= 0) ||
      timeout === Infinity
    ) {
      return Promise.reject(
        new RangeError(
          `connect(): timeout must be 0 or more milliseconds, got ${String(timeout)}.`,
        ),
      );
    }
    const entry = entryFor(deviceId);
    if (entry.snapshot.status === "connected") return Promise.resolve();
    if (entry.pending) return entry.pending;
    const session = ++entry.session;
    const check = () => {
      if (session !== entry.session) {
        throw new BluetoothError(
          "disconnected",
          "disconnect() was called while connecting.",
        );
      }
    };
    listen();
    update(entry, { status: "connecting", error: null });

    const run = async () => {
      let reached = false;
      try {
        await ensureBluetoothReady(adapter);
        check();
        reached = true;
        try {
          await withTimeout(adapter.connect(deviceId), timeout, "connect");
        } catch (error) {
          check();
          throw error;
        }
        check();
        const services = await withTimeout(
          adapter.discoverServices(deviceId),
          timeout,
          "list its services",
        );
        check();
        update(entry, { status: "connected", services });
        for (const [key, notification] of entry.notifications) {
          void enable(deviceId, entry, key, notification);
        }
      } catch (error) {
        const failure = toError(error);
        if (session === entry.session) {
          entry.session++;
          closed(entry, failure);
          // Connected without services, or timed out: leave no link open.
          if (reached) adapter.disconnect(deviceId).catch(() => {});
        }
        throw failure;
      }
    };
    const attempt: Promise<void> = run().finally(() => {
      if (entry.pending === attempt) entry.pending = null;
    });
    entry.pending = attempt;
    return attempt;
  }

  async function disconnect(deviceId: string) {
    const entry = entries.get(deviceId);
    if (!entry || entry.snapshot.status === "disconnected") return;
    const session = ++entry.session;
    entry.pending = null;
    update(entry, { status: "disconnecting" });
    try {
      await adapter.disconnect(deviceId);
    } finally {
      if (session === entry.session) closed(entry, null);
    }
  }

  /** A GATT call on a connected device, with a timeout. */
  async function onConnected<T>(
    deviceId: string,
    what: string,
    call: () => Promise<T>,
  ): Promise<T> {
    if (entries.get(deviceId)?.snapshot.status !== "connected") {
      throw new BluetoothError("not-connected");
    }
    try {
      return await withTimeout(call(), GATT_TIMEOUT, what);
    } catch (error) {
      throw toError(error);
    }
  }

  return {
    getSnapshot: (deviceId) => entryFor(deviceId).snapshot,
    subscribe(deviceId, listener) {
      const entry = entryFor(deviceId);
      entry.listeners.add(listener);
      return () => {
        entry.listeners.delete(listener);
      };
    },
    hold(deviceId, disconnectOnUnmount) {
      const entry = entryFor(deviceId);
      const token = Symbol(deviceId);
      entry.holders.set(token, disconnectOnUnmount);
      return () => {
        entry.holders.delete(token);
        if (!disconnectOnUnmount) return;
        // A component replaced in the same commit keeps the connection.
        queueMicrotask(() => {
          if (entry.holders.size === 0) disconnect(deviceId).catch(() => {});
        });
      };
    },
    connect,
    disconnect,

    read(deviceId, service, characteristic) {
      const s = toBluetoothUuid(service);
      const c = toBluetoothUuid(characteristic);
      return onConnected(deviceId, "answer the read", () =>
        adapter.read(deviceId, s, c),
      );
    },

    write(deviceId, service, characteristic, value, options = {}) {
      const s = toBluetoothUuid(service);
      const c = toBluetoothUuid(characteristic);
      const bytes = checkValue(value);
      let withResponse = options.withResponse;
      if (withResponse === undefined) {
        const properties = entries
          .get(deviceId)
          ?.snapshot.services?.find((found) => found.uuid === s)
          ?.characteristics.find((found) => found.uuid === c)?.properties;
        withResponse = !(
          properties &&
          !properties.write &&
          properties.writeWithoutResponse
        );
      }
      const request = { withResponse };
      return onConnected(deviceId, "acknowledge the write", () =>
        adapter.write(deviceId, s, c, bytes, request),
      );
    },

    notify(deviceId, service, characteristic, listener) {
      const s = toBluetoothUuid(service);
      const c = toBluetoothUuid(characteristic);
      const key = keyOf(s, c);
      const entry = entryFor(deviceId);
      listen();
      let notification = entry.notifications.get(key);
      if (!notification) {
        notification = { service: s, characteristic: c, listeners: new Set() };
        entry.notifications.set(key, notification);
        setNotification(entry, key, INACTIVE);
      }
      notification.listeners.add(listener);
      if (
        notification.listeners.size === 1 &&
        entry.snapshot.status === "connected"
      ) {
        void enable(deviceId, entry, key, notification);
      }
      const subscribed = notification;
      return () => {
        if (!subscribed.listeners.delete(listener)) return;
        if (subscribed.listeners.size > 0) return;
        entry.notifications.delete(key);
        const wasActive = entry.snapshot.notifications[key]?.isActive;
        setNotification(entry, key, null);
        if (wasActive && entry.snapshot.status === "connected") {
          adapter.stopNotifications(deviceId, s, c).catch(() => {});
        }
      };
    },

    async requestMtu(deviceId, mtu) {
      if (!Number.isInteger(mtu) || mtu < MIN_MTU || mtu > MAX_MTU) {
        throw new RangeError(
          `requestMtu(): the MTU must be an integer from ${MIN_MTU} to ${MAX_MTU}, got ${String(mtu)}.`,
        );
      }
      const negotiated = await onConnected(deviceId, "agree on an MTU", () =>
        adapter.requestMtu(deviceId, mtu),
      );
      const entry = entries.get(deviceId);
      if (entry?.snapshot.status === "connected")
        update(entry, { mtu: negotiated });
      return negotiated;
    },

    readRssi: (deviceId) =>
      onConnected(deviceId, "report its signal", () =>
        adapter.readRssi(deviceId),
      ),

    async bond(deviceId) {
      const bond = adapter.bond;
      if (!bond) {
        throw new BluetoothError(
          "unsupported",
          "Only Android lets an app ask to pair; iOS pairs on its own when a characteristic needs it.",
        );
      }
      await onConnected(deviceId, "pair", () => bond.call(adapter, deviceId));
    },
  };
}

const stores = new WeakMap<BluetoothAdapter, ConnectionStore>();

function getConnectionStore(adapter: BluetoothAdapter): ConnectionStore {
  let store = stores.get(adapter);
  if (!store) {
    store = createConnectionStore(adapter);
    stores.set(adapter, store);
  }
  return store;
}

const getServerSnapshot = () => DISCONNECTED;

function checkDeviceId(api: string, deviceId: unknown): void {
  if (typeof deviceId !== "string" || deviceId === "") {
    throw new TypeError(`${api}: the device id must be a non-empty string.`);
  }
}

function useDeviceSnapshot(
  store: ConnectionStore,
  deviceId: string,
): BluetoothDeviceSnapshot {
  const subscribe = useMemo(
    () => (listener: () => void) => store.subscribe(deviceId, listener),
    [store, deviceId],
  );
  const getSnapshot = useMemo(
    () => () => store.getSnapshot(deviceId),
    [store, deviceId],
  );
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export interface UseBluetoothDeviceOptions {
  /**
   * Close the connection when this component unmounts and no other
   * component uses the device (default true). With `false` it stays open
   * for the rest of the app until `disconnect()`.
   */
  disconnectOnUnmount?: boolean;
}

export interface UseBluetoothDevice extends BluetoothDeviceSnapshot {
  id: string;
  isConnected: boolean;
  /**
   * Connects and discovers the services. Checks the permission and the
   * radio first, never prompts; resolves at once when connected, and joins
   * an attempt already running.
   */
  connect: (options?: ConnectOptions) => Promise<void>;
  disconnect: () => Promise<void>;
  /** Reads a characteristic. UUIDs short (`"2A19"`) or 128-bit. */
  read: (service: string, characteristic: string) => Promise<Uint8Array>;
  /**
   * Writes a characteristic. A value longer than one write carries (MTU − 3
   * bytes) goes as several consecutive writes.
   */
  write: (
    service: string,
    characteristic: string,
    value: Uint8Array | number[],
    options?: WriteOptions,
  ) => Promise<void>;
  /**
   * Asks for a larger MTU (Android; iOS negotiates its own) and resolves the
   * one in force.
   */
  requestMtu: (mtu: number) => Promise<number>;
  /** The connection's signal strength now, in dBm. */
  readRssi: () => Promise<number>;
  /** Whether `bond()` can ask to pair (Android). */
  canBond: boolean;
  /** Pairs with the device (Android). */
  bond: () => Promise<void>;
}

/**
 * A Bluetooth Low Energy device by the `id` a scan reported: its
 * connection, its services and its GATT. Every component using the same id
 * shares one connection; nothing connects until `connect()`.
 */
export function useBluetoothDevice(
  deviceId: string,
  { disconnectOnUnmount = true }: UseBluetoothDeviceOptions = {},
): UseBluetoothDevice {
  checkDeviceId("useBluetoothDevice()", deviceId);
  const adapter = useBluetoothAdapter();
  const store = getConnectionStore(adapter);
  const snapshot = useDeviceSnapshot(store, deviceId);

  useEffect(
    () => store.hold(deviceId, disconnectOnUnmount),
    [store, deviceId, disconnectOnUnmount],
  );

  const actions = useMemo(
    () => ({
      connect: (options?: ConnectOptions) => store.connect(deviceId, options),
      disconnect: () => store.disconnect(deviceId),
      read: (service: string, characteristic: string) =>
        store.read(deviceId, service, characteristic),
      write: (
        service: string,
        characteristic: string,
        value: Uint8Array | number[],
        options?: WriteOptions,
      ) => store.write(deviceId, service, characteristic, value, options),
      requestMtu: (mtu: number) => store.requestMtu(deviceId, mtu),
      readRssi: () => store.readRssi(deviceId),
      bond: () => store.bond(deviceId),
    }),
    [store, deviceId],
  );

  return {
    ...snapshot,
    ...actions,
    id: deviceId,
    isConnected: snapshot.status === "connected",
    canBond: typeof adapter.bond === "function",
  };
}

export interface UseBluetoothNotificationsOptions {
  /** Default true; `false` turns them off for this component. */
  enabled?: boolean;
}

/**
 * Calls `onValue` with every value the device notifies (or indicates) on a
 * characteristic. Readers of the same characteristic share one
 * subscription on the device, on while at least one is mounted; it turns on
 * once the device is connected and again after every reconnection. Never
 * connects by itself: pair it with `useBluetoothDevice(id).connect()`.
 */
export function useBluetoothNotifications(
  deviceId: string,
  service: string,
  characteristic: string,
  onValue: (value: Uint8Array) => void,
  { enabled = true }: UseBluetoothNotificationsOptions = {},
): BluetoothNotificationState {
  checkDeviceId("useBluetoothNotifications()", deviceId);
  const adapter = useBluetoothAdapter();
  const store = getConnectionStore(adapter);
  const s = toBluetoothUuid(service);
  const c = toBluetoothUuid(characteristic);
  const key = keyOf(s, c);
  const snapshot = useDeviceSnapshot(store, deviceId);
  const latest = useRef(onValue);

  useEffect(() => {
    latest.current = onValue;
  });

  useEffect(() => {
    if (!enabled) return;
    return store.notify(deviceId, s, c, (value) => latest.current(value));
  }, [store, deviceId, s, c, enabled]);

  return (enabled && snapshot.notifications[key]) || INACTIVE;
}
