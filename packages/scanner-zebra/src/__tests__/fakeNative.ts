import type { BarcodeType } from "@its/glowup-device/scanner";

import { OTHER_SYMBOLOGY_PARAMS } from "../convert";
import {
  ZEBRA_SCANNER_NATIVE_REVISION,
  type NativeEvents,
  type NativeParams,
  type NativeRead,
  type ZebraScannerNativeModule,
} from "../native";

/** A rejection as the Expo module sends it: an Error with the module's code. */
export function nativeError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

/** What DataWedge reports for each symbology, and the decoder that reads it. */
export const DEVICE_SYMBOLOGIES: Record<
  BarcodeType,
  { labelType: string; decoder: string }
> = {
  aztec: { labelType: "LABEL-TYPE-AZTEC", decoder: "decoder_aztec" },
  codabar: { labelType: "LABEL-TYPE-CODABAR", decoder: "decoder_codabar" },
  code39: { labelType: "LABEL-TYPE-CODE39", decoder: "decoder_code39" },
  code93: { labelType: "LABEL-TYPE-CODE93", decoder: "decoder_code93" },
  code128: { labelType: "LABEL-TYPE-CODE128", decoder: "decoder_code128" },
  datamatrix: {
    labelType: "LABEL-TYPE-DATAMATRIX",
    decoder: "decoder_datamatrix",
  },
  ean8: { labelType: "LABEL-TYPE-EAN8", decoder: "decoder_ean8" },
  ean13: { labelType: "LABEL-TYPE-EAN13", decoder: "decoder_ean13" },
  itf14: { labelType: "LABEL-TYPE-I2OF5", decoder: "decoder_i2of5" },
  pdf417: { labelType: "LABEL-TYPE-PDF417", decoder: "decoder_pdf417" },
  qr: { labelType: "LABEL-TYPE-QRCODE", decoder: "decoder_qrcode" },
  upc_a: { labelType: "LABEL-TYPE-UPCA", decoder: "decoder_upca" },
  upc_e: { labelType: "LABEL-TYPE-UPCE0", decoder: "decoder_upce0" },
};

/**
 * A new profile's barcode input, as DataWedge would create it: some
 * decoders off, and UPC-E without its check digit or number system. The
 * values are illustrative (the TC22 run reads the real ones, ZB2); the
 * charset is left out, which DataWedge 14's guide gives as UTF-8.
 */
const PROFILE_DEFAULTS: NativeParams = {
  // The TC22's GET_CONFIG lists every other decoder the adapter names.
  ...OTHER_SYMBOLOGY_PARAMS,
  decoder_gs1_databar: "true",
  ...Object.fromEntries(
    Object.values(DEVICE_SYMBOLOGIES).map((s) => [s.decoder, "true"]),
  ),
  decoder_code93: "false",
  decoder_i2of5: "false",
  decoder_msi: "false",
  decoder_upca_report_check_digit: "true",
  decoder_upca_preamble: "1",
  decoder_upce0_report_check_digit: "false",
  decoder_upce0_preamble: "0",
};

type Listeners = { [K in keyof NativeEvents]: Set<NativeEvents[K]> };

export interface FakeDataWedge extends ZebraScannerNativeModule {
  /** The imager decodes a code: delivered only while open and its decoder on. */
  decode(type: BarcodeType, data: string): boolean;
  /** Sends a raw read, whatever the settings: for the conversion's tests. */
  emitRaw(read: Partial<NativeRead>): void;
  /** DataWedge switches to another app's profile while the app is in front. */
  takeAway(): void;
  /** The app restarts: the module's state goes, DataWedge's and the kept originals stay. */
  restart(): void;
  /** The profile DataWedge uses when `open()` asks (the first run: Profile0). */
  setActiveProfile(name: string | null): void;
  setDataWedgeEnabled(enabled: boolean): void;
  setInstalled(installed: boolean): void;
  failNext(method: string, code: string, message?: string): void;
  readonly isOpen: boolean;
  readonly opens: number;
  readonly profileName: string | null;
  /** What the profile stores, as `GET_CONFIG` reads it. */
  readonly stored: NativeParams;
  readonly softwareTriggers: boolean[];
  readonly diagnostics: boolean;
  readonly listenerCount: number;
}

const PACKAGE = "it.example.app";

/**
 * The Kotlin module's behaviour in JavaScript, with DataWedge's side (which
 * profile is active, what it stores, what a switch changes, which reads
 * arrive): what the adapter's tests and the conformance kit run against.
 */
export function createFakeDataWedge(): FakeDataWedge {
  const listeners = {
    onRead: new Set(),
    onClose: new Set(),
    onDiagnostic: new Set(),
  } as Listeners;
  const failures = new Map<string, Error>();
  const softwareTriggers: boolean[] = [];
  let stored: NativeParams = {};
  // What each key held in the stored profile before the module first wrote
  // it, by "profile/key": kept on the device, so a restart keeps it too.
  const originals = new Map<string, string | undefined>();
  let profileName: string | null = null;
  let profileParams: string | null = null;
  let forcedProfile: string | null = null;
  let isOpen = false;
  let opens = 0;
  let enabled = true;
  let installed = true;
  let diagnostics = false;

  function emit<K extends keyof NativeEvents>(
    event: K,
    payload: Parameters<NativeEvents[K]>[0],
  ) {
    [...listeners[event]].forEach((listener) =>
      (listener as (value: typeof payload) => void)(payload),
    );
  }

  function takeFailure(method: string) {
    const failure = failures.get(method);
    if (failure) {
      failures.delete(method);
      throw failure;
    }
  }

  const fake: FakeDataWedge = {
    getRevision: () => ZEBRA_SCANNER_NATIVE_REVISION,
    isDataWedgeInstalled: () => installed,
    setDiagnostics(on) {
      diagnostics = on;
    },
    async open(config) {
      takeFailure("open");
      if (!enabled) {
        throw nativeError(
          "ERR_UNAVAILABLE",
          "DataWedge is disabled on this device.",
        );
      }
      const name = config.profileName || PACKAGE;
      const params = JSON.stringify(config.profile);
      if (name !== profileName || params !== profileParams) {
        if (name !== profileName && profileName === null) {
          stored = { ...PROFILE_DEFAULTS };
        }
        stored = { ...stored, ...config.profile };
        profileName = name;
        profileParams = params;
      }
      const active = forcedProfile ?? name;
      if (active !== name) {
        throw nativeError(
          "ERR_UNAVAILABLE",
          `DataWedge is using the profile "${active}", not "${name}": bring the app to the front again.`,
        );
      }
      // The claim's decoders go in the stored profile; every other key the
      // module wrote goes back to the profile's own value from before.
      const written: NativeParams = { ...config.scanner };
      for (const key of Object.keys(config.scanner)) {
        if (!originals.has(`${name}/${key}`)) {
          originals.set(`${name}/${key}`, stored[key]);
        }
      }
      for (const [kept, original] of originals) {
        const key = kept.slice(name.length + 1);
        if (!kept.startsWith(`${name}/`) || key in written) continue;
        if (original !== undefined) written[key] = original;
      }
      stored = { ...stored, ...written };
      if (!isOpen) {
        takeFailure("enable");
        isOpen = true;
        opens += 1;
      }
    },
    async close() {
      isOpen = false;
    },
    restart() {
      isOpen = false;
      profileParams = null;
    },
    async softwareTrigger(pressed) {
      if (!isOpen)
        throw nativeError("ERR_NOT_OPEN", "The scanner is not open.");
      takeFailure("softwareTrigger");
      softwareTriggers.push(pressed);
    },
    async getScannerInfo() {
      takeFailure("getScannerInfo");
      return {
        // As the TC22 measured (the list goes on with Bluetooth and USB
        // scanners, not connected).
        datawedge: "15.0.96",
        barcodeScanning: "43.63.50.0",
        decoderLibrary: "IMGKIT_10.04T02.20|Digimarc-3.9.1 - 20200506124529",
        firmware: ["2D Barcode Imager: PAAFNS00-002-R06"],
        scanners: [
          {
            name: "camera scanner",
            index: 0,
            identifier: "INTERNAL_CAMERA",
            connected: true,
          },
          {
            name: "2D Barcode Imager",
            index: 1,
            identifier: "INTERNAL_IMAGER",
            connected: true,
          },
          {
            name: "Zebra Bluetooth Scanner",
            index: 5,
            identifier: "BLUETOOTH_ZEBRA",
            connected: false,
          },
        ],
      };
    },
    async getProfileParams() {
      return { ...stored };
    },
    async getActiveProfile() {
      return forcedProfile ?? profileName;
    },
    addListener(event, listener) {
      (listeners[event] as Set<typeof listener>).add(listener);
      return {
        remove: () => {
          (listeners[event] as Set<typeof listener>).delete(listener);
        },
      };
    },

    decode(type, data) {
      const symbology = DEVICE_SYMBOLOGIES[type];
      const params = stored;
      if (!isOpen || params[symbology.decoder] !== "true") return false;
      let text = data;
      for (const upc of ["upca", "upce0"]) {
        if (symbology.decoder !== `decoder_${upc}`) continue;
        if (params[`decoder_${upc}_report_check_digit`] === "false") {
          text = text.slice(0, -1);
        }
        if (params[`decoder_${upc}_preamble`] === "0") text = text.slice(1);
      }
      // A charset other than UTF-8 decodes a UTF-8 text as Latin-1.
      const charset = params.charset_name;
      if (charset !== undefined && charset !== "UTF-8") {
        text = Buffer.from(text, "utf8").toString("latin1");
      }
      emit("onRead", {
        data: text,
        labelType: symbology.labelType,
        source: "scanner",
        receivedAt: Date.now(),
      });
      return true;
    },
    emitRaw(read) {
      emit("onRead", {
        data: "",
        labelType: "LABEL-TYPE-EAN13",
        source: "scanner",
        receivedAt: Date.now(),
        ...read,
      });
    },
    takeAway() {
      if (!isOpen) return;
      isOpen = false;
      emit("onClose", {
        code: "ERR_UNAVAILABLE",
        message: 'DataWedge switched to the profile "Profile0 (default)".',
      });
    },
    setActiveProfile(name) {
      forcedProfile = name;
    },
    setDataWedgeEnabled(on) {
      enabled = on;
    },
    setInstalled(on) {
      installed = on;
    },
    failNext(method, code, message = "DataWedge refused.") {
      failures.set(method, nativeError(code, message));
    },
    get isOpen() {
      return isOpen;
    },
    get opens() {
      return opens;
    },
    get profileName() {
      return profileName;
    },
    get stored() {
      return { ...stored };
    },
    get softwareTriggers() {
      return [...softwareTriggers];
    },
    get diagnostics() {
      return diagnostics;
    },
    get listenerCount() {
      return Object.values(listeners).reduce((n, set) => n + set.size, 0);
    },
  };
  return fake;
}
