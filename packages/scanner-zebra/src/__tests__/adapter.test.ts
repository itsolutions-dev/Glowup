import {
  BARCODE_TYPES,
  getBarcodeScannerCapabilities,
  isBarcodeScannerError,
  type BarcodeScannerHandlers,
  type BarcodeScannerRead,
} from "@its/glowup-device/scanner";
import { Platform } from "react-native";

import { createZebraBarcodeScannerAdapter } from "../adapter";
import {
  DATA_PARAMS,
  fromNativeInfo,
  fromNativeRead,
  OTHER_SYMBOLOGY_PARAMS,
  SYMBOLOGY_PARAMS,
  toOpenConfig,
} from "../convert";
import { createFakeDataWedge } from "./fakeNative";

function setup(
  options: Parameters<typeof createZebraBarcodeScannerAdapter>[0] = {},
) {
  const native = createFakeDataWedge();
  const adapter = createZebraBarcodeScannerAdapter({
    native,
    manufacturer: () => "Zebra Technologies",
    ...options,
  });
  const reads: BarcodeScannerRead[] = [];
  const presses: boolean[] = [];
  const closes: unknown[] = [];
  const handlers: BarcodeScannerHandlers = {
    onRead: (read) => reads.push(read),
    onTrigger: (pressed) => presses.push(pressed),
    onClose: (error) => closes.push(error),
  };
  return { native, adapter, handlers, reads, presses, closes };
}

async function rejection(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("Expected a rejection.");
}

describe("createZebraBarcodeScannerAdapter", () => {
  it("declares contract 1, every BarcodeType and both optional parts", () => {
    const { adapter } = setup();
    expect(adapter.contractVersion).toBe(1);
    expect(adapter.vendor).toBe("zebra");
    expect([...adapter.symbologies].sort()).toEqual([...BARCODE_TYPES].sort());
    expect(getBarcodeScannerCapabilities(adapter)).toMatchObject({
      softwareTrigger: true,
      scannerInfo: true,
    });
  });

  describe("isSupported", () => {
    it("needs the linked module", async () => {
      const adapter = createZebraBarcodeScannerAdapter({
        native: null,
        manufacturer: () => "Zebra Technologies",
      });
      expect(adapter.isSupported()).toBe(false);
      expect(adapter.hasDataWedge()).toBe(false);
      expect(adapter.nativeRevision()).toBeNull();
      const error = await rejection(
        adapter.open(
          { symbologies: null },
          { onRead() {}, onTrigger() {}, onClose() {} },
        ),
      );
      expect(isBarcodeScannerError(error) && error.code).toBe("unsupported");
      await expect(adapter.close()).resolves.toBeUndefined();
    });

    it("needs a Zebra host, unless the lab option turns the check off", () => {
      const { adapter } = setup({ manufacturer: () => "Honeywell" });
      expect(adapter.isSupported()).toBe(false);
      expect(adapter.isZebraHost()).toBe(false);
      const lab = setup({
        manufacturer: () => "Google",
        requireZebraHost: false,
      });
      expect(lab.adapter.isSupported()).toBe(true);
    });

    it("needs DataWedge installed", () => {
      const { native, adapter } = setup();
      expect(adapter.isSupported()).toBe(true);
      native.setInstalled(false);
      expect(adapter.isSupported()).toBe(false);
      expect(adapter.hasDataWedge()).toBe(false);
    });

    it("is Android only", () => {
      const os = Platform.OS;
      Object.defineProperty(Platform, "OS", { value: "ios", writable: true });
      try {
        expect(setup().adapter.isSupported()).toBe(false);
      } finally {
        Object.defineProperty(Platform, "OS", { value: os, writable: true });
      }
    });
  });

  describe("open", () => {
    it("opens once, however many times it is called while open", async () => {
      const { native, adapter, handlers, reads } = setup();
      await adapter.open({ symbologies: null }, handlers);
      await adapter.open({ symbologies: ["qr"] }, handlers);
      expect(native.opens).toBe(1);
      native.decode("qr", "A1");
      expect(reads).toHaveLength(1);
      // onRead and onClose: one each.
      expect(native.listenerCount).toBe(2);
    });

    it("sets the app's profile up under its package name, or the one given", async () => {
      const { native, adapter, handlers } = setup();
      await adapter.open({ symbologies: null }, handlers);
      expect(native.profileName).toBe("it.example.app");
      expect(native.stored).toMatchObject(DATA_PARAMS);
      const named = setup({ profileName: " Warehouse " });
      await named.adapter.open({ symbologies: null }, named.handlers);
      expect(named.native.profileName).toBe("Warehouse");
    });

    it("switches the requested symbologies on and every other off, for the claim only", async () => {
      const { native, adapter, handlers } = setup();
      await adapter.open(
        { symbologies: ["qr", "code128", "ean13", "datamatrix"] },
        handlers,
      );
      expect(native.effective).toMatchObject({
        decoder_qrcode: "true",
        decoder_code128: "true",
        decoder_ean13: "true",
        decoder_datamatrix: "true",
        decoder_ean8: "false",
        decoder_upca: "false",
        decoder_pdf417: "false",
        decoder_msi: "false",
        decoder_maxicode: "false",
      });
      // The profile keeps its own decoders: the switch is the claim's.
      expect(native.stored.decoder_ean8).toBe("true");
      expect(native.decode("ean8", "96385074")).toBe(false);
      expect(native.decode("qr", "A1")).toBe(true);
    });

    it("puts the profile's settings back for a request without symbologies", async () => {
      const { native, adapter, handlers } = setup();
      await adapter.open({ symbologies: ["qr"] }, handlers);
      expect(native.effective.decoder_ean13).toBe("false");
      await adapter.open({ symbologies: null }, handlers);
      expect(native.effective).toEqual(native.stored);
      expect(native.decode("ean13", "8001234567897")).toBe(true);
    });

    it("reads every digit of a UPC whatever the profile's defaults", async () => {
      const { native, adapter, handlers, reads } = setup();
      await adapter.open({ symbologies: null }, handlers);
      native.decode("upc_a", "036000291452");
      native.decode("upc_e", "04252614");
      native.decode("ean13", "9782743400804");
      expect(reads.map((read) => read.data)).toEqual([
        "036000291452",
        "04252614",
        "9782743400804",
      ]);
    });

    it("reads a QR's UTF-8 text as such", async () => {
      const { native, adapter, handlers, reads } = setup();
      await adapter.open({ symbologies: null }, handlers);
      native.decode("qr", "Città perché € 日本語");
      expect(reads[0]?.data).toBe("Città perché € 日本語");
    });

    it("rejects unavailable while DataWedge is disabled or on another profile", async () => {
      const { native, adapter, handlers } = setup();
      native.setDataWedgeEnabled(false);
      const disabled = await rejection(
        adapter.open({ symbologies: null }, handlers),
      );
      expect(isBarcodeScannerError(disabled) && disabled.code).toBe(
        "unavailable",
      );
      expect(native.listenerCount).toBe(0);

      native.setDataWedgeEnabled(true);
      native.setActiveProfile("Profile0 (default)");
      const other = await rejection(
        adapter.open({ symbologies: null }, handlers),
      );
      expect(isBarcodeScannerError(other) && other.code).toBe("unavailable");
      expect((other as Error).message).toMatch(/Profile0/);

      native.setActiveProfile(null);
      await expect(
        adapter.open({ symbologies: null }, handlers),
      ).resolves.toBeUndefined();
    });

    it("rejects failed for anything else, with DataWedge's message", async () => {
      const { native, adapter, handlers } = setup();
      native.failNext("open", "ERR_DATAWEDGE", "Something else.");
      const other = await rejection(
        adapter.open({ symbologies: null }, handlers),
      );
      expect(isBarcodeScannerError(other) && other.code).toBe("failed");
      expect((other as Error).message).toBe("Something else.");
    });
  });

  describe("reads", () => {
    it("reach the latest handlers only", async () => {
      const { native, adapter, handlers } = setup();
      const first: BarcodeScannerRead[] = [];
      await adapter.open(
        { symbologies: null },
        { ...handlers, onRead: (read) => first.push(read) },
      );
      const second: BarcodeScannerRead[] = [];
      await adapter.open(
        { symbologies: null },
        { ...handlers, onRead: (read) => second.push(read) },
      );
      native.decode("code128", "PALLET-7");
      expect(first).toHaveLength(0);
      expect(second.map((read) => read.data)).toEqual(["PALLET-7"]);
    });

    it("stop on close(), with every listener removed", async () => {
      const { native, adapter, handlers, reads, closes } = setup();
      await adapter.open({ symbologies: null }, handlers);
      await adapter.close();
      native.emitRaw({ data: "late" });
      expect(reads).toHaveLength(0);
      expect(closes).toHaveLength(0);
      expect(native.isOpen).toBe(false);
      expect(native.listenerCount).toBe(0);
    });

    it("name their type from DataWedge's label type, with no AIM id", async () => {
      const { native, adapter, handlers, reads } = setup();
      await adapter.open({ symbologies: null }, handlers);
      native.decode("upc_a", "036000291452");
      native.decode("upc_e", "04252614");
      native.decode("datamatrix", "SN 22271B821E");
      expect(
        reads.map((read) => [read.type, read.rawType, read.aimId]),
      ).toEqual([
        ["upc_a", "LABEL-TYPE-UPCA", null],
        ["upc_e", "LABEL-TYPE-UPCE0", null],
        ["datamatrix", "LABEL-TYPE-DATAMATRIX", null],
      ]);
    });
  });

  describe("the trigger and the claim", () => {
    it("reports no hardware trigger: DataWedge sends no presses", async () => {
      const { adapter, handlers, presses } = setup();
      await adapter.open({ symbologies: null }, handlers);
      expect(presses).toEqual([]);
    });

    it("reports a profile switch while in front once, then reads nothing", async () => {
      const { native, adapter, handlers, reads, closes } = setup();
      await adapter.open({ symbologies: null }, handlers);
      native.takeAway();
      expect(closes).toHaveLength(1);
      const [error] = closes;
      expect(isBarcodeScannerError(error) && error.code).toBe("unavailable");
      expect(native.listenerCount).toBe(0);
      native.emitRaw({ data: "after" });
      expect(reads).toHaveLength(0);
    });

    it("needs the scanner open for the software trigger", async () => {
      const { native, adapter, handlers } = setup();
      const closed = await rejection(adapter.softwareTrigger(true));
      expect(isBarcodeScannerError(closed) && closed.code).toBe("not-open");
      await adapter.open({ symbologies: null }, handlers);
      await adapter.softwareTrigger(true);
      await adapter.softwareTrigger(false);
      expect(native.softwareTriggers).toEqual([true, false]);
      native.failNext("softwareTrigger", "ERR_NOT_OPEN", "Closed.");
      const lost = await rejection(adapter.softwareTrigger(true));
      expect(isBarcodeScannerError(lost) && lost.code).toBe("not-open");
    });
  });

  describe("identity and the diagnostics", () => {
    it("names the internal imager and its firmware", async () => {
      const { adapter } = setup();
      await expect(adapter.getScannerInfo()).resolves.toEqual({
        name: "2D Barcode Imager",
        model: "INTERNAL_IMAGER",
        serialNumber: null,
        firmwareVersion: "PAAFNS00-001-R02",
      });
      await expect(adapter.listDevices()).resolves.toHaveLength(2);
      await expect(adapter.getRawScannerInfo()).resolves.toMatchObject({
        datawedge: "15.0.96",
      });
    });

    it("reads the profile's parameters and the active profile", async () => {
      const { adapter, handlers } = setup();
      await adapter.open({ symbologies: null }, handlers);
      await expect(adapter.getAllProperties()).resolves.toMatchObject({
        charset_name: "UTF-8",
      });
      await expect(adapter.getActiveProfile()).resolves.toBe("it.example.app");
    });

    it("rejects unavailable when DataWedge does not answer", async () => {
      const { native, adapter } = setup();
      native.failNext("getScannerInfo", "ERR_UNAVAILABLE", "No answer.");
      const error = await rejection(adapter.getScannerInfo());
      expect(isBarcodeScannerError(error) && error.code).toBe("unavailable");
    });

    it("switches the raw events and reports the native revision", () => {
      const { native, adapter } = setup();
      adapter.setDiagnostics(true);
      expect(native.diagnostics).toBe(true);
      const stop = adapter.subscribeDiagnostics(() => {});
      expect(native.listenerCount).toBe(1);
      stop();
      expect(native.listenerCount).toBe(0);
      expect(adapter.nativeRevision()).toBe(1);
    });
  });
});

describe("toOpenConfig", () => {
  it("switches nothing without symbologies", () => {
    expect(toOpenConfig(null, null)).toEqual({
      profileName: null,
      profile: DATA_PARAMS,
      scanner: {},
    });
  });

  it("names every decoder with a list, the others off", () => {
    const { scanner } = toOpenConfig([], "P");
    expect(scanner).toMatchObject(OTHER_SYMBOLOGY_PARAMS);
    for (const decoder of Object.values(SYMBOLOGY_PARAMS)) {
      expect(scanner[decoder]).toBe("false");
    }
    expect(toOpenConfig(["qr"], "P").scanner.decoder_qrcode).toBe("true");
  });

  it("never names a decoder twice", () => {
    const decoders = Object.values(SYMBOLOGY_PARAMS);
    expect(new Set(decoders).size).toBe(decoders.length);
    for (const decoder of decoders) {
      expect(decoder in OTHER_SYMBOLOGY_PARAMS).toBe(false);
    }
  });
});

describe("fromNativeRead", () => {
  const base = {
    data: "x",
    labelType: "LABEL-TYPE-QRCODE",
    source: "scanner",
    receivedAt: 1_760_000_000_000,
  };

  it("keeps the text as decoded and stamps it with its arrival", () => {
    expect(fromNativeRead({ ...base, data: " Città · 品番 \n" })).toEqual({
      data: " Città · 品番 \n",
      aimId: null,
      rawType: "LABEL-TYPE-QRCODE",
      type: "qr",
      timestamp: 1_760_000_000_000,
    });
  });

  it("reads GS1 variants as their symbology and an unknown label as unknown", () => {
    expect(
      fromNativeRead({ ...base, labelType: "LABEL-TYPE-EAN128" }).type,
    ).toBe("code128");
    expect(
      fromNativeRead({ ...base, labelType: "LABEL-TYPE-GS1-DATAMATRIX" }).type,
    ).toBe("datamatrix");
    expect(
      fromNativeRead({ ...base, labelType: "LABEL-TYPE-MAXICODE" }),
    ).toMatchObject({ type: "unknown", rawType: "LABEL-TYPE-MAXICODE" });
    expect(fromNativeRead({ ...base, labelType: null })).toMatchObject({
      type: "unknown",
      rawType: "unknown",
    });
  });
});

describe("fromNativeInfo", () => {
  it("falls back to the first scanner without an internal imager", () => {
    expect(
      fromNativeInfo({
        datawedge: null,
        barcodeScanning: null,
        decoderLibrary: null,
        firmware: [],
        scanners: [
          {
            name: "Camera Scanner",
            index: 0,
            identifier: "INTERNAL_CAMERA",
            connected: true,
          },
        ],
      }),
    ).toEqual({
      name: "Camera Scanner",
      model: "INTERNAL_CAMERA",
      serialNumber: null,
      firmwareVersion: null,
    });
  });
});
