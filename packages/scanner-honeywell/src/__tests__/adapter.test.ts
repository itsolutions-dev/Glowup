import {
  BARCODE_TYPES,
  getBarcodeScannerCapabilities,
  isBarcodeScannerError,
  type BarcodeScannerHandlers,
  type BarcodeScannerRead,
} from "@its/glowup-device/scanner";
import { Platform } from "react-native";

import { createHoneywellBarcodeScannerAdapter } from "../adapter";
import {
  DATA_PROPERTIES,
  fromNativeRead,
  OTHER_SYMBOLOGY_PROPERTIES,
  toOpenProperties,
} from "../convert";
import { createFakeHoneywellScanner } from "./fakeNative";

function setup(
  options: Parameters<typeof createHoneywellBarcodeScannerAdapter>[0] = {},
) {
  const native = createFakeHoneywellScanner();
  const adapter = createHoneywellBarcodeScannerAdapter({
    native,
    manufacturer: () => "Honeywell",
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

describe("createHoneywellBarcodeScannerAdapter", () => {
  it("declares contract 1, every BarcodeType and both optional parts", () => {
    const { adapter } = setup();
    expect(adapter.contractVersion).toBe(1);
    expect(adapter.vendor).toBe("honeywell");
    expect([...adapter.symbologies].sort()).toEqual([...BARCODE_TYPES].sort());
    expect(getBarcodeScannerCapabilities(adapter)).toMatchObject({
      softwareTrigger: true,
      scannerInfo: true,
    });
  });

  describe("isSupported", () => {
    it("needs the linked module", async () => {
      const adapter = createHoneywellBarcodeScannerAdapter({
        native: null,
        manufacturer: () => "Honeywell",
      });
      expect(adapter.isSupported()).toBe(false);
      expect(adapter.nativeRevision()).toBeNull();
      const error = await rejection(
        adapter.open(
          { symbologies: null },
          {
            onRead() {},
            onTrigger() {},
            onClose() {},
          },
        ),
      );
      expect(isBarcodeScannerError(error) && error.code).toBe("unsupported");
      await expect(adapter.close()).resolves.toBeUndefined();
    });

    it("needs a Honeywell host, unless the lab option turns the check off", () => {
      const { adapter } = setup({ manufacturer: () => "Zebra Technologies" });
      expect(adapter.isSupported()).toBe(false);
      expect(adapter.isHoneywellHost()).toBe(false);
      const lab = setup({
        manufacturer: () => "Google",
        requireHoneywellHost: false,
      });
      expect(lab.adapter.isSupported()).toBe(true);
    });

    it("reads the manufacturer case-insensitively", () => {
      expect(
        setup({ manufacturer: () => "HONEYWELL" }).adapter.isSupported(),
      ).toBe(true);
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
    it("claims once, however many times it is called while open", async () => {
      const { native, adapter, handlers, reads } = setup();
      await adapter.open({ symbologies: null }, handlers);
      await adapter.open({ symbologies: ["qr"] }, handlers);
      expect(native.claims).toBe(1);
      native.decode("qr", "A1");
      expect(reads).toHaveLength(1);
      // onRead, onTrigger, onClose: one each.
      expect(native.listenerCount).toBe(3);
    });

    it("turns on the requested symbologies and every other off", async () => {
      const { native, adapter, handlers } = setup();
      await adapter.open(
        { symbologies: ["qr", "code128", "ean13", "datamatrix"] },
        handlers,
      );
      const properties = native.properties;
      expect(properties).toMatchObject({
        DEC_QR_ENABLED: true,
        DEC_CODE128_ENABLED: true,
        DEC_GS1_128_ENABLED: true,
        DEC_EAN13_ENABLED: true,
        DEC_DATAMATRIX_ENABLED: true,
        DEC_EAN8_ENABLED: false,
        DEC_UPCA_ENABLE: false,
        DEC_PDF417_ENABLED: false,
        DEC_MSI_ENABLED: false,
        DEC_POSTAL_ENABLED: "none",
      });
      expect(native.decode("ean8", "12345670")).toBe(false);
      expect(native.decode("qr", "A1")).toBe(true);
    });

    it("puts the device's settings back for a request without symbologies", async () => {
      const { native, adapter, handlers } = setup();
      const before = native.properties;
      await adapter.open({ symbologies: ["qr"] }, handlers);
      expect(native.properties.DEC_EAN13_ENABLED).toBe(false);
      await adapter.open({ symbologies: null }, handlers);
      const after = native.properties;
      expect(after.DEC_EAN13_ENABLED).toBe(before.DEC_EAN13_ENABLED);
      expect(after.DEC_MSI_ENABLED).toBe(before.DEC_MSI_ENABLED);
      expect("DEC_POSTAL_ENABLED" in after).toBe(false);
    });

    it("always clears the wedge's prefix and suffix and the scan's side effects", async () => {
      const { native, adapter, handlers } = setup();
      expect(native.properties.DPR_SUFFIX).toBe("\n");
      await adapter.open({ symbologies: null }, handlers);
      expect(native.properties).toMatchObject(DATA_PROPERTIES);
    });

    it("reads every digit of an EAN or UPC whatever the device's settings", async () => {
      const { native, adapter, handlers, reads } = setup();
      await adapter.open({ symbologies: null }, handlers);
      native.decode("ean13", "9782743400804");
      native.decode("upc_a", "036000291452");
      expect(reads.map((read) => read.data)).toEqual([
        "9782743400804",
        "036000291452",
      ]);
    });

    it("leaves the trigger to the service by default; client control on request", async () => {
      const { native, adapter, handlers } = setup();
      await adapter.open({ symbologies: null }, handlers);
      expect(native.triggerControl).toBe("auto");
      adapter.setTriggerControl("client");
      await adapter.open({ symbologies: null }, handlers);
      expect(native.properties.TRIG_CONTROL_MODE).toBe("clientControl");
      expect(
        setup({ triggerControl: "client" }).adapter.open(
          { symbologies: null },
          handlers,
        ),
      ).resolves.toBeUndefined();
    });

    it("rejects with the contract's code and leaves no listener behind", async () => {
      const { native, adapter, handlers } = setup();
      native.failNext("claim", "ERR_UNAVAILABLE", "Held elsewhere.");
      const held = await rejection(
        adapter.open({ symbologies: null }, handlers),
      );
      expect(isBarcodeScannerError(held) && held.code).toBe("unavailable");
      expect(native.listenerCount).toBe(0);

      native.failNext("open", "ERR_NO_SCANNER", "No imager.");
      const none = await rejection(
        adapter.open({ symbologies: null }, handlers),
      );
      expect(isBarcodeScannerError(none) && none.code).toBe("unsupported");

      native.failNext("open", "ERR_SDK", "Something else.");
      const other = await rejection(
        adapter.open({ symbologies: null }, handlers),
      );
      expect(isBarcodeScannerError(other) && other.code).toBe("failed");
      expect((other as Error).message).toBe("Something else.");
    });
  });

  describe("reads", () => {
    it("reaches the latest handlers only", async () => {
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
      expect(native.claimed).toBe(false);
      expect(native.listenerCount).toBe(0);
    });

    it("tells UPC-A and UPC-E from EAN-13 by Honeywell's code id", async () => {
      const { native, adapter, handlers, reads } = setup();
      await adapter.open({ symbologies: null }, handlers);
      native.decode("upc_a", "036000291452");
      native.decode("upc_e", "04252614");
      native.decode("ean13", "8001234567890");
      expect(reads.map((read) => read.type)).toEqual([
        "upc_a",
        "upc_e",
        undefined,
      ]);
      expect(reads[2]).toMatchObject({ aimId: "]E0", rawType: "d" });
    });
  });

  describe("the trigger and the claim", () => {
    it("reports the hardware trigger while open", async () => {
      const { native, adapter, handlers, presses } = setup();
      await adapter.open({ symbologies: null }, handlers);
      native.pressTrigger(true);
      native.pressTrigger(false);
      expect(presses).toEqual([true, false]);
    });

    it("reports a claim the service takes back once, then reads nothing", async () => {
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
      native.failNext("softwareTrigger", "ERR_UNAVAILABLE", "Held.");
      const held = await rejection(adapter.softwareTrigger(true));
      expect(isBarcodeScannerError(held) && held.code).toBe("unavailable");
    });
  });

  describe("identity and the diagnostics", () => {
    it("names the scanner, its serial and firmware", async () => {
      const { adapter, handlers } = setup();
      await adapter.open({ symbologies: null }, handlers);
      await expect(adapter.getScannerInfo()).resolves.toEqual({
        name: "Internal Scanner",
        model: null,
        serialNumber: "21234B0123",
        firmwareVersion: "4.4.13",
      });
      await expect(adapter.getRawScannerInfo()).resolves.toMatchObject({
        scannerId: "N6703",
      });
      await expect(adapter.listDevices()).resolves.toHaveLength(1);
      await expect(adapter.getAllProperties()).resolves.toMatchObject({
        DPR_SUFFIX: "",
      });
    });

    it("rejects not-open before the first open", async () => {
      const error = await rejection(setup().adapter.getScannerInfo());
      expect(isBarcodeScannerError(error) && error.code).toBe("not-open");
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

describe("toOpenProperties", () => {
  it("sets only the data properties without symbologies", () => {
    expect(toOpenProperties(null)).toEqual(DATA_PROPERTIES);
  });

  it("names every symbology switch with a list, the others off", () => {
    const properties = toOpenProperties([]);
    expect(properties).toMatchObject(OTHER_SYMBOLOGY_PROPERTIES);
    expect(
      Object.entries(properties).filter(
        ([key, value]) => value === true && !(key in DATA_PROPERTIES),
      ),
    ).toEqual([]);
  });
});

describe("fromNativeRead", () => {
  const base = {
    data: "x",
    codeId: "s",
    aimId: "]Q1",
    charset: "UTF-8",
    timestamp: null,
    receivedAt: 1_760_000_000_000,
  };

  it("keeps the text as decoded and names the code id as the raw type", () => {
    expect(fromNativeRead({ ...base, data: " Città · 品番 \n" })).toEqual({
      data: " Città · 品番 \n",
      aimId: "]Q1",
      rawType: "s",
      timestamp: 1_760_000_000_000,
    });
  });

  it("uses the SDK's timestamp when it parses, the arrival otherwise", () => {
    expect(
      fromNativeRead({ ...base, timestamp: "2026-10-20T09:15:30.250Z" })
        .timestamp,
    ).toBe(Date.parse("2026-10-20T09:15:30.250Z"));
    // The CT40's own format: the offset unpadded, which V8 does not parse.
    expect(
      fromNativeRead({ ...base, timestamp: "2026-10-21T09:27:47.246+2:00" })
        .timestamp,
    ).toBe(Date.parse("2026-10-21T07:27:47.246Z"));
    expect(
      fromNativeRead({ ...base, timestamp: "2026-10-21T09:27:47.246-5:30" })
        .timestamp,
    ).toBe(Date.parse("2026-10-21T14:57:47.246Z"));
    expect(fromNativeRead({ ...base, timestamp: "12:34:56" }).timestamp).toBe(
      base.receivedAt,
    );
    expect(fromNativeRead({ ...base, timestamp: "0" }).timestamp).toBe(
      base.receivedAt,
    );
  });

  it("drops an AIM id that is not one, and falls back for the raw type", () => {
    expect(fromNativeRead({ ...base, aimId: "", codeId: "" })).toMatchObject({
      aimId: null,
      rawType: "unknown",
    });
    expect(fromNativeRead({ ...base, codeId: null })).toMatchObject({
      rawType: "]Q1",
    });
  });
});
