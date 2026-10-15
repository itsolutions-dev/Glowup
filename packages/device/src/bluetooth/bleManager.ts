import { PermissionsAndroid, Platform, type Permission } from "react-native";
import type BleManager from "react-native-ble-manager";
import type {
  CustomAdvertisingData,
  Peripheral,
} from "react-native-ble-manager";

import { isNativePlatform } from "../core/support";
import { systemSheet } from "../core/systemSheet";
import type { PermissionState } from "../core/types";
import { BluetoothError } from "./errors";
import { createStartThrottle } from "./throttle";
import type {
  BluetoothAdapter,
  BluetoothDevice,
  BluetoothScanHandlers,
  BluetoothState,
} from "./types";
import { toBluetoothUuid } from "./uuid";

type BleManagerModule = typeof BleManager;

let loaded: BleManagerModule | null | undefined;

/**
 * react-native-ble-manager builds its manager at import and throws without
 * the native module (Expo Go, a build without it), so it is required on
 * first use, never at the top of the file: a missing module then reads as
 * unsupported instead of crashing the app on import.
 */
function loadBleManager(): BleManagerModule | null {
  if (loaded === undefined) {
    loaded = null;
    if (isNativePlatform) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const exported = require("react-native-ble-manager");
        loaded = (exported.default ?? exported) as BleManagerModule;
      } catch {
        loaded = null;
      }
    }
  }
  return loaded;
}

// One central manager per process: ble-manager builds a new one on every
// start() on iOS, and the app would then talk to two.
let starting: Promise<void> | null = null;

function ensureStarted(ble: BleManagerModule): Promise<void> {
  starting ??= (async () => {
    if (await ble.isStarted()) return;
    // No power alert: the app decides how to ask for Bluetooth to be on.
    await ble.start({ showAlert: false });
  })().catch((error: unknown) => {
    starting = null;
    throw toStartError(error);
  });
  return starting;
}

const MISSING_PURPOSE = "NSBluetoothAlwaysUsageDescription is not set";

function toStartError(error: unknown): BluetoothError {
  const message = String(error);
  if (message.includes(MISSING_PURPOSE)) {
    return new BluetoothError(
      "unsupported",
      'This build has no Bluetooth purpose string: add `bluetooth` to the "@its/glowup-device" config plugin and rebuild.',
      error,
    );
  }
  if (message.includes("No bluetooth support")) {
    return new BluetoothError("unsupported", undefined, error);
  }
  return new BluetoothError("failed", message, error);
}

/** ble-manager's states, iOS's and Android's, as the package's. */
export function toBluetoothState(raw: unknown): BluetoothState {
  switch (raw) {
    case "on":
      return "on";
    case "off":
    case "turning_on":
    case "turning_off":
      return "off";
    case "unauthorized":
      return "unauthorized";
    case "unsupported":
      return "unsupported";
    default:
      return "unknown";
  }
}

const UNSUPPORTED: PermissionState = {
  status: "unsupported",
  canAskAgain: false,
};
const UNDETERMINED: PermissionState = {
  status: "undetermined",
  canAskAgain: true,
};
const GRANTED: PermissionState = { status: "granted", canAskAgain: false };

/** What iOS's radio state says about the permission. */
function toIosPermission(state: BluetoothState): PermissionState {
  switch (state) {
    case "unauthorized":
      return { status: "denied", canAskAgain: false };
    case "unsupported":
      return UNSUPPORTED;
    case "unknown":
      return UNDETERMINED;
    default:
      return GRANTED;
  }
}

// How long iOS may leave its permission prompt unanswered before
// `requestPermission()` gives up and reads `undetermined`.
const PROMPT_TIMEOUT = 60_000;

/** The first state iOS settles on: `unknown` while its prompt is open. */
function settledState(ble: BleManagerModule): Promise<BluetoothState> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (state: BluetoothState) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      subscription.remove();
      resolve(state);
    };
    const subscription = ble.onDidUpdateState(({ state }) => {
      const next = toBluetoothState(state);
      if (next !== "unknown") finish(next);
    });
    const timer = setTimeout(() => finish("unknown"), PROMPT_TIMEOUT);
    ble.checkState().then(
      (state) => {
        const next = toBluetoothState(state);
        if (next !== "unknown") finish(next);
      },
      () => {},
    );
  });
}

function toBytes(data: CustomAdvertisingData | undefined): Uint8Array {
  return Uint8Array.from(data?.bytes ?? []);
}

/** A UUID the platform reported, normalised; `null` when it is not one. */
function readUuid(uuid: string): string | null {
  try {
    return toBluetoothUuid(uuid);
  } catch {
    return null;
  }
}

// What Android's ScanRecord answers when no power level was advertised.
const NO_TX_POWER = -2147483648;

/** ble-manager's peripheral as the package's device. */
export function toBluetoothDevice(peripheral: Peripheral): BluetoothDevice {
  const advertising = peripheral.advertising ?? {};
  const serviceData: Record<string, Uint8Array> = {};
  for (const [key, value] of Object.entries(advertising.serviceData ?? {})) {
    const uuid = readUuid(key);
    if (uuid) serviceData[uuid] = toBytes(value);
  }
  // Both platforms key the one entry by the company id in hex.
  const [manufacturer] = Object.entries(advertising.manufacturerData ?? {});
  const companyId = manufacturer ? Number.parseInt(manufacturer[0], 16) : NaN;
  const txPowerLevel = advertising.txPowerLevel;
  const localName = advertising.localName || null;
  return {
    id: peripheral.id,
    name: localName ?? (peripheral.name || null),
    rssi: peripheral.rssi,
    advertisement: {
      localName,
      serviceUuids: (advertising.serviceUUIDs ?? [])
        .map(readUuid)
        .filter((uuid): uuid is string => uuid !== null),
      serviceData,
      manufacturerData: Number.isNaN(companyId)
        ? null
        : { companyId, data: toBytes(manufacturer![1]) },
      txPowerLevel:
        typeof txPowerLevel === "number" && txPowerLevel !== NO_TX_POWER
          ? txPowerLevel
          : null,
      isConnectable:
        typeof advertising.isConnectable === "boolean"
          ? advertising.isConnectable
          : null,
    },
  };
}

// Android's ScanCallback failures, as `onStopScan`'s status. 10 is
// ble-manager's own timer (not used here) and 0 a stop the app asked for.
const SCAN_FAILURES: Record<number, string> = {
  1: "A scan was already running.",
  2: "The app could not register its scan.",
  3: "The Bluetooth stack failed.",
  4: "This device cannot scan for Bluetooth Low Energy.",
  5: "The Bluetooth controller is out of resources.",
  6: "The app scans too frequently.",
};
const SCAN_UNSUPPORTED = 4;
const ASKED_TO_STOP = new Set([0, 10]);

// Android's ScanSettings: low latency while an app looks at the results.
const SCAN_MODE_LOW_LATENCY = 2;

// Android's scan() never calls back while the radio is off: a start that
// takes longer than this did not happen.
const SCAN_START_TIMEOUT = 5_000;

// One scan per process, as the platform has.
let scanSession = 0;
let stopListening: (() => void) | null = null;
const androidThrottle = createStartThrottle();

function endScanSession(): void {
  scanSession++;
  stopListening?.();
  stopListening = null;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new BluetoothError("timeout", "The platform did not start the scan."),
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

async function startScan(
  ble: BleManagerModule,
  services: string[],
  handlers: BluetoothScanHandlers,
): Promise<void> {
  endScanSession();
  const session = scanSession;
  await ensureStarted(ble);
  if (session !== scanSession) return;
  if (Platform.OS === "android") {
    const delay = androidThrottle.delay();
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    // Stopped or replaced while it waited.
    if (session !== scanSession) return;
    androidThrottle.record();
  }
  const discovered = ble.onDiscoverPeripheral((peripheral) => {
    if (session === scanSession)
      handlers.onDevice(toBluetoothDevice(peripheral));
  });
  const stopped = ble.onStopScan(({ status }) => {
    if (session !== scanSession || ASKED_TO_STOP.has(status ?? 0)) return;
    endScanSession();
    handlers.onStop(
      new BluetoothError(
        status === SCAN_UNSUPPORTED ? "unsupported" : "failed",
        SCAN_FAILURES[status!] ?? `The scan stopped (status ${status}).`,
      ),
    );
  });
  stopListening = () => {
    discovered.remove();
    stopped.remove();
  };
  try {
    await withTimeout(
      ble.scan({
        serviceUUIDs: services,
        // iOS reports a device once per scan otherwise, and its signal never updates.
        allowDuplicates: true,
        scanMode: SCAN_MODE_LOW_LATENCY,
      }),
      SCAN_START_TIMEOUT,
    );
  } catch (error) {
    if (session === scanSession) endScanSession();
    throw error instanceof BluetoothError
      ? error
      : new BluetoothError("failed", String(error), error);
  }
}

export interface BleManagerAdapterOptions {
  /**
   * Match the config plugin's `bluetooth.neverForLocation` (default `true`).
   * With `false`, Android 12 and later also ask for the precise location
   * permission, which scans that locate the user (beacons) need.
   */
  neverForLocation?: boolean;
}

/** The Android runtime permissions a scan and a connection need. */
function androidPermissions(neverForLocation: boolean): Permission[] {
  const { BLUETOOTH_SCAN, BLUETOOTH_CONNECT, ACCESS_FINE_LOCATION } =
    PermissionsAndroid.PERMISSIONS;
  // Android 11 and earlier have no Bluetooth permission: scans need location.
  if ((Platform.Version as number) < 31) return [ACCESS_FINE_LOCATION];
  return neverForLocation
    ? [BLUETOOTH_SCAN, BLUETOOTH_CONNECT]
    : [BLUETOOTH_SCAN, BLUETOOTH_CONNECT, ACCESS_FINE_LOCATION];
}

/**
 * The adapter on `react-native-ble-manager`. Create one with
 * `neverForLocation: false` (and pass it to `DeviceAdaptersProvider`) when the
 * config plugin says so; `bleManagerAdapter` is the default.
 */
export function createBleManagerAdapter(
  options: BleManagerAdapterOptions = {},
): BluetoothAdapter {
  const neverForLocation = options.neverForLocation ?? true;
  // Android tells "never ask again" only in a request's answer: kept for
  // this launch, so a later read does not claim the prompt can show.
  let androidAnswer: PermissionState | null = null;

  const isSupported = () => loadBleManager() !== null;

  return {
    isSupported,

    async getState() {
      const ble = loadBleManager();
      if (!ble) return "unsupported";
      // iOS has no state before the manager exists, and building it may prompt.
      if (Platform.OS === "ios" && !(await ble.isStarted())) return "unknown";
      return toBluetoothState(await ble.checkState());
    },

    subscribeState(listener) {
      const ble = loadBleManager();
      if (!ble) return () => {};
      const subscription = ble.onDidUpdateState(({ state }) =>
        listener(toBluetoothState(state)),
      );
      // Android reports changes only once started, which never prompts there.
      if (Platform.OS === "android") ensureStarted(ble).catch(() => {});
      return () => subscription.remove();
    },

    canEnable: () => Platform.OS === "android" && isSupported(),

    async enable() {
      const ble = loadBleManager();
      if (!ble || Platform.OS !== "android") {
        throw new BluetoothError(
          "unsupported",
          "Only Android lets an app ask for Bluetooth to be switched on.",
        );
      }
      try {
        await systemSheet.run(() => ble.enableBluetooth());
        return true;
      } catch (error) {
        if (String(error).includes("User refused")) return false;
        throw new BluetoothError("failed", String(error), error);
      }
    },

    async getPermission() {
      const ble = loadBleManager();
      if (!ble) return UNSUPPORTED;
      if (Platform.OS === "ios") {
        if (!(await ble.isStarted())) return UNDETERMINED;
        return toIosPermission(toBluetoothState(await ble.checkState()));
      }
      const checks = await Promise.all(
        androidPermissions(neverForLocation).map((permission) =>
          PermissionsAndroid.check(permission),
        ),
      );
      if (checks.every(Boolean)) return GRANTED;
      return androidAnswer?.status === "denied" ? androidAnswer : UNDETERMINED;
    },

    async requestPermission() {
      const ble = loadBleManager();
      if (!ble) return UNSUPPORTED;
      if (Platform.OS === "ios") {
        // Building the manager is the request: iOS prompts once, ever.
        await ensureStarted(ble);
        return toIosPermission(await settledState(ble));
      }
      const permissions = androidPermissions(neverForLocation);
      const answers = await systemSheet.run(() =>
        PermissionsAndroid.requestMultiple(permissions),
      );
      const results = permissions.map((permission) => answers[permission]);
      const { GRANTED: YES, NEVER_ASK_AGAIN } = PermissionsAndroid.RESULTS;
      androidAnswer = results.every((result) => result === YES)
        ? GRANTED
        : {
            status: "denied",
            canAskAgain: !results.includes(NEVER_ASK_AGAIN),
          };
      return androidAnswer;
    },

    async startScan({ services }, handlers) {
      const ble = loadBleManager();
      if (!ble) throw new BluetoothError("unsupported");
      await startScan(ble, services, handlers);
    },

    async stopScan() {
      const ble = loadBleManager();
      if (!ble || !stopListening) {
        endScanSession();
        return;
      }
      endScanSession();
      await ble.stopScan();
    },
  };
}

/** The default adapter: `neverForLocation`, as the config plugin's default. */
export const bleManagerAdapter: BluetoothAdapter = createBleManagerAdapter();
