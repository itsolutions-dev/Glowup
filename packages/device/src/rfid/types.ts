import type { PermissionState, Unsubscribe } from "../core/types";
import type { RfidError } from "./errors";

/**
 * The version of the contract below. A vendor adapter declares the one it
 * implements in `contractVersion`, and every operation rejects a mismatch
 * with `RfidError("incompatible-adapter")` rather than misreading its units.
 * It changes only when the contract does, never for an addition an adapter
 * may leave out.
 */
export const RFID_CONTRACT_VERSION = 1;

/**
 * One tag as the reader reported it, in the contract's units: the adapter
 * converts from its vendor's.
 */
export interface RfidTagRead {
  /** The EPC as uppercase hex, without separators. */
  epc: string;
  /** Received signal strength in dBm (negative: about -30 near, -80 far). */
  rssi: number;
  /** The antenna port that read it, when the reader has several. */
  antenna?: number;
  /** How many times the reader saw it in this report. Default 1. */
  readCount?: number;
  /** The TID as uppercase hex, when the inventory asked for it. */
  tid?: string;
  /** When it was read, in ms since the epoch. Default: when it arrived. */
  timestamp?: number;
}

export interface RfidInventoryRequest {
  /** Read each tag's TID too (slower). Only when `supportsTid`. */
  tid: boolean;
}

export interface RfidInventoryHandlers {
  /** Reads in batches, as the reader delivers them. Never called after `stopInventory()` resolves. */
  onTags(reads: RfidTagRead[]): void;
  /**
   * The inventory ended without `stopInventory()`: the reader dropped
   * (`disconnected`) or failed. Not called after `stopInventory()`.
   */
  onStop(error: RfidError | null): void;
}

export interface RfidLocateHandlers {
  /** The searched tag's signal in dBm, each time the reader hears it. */
  onValue(rssi: number): void;
  /** As `RfidInventoryHandlers.onStop`. */
  onStop(error: RfidError | null): void;
}

export interface RfidReadOnceRequest {
  /** How long the reader listens, in ms. */
  window: number;
  tid: boolean;
}

/**
 * - `disconnected`: no reader, or `disconnect()` closed it.
 * - `connecting`: `connect()` runs.
 * - `connected`: ready for every operation.
 * - `reconnecting`: the link dropped and the adapter is getting it back;
 *   operations wait for `connected`.
 */
export type RfidConnectionState =
  "disconnected" | "connecting" | "connected" | "reconnecting";

export interface RfidConnection {
  state: RfidConnectionState;
  /** The reader `connect()` was given; `null` when `disconnected`. */
  readerId: string | null;
}

/** A reader a discovery found. */
export interface RfidDiscoveredReader {
  /** What `connect()` takes (Honeywell: the Bluetooth address). */
  id: string;
  name: string | null;
  /** The discovery signal in dBm, when the transport reports it. */
  rssi: number | null;
}

export interface RfidDiscoveryHandlers {
  onReader(reader: RfidDiscoveredReader): void;
  onStop(error: RfidError | null): void;
}

export interface RfidReaderInfo {
  id: string;
  name: string | null;
  model: string | null;
  serialNumber: string | null;
  firmwareVersion: string | null;
}

/** The beeper's volume; `null` in `RfidSettings` when the reader has none to set. */
export type RfidBeeperVolume = "off" | "low" | "medium" | "high";

export interface RfidSettings {
  /** Transmit power in dBm, within the adapter's `powerRange`. */
  power: number;
  /** The Gen2 session (S0–S3): how long a tag stays quiet after a read. */
  session: 0 | 1 | 2 | 3;
  beeperVolume: RfidBeeperVolume | null;
  /**
   * The radio region the reader is set to (`"EU"`, `"FCC"`, …); read-only:
   * a wrong region is unlawful, so it is set with the vendor's tools.
   */
  region: string | null;
}

export interface RfidSettingsPatch {
  power?: number;
  session?: RfidSettings["session"];
  /** Only on a reader whose `beeperVolume` reads other than `null`. */
  beeperVolume?: RfidBeeperVolume;
}

/**
 * The RSSI, in dBm, where proximity reads 1 (`near`) and 0 (`far`).
 * RSSI follows distance only roughly (tag, orientation, material), so
 * proximity ranks tags and guides a search; it is never metres.
 */
export interface RfidProximityBounds {
  near: number;
  far: number;
}

/**
 * What a vendor package implements. The engine in `@its/glowup-device/rfid`
 * builds every mode on it: the adapter stays thin, and an optional method
 * left out is emulated (locate, single read) or reported as missing.
 *
 * The engine calls one mode at a time: it stops an inventory before a
 * locate starts, and never starts one while another runs.
 */
export interface RfidAdapter {
  /**
   * The contract version the adapter was written for, as a number literal:
   * importing `RFID_CONTRACT_VERSION` would always match and hide a mismatch.
   */
  readonly contractVersion: number;
  /** Who made the reader: `"honeywell"`, `"zebra"`, … */
  readonly vendor: string;
  /** Whether inventories can ask for each tag's TID. */
  readonly supportsTid: boolean;
  /** The adapter's default proximity bounds, which an app may calibrate. */
  readonly proximityBounds: RfidProximityBounds;
  /** The transmit power range, in dBm. */
  readonly powerRange: { min: number; max: number };

  /** Whether this platform and build can reach the vendor's readers. Synchronous. */
  isSupported(): boolean;
  /** What the reader's link needs (on Android: Bluetooth). */
  getPermission(): Promise<PermissionState>;
  requestPermission(): Promise<PermissionState>;

  /**
   * Opens the reader and resolves once it accepts operations. Replaces a
   * connection to another reader. After a drop the adapter reconnects by
   * itself (`reconnecting`) until `disconnect()`.
   */
  connect(readerId: string): Promise<void>;
  disconnect(): Promise<void>;
  getConnection(): Promise<RfidConnection>;
  subscribeConnection(
    listener: (connection: RfidConnection) => void,
  ): Unsubscribe;

  /** Starts reading every tag in range; resolves once it runs. */
  startInventory(
    request: RfidInventoryRequest,
    handlers: RfidInventoryHandlers,
  ): Promise<void>;
  stopInventory(): Promise<void>;

  /** Reads for a window and returns every read: the reader's own single read. */
  readOnce?(request: RfidReadOnceRequest): Promise<RfidTagRead[]>;

  /** The reader's own tag finder for one EPC (uppercase hex). Both or neither. */
  startLocate?(epc: string, handlers: RfidLocateHandlers): Promise<void>;
  stopLocate?(): Promise<void>;

  /**
   * Hands the reader's trigger to the app while subscribed: presses reach
   * `listener` instead of starting the reader's own scan. May be called
   * before `connect()`; the adapter applies it once connected.
   */
  subscribeTrigger?(listener: (pressed: boolean) => void): Unsubscribe;

  /** Searches for readers to `connect()` to. Both or neither. */
  startDiscovery?(handlers: RfidDiscoveryHandlers): Promise<void>;
  stopDiscovery?(): Promise<void>;

  getSettings(): Promise<RfidSettings>;
  /** Applies the given settings and returns them all. */
  setSettings(patch: RfidSettingsPatch): Promise<RfidSettings>;

  /** The reader's battery, 0–100; `null` when it does not say. */
  getBatteryLevel?(): Promise<number | null>;
  getReaderInfo?(): Promise<RfidReaderInfo>;
}

/**
 * What an adapter offers beyond the required primitives, read from the
 * methods it implements: `"native"` runs on the reader (a native locate
 * also beeps faster as the tag nears), `"emulated"` on an inventory here.
 */
export interface RfidCapabilities {
  locate: "native" | "emulated";
  singleRead: "native" | "emulated";
  tid: boolean;
  trigger: boolean;
  discovery: boolean;
  battery: boolean;
  readerInfo: boolean;
}

/** A tag the hooks report: every read of one EPC, merged. */
export interface RfidTag {
  epc: string;
  tid: string | null;
  /** The latest read's RSSI, in dBm. */
  rssi: number;
  /** The RSSI smoothed over the reads, in dBm: steadier, and what `proximity` follows. */
  averageRssi: number;
  /** 0 (at or beyond the far bound) to 1 (at or within the near bound). */
  proximity: number;
  antenna: number | null;
  /** Reads since the tag was first seen. */
  readCount: number;
  firstSeen: number;
  lastSeen: number;
}
