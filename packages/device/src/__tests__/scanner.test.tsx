import { act, renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { AppState } from "react-native";

import { DeviceAdaptersProvider } from "..";
import type { CameraViewProps } from "../camera";
import {
  isBarcodeScannerError,
  useBarcodeScanner,
  type BarcodeScan,
  type BarcodeScannerOptions,
  type BarcodeScannerScan,
} from "../scanner";
import {
  createMockBarcodeScannerAdapter,
  type MockBarcodeScannerAdapter,
  type MockBarcodeScannerOptions,
} from "../testing";

const FOUR = ["qr", "code128", "ean13", "datamatrix"] as const;

// jest-expo's AppState.addEventListener is a jest.fn: swap it for one that
// lets the test move the app between states.
let appStateListeners: ((state: string) => void)[] = [];
const originalAddEventListener = AppState.addEventListener;

beforeEach(() => {
  jest.useFakeTimers({ now: 1_000_000 });
  appStateListeners = [];
  AppState.addEventListener = ((_type: string, listener: never) => {
    appStateListeners.push(listener);
    return {
      remove: () => {
        appStateListeners = appStateListeners.filter((l) => l !== listener);
      },
    };
  }) as never;
});

afterEach(() => {
  AppState.addEventListener = originalAddEventListener;
  jest.useRealTimers();
});

async function flush() {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });
}

async function moveTo(state: string) {
  await act(async () => appStateListeners.forEach((l) => l(state)));
  await flush();
}

function wrapperFor(adapter: MockBarcodeScannerAdapter) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <DeviceAdaptersProvider adapters={{ barcodeScanner: adapter }}>
        {children}
      </DeviceAdaptersProvider>
    );
  };
}

async function setup(
  options: Partial<BarcodeScannerOptions> = {},
  adapterOptions: MockBarcodeScannerOptions = {},
) {
  const adapter = createMockBarcodeScannerAdapter(adapterOptions);
  const onScan = jest.fn<unknown, [BarcodeScannerScan]>();
  const hook = await renderHook(
    (props: Partial<BarcodeScannerOptions>) =>
      useBarcodeScanner({ onScan, ...options, ...props }),
    { wrapper: wrapperFor(adapter), initialProps: {} },
  );
  await flush();
  return { adapter, onScan, ...hook };
}

async function scan(
  adapter: MockBarcodeScannerAdapter,
  read: Parameters<MockBarcodeScannerAdapter["scan"]>[0],
) {
  let delivered = false;
  await act(async () => {
    delivered = adapter.scan(read);
  });
  return delivered;
}

async function codeOf(run: () => Promise<unknown>): Promise<string> {
  let code = "";
  await act(async () => {
    try {
      await run();
      code = "resolved";
    } catch (error) {
      code = isBarcodeScannerError(error) ? error.code : String(error);
    }
  });
  return code;
}

describe("useBarcodeScanner", () => {
  it("reads unsupported without an adapter, and never throws on symbologies", async () => {
    const onScan = jest.fn();
    const { result } = await renderHook(() =>
      useBarcodeScanner({ onScan, symbologies: [...FOUR] }),
    );
    expect(result.current).toMatchObject({
      isSupported: false,
      vendor: "none",
      state: "closed",
      isActive: false,
      error: null,
      capabilities: { softwareTrigger: false, symbologies: [] },
    });
    expect(await codeOf(() => result.current.softwareTrigger(true))).toBe(
      "unsupported",
    );
  });

  it("holds the scanner while mounted, with the symbologies asked for", async () => {
    const { adapter, onScan, result, unmount } = await setup({
      symbologies: [...FOUR],
    });
    expect(adapter.isOpen).toBe(true);
    expect(adapter.request).toEqual({ symbologies: [...FOUR] });
    expect(result.current).toMatchObject({
      isSupported: true,
      vendor: "mock",
      state: "open",
      isActive: true,
    });
    expect(await scan(adapter, { data: "8001234567890", type: "ean13" })).toBe(
      true,
    );
    expect(onScan).toHaveBeenCalledWith({
      data: "8001234567890",
      type: "ean13",
      rawType: "ean13",
      aimId: "]E0",
      timestamp: 1_000_000,
    });
    // A symbology turned off is not decoded at all.
    expect(await scan(adapter, { data: "x", type: "pdf417" })).toBe(false);
    await unmount();
    await flush();
    expect(adapter.isOpen).toBe(false);
  });

  it("names the symbology from the AIM id, or keeps the adapter's", async () => {
    const { adapter, onScan } = await setup();
    await scan(adapter, { data: "A", aimId: "]d2", rawType: "w" });
    await scan(adapter, { data: "B", aimId: null, rawType: "?" });
    expect(onScan.mock.calls.map(([s]) => [s.type, s.aimId])).toEqual([
      ["datamatrix", "]d2"],
      ["unknown", null],
    ]);
  });

  it("keeps the scanner's configuration with no symbologies", async () => {
    const { adapter } = await setup();
    expect(adapter.request).toEqual({ symbologies: null });
  });

  it("opens only while enabled", async () => {
    const { adapter, result, rerender } = await setup({ enabled: false });
    expect(adapter.isOpen).toBe(false);
    expect(result.current.state).toBe("closed");
    await rerender({ enabled: true });
    await flush();
    expect(adapter.isOpen).toBe(true);
    await rerender({ enabled: false });
    await flush();
    expect(adapter.isOpen).toBe(false);
  });

  it("applies new symbologies without releasing the scanner", async () => {
    const { adapter, rerender } = await setup({ symbologies: ["qr"] });
    // A new inline array with the same list changes nothing.
    await rerender({ symbologies: ["qr"] });
    await flush();
    expect(adapter.openCount).toBe(1);
    await rerender({ symbologies: ["qr", "ean13"] });
    await flush();
    expect(adapter.request).toEqual({ symbologies: ["qr", "ean13"] });
    expect(adapter.openCount).toBe(2);
    expect(adapter.closeCount).toBe(0);
  });

  it("gives the reads to the latest holder, then back to the one below", async () => {
    const adapter = createMockBarcodeScannerAdapter();
    const below = jest.fn();
    const above = jest.fn();
    const wrapper = wrapperFor(adapter);
    const first = await renderHook(
      () => useBarcodeScanner({ onScan: below, symbologies: ["qr"] }),
      { wrapper },
    );
    const second = await renderHook(
      () => useBarcodeScanner({ onScan: above, symbologies: ["ean13"] }),
      { wrapper },
    );
    await flush();
    expect(adapter.request).toEqual({ symbologies: ["ean13"] });
    expect(first.result.current.isActive).toBe(false);
    expect(second.result.current.isActive).toBe(true);
    await scan(adapter, { data: "8001234567890", type: "ean13" });
    expect(above).toHaveBeenCalledTimes(1);
    expect(below).not.toHaveBeenCalled();
    await second.unmount();
    await flush();
    expect(adapter.request).toEqual({ symbologies: ["qr"] });
    expect(adapter.closeCount).toBe(0);
    await scan(adapter, { data: "hello" });
    expect(below).toHaveBeenCalledTimes(1);
    expect(first.result.current.isActive).toBe(true);
  });

  it("drops reads while onScan's confirmation runs", async () => {
    let confirm!: () => void;
    const { adapter, onScan, result } = await setup();
    onScan.mockImplementation(
      () => new Promise<void>((resolve) => (confirm = resolve)),
    );
    await scan(adapter, { data: "A" });
    expect(result.current.isBusy).toBe(true);
    await scan(adapter, { data: "B" });
    expect(onScan).toHaveBeenCalledTimes(1);
    await act(async () => confirm());
    expect(result.current.isBusy).toBe(false);
    await scan(adapter, { data: "B" });
    expect(onScan).toHaveBeenCalledTimes(2);
  });

  it("delivers the same code once per repeatInterval", async () => {
    const { adapter, onScan, rerender } = await setup();
    await scan(adapter, { data: "A" });
    await scan(adapter, { data: "A" });
    expect(onScan).toHaveBeenCalledTimes(1);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1000);
    });
    await scan(adapter, { data: "A" });
    expect(onScan).toHaveBeenCalledTimes(2);
    await rerender({ repeatInterval: 0 });
    await scan(adapter, { data: "A" });
    await scan(adapter, { data: "A" });
    expect(onScan).toHaveBeenCalledTimes(4);
  });

  it("uses the latest onScan without reopening", async () => {
    const { adapter, onScan, rerender } = await setup();
    const next = jest.fn();
    await rerender({ onScan: next });
    await scan(adapter, { data: "A" });
    expect(next).toHaveBeenCalledTimes(1);
    expect(onScan).not.toHaveBeenCalled();
    expect(adapter.openCount).toBe(1);
  });

  it("releases the scanner in the background and takes it back on return", async () => {
    const { adapter, result } = await setup();
    await moveTo("inactive");
    expect(adapter.isOpen).toBe(true);
    await moveTo("background");
    expect(adapter.isOpen).toBe(false);
    expect(result.current.state).toBe("closed");
    await moveTo("active");
    expect(adapter.isOpen).toBe(true);
    expect(result.current.state).toBe("open");
  });

  it("reports a scanner another app took, and opens again on retry()", async () => {
    const { adapter, result } = await setup();
    await act(async () => adapter.takeAway());
    expect(result.current.state).toBe("closed");
    expect(result.current.error?.code).toBe("unavailable");
    await act(async () => result.current.retry());
    await flush();
    expect(adapter.isOpen).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("reports an open that failed, and releases what it held", async () => {
    const adapter = createMockBarcodeScannerAdapter();
    adapter.failNextOpen("unavailable");
    const { result } = await renderHook(
      () => useBarcodeScanner({ onScan: jest.fn() }),
      { wrapper: wrapperFor(adapter) },
    );
    await flush();
    expect(result.current).toMatchObject({
      state: "closed",
      error: expect.objectContaining({ code: "unavailable" }),
    });
    expect(adapter.isOpen).toBe(false);
  });

  it("is opening until the adapter answers, and closes if left meanwhile", async () => {
    const adapter = createMockBarcodeScannerAdapter();
    adapter.holdNextOpen();
    const { result, unmount } = await renderHook(
      () => useBarcodeScanner({ onScan: jest.fn() }),
      { wrapper: wrapperFor(adapter) },
    );
    await flush();
    expect(result.current.state).toBe("opening");
    await unmount();
    await act(async () => adapter.releaseOpen());
    await flush();
    expect(adapter.isOpen).toBe(false);
  });

  it("drives the software trigger only while open", async () => {
    const { adapter, result, rerender } = await setup({ enabled: false });
    expect(await codeOf(() => result.current.softwareTrigger(true))).toBe(
      "not-open",
    );
    await rerender({ enabled: true });
    await flush();
    expect(await codeOf(() => result.current.softwareTrigger(true))).toBe(
      "resolved",
    );
    await codeOf(() => result.current.softwareTrigger(false));
    expect(adapter.softwareTriggerCalls).toEqual([true, false]);
  });

  it("reports the hardware trigger", async () => {
    const { adapter, result } = await setup();
    await act(async () => adapter.pressTrigger());
    expect(result.current.isTriggerPressed).toBe(true);
    await act(async () => adapter.pressTrigger(false));
    expect(result.current.isTriggerPressed).toBe(false);
  });

  it("reads the scanner's identity when the adapter reports it", async () => {
    const { result } = await setup();
    let info: unknown;
    await act(async () => {
      info = await result.current.getScannerInfo();
    });
    expect(info).toEqual(expect.objectContaining({ model: "MOCK-1" }));
    const bare = await setup({}, { scannerInfo: null, softwareTrigger: false });
    expect(bare.result.current.capabilities).toMatchObject({
      softwareTrigger: false,
      scannerInfo: false,
    });
  });

  it("refuses a symbology the scanner cannot decode, and a negative interval", async () => {
    const adapter = createMockBarcodeScannerAdapter({ symbologies: ["qr"] });
    const silence = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      renderHook(
        () => useBarcodeScanner({ onScan: jest.fn(), symbologies: ["ean13"] }),
        { wrapper: wrapperFor(adapter) },
      ),
    ).rejects.toThrow(/the mock scanner cannot decode ean13; it takes qr/);
    await expect(
      renderHook(
        () => useBarcodeScanner({ onScan: jest.fn(), repeatInterval: -1 }),
        { wrapper: wrapperFor(adapter) },
      ),
    ).rejects.toThrow(RangeError);
    silence.mockRestore();
  });

  it("refuses an adapter written for another contract version", async () => {
    const { adapter, result } = await setup({}, { contractVersion: 0 });
    expect(result.current.isSupported).toBe(false);
    expect(result.current.error?.code).toBe("incompatible-adapter");
    expect(adapter.isOpen).toBe(false);
  });

  it("takes the same handler as the camera", () => {
    // A type check: one function serves a hardware scanner and CameraView.
    const onScan = (scan: BarcodeScan) => scan.data;
    const forCamera: CameraViewProps["onBarcodeScanned"] = onScan;
    const forScanner: BarcodeScannerOptions["onScan"] = onScan;
    expect([forCamera, forScanner]).toEqual([onScan, onScan]);
  });

  it("renders closed and unsupported on the server", () => {
    const adapter = createMockBarcodeScannerAdapter();
    let seen: unknown;
    function Probe() {
      const scanner = useBarcodeScanner({ onScan: () => {} });
      seen = {
        isSupported: scanner.isSupported,
        state: scanner.state,
        isActive: scanner.isActive,
      };
      return null;
    }
    renderToString(
      <DeviceAdaptersProvider adapters={{ barcodeScanner: adapter }}>
        <Probe />
      </DeviceAdaptersProvider>,
    );
    expect(seen).toEqual({
      isSupported: false,
      state: "closed",
      isActive: false,
    });
  });
});
