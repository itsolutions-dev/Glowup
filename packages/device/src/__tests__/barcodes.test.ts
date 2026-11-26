import { aimToBarcodeType, createScanGate } from "../core/barcodes";

const QR = { type: "qr" as const, rawType: "qr", data: "A" };
const OPTIONS = { repeatInterval: 1000, dropWhileBusy: true };

describe("aimToBarcodeType", () => {
  it.each([
    ["]Q1", "qr"],
    ["]C0", "code128"],
    ["]C1", "code128"],
    ["]E0", "ean13"],
    ["]E4", "ean8"],
    ["]d1", "datamatrix"],
    ["]d2", "datamatrix"],
    ["]A0", "code39"],
    ["]G0", "code93"],
    ["]F0", "codabar"],
    ["]I1", "itf14"],
    ["]L2", "pdf417"],
    ["]z0", "aztec"],
  ])("reads %s as %s", (aimId, type) => {
    expect(aimToBarcodeType(aimId)).toBe(type);
  });

  it.each([null, undefined, "", "]", "Q1", "]E3", "]X0", "]D1"])(
    "reads %p as unknown",
    (aimId) => {
      expect(aimToBarcodeType(aimId)).toBe("unknown");
    },
  );
});

describe("createScanGate", () => {
  afterEach(() => jest.restoreAllMocks());

  it("delivers the same code once per interval, another code at once", () => {
    const now = jest.spyOn(Date, "now").mockReturnValue(1000);
    const gate = createScanGate();
    const deliver = jest.fn();
    expect(gate.offer(QR, OPTIONS, deliver)).toBe(true);
    expect(gate.offer(QR, OPTIONS, deliver)).toBe(false);
    expect(gate.offer({ ...QR, data: "B" }, OPTIONS, deliver)).toBe(true);
    now.mockReturnValue(2100);
    expect(gate.offer({ ...QR, data: "B" }, OPTIONS, deliver)).toBe(true);
    expect(deliver.mock.calls.map(([scan]) => scan.data)).toEqual([
      "A",
      "B",
      "B",
    ]);
  });

  it("delivers every read with a 0 interval, and again after reset()", () => {
    const gate = createScanGate();
    const deliver = jest.fn();
    gate.offer(QR, { ...OPTIONS, repeatInterval: 0 }, deliver);
    gate.offer(QR, { ...OPTIONS, repeatInterval: 0 }, deliver);
    gate.offer(QR, OPTIONS, deliver);
    gate.reset();
    gate.offer(QR, OPTIONS, deliver);
    expect(deliver).toHaveBeenCalledTimes(3);
  });

  it("drops reads while a delivery's promise is pending", async () => {
    const gate = createScanGate();
    let finish!: () => void;
    const deliver = jest.fn(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    const changes = jest.fn();
    gate.subscribe(changes);
    gate.offer(QR, OPTIONS, deliver);
    expect(gate.isBusy()).toBe(true);
    expect(gate.offer({ ...QR, data: "B" }, OPTIONS, deliver)).toBe(false);
    finish();
    await Promise.resolve();
    await Promise.resolve();
    expect(gate.isBusy()).toBe(false);
    expect(gate.offer({ ...QR, data: "B" }, OPTIONS, deliver)).toBe(true);
    expect(changes).toHaveBeenCalledTimes(3);
  });

  it("keeps delivering while busy without dropWhileBusy", () => {
    const gate = createScanGate();
    const deliver = jest.fn(() => new Promise<void>(() => {}));
    gate.offer(QR, { ...OPTIONS, dropWhileBusy: false }, deliver);
    gate.offer(
      { ...QR, data: "B" },
      { ...OPTIONS, dropWhileBusy: false },
      deliver,
    );
    expect(deliver).toHaveBeenCalledTimes(2);
  });
});
