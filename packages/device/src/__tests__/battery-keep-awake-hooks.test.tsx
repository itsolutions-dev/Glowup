import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { DeviceAdaptersProvider, type DeviceAdapters } from "..";
import { useBattery } from "../battery";
import { useKeepAwake, useKeepAwakeSupport } from "../keep-awake";
import {
  createMockBatteryAdapter,
  createMockKeepAwakeAdapter,
  MOCK_BATTERY,
} from "../testing";

// Only for the module-level defaults; every test injects a mock adapter.
jest.mock("expo-battery", () => ({ BatteryState: {} }));
jest.mock("expo-keep-awake", () => ({}));

function wrapperFor(adapters: Partial<DeviceAdapters>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <DeviceAdaptersProvider adapters={adapters}>
        {children}
      </DeviceAdaptersProvider>
    );
  };
}

describe("useBattery", () => {
  it("loads, then reports the status", async () => {
    const battery = createMockBatteryAdapter();
    const { result } = await renderHook(() => useBattery(), {
      wrapper: wrapperFor({ battery }),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject(MOCK_BATTERY);
  });

  it("follows the platform's changes", async () => {
    const battery = createMockBatteryAdapter();
    const { result } = await renderHook(() => useBattery(), {
      wrapper: wrapperFor({ battery }),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () =>
      battery.setStatus({ level: 0.05, lowPowerMode: true }),
    );
    expect(result.current).toMatchObject({ level: 0.05, lowPowerMode: true });
  });

  it("shares one platform subscription and closes it with the last listener", async () => {
    const battery = createMockBatteryAdapter();
    const wrapper = wrapperFor({ battery });
    const first = await renderHook(() => useBattery(), { wrapper });
    const second = await renderHook(() => useBattery(), { wrapper });
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));
    expect(battery.subscriberCount).toBe(1);
    await first.unmount();
    expect(battery.subscriberCount).toBe(1);
    await second.unmount();
    expect(battery.subscriberCount).toBe(0);
  });

  it("reports no battery where the adapter is unsupported", async () => {
    const battery = createMockBatteryAdapter();
    battery.isSupported = () => false;
    const { result } = await renderHook(() => useBattery(), {
      wrapper: wrapperFor({ battery }),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject({ isAvailable: false, level: null });
    expect(battery.subscriberCount).toBe(0);
  });
});

describe("useKeepAwake", () => {
  it("holds the screen on while mounted", async () => {
    const keepAwake = createMockKeepAwakeAdapter();
    const { unmount } = await renderHook(() => useKeepAwake(), {
      wrapper: wrapperFor({ keepAwake }),
    });
    expect(keepAwake.isAwake).toBe(true);
    await unmount();
    expect(keepAwake.isAwake).toBe(false);
  });

  it("follows enabled", async () => {
    const keepAwake = createMockKeepAwakeAdapter();
    const { rerender } = await renderHook(
      ({ enabled }: { enabled: boolean }) => useKeepAwake({ enabled }),
      { wrapper: wrapperFor({ keepAwake }), initialProps: { enabled: false } },
    );
    expect(keepAwake.isAwake).toBe(false);
    await rerender({ enabled: true });
    expect(keepAwake.isAwake).toBe(true);
    await rerender({ enabled: false });
    expect(keepAwake.isAwake).toBe(false);
  });

  it("gives each holder its own tag, so the last one decides", async () => {
    const keepAwake = createMockKeepAwakeAdapter();
    const wrapper = wrapperFor({ keepAwake });
    const first = await renderHook(() => useKeepAwake(), { wrapper });
    const second = await renderHook(() => useKeepAwake(), { wrapper });
    expect(keepAwake.activeTags).toHaveLength(2);
    expect(new Set(keepAwake.activeTags).size).toBe(2);
    await first.unmount();
    expect(keepAwake.isAwake).toBe(true);
    await second.unmount();
    expect(keepAwake.isAwake).toBe(false);
  });

  it("does nothing where unsupported, and says so", async () => {
    const keepAwake = createMockKeepAwakeAdapter({ supported: false });
    const activate = jest.spyOn(keepAwake, "activate");
    const { result } = await renderHook(
      () => {
        useKeepAwake();
        return useKeepAwakeSupport();
      },
      { wrapper: wrapperFor({ keepAwake }) },
    );
    expect(result.current).toBe(false);
    expect(activate).not.toHaveBeenCalled();
  });

  it("survives a failing activation", async () => {
    const keepAwake = createMockKeepAwakeAdapter();
    keepAwake.activate = () => Promise.reject(new Error("NotAllowedError"));
    await expect(
      renderHook(() => useKeepAwake(), { wrapper: wrapperFor({ keepAwake }) }),
    ).resolves.toBeDefined();
  });
});
