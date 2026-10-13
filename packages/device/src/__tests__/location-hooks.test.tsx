import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AppState } from "react-native";

import { DeviceAdaptersProvider } from "..";
import {
  LocationError,
  useCurrentPosition,
  useLocationPermission,
  useWatchPosition,
  type LocationAdapter,
} from "../location";
import {
  buildPosition,
  createMockLocationAdapter,
  type MockLocationAdapter,
} from "../testing";

// Only for the module-level default; every test injects a mock adapter.
jest.mock("expo-location", () => ({
  LocationAccuracy: { Low: 2, Balanced: 3, High: 4, Highest: 5 },
}));

function wrapperFor(location: LocationAdapter) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <DeviceAdaptersProvider adapters={{ location }}>
        {children}
      </DeviceAdaptersProvider>
    );
  };
}

let adapter: MockLocationAdapter;
beforeEach(() => {
  adapter = createMockLocationAdapter();
});

describe("useLocationPermission", () => {
  it("loads, then reports the state", async () => {
    adapter.setPermission("granted", { precision: "approximate" });
    const { result } = await renderHook(() => useLocationPermission(), {
      wrapper: wrapperFor(adapter),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject({
      status: "granted",
      precision: "approximate",
      canAskAgain: false,
    });
  });

  it("shares a request between every component", async () => {
    const wrapper = wrapperFor(adapter);
    const first = await renderHook(() => useLocationPermission(), { wrapper });
    const second = await renderHook(() => useLocationPermission(), { wrapper });
    await waitFor(() =>
      expect(second.result.current.status).toBe("undetermined"),
    );
    await act(async () => {
      await first.result.current.request();
    });
    expect(adapter.requestCount).toBe(1);
    expect(second.result.current).toMatchObject({
      status: "granted",
      precision: "precise",
    });
  });

  it("re-reads when the app returns to the foreground", async () => {
    const addEventListener = jest.mocked(AppState.addEventListener);
    addEventListener.mockClear();
    const { result } = await renderHook(() => useLocationPermission(), {
      wrapper: wrapperFor(adapter),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    adapter.setPermission("denied"); // changed in the system settings
    const listeners = addEventListener.mock.calls.map(
      ([, listener]) => listener,
    );
    await act(async () => listeners.forEach((listener) => listener("active")));
    await waitFor(() => expect(result.current.status).toBe("denied"));
  });

  it("reports unsupported without asking the adapter", async () => {
    const unsupported = createMockLocationAdapter({ supported: false });
    const getPermission = jest.spyOn(unsupported, "getPermission");
    const { result } = await renderHook(() => useLocationPermission(), {
      wrapper: wrapperFor(unsupported),
    });
    await waitFor(() => expect(result.current.status).toBe("unsupported"));
    expect(getPermission).not.toHaveBeenCalled();
  });
});

describe("useCurrentPosition", () => {
  const render = async (options?: Parameters<typeof useCurrentPosition>[0]) =>
    renderHook(() => useCurrentPosition(options), {
      wrapper: wrapperFor(adapter),
    });

  it("reads a position once granted", async () => {
    adapter.setPermission("granted");
    const fix = buildPosition({ latitude: 45.46 });
    adapter.setPosition(fix);
    const { result } = await render();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.position).toBe(fix);
    expect(result.current.error).toBeNull();
  });

  it("never prompts: an unasked permission is an error", async () => {
    const { result } = await render();
    await waitFor(() =>
      expect(result.current.error?.code).toBe("permission-denied"),
    );
    expect(adapter.requestCount).toBe(0);
  });

  it("tells disabled location services apart", async () => {
    adapter.setPermission("granted");
    adapter.setServicesEnabled(false);
    const { result } = await render();
    await waitFor(() =>
      expect(result.current.error?.code).toBe("services-disabled"),
    );
  });

  it("serves a recent cached fix when maxAge allows it", async () => {
    adapter.setPermission("granted");
    const cached = buildPosition({}, Date.now() - 30000);
    adapter.setLastKnown(cached);
    adapter.setPosition("pending");
    const { result } = await render({ maxAge: 60000 });
    await waitFor(() => expect(result.current.position).toBe(cached));
  });

  it("skips a cached fix older than maxAge", async () => {
    adapter.setPermission("granted");
    adapter.setLastKnown(buildPosition({}, Date.now() - 120000));
    const fresh = buildPosition({ latitude: 1 });
    adapter.setPosition(fresh);
    const { result } = await render({ maxAge: 60000 });
    await waitFor(() => expect(result.current.position).toBe(fresh));
  });

  it("falls back to a fresh read when the cache fails", async () => {
    adapter.setPermission("granted");
    jest
      .spyOn(adapter, "getLastKnownPosition")
      .mockRejectedValue(new LocationError("unavailable"));
    const fresh = buildPosition({ latitude: 2 });
    adapter.setPosition(fresh);
    const { result } = await render({ maxAge: 60000 });
    await waitFor(() => expect(result.current.position).toBe(fresh));
  });

  it("times out", async () => {
    adapter.setPermission("granted");
    adapter.setPosition("pending");
    const { result } = await render({ timeout: 50 });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.error?.code).toBe("timeout"));
    expect(result.current.isLoading).toBe(false);
  });

  it("keeps the last fix when a later read fails", async () => {
    adapter.setPermission("granted");
    const fix = buildPosition();
    adapter.setPosition(fix);
    const { result } = await render();
    await waitFor(() => expect(result.current.position).toBe(fix));
    adapter.setPosition(new LocationError("unavailable"));
    await act(async () => result.current.refresh());
    await waitFor(() => expect(result.current.error?.code).toBe("unavailable"));
    expect(result.current.position).toBe(fix);
  });

  it("reads only on refresh() when disabled", async () => {
    adapter.setPermission("granted");
    const getCurrentPosition = jest.spyOn(adapter, "getCurrentPosition");
    const { result } = await render({ enabled: false });
    expect(result.current.isLoading).toBe(false);
    expect(getCurrentPosition).not.toHaveBeenCalled();
    await act(async () => result.current.refresh());
    await waitFor(() => expect(result.current.position).not.toBeNull());
  });

  it("wraps a foreign adapter error", async () => {
    adapter.setPermission("granted");
    jest
      .spyOn(adapter, "getCurrentPosition")
      .mockRejectedValue(new Error("boom"));
    const { result } = await render();
    await waitFor(() =>
      expect(result.current.error).toMatchObject({
        name: "LocationError",
        code: "unavailable",
        message: "boom",
      }),
    );
  });
});

describe("useWatchPosition", () => {
  it("watches with the options and follows the fixes", async () => {
    adapter.setPermission("granted");
    const { result, unmount } = await renderHook(
      () => useWatchPosition({ accuracy: "high", distanceInterval: 25 }),
      { wrapper: wrapperFor(adapter) },
    );
    await waitFor(() => expect(adapter.watches).toHaveLength(1));
    expect(adapter.watches[0]).toEqual({
      accuracy: "high",
      distanceInterval: 25,
      timeInterval: undefined,
    });
    const fix = buildPosition({ latitude: 10 });
    await act(async () => adapter.emit(fix));
    expect(result.current.position).toBe(fix);
    await act(async () => adapter.fail("unavailable"));
    expect(result.current.error?.code).toBe("unavailable");
    await act(async () => adapter.emit(buildPosition()));
    expect(result.current.error).toBeNull();
    await unmount();
    expect(adapter.watches).toHaveLength(0);
  });

  it("does not watch without the permission", async () => {
    const { result } = await renderHook(() => useWatchPosition(), {
      wrapper: wrapperFor(adapter),
    });
    await waitFor(() =>
      expect(result.current.error?.code).toBe("permission-denied"),
    );
    expect(adapter.watches).toHaveLength(0);
    expect(adapter.requestCount).toBe(0);
  });

  it("starts and stops with enabled", async () => {
    adapter.setPermission("granted");
    const { rerender } = await renderHook(
      ({ enabled }: { enabled: boolean }) => useWatchPosition({ enabled }),
      { wrapper: wrapperFor(adapter), initialProps: { enabled: false } },
    );
    expect(adapter.watches).toHaveLength(0);
    await rerender({ enabled: true });
    await waitFor(() => expect(adapter.watches).toHaveLength(1));
    await rerender({ enabled: false });
    expect(adapter.watches).toHaveLength(0);
  });
});
