import { PermissionsAndroid, Platform, type Permission } from "react-native";
import type BleManager from "react-native-ble-manager";
import type {
  Characteristic,
  CustomAdvertisingData,
  Peripheral,
  PeripheralInfo,
} from "react-native-ble-manager";

import { isNativePlatform } from "../core/support";
import { systemSheet } from "../core/systemSheet";
import type { PermissionState } from "../core/types";
import { BluetoothError, isBluetoothError } from "./errors";
import { createStartThrottle } from "./throttle";
import type {
  BluetoothAdapter,
  BluetoothCharacteristicProperties,
  BluetoothDevice,
  BluetoothScanHandlers,
  BluetoothService,
  BluetoothState,
} from "./types";
import { shortBluetoothUuid, toBluetoothUuid } from "./uuid";

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
        serviceUUIDs: services.map(shortBluetoothUuid),
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

/** The message inside whatever ble-manager rejected with. */
function messageOf(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

/**
 * ble-manager rejects GATT calls with strings (iOS's failed connections with
 * `{ code, domain, message }`): as `BluetoothError`s, from the wording both
 * platforms use.
 */
export function toGattError(error: unknown): BluetoothError {
  if (isBluetoothError(error)) return error;
  const message = messageOf(error);
  const lower = message.toLowerCase();
  // Android: "Device disconnected", "Disconnect called before the command
  // completed"; iOS: "Peripheral did disconnect: …".
  if (lower.includes("disconnect")) {
    return new BluetoothError("disconnected", message, error);
  }
  // "Device is not connected", "Peripheral not found or not connected",
  // "Could not find peripheral …", "BluetoothGatt is null".
  if (
    lower.includes("not connected") ||
    lower.includes("peripheral not found") ||
    lower.includes("could not find peripheral") ||
    lower.includes("gatt is null")
  ) {
    return new BluetoothError("not-connected", message, error);
  }
  return new BluetoothError("failed", message, error);
}

const PROPERTY_NAMES: Record<keyof BluetoothCharacteristicProperties, string> =
  {
    read: "Read",
    write: "Write",
    writeWithoutResponse: "WriteWithoutResponse",
    notify: "Notify",
    indicate: "Indicate",
  };

function toProperties(
  raw: Characteristic["properties"] | string[] | undefined,
): BluetoothCharacteristicProperties {
  const has = (name: string) =>
    Array.isArray(raw)
      ? raw.includes(name)
      : Boolean(raw && (raw as Record<string, unknown>)[name]);
  return {
    read: has(PROPERTY_NAMES.read),
    write: has(PROPERTY_NAMES.write),
    writeWithoutResponse: has(PROPERTY_NAMES.writeWithoutResponse),
    notify: has(PROPERTY_NAMES.notify),
    indicate: has(PROPERTY_NAMES.indicate),
  };
}

/** ble-manager's flat lists as services holding their characteristics. */
export function toBluetoothServices(info: PeripheralInfo): BluetoothService[] {
  const services = new Map<string, BluetoothService>();
  const serviceFor = (uuid: string) => {
    let service = services.get(uuid);
    if (!service) {
      service = { uuid, characteristics: [] };
      services.set(uuid, service);
    }
    return service;
  };
  for (const { uuid } of info.services ?? []) {
    const service = readUuid(uuid);
    if (service) serviceFor(service);
  }
  for (const raw of info.characteristics ?? []) {
    const service = readUuid(raw.service);
    const uuid = readUuid(raw.characteristic);
    if (!service || !uuid) continue;
    serviceFor(service).characteristics.push({
      uuid,
      service,
      properties: toProperties(raw.properties),
    });
  }
  return [...services.values()];
}

// ATT's default MTU, and the 3 bytes of each write's header.
const DEFAULT_MTU = 23;
const ATT_HEADER = 3;
// The MTU Android negotiated per device (iOS reports its own).
const androidMtus = new Map<string, number>();

/** How many bytes one write carries on this connection. */
async function writeLength(
  ble: BleManagerModule,
  deviceId: string,
  withResponse: boolean,
): Promise<number> {
  if (Platform.OS !== "ios") {
    return (androidMtus.get(deviceId) ?? DEFAULT_MTU) - ATT_HEADER;
  }
  try {
    return withResponse
      ? await ble.getMaximumWriteValueLengthForWithResponse(deviceId)
      : await ble.getMaximumWriteValueLengthForWithoutResponse(deviceId);
  } catch {
    return DEFAULT_MTU - ATT_HEADER;
  }
}

/** The form ble-manager is given: SIG UUIDs short, as CoreBluetooth reports them. */
const native = shortBluetoothUuid;

function requireBle(): BleManagerModule {
  const ble = loadBleManager();
  if (!ble) throw new BluetoothError("unsupported");
  return ble;
}

/** Runs a GATT call, its failure as a `BluetoothError`. */
async function gatt<T>(
  call: (ble: BleManagerModule) => Promise<T>,
): Promise<T> {
  const ble = requireBle();
  try {
    return await call(ble);
  } catch (error) {
    throw toGattError(error);
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

    connect(deviceId) {
      // A new connection starts from the default MTU.
      androidMtus.delete(deviceId);
      return gatt((ble) => ble.connect(deviceId));
    },

    async disconnect(deviceId) {
      try {
        await gatt((ble) => ble.disconnect(deviceId));
      } catch (error) {
        // Never connected, or already gone: nothing to close.
        if ((error as BluetoothError).code !== "not-connected") throw error;
      }
    },

    discoverServices: (deviceId) =>
      gatt(async (ble) =>
        toBluetoothServices(await ble.retrieveServices(deviceId)),
      ),

    read: (deviceId, service, characteristic) =>
      gatt(async (ble) =>
        Uint8Array.from(
          await ble.read(deviceId, native(service), native(characteristic)),
        ),
      ),

    write: (deviceId, service, characteristic, value, { withResponse }) =>
      gatt(async (ble) => {
        const length = await writeLength(ble, deviceId, withResponse);
        const data = Array.from(value);
        if (withResponse) {
          await ble.write(
            deviceId,
            native(service),
            native(characteristic),
            data,
            length,
          );
        } else {
          await ble.writeWithoutResponse(
            deviceId,
            native(service),
            native(characteristic),
            data,
            length,
          );
        }
      }),

    startNotifications: (deviceId, service, characteristic) =>
      gatt((ble) =>
        ble.startNotification(
          deviceId,
          native(service),
          native(characteristic),
        ),
      ),

    stopNotifications: (deviceId, service, characteristic) =>
      gatt((ble) =>
        ble.stopNotification(deviceId, native(service), native(characteristic)),
      ),

    subscribeValues(listener) {
      const ble = loadBleManager();
      if (!ble) return () => {};
      const subscription = ble.onDidUpdateValueForCharacteristic((event) => {
        const service = readUuid(event.service);
        const characteristic = readUuid(event.characteristic);
        if (!service || !characteristic) return;
        listener({
          deviceId: event.peripheral,
          service,
          characteristic,
          value: Uint8Array.from(event.value),
        });
      });
      return () => subscription.remove();
    },

    subscribeDisconnects(listener) {
      const ble = loadBleManager();
      if (!ble) return () => {};
      const subscription = ble.onDisconnectPeripheral(({ peripheral }) => {
        androidMtus.delete(peripheral);
        listener(peripheral);
      });
      return () => subscription.remove();
    },

    requestMtu: (deviceId, mtu) =>
      gatt(async (ble) => {
        if (Platform.OS === "ios") {
          // iOS negotiated it on connecting; a write without response carries MTU - 3.
          return (
            (await ble.getMaximumWriteValueLengthForWithoutResponse(deviceId)) +
            ATT_HEADER
          );
        }
        const negotiated = await ble.requestMTU(deviceId, mtu);
        androidMtus.set(deviceId, negotiated);
        return negotiated;
      }),

    readRssi: (deviceId) => gatt((ble) => ble.readRSSI(deviceId)),

    ...(Platform.OS === "android" && {
      bond: (deviceId: string) => gatt((ble) => ble.createBond(deviceId)),
    }),
  };
}

/** The default adapter: `neverForLocation`, as the config plugin's default. */
export const bleManagerAdapter: BluetoothAdapter = createBleManagerAdapter();
