import type { BarcodeType } from "@its/glowup-device/scanner";

import {
  HONEYWELL_SCANNER_NATIVE_REVISION,
  type HoneywellScannerNativeModule,
  type HoneywellTriggerControl,
  type NativeEvents,
  type NativeProperty,
  type NativeRead,
} from "../native";

/** A rejection as the Expo module sends it: an Error with the module's code. */
export function nativeError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

/**
 * What the imager reports for each symbology: Honeywell's code id and the
 * AIM id (Honeywell's symbology chart; the CT40 run confirms them), and the
 * property that turns it on.
 */
export const DEVICE_SYMBOLOGIES: Record<
  BarcodeType,
  { codeId: string; aimId: string; property: string }
> = {
  aztec: { codeId: "z", aimId: "]z0", property: "DEC_AZTEC_ENABLED" },
  codabar: { codeId: "a", aimId: "]F0", property: "DEC_CODABAR_ENABLED" },
  code39: { codeId: "b", aimId: "]A0", property: "DEC_CODE39_ENABLED" },
  code93: { codeId: "i", aimId: "]G0", property: "DEC_CODE93_ENABLED" },
  code128: { codeId: "j", aimId: "]C0", property: "DEC_CODE128_ENABLED" },
  datamatrix: {
    codeId: "w",
    aimId: "]d1",
    property: "DEC_DATAMATRIX_ENABLED",
  },
  ean8: { codeId: "D", aimId: "]E4", property: "DEC_EAN8_ENABLED" },
  ean13: { codeId: "d", aimId: "]E0", property: "DEC_EAN13_ENABLED" },
  itf14: { codeId: "e", aimId: "]I0", property: "DEC_I25_ENABLED" },
  pdf417: { codeId: "r", aimId: "]L0", property: "DEC_PDF417_ENABLED" },
  qr: { codeId: "s", aimId: "]Q1", property: "DEC_QR_ENABLED" },
  upc_a: { codeId: "c", aimId: "]E0", property: "DEC_UPCA_ENABLE" },
  upc_e: { codeId: "E", aimId: "]E0", property: "DEC_UPCE0_ENABLED" },
};

/**
 * The settings that shorten an EAN's or UPC's text: off, the service drops
 * the check digit (the last) or the number system (the first).
 */
const DIGIT_SETTINGS: Partial<
  Record<BarcodeType, { checkDigit: string; numberSystem?: string }>
> = {
  ean13: { checkDigit: "DEC_EAN13_CHECK_DIGIT_TRANSMIT" },
  ean8: { checkDigit: "DEC_EAN8_CHECK_DIGIT_TRANSMIT" },
  upc_a: {
    checkDigit: "DEC_UPCA_CHECK_DIGIT_TRANSMIT",
    numberSystem: "DEC_UPCA_NUMBER_SYSTEM_TRANSMIT",
  },
  upc_e: {
    checkDigit: "DEC_UPCE_CHECK_DIGIT_TRANSMIT",
    numberSystem: "DEC_UPCE_NUMBER_SYSTEM_TRANSMIT",
  },
};

type Listeners = { [K in keyof NativeEvents]: Set<NativeEvents[K]> };

export interface FakeHoneywellScanner extends HoneywellScannerNativeModule {
  /** The imager decodes a code: delivered only while claimed and enabled. */
  decode(type: BarcodeType, data: string, extra?: Partial<NativeRead>): boolean;
  /** Sends a raw read, whatever the settings: for the conversion's tests. */
  emitRaw(read: Partial<NativeRead>): void;
  /** The hardware trigger; reported only while claimed, as the SDK does. */
  pressTrigger(pressed: boolean): void;
  /** The service takes the claim back (another app, a disconnected scanner). */
  takeAway(): void;
  failNext(method: string, code: string, message?: string): void;
  readonly claimed: boolean;
  readonly claims: number;
  readonly triggerControl: HoneywellTriggerControl | null;
  /** The properties as the service holds them for this app. */
  readonly properties: Record<string, NativeProperty>;
  readonly softwareTriggers: boolean[];
  readonly diagnostics: boolean;
  readonly listenerCount: number;
}

/** The device's own settings before the app changes any. */
const DEVICE_DEFAULTS: Record<string, NativeProperty> = {
  ...Object.fromEntries(
    Object.values(DEVICE_SYMBOLOGIES).map((s) => [s.property, true]),
  ),
  DEC_GS1_128_ENABLED: true,
  DEC_MSI_ENABLED: false,
  // As the CT40 measured: EAN-13 without its check digit.
  DEC_EAN13_CHECK_DIGIT_TRANSMIT: false,
  DPR_PREFIX: "",
  DPR_SUFFIX: "\n",
  TRIG_CONTROL_MODE: "autoControl",
};

/**
 * The Kotlin module's behaviour in JavaScript: what the adapter's tests and
 * the conformance kit run against. The service's side (what is enabled,
 * which reads arrive) follows the properties the module set.
 */
export function createFakeHoneywellScanner(): FakeHoneywellScanner {
  const listeners = {
    onRead: new Set(),
    onTrigger: new Set(),
    onClose: new Set(),
    onDiagnostic: new Set(),
  } as Listeners;
  const properties: Record<string, NativeProperty> = { ...DEVICE_DEFAULTS };
  const originals = new Map<string, NativeProperty | undefined>();
  const applied = new Set<string>();
  const failures = new Map<string, Error>();
  const softwareTriggers: boolean[] = [];
  let claimed = false;
  let claims = 0;
  let triggerControl: HoneywellTriggerControl | null = null;
  let diagnostics = false;
  let opened = false;

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

  function requireReader() {
    if (!opened) {
      throw nativeError("ERR_NOT_OPEN", "The scanner has not been opened yet.");
    }
  }

  const read = (extra: Partial<NativeRead>): NativeRead => ({
    data: "",
    codeId: "d",
    aimId: "]E0",
    charset: "UTF-8",
    timestamp: null,
    receivedAt: Date.now(),
    ...extra,
  });

  const fake: FakeHoneywellScanner = {
    getRevision: () => HONEYWELL_SCANNER_NATIVE_REVISION,
    setDiagnostics(enabled) {
      diagnostics = enabled;
    },
    async open(wanted, control) {
      takeFailure("open");
      opened = true;
      for (const key of Object.keys(wanted)) {
        if (!originals.has(key)) originals.set(key, properties[key]);
      }
      const restore = [...applied].filter((key) => !(key in wanted));
      for (const [key, value] of Object.entries(wanted)) {
        properties[key] = value;
        applied.add(key);
      }
      for (const key of restore) {
        const original = originals.get(key);
        if (original === undefined) delete properties[key];
        else properties[key] = original;
        applied.delete(key);
      }
      properties.TRIG_CONTROL_MODE =
        control === "client" ? "clientControl" : "autoControl";
      triggerControl = control;
      if (!claimed) {
        takeFailure("claim");
        claimed = true;
        claims += 1;
      }
    },
    async close() {
      claimed = false;
    },
    async softwareTrigger(pressed) {
      if (!claimed) {
        throw nativeError("ERR_NOT_OPEN", "The scanner is not claimed.");
      }
      takeFailure("softwareTrigger");
      softwareTriggers.push(pressed);
    },
    async getScannerInfo() {
      requireReader();
      return {
        name: "dcs.scanner.imager",
        friendlyName: "Internal Scanner",
        scannerId: "N6703",
        firmwareVersion: "4.4.13",
        serialNumber: "21234B0123",
        versionNumber: "1",
        controlLogicVersion: "2.1",
        fullDecodeVersion: "3.3",
        fastDecodeVersion: "3.3",
      };
    },
    async listDevices() {
      return [await fake.getScannerInfo()];
    },
    async getAllProperties() {
      requireReader();
      return { ...properties };
    },
    addListener(event, listener) {
      (listeners[event] as Set<typeof listener>).add(listener);
      return {
        remove: () => {
          (listeners[event] as Set<typeof listener>).delete(listener);
        },
      };
    },

    decode(type, data, extra = {}) {
      const symbology = DEVICE_SYMBOLOGIES[type];
      if (!claimed || properties[symbology.property] !== true) return false;
      const digits = DIGIT_SETTINGS[type];
      let text = data;
      if (digits && properties[digits.checkDigit] === false) {
        text = text.slice(0, -1);
      }
      if (digits?.numberSystem && properties[digits.numberSystem] === false) {
        text = text.slice(1);
      }
      emit(
        "onRead",
        read({
          data: text,
          codeId: symbology.codeId,
          aimId: symbology.aimId,
          ...extra,
        }),
      );
      return true;
    },
    emitRaw(extra) {
      emit("onRead", read(extra));
    },
    pressTrigger(pressed) {
      if (claimed) emit("onTrigger", { pressed });
    },
    takeAway() {
      if (!claimed) return;
      claimed = false;
      emit("onClose", {
        code: "ERR_UNAVAILABLE",
        message: "The scanner is held elsewhere.",
      });
    },
    failNext(method, code, message = "The scanner refused.") {
      failures.set(method, nativeError(code, message));
    },
    get claimed() {
      return claimed;
    },
    get claims() {
      return claims;
    },
    get triggerControl() {
      return triggerControl;
    },
    get properties() {
      return { ...properties };
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
