import { PermissionsAndroid, Platform, type Permission } from "react-native";
import type BleManager from "react-native-ble-manager";

import { isNativePlatform } from "../core/support";
import { systemSheet } from "../core/systemSheet";
import type { PermissionState } from "../core/types";
import { BluetoothError } from "./errors";
import type { BluetoothAdapter, BluetoothState } from "./types";

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
  };
}

/** The default adapter: `neverForLocation`, as the config plugin's default. */
export const bleManagerAdapter: BluetoothAdapter = createBleManagerAdapter();
