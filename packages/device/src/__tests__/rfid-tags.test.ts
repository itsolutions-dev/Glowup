import {
  firstSupportedRfidAdapter,
  getRfidCapabilities,
  isCompatibleRfidAdapter,
  isRfidError,
  normalizeEpc,
  RFID_CONTRACT_VERSION,
  RfidError,
  toProximity,
  toRfidError,
  unsupportedRfidAdapter,
} from "../rfid";
import { mergeRead, mergeReads, strongestTag } from "../rfid/tags";
import { createMockRfidAdapter } from "../testing";

const BOUNDS = { near: -35, far: -75 };

describe("normalizeEpc", () => {
  it("uppercases and drops separators", () => {
    expect(normalizeEpc("e280-1170 0000:0212")).toBe("E280117000000212");
  });

  it("refuses what is not hex in 16-bit words", () => {
    expect(normalizeEpc("")).toBeNull();
    expect(normalizeEpc("E28")).toBeNull();
    expect(normalizeEpc("E28G")).toBeNull();
    expect(normalizeEpc(42 as never)).toBeNull();
  });
});

describe("toProximity", () => {
  it("maps the RSSI between the bounds to 0–1", () => {
    expect(toProximity(-35, BOUNDS)).toBe(1);
    expect(toProximity(-20, BOUNDS)).toBe(1);
    expect(toProximity(-55, BOUNDS)).toBe(0.5);
    expect(toProximity(-75, BOUNDS)).toBe(0);
    expect(toProximity(-90, BOUNDS)).toBe(0);
  });

  it("degrades to a threshold for collapsed bounds", () => {
    expect(toProximity(-50, { near: -50, far: -50 })).toBe(1);
    expect(toProximity(-51, { near: -50, far: -50 })).toBe(0);
  });
});

describe("mergeRead", () => {
  it("smooths the RSSI, counts reads and keeps what a later read lacks", () => {
    const first = mergeRead(
      undefined,
      { epc: "e2801170", rssi: -55, antenna: 1, tid: "e2", timestamp: 10 },
      BOUNDS,
      99,
    )!;
    expect(first).toEqual({
      epc: "E2801170",
      tid: "E2",
      rssi: -55,
      averageRssi: -55,
      proximity: 0.5,
      antenna: 1,
      readCount: 1,
      firstSeen: 10,
      lastSeen: 10,
    });
    const second = mergeRead(
      first,
      { epc: "E2801170", rssi: -45, readCount: 3 },
      BOUNDS,
      20,
    )!;
    expect(second).toMatchObject({
      tid: "E2",
      rssi: -45,
      averageRssi: -52,
      antenna: 1,
      readCount: 4,
      firstSeen: 10,
      lastSeen: 20,
    });
    expect(second.proximity).toBeCloseTo(0.575);
  });

  it("ignores a read that is not a tag", () => {
    expect(mergeRead(undefined, { epc: "nope", rssi: -50 }, BOUNDS, 1)).toBe(
      null,
    );
    expect(
      mergeRead(undefined, { epc: "E280", rssi: Number.NaN }, BOUNDS, 1),
    ).toBeNull();
  });
});

describe("strongestTag", () => {
  it("keeps the highest average, then the most reads", () => {
    const tags = mergeReads(
      [
        { epc: "AAAA", rssi: -60 },
        { epc: "BBBB", rssi: -50 },
        { epc: "CCCC", rssi: -50 },
        { epc: "CCCC", rssi: -50 },
      ],
      BOUNDS,
      1,
    );
    expect(strongestTag(tags.values())?.epc).toBe("CCCC");
    expect(strongestTag([])).toBeNull();
  });
});

describe("RfidError", () => {
  it("is recognised by name across copies, and wraps anything else", () => {
    const error = new RfidError("timeout");
    expect(error.message).toBe("The RFID reader did not answer in time.");
    expect(isRfidError(error)).toBe(true);
    const copy = Object.assign(new Error("x"), {
      name: "RfidError",
      code: "failed",
    });
    expect(isRfidError(copy)).toBe(true);
    expect(isRfidError(new Error("x"))).toBe(false);
    expect(toRfidError(error)).toBe(error);
    const wrapped = toRfidError(new Error("SDK said no"));
    expect(wrapped).toMatchObject({ code: "failed", message: "SDK said no" });
    expect((wrapped as { cause?: unknown }).cause).toBeInstanceOf(Error);
    expect(toRfidError("raw").message).toBe("raw");
  });
});

describe("choosing an adapter", () => {
  it("reads the capabilities from the methods", () => {
    expect(getRfidCapabilities(unsupportedRfidAdapter)).toEqual({
      locate: "emulated",
      singleRead: "emulated",
      tid: false,
      trigger: false,
      discovery: false,
      battery: false,
      readerInfo: false,
    });
  });

  it("takes the first supported adapter of this contract version", () => {
    const off = createMockRfidAdapter({ supported: false, vendor: "off" });
    const old = createMockRfidAdapter({ contractVersion: 0, vendor: "old" });
    const good = createMockRfidAdapter({ vendor: "good" });
    expect(isCompatibleRfidAdapter(old)).toBe(false);
    expect(good.contractVersion).toBe(RFID_CONTRACT_VERSION);
    expect(firstSupportedRfidAdapter([off, old, good])).toBe(good);
    expect(firstSupportedRfidAdapter([off, old])).toBe(unsupportedRfidAdapter);
  });

  it("the unsupported adapter rejects every operation", async () => {
    await expect(unsupportedRfidAdapter.connect("x")).rejects.toMatchObject({
      code: "unsupported",
    });
    await expect(unsupportedRfidAdapter.getPermission()).resolves.toEqual({
      status: "unsupported",
      canAskAgain: false,
    });
  });
});
