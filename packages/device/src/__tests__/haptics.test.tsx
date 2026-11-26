import { act, renderHook } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import { Platform } from "react-native";
import { renderToString } from "react-dom/server";

import { DeviceAdaptersProvider } from "..";
import {
  expoHapticsAdapter,
  hapticFeedback,
  useHaptics,
  type HapticsAdapter,
} from "../haptics";
import { createMockHapticsAdapter } from "../testing";

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
  AndroidHaptics: {
    Virtual_Key: "virtual-key",
    Context_Click: "context-click",
    Clock_Tick: "clock-tick",
    Long_Press: "long-press",
  },
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  selectionAsync: jest.fn(async () => {}),
  performAndroidHapticsAsync: jest.fn(async () => {}),
}));

const haptics = jest.mocked(Haptics);
const originalOS = Platform.OS;

beforeEach(() => jest.clearAllMocks());
afterEach(() => {
  Platform.OS = originalOS;
});

function wrapperFor(adapter: HapticsAdapter) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <DeviceAdaptersProvider adapters={{ haptics: adapter }}>
        {children}
      </DeviceAdaptersProvider>
    );
  };
}

describe("expoHapticsAdapter", () => {
  it("maps impacts and notifications", async () => {
    await expoHapticsAdapter.impact("heavy");
    await expoHapticsAdapter.notification("warning");
    await expoHapticsAdapter.selection();
    expect(haptics.impactAsync).toHaveBeenCalledWith("heavy");
    expect(haptics.notificationAsync).toHaveBeenCalledWith("warning");
    expect(haptics.selectionAsync).toHaveBeenCalled();
  });

  it("answers interactions on iOS with impacts and selection", async () => {
    Platform.OS = "ios";
    for (const kind of ["press", "toggle", "selection", "longPress"] as const) {
      await expoHapticsAdapter.interaction(kind);
    }
    expect(haptics.impactAsync.mock.calls).toEqual([
      ["light"],
      ["light"],
      ["medium"],
    ]);
    expect(haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(haptics.performAndroidHapticsAsync).not.toHaveBeenCalled();
  });

  it("answers interactions on Android through performHapticFeedback", async () => {
    Platform.OS = "android";
    for (const kind of ["press", "toggle", "selection", "longPress"] as const) {
      await expoHapticsAdapter.interaction(kind);
    }
    expect(haptics.performAndroidHapticsAsync.mock.calls).toEqual([
      ["virtual-key"],
      ["context-click"],
      ["clock-tick"],
      ["long-press"],
    ]);
    // The Vibrator ignores the user's touch feedback setting: never used here.
    expect(haptics.impactAsync).not.toHaveBeenCalled();
    expect(haptics.selectionAsync).not.toHaveBeenCalled();
  });
});

describe("useHaptics", () => {
  it("plays through the provided adapter, light impact by default", async () => {
    const adapter = createMockHapticsAdapter();
    const { result } = await renderHook(() => useHaptics(), {
      wrapper: wrapperFor(adapter),
    });
    expect(result.current.isSupported).toBe(true);
    await act(async () => {
      await result.current.impact();
      await result.current.notification("success");
      await result.current.selection();
      await result.current.interaction("toggle");
    });
    expect(adapter.events).toEqual([
      { type: "impact", style: "light" },
      { type: "notification", feedback: "success" },
      { type: "selection" },
      { type: "interaction", kind: "toggle" },
    ]);
  });

  it("does nothing where unsupported", async () => {
    const adapter = createMockHapticsAdapter({ supported: false });
    const { result } = await renderHook(() => useHaptics(), {
      wrapper: wrapperFor(adapter),
    });
    expect(result.current.isSupported).toBe(false);
    await act(() => result.current.interaction("press"));
    expect(adapter.events).toEqual([]);
  });

  it("never rejects", async () => {
    const adapter = createMockHapticsAdapter();
    adapter.impact = () => Promise.reject(new Error("no activity"));
    const { result } = await renderHook(() => useHaptics(), {
      wrapper: wrapperFor(adapter),
    });
    await expect(result.current.impact("heavy")).resolves.toBeUndefined();
  });

  it("keeps its functions across renders", async () => {
    const adapter = createMockHapticsAdapter();
    const { result, rerender } = await renderHook(() => useHaptics(), {
      wrapper: wrapperFor(adapter),
    });
    const first = result.current.interaction;
    await rerender({});
    expect(result.current.interaction).toBe(first);
  });

  it("reports unsupported in the static export", () => {
    const adapter = createMockHapticsAdapter();
    function Probe() {
      return <>{String(useHaptics().isSupported)}</>;
    }
    const html = renderToString(
      <DeviceAdaptersProvider adapters={{ haptics: adapter }}>
        <Probe />
      </DeviceAdaptersProvider>,
    );
    expect(html).toBe("false");
  });
});

describe("hapticFeedback", () => {
  it("answers an interaction on the default adapter, quietly", async () => {
    haptics.impactAsync.mockRejectedValueOnce(new Error("unavailable"));
    expect(() => hapticFeedback("press")).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));
    expect(haptics.impactAsync).toHaveBeenCalledWith("light");
  });
});
