import { requireOptionalNativeModule } from "expo";

/**
 * The Kotlin module's surface (`android/…/ZebraRfidModule.kt`). Values are
 * the SDK's own: RSSI as the reader reports it, power as an index into the
 * reader's table of levels, volume and region as the SDK names them. The
 * adapter converts them.
 */
export interface NativeTagRead {
  epc: string;
  rssi: number;
  antenna: number;
  /** `TagData.getTagSeenCount()`. */
  seenCount: number;
  /** The arrival time, in ms since the epoch: the SDK's tag times are not relied on. */
  timestamp: number;
  tid: string | null;
}

export interface NativeConnection {
  state: "disconnected" | "connecting" | "connected" | "reconnecting";
  readerId: string | null;
}

export interface NativeSettings {
  /** The index into `powerLevels` the antenna transmits at. */
  powerIndex: number | null;
  /** `ReaderCapabilities.getTransmitPowerLevelValues()`: the reader's levels, in tenths of a dBm. */
  powerLevels: number[];
  /** 0–3. */
  session: number | null;
  /** `QUIET`, `LOW`, `MEDIUM` or `HIGH`. */
  volume: string | null;
  region: string | null;
}

export interface NativeReaderInfo {
  id: string | null;
  /** The name the reader is paired under (`RFD40+_…`). */
  name: string | null;
  model: string | null;
  serialNumber: string | null;
  /** `RFIDReader.versionInfo().getVersion()`. */
  firmware: string | null;
  /** `Config.getDeviceVersionInfo()`: every component's version, by the SDK's keys. */
  versions: Record<string, string>;
}

export interface NativeFoundReader {
  id: string;
  name: string | null;
  likelyReader: boolean;
}

/** A diagnostic event: what the SDK did, raw, while diagnostics are on. */
export interface ZebraDiagnostic {
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
  onDiagnostic: (event: ZebraDiagnostic) => void;
}

export interface NativeSubscription {
  remove(): void;
}

/**
 * The native module's revision this JavaScript expects: the Kotlin's
 * `NATIVE_REVISION`, raised together. A Metro reload changes the JavaScript
 * only, so an app built before a native change reports a lower one.
 */
export const ZEBRA_NATIVE_REVISION = 1;

export interface ZebraRfidNativeModule {
  getRevision(): number;
  getConnection(): NativeConnection;
  setDiagnostics(enabled: boolean): void;
  /** A paired reader's Bluetooth address, or its name. */
  connect(id: string): Promise<void>;
  disconnect(): Promise<void>;
  startInventory(tid: boolean): Promise<void>;
  stopInventory(): Promise<void>;
  startLocate(epc: string): Promise<void>;
  stopLocate(): Promise<void>;
  setTriggerHandover(enabled: boolean): Promise<void>;
  startDiscovery(filter: boolean): Promise<void>;
  stopDiscovery(): Promise<void>;
  getSettings(): Promise<NativeSettings>;
  setSettings(
    powerIndex: number | null,
    session: number | null,
    volume: string | null,
  ): Promise<void>;
  /** 0–100; -1 when the reader did not answer. */
  getBatteryLevel(): Promise<number>;
  getReaderInfo(): Promise<NativeReaderInfo>;
  addListener<K extends keyof NativeEvents>(
    event: K,
    listener: NativeEvents[K],
  ): NativeSubscription;
}

let loaded: ZebraRfidNativeModule | null | undefined;

/**
 * The native module, or `null` where it is not linked: iOS, the web, Expo Go,
 * or a build made without the config plugin.
 */
export function loadZebraRfidModule(): ZebraRfidNativeModule | null {
  if (loaded === undefined) {
    loaded = requireOptionalNativeModule<ZebraRfidNativeModule>("ZebraRfid");
  }
  return loaded;
}
