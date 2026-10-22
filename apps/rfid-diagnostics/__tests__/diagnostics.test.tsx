import {
  createHoneywellBarcodeScannerAdapter,
  HONEYWELL_SCANNER_NATIVE_REVISION,
} from "@its/scanner-honeywell";
import {
  createZebraBarcodeScannerAdapter,
  ZEBRA_SCANNER_NATIVE_REVISION,
} from "@its/scanner-zebra";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import App from "../App";
import config, {
  excludeFromAutolinking,
  VENDORS,
  vendorOf,
} from "../app.config";
import {
  batchRate,
  emptyMeasurements,
  record,
  toReport,
} from "../measurements";
import { FIRST_SCOPE } from "../ScannerScreen";
import {
  emptyScannerMeasurements,
  recordScanner,
  toScannerReport,
} from "../scannerMeasurements";
import { honeywellVendor, zebraVendor } from "../vendors";

const at = (ms: number) => 1_700_000_000_000 + ms;

describe("measurements", () => {
  it("gathers the batches: sizes, threads, raw RSSI, EPC case and the SDK's tag time", () => {
    let m = emptyMeasurements(at(0));
    m = record(m, {
      type: "tags",
      at: at(0),
      thread: "SilionBle",
      size: 3,
      sample: { epc: "E2801170", rssi: -48, readCount: 1, time: 0 },
    });
    m = record(m, {
      type: "tags",
      at: at(500),
      thread: "SilionBle",
      size: 5,
      sample: { epc: "e2801171", rssi: -71, readCount: 4, time: 0 },
    });
    m = record(m, {
      type: "tags",
      at: at(1000),
      thread: "other",
      size: 1,
      sample: { epc: "E2801172", rssi: -55, readCount: 1 },
    });
    expect(m.reads).toMatchObject({
      batches: 3,
      reads: 9,
      largestBatch: 5,
      threads: ["SilionBle", "other"],
      rssiMin: -71,
      rssiMax: -48,
      readCountMax: 4,
      lowercaseEpc: true,
      zeroTime: true,
    });
    expect(batchRate(m)).toBe(2);
  });

  it("keeps the SDK's locate values, battery strings, adverts and the connection timeline", () => {
    let m = emptyMeasurements(at(0));
    m = record(m, {
      type: "findingTag",
      at: at(1),
      thread: "main",
      value: -12,
    });
    m = record(m, {
      type: "findingTag",
      at: at(2),
      thread: "main",
      value: -40,
    });
    m = record(m, { type: "battery", at: at(3), thread: "q", raw: "87" });
    m = record(m, { type: "battery", at: at(4), thread: "q", raw: "87" });
    m = record(m, {
      type: "advert",
      at: at(5),
      thread: "scan",
      id: "0C:23:69:19:AA:12",
      name: "IH40",
      rssi: -60,
      serviceUuids: ["e093f3b5-00a3-a9e5-9eca-40016e0edc24"],
      manufacturerIds: [1234],
      likelyReader: true,
    });
    m = record(m, {
      type: "readerCreated",
      at: at(6),
      thread: "main",
      success: true,
    });
    expect(m.findingTag).toEqual({ count: 2, min: -40, max: -12 });
    expect(m.battery).toEqual(["87"]);
    expect(m.adverts["0C:23:69:19:AA:12"]).toMatchObject({
      name: "IH40",
      likelyReader: true,
    });
    expect(m.timeline).toEqual([
      { type: "readerCreated", at: at(6), detail: '{"success":true}' },
    ]);
    expect(m.events).toBe(6);
    expect(toReport(m, { host: "CT40" })).toMatchObject({
      context: { host: "CT40" },
      findingTag: { count: 2 },
    });
  });

  it("keeps Zebra's native locate reads, battery levels and paired readers", () => {
    let m = emptyMeasurements(at(0));
    m = record(m, {
      type: "locate",
      at: at(1),
      thread: "sdk",
      rssi: -48,
      hasLocation: true,
      relativeDistance: 72,
    });
    m = record(m, {
      type: "locate",
      at: at(2),
      thread: "sdk",
      rssi: -63,
      hasLocation: false,
      relativeDistance: null,
    });
    m = record(m, { type: "battery", at: at(3), thread: "sdk", level: 64 });
    m = record(m, {
      type: "tags",
      at: at(4),
      thread: "sdk",
      size: 2,
      sample: { epc: "E2801170", rssi: -50, seenCount: 3 },
    });
    m = record(m, {
      type: "pairedReader",
      at: at(5),
      thread: "ZebraRfid-link",
      id: "84:C6:92:12:34:56",
      name: "RFD40+_211545201D0011",
      likelyReader: true,
    });
    expect(m.locate).toEqual({
      count: 2,
      rssiMin: -63,
      rssiMax: -48,
      distanceMin: 72,
      distanceMax: 72,
      withoutLocation: 1,
    });
    expect(m.battery).toEqual(["64"]);
    expect(m.reads.readCountMax).toBe(3);
    expect(m.adverts["84:C6:92:12:34:56"]).toMatchObject({
      name: "RFD40+_211545201D0011",
      likelyReader: true,
    });
  });

  it("keeps the last 200 events", () => {
    let m = emptyMeasurements();
    for (let i = 0; i < 250; i++) {
      m = record(m, { type: "x", at: i, thread: "t" });
    }
    expect(m.log).toHaveLength(200);
    expect(m.log[0]!.at).toBe(50);
  });
});

describe("scanner measurements", () => {
  it("groups the reads by code id and AIM id, with their charsets and a sample", () => {
    let m = emptyScannerMeasurements(at(0));
    const read = (
      codeId: string,
      aimId: string,
      data: string,
      charset: string,
    ) =>
      (m = recordScanner(m, {
        type: "read",
        at: at(1),
        thread: "binder:1234_2",
        codeId,
        aimId,
        data,
        charset,
        timestamp: "2026-10-20 10:15:30.250",
      }));
    read("s", "]Q1", "Città\n", "UTF-8");
    read("s", "]Q1", "B", "ISO-8859-1");
    read("j", "]C0", "PALLET-7", "UTF-8");
    m = recordScanner(m, { type: "noRead", at: at(2), thread: "t" });
    expect(m.reads).toBe(3);
    expect(m.noReads).toBe(1);
    expect(m.symbologies["s ]Q1"]).toEqual({
      codeId: "s",
      aimId: "]Q1",
      charsets: ["UTF-8", "ISO-8859-1"],
      count: 2,
      timestamp: "2026-10-20 10:15:30.250",
      sample: '"B"',
    });
    expect(m.symbologies["j ]C0"]!.count).toBe(1);
    expect(m.threads).toEqual(["binder:1234_2", "t"]);
  });

  it("groups DataWedge's reads by label type and keeps its commands and notifications", () => {
    let m = emptyScannerMeasurements(at(0));
    m = recordScanner(m, {
      type: "read",
      at: at(1),
      thread: "ZebraScanner-events",
      data: "LOC:A-03-12",
      labelType: "LABEL-TYPE-QRCODE",
      source: "scanner",
      delivered: true,
    });
    m = recordScanner(m, {
      type: "command",
      at: at(2),
      thread: "ZebraScanner",
      command: "SWITCH_SCANNER_PARAMS",
      answered: true,
      result: "SUCCESS",
    });
    m = recordScanner(m, {
      type: "notification",
      at: at(3),
      thread: "ZebraScanner-events",
      notification: "SCANNER_STATUS",
      status: "WAITING",
    });
    expect(m.symbologies["LABEL-TYPE-QRCODE ?"]).toMatchObject({
      codeId: "LABEL-TYPE-QRCODE",
      aimId: null,
      count: 1,
    });
    expect(m.timeline.map((entry) => entry.type)).toEqual([
      "command",
      "notification",
    ]);
  });

  it("counts the trigger, also while not claimed, and keeps the claim's timeline", () => {
    let m = emptyScannerMeasurements(at(0));
    for (const [pressed, claimed] of [
      [true, true],
      [false, true],
      [true, false],
    ]) {
      m = recordScanner(m, {
        type: "trigger",
        at: at(1),
        thread: "t",
        pressed,
        claimed,
      });
    }
    m = recordScanner(m, {
      type: "applied",
      at: at(2),
      thread: "t",
      set: 40,
      skipped: ["DEC_DIGIMARC_ENABLED"],
      restored: [],
    });
    m = recordScanner(m, { type: "released", at: at(3), thread: "t" });
    expect(m.triggers).toEqual({ pressed: 2, released: 1, whileReleased: 1 });
    expect(m.timeline.map((entry) => entry.type)).toEqual([
      "applied",
      "released",
    ]);
    expect(m.timeline[0]!.detail).toContain("DEC_DIGIMARC_ENABLED");
    expect(toScannerReport(m, { host: "CT40" })).toMatchObject({
      kind: "barcode-scanner",
      context: { host: "CT40" },
    });
  });
});

/** The Kotlin module's surface, enough for the screen: claims and reads. */
function fakeScannerModule() {
  const listeners = new Map<string, Set<(event: never) => void>>();
  let claimed = false;
  const opens: Record<string, unknown>[] = [];
  const controls: string[] = [];
  return {
    opens,
    controls,
    get claimed() {
      return claimed;
    },
    decode(data: string) {
      if (!claimed) return;
      listeners.get("onRead")?.forEach((listener) =>
        (listener as (event: unknown) => void)({
          data,
          codeId: "s",
          aimId: "]Q1",
          charset: "UTF-8",
          timestamp: null,
          receivedAt: Date.now(),
        }),
      );
    },
    module: {
      getRevision: () => HONEYWELL_SCANNER_NATIVE_REVISION,
      setDiagnostics() {},
      async open(properties: Record<string, unknown>, control: string) {
        opens.push(properties);
        controls.push(control);
        claimed = true;
      },
      async close() {
        claimed = false;
      },
      async softwareTrigger() {},
      async getScannerInfo() {
        throw new Error("not in this fake");
      },
      async listDevices() {
        return [];
      },
      async getAllProperties() {
        return {};
      },
      addListener(event: string, listener: (event: never) => void) {
        const set = listeners.get(event) ?? new Set();
        set.add(listener);
        listeners.set(event, set);
        return { remove: () => set.delete(listener) };
      },
    },
  };
}

/** The Zebra module's surface, enough for the screen: DataWedge's claim and reads. */
function fakeZebraModule() {
  const listeners = new Map<string, Set<(event: never) => void>>();
  let open = false;
  const opens: { scanner: Record<string, string>; method: string }[] = [];
  return {
    opens,
    get open() {
      return open;
    },
    decode(data: string) {
      if (!open) return;
      listeners.get("onRead")?.forEach((listener) =>
        (listener as (event: unknown) => void)({
          data,
          labelType: "LABEL-TYPE-QRCODE",
          source: "scanner",
          receivedAt: Date.now(),
        }),
      );
    },
    module: {
      getRevision: () => ZEBRA_SCANNER_NATIVE_REVISION,
      isDataWedgeInstalled: () => true,
      setDiagnostics() {},
      async open(config: { scanner: Record<string, string>; method: string }) {
        opens.push(config);
        open = true;
      },
      async close() {
        open = false;
      },
      async softwareTrigger() {},
      async getScannerInfo() {
        return {
          datawedge: "15.0.96",
          barcodeScanning: null,
          decoderLibrary: null,
          firmware: [],
          scanners: [],
        };
      },
      async getProfileParams() {
        return { charset_name: "UTF-8", decoder_qrcode: "true" };
      },
      async getActiveProfile() {
        return "it.itsolutions.rfiddiagnostics";
      },
      addListener(event: string, listener: (event: never) => void) {
        const set = listeners.get(event) ?? new Set();
        set.add(listener);
        listeners.set(event, set);
        return { remove: () => set.delete(listener) };
      },
    },
  };
}

describe("the screen", () => {
  it("renders without a Honeywell host or module, and says why the adapter is off", async () => {
    await render(<App />);
    expect(screen.getByText("RFID diagnostics")).toBeTruthy();
    expect(
      screen.getByText(
        /unsupported: (not a Honeywell host|the native module is missing)/,
      ),
    ).toBeTruthy();
    expect(screen.getByText("Multiple scan")).toBeTruthy();
  });

  it("runs the Zebra adapter too, with the switch between the reader's search and the engine's", async () => {
    await render(<App vendor={zebraVendor()} />);
    expect(screen.getByText(/Vendor: zebra/)).toBeTruthy();
    expect(
      screen.getByText(/the native module is missing .*RFID_VENDOR=zebra/),
    ).toBeTruthy();
    expect(
      screen.getByText("The reader's own search (off: the engine's)"),
    ).toBeTruthy();
  });
});

describe("the scanner screen", () => {
  it("renders without a Honeywell host or module, and says why the adapter is off", async () => {
    await render(<App initialScreen="scanner" />);
    expect(screen.getByText("Barcode scanner diagnostics")).toBeTruthy();
    expect(
      screen.getByText(
        /unsupported: (not a Honeywell host|the native module is missing)/,
      ),
    ).toBeTruthy();
    expect(screen.getByText("Keyboard wedge")).toBeTruthy();
  });

  it("holds the CT40's imager with the first scope and lists what reaches onScan", async () => {
    const fake = fakeScannerModule();
    const vendor = honeywellVendor();
    vendor.scanner = {
      name: "honeywell",
      adapter: createHoneywellBarcodeScannerAdapter({
        native: fake.module as never,
        manufacturer: () => "Honeywell",
      }),
      expectedRevision: HONEYWELL_SCANNER_NATIVE_REVISION,
      unsupportedReason: () => "supported",
    };
    await render(<App vendor={vendor} />);
    await fireEvent.press(screen.getByText("Barcode scanner"));
    await waitFor(() => expect(fake.claimed).toBe(true));
    const enabled = Object.entries(fake.opens.at(-1)!)
      .filter(([key, value]) => key.endsWith("_ENABLED") && value === true)
      .map(([key]) => key)
      .sort();
    expect(enabled).toEqual([
      "DEC_CODE128_ENABLED",
      "DEC_DATAMATRIX_ENABLED",
      "DEC_EAN13_ENABLED",
      "DEC_EAN8_ENABLED",
      "DEC_GS1_128_ENABLED",
      "DEC_QR_ENABLED",
    ]);
    expect(FIRST_SCOPE).toEqual([
      "qr",
      "code128",
      "ean13",
      "ean8",
      "datamatrix",
    ]);
    await act(async () => fake.decode("LOT-42"));
    expect(screen.getByText('"LOT-42"')).toBeTruthy();
    expect(screen.getByText(/qr · AIM \]Q1 · code id s/)).toBeTruthy();
    // Client control applies on a new claim: the screen lets go and claims again.
    await fireEvent(
      screen.getByLabelText(/The app drives the trigger/),
      "valueChange",
      true,
    );
    await waitFor(() => expect(fake.controls.at(-1)).toBe("client"));
    // Back to RFID: the scanner screen unmounts and the imager is released.
    await fireEvent.press(screen.getByText("RFID"));
    await waitFor(() => expect(fake.claimed).toBe(false));
  });

  it("says why the Zebra scanner is off in a build without its module", async () => {
    await render(<App vendor={zebraVendor()} initialScreen="scanner" />);
    expect(
      screen.getByText(/the native module is missing .*RFID_VENDOR=zebra/),
    ).toBeTruthy();
    expect(
      screen.getByText(/DataWedge profile turns the keystroke/),
    ).toBeTruthy();
    expect(screen.queryByText(/client control/)).toBeNull();
  });

  it("holds the TC22's imager through DataWedge with the first scope", async () => {
    const fake = fakeZebraModule();
    const vendor = zebraVendor();
    vendor.scanner = {
      name: "zebra",
      adapter: createZebraBarcodeScannerAdapter({
        native: fake.module as never,
        manufacturer: () => "Zebra Technologies",
      }),
      expectedRevision: ZEBRA_SCANNER_NATIVE_REVISION,
      unsupportedReason: () => "supported",
    };
    await render(<App vendor={vendor} initialScreen="scanner" />);
    await waitFor(() => expect(fake.open).toBe(true));
    const on = Object.entries(fake.opens.at(-1)!.scanner)
      .filter(([, value]) => value === "true")
      .map(([key]) => key)
      .sort();
    expect(on).toEqual([
      "decoder_code128",
      "decoder_datamatrix",
      "decoder_ean13",
      "decoder_ean8",
      "decoder_qrcode",
    ]);
    expect(fake.opens.at(-1)!.method).toBe("switch");
    await act(async () => fake.decode("LOC:A-03-12"));
    expect(screen.getByText('"LOC:A-03-12"')).toBeTruthy();
    expect(
      screen.getByText(/qr · AIM — · label LABEL-TYPE-QRCODE/),
    ).toBeTruthy();
    await fireEvent.press(screen.getByText("Active profile"));
    expect(
      await screen.findByText(/Active profile: it.itsolutions.rfiddiagnostics/),
    ).toBeTruthy();
    // The other way to set the decoders: the scanner is claimed again with it.
    const opens = fake.opens.length;
    await fireEvent(
      screen.getByLabelText(/Decoders in the stored profile/),
      "valueChange",
      true,
    );
    await waitFor(() => expect(fake.opens.length).toBeGreaterThan(opens));
    expect(fake.opens.at(-1)!.method).toBe("config");
  });
});

describe("one vendor per build", () => {
  const SETTINGS = `extensions.configure(com.facebook.react.ReactSettingsExtension) { ex ->
  ex.autolinkLibrariesFromCommand(expoAutolinking.rnConfigCommand)
}
expoAutolinking.useExpoModules()

rootProject.name = 'HelloWorld'
`;

  it("picks the vendor from RFID_VENDOR, Honeywell by default", () => {
    expect(vendorOf(undefined)).toBe("honeywell");
    expect(vendorOf("zebra")).toBe("zebra");
    expect(() => vendorOf("acme")).toThrow(/honeywell or zebra/);
    expect(config.plugins?.[0]).toEqual([
      "@its/rfid-honeywell",
      expect.objectContaining({ aarPath: expect.any(String) }),
    ]);
    expect(config.plugins?.[1]).toEqual([
      "@its/scanner-honeywell",
      { dataCollectionAarPath: expect.any(String) },
    ]);
  });

  it("gives Honeywell's RFID and scanner plugins one Data Collection SDK, at one coordinate (C5)", () => {
    const [[, rfid], [, scanner]] = VENDORS.honeywell.plugins;
    expect(scanner.dataCollectionAarPath).toBe(rfid.dataCollectionAarPath);
    const rfidSdk = jest
      .requireActual("@its/rfid-honeywell/app.plugin.js")
      .internal.SDKS.find(
        (sdk: { option: string }) => sdk.option === "dataCollectionAarPath",
      );
    const scannerSdk = jest.requireActual(
      "@its/scanner-honeywell/app.plugin.js",
    ).internal.SDK;
    for (const key of ["group", "artifact", "version"]) {
      expect(scannerSdk[key]).toBe(rfidSdk[key]);
    }
  });

  it("leaves the other vendor's RFID and scanner modules out of each build", () => {
    expect(VENDORS.honeywell.packages).toEqual([
      "@its/rfid-honeywell",
      "@its/scanner-honeywell",
    ]);
    expect(VENDORS.zebra.packages).toEqual([
      "@its/rfid-zebra",
      "@its/scanner-zebra",
    ]);
    // Zebra's scanner has no plugin: DataWedge needs no SDK.
    expect(VENDORS.zebra.plugins.map(([name]) => name)).toEqual([
      "@its/rfid-zebra",
    ]);
  });

  it("leaves the other vendors' modules out of autolinking, once", () => {
    const once = excludeFromAutolinking(SETTINGS, ["@its/rfid-zebra"]);
    expect(once).toContain(`// @its/rfid-diagnostics: one vendor per build
expoAutolinking.exclude = ["@its/rfid-zebra"]
expoAutolinking.useExpoModules()`);
    expect(excludeFromAutolinking(once, ["@its/rfid-zebra"])).toBe(once);
    expect(() => excludeFromAutolinking("include ':app'", ["x"])).toThrow(
      /useExpoModules/,
    );
  });
});
