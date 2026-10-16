import { render, screen } from "@testing-library/react-native";

import App from "../App";
import {
  batchRate,
  emptyMeasurements,
  record,
  toReport,
} from "../measurements";

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

  it("keeps the last 200 events", () => {
    let m = emptyMeasurements();
    for (let i = 0; i < 250; i++) {
      m = record(m, { type: "x", at: i, thread: "t" });
    }
    expect(m.log).toHaveLength(200);
    expect(m.log[0]!.at).toBe(50);
  });
});

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
});
