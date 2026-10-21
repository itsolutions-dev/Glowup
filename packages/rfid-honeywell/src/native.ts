import { requireOptionalNativeModule } from "expo";

/**
 * The Kotlin module's surface (`android/…/HoneywellRfidModule.kt`). Values
 * are the SDK's own: RSSI as the reader reports it, power in centi-dBm,
 * volume and region as the SDK's enum names. The adapter converts them.
 */
export interface NativeTagRead {
  epc: string;
  rssi: number;
  antenna: number;
  readCount: number;
  frequency: number;
  timestamp: number;
  tid: string | null;
}

export interface NativeConnection {
  state: "disconnected" | "connecting" | "connected" | "reconnecting";
  readerId: string | null;
}

export interface NativeSettings {
  /** Centi-dBm, of the first antenna. */
  power: number | null;
  antennas: number;
  /** 0–3. */
  session: number | null;
  /** `MUTE`, `LOW`, `MEDIUM` or `HIGH`. */
  volume: string | null;
  region: string | null;
}

export interface NativeReaderInfo {
  id: string | null;
  serialNumber: string | null;
  rfidSoftware: string | null;
  rfidHardware: string | null;
  bluetoothSoftware: string | null;
  bluetoothHardware: string | null;
  sdkVersion: string | null;
  region: string | null;
}

export interface NativeFoundReader {
  id: string;
  name: string | null;
  rssi: number;
  likelyReader: boolean;
}

/** A diagnostic event: what the SDK did, raw, while diagnostics are on. */
export interface HoneywellDiagnostic {
  type: string;
  /** ms since the epoch. */
  at: number;
  /** The thread the SDK called back on. */
  thread: string;
  [detail: string]: unknown;
}

export interface NativeEvents {
  onConnection: (event: NativeConnection) => void;
  onTags: (event: { reads: NativeTagRead[] }) => void;
  onLocate: (event: { rssi: number }) => void;
  onModeStop: (event: {
    mode: "inventory" | "locate";
    code: string;
    message: string;
  }) => void;
  onTrigger: (event: { pressed: boolean }) => void;
  onReaderFound: (event: NativeFoundReader) => void;
  onDiscoveryStop: (event: { code: string; message: string }) => void;
  onDiagnostic: (event: HoneywellDiagnostic) => void;
}

export interface NativeSubscription {
  remove(): void;
}

/**
 * The native module's revision this JavaScript expects: the Kotlin's
 * `NATIVE_REVISION`, raised together. A Metro reload changes the JavaScript
 * only, so an app built before a native change reports a lower one.
 */
export const HONEYWELL_NATIVE_REVISION = 4;

export interface HoneywellRfidNativeModule {
  /** Missing before revision 2. */
  getRevision?(): number;
  getConnection(): NativeConnection;
  setDiagnostics(enabled: boolean): void;
  connect(mac: string): Promise<void>;
  disconnect(): Promise<void>;
  startInventory(tid: boolean): Promise<void>;
  stopInventory(): Promise<void>;
  startLocate(epc: string): Promise<void>;
  stopLocate(): Promise<void>;
  readOnce(windowMs: number, tid: boolean): Promise<NativeTagRead[]>;
  setTriggerHandover(enabled: boolean): Promise<void>;
  startDiscovery(filter: boolean): Promise<void>;
  stopDiscovery(): Promise<void>;
  getSettings(): Promise<NativeSettings>;
  setSettings(
    power: number | null,
    session: number | null,
    volume: string | null,
  ): Promise<void>;
  /** A decimal string; empty when the reader did not answer. */
  getBatteryLevel(): Promise<string>;
  getReaderInfo(): Promise<NativeReaderInfo>;
  addListener<K extends keyof NativeEvents>(
    event: K,
    listener: NativeEvents[K],
  ): NativeSubscription;
}

let loaded: HoneywellRfidNativeModule | null | undefined;

/**
 * The native module, or `null` where it is not linked: iOS, the web, Expo Go,
 * or a build made without the config plugin.
 */
export function loadHoneywellRfidModule(): HoneywellRfidNativeModule | null {
  if (loaded === undefined) {
    loaded =
      requireOptionalNativeModule<HoneywellRfidNativeModule>("HoneywellRfid");
  }
  return loaded;
}
