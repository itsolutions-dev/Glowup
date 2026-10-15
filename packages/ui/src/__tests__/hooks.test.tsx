import { act, renderHook } from "@testing-library/react-native";
import { Dimensions } from "react-native";

import {
  SIZE_CLASSES,
  sizeClassFor,
  useBreakpoint,
  useDebouncedCallback,
  useDebouncedValue,
  useReduceMotion,
} from "..";

describe("useDebouncedValue", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("returns the first value at once and follows changes after the delay", async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 300),
      { initialProps: { value: "a" } },
    );
    expect(result.current).toBe("a");

    await rerender({ value: "ab" });
    expect(result.current).toBe("a");
    await act(async () => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe("a");
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe("ab");
  });

  it("restarts the wait on every change and settles on the last value", async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 300),
      { initialProps: { value: "a" } },
    );
    await rerender({ value: "ab" });
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    await rerender({ value: "abc" });
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe("a");
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe("abc");
  });
});

describe("useDebouncedCallback", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("calls once, with the last arguments, after the delay", async () => {
    const fn = jest.fn();
    const { result } = await renderHook(() => useDebouncedCallback(fn, 600));
    result.current("a");
    result.current("b");
    expect(fn).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("b");
  });

  it("cancel drops the pending call", async () => {
    const fn = jest.fn();
    const { result } = await renderHook(() => useDebouncedCallback(fn, 600));
    result.current("a");
    result.current.cancel();
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it("flush runs the pending call now, and only once", async () => {
    const fn = jest.fn();
    const { result } = await renderHook(() => useDebouncedCallback(fn, 600));
    result.current("a");
    result.current.flush();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a");
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("flush with nothing pending does nothing", async () => {
    const fn = jest.fn();
    const { result } = await renderHook(() => useDebouncedCallback(fn, 600));
    result.current.flush();
    expect(fn).not.toHaveBeenCalled();
  });

  it("keeps one identity across renders and calls the latest function", async () => {
    const first = jest.fn();
    const second = jest.fn();
    const { result, rerender } = await renderHook(
      ({ fn }: { fn: () => void }) => useDebouncedCallback(fn, 600),
      { initialProps: { fn: first } },
    );
    const debounced = result.current;
    debounced();
    await rerender({ fn: second });
    expect(result.current).toBe(debounced);
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("drops the pending call when the component unmounts", async () => {
    const fn = jest.fn();
    const { result, unmount } = await renderHook(() =>
      useDebouncedCallback(fn, 600),
    );
    result.current("a");
    await unmount();
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("sizeClassFor", () => {
  it.each([
    [0, "compact"],
    [599, "compact"],
    [600, "medium"],
    [839, "medium"],
    [840, "expanded"],
    [1199, "expanded"],
    [1200, "large"],
    [1599, "large"],
    [1600, "extraLarge"],
    [4000, "extraLarge"],
  ])("a %i dp wide window is %s", (width, expected) => {
    expect(sizeClassFor(width)).toBe(expected);
  });

  it("takes thresholds from the app", async () => {
    expect(sizeClassFor(1250, { ...SIZE_CLASSES, large: 1300 })).toBe(
      "expanded",
    );
    expect(sizeClassFor(1300, { ...SIZE_CLASSES, large: 1300 })).toBe("large");
  });
});

describe("useBreakpoint", () => {
  const setWidth = (width: number) =>
    act(async () => {
      Dimensions.set({
        window: { width, height: 800, scale: 1, fontScale: 1 },
        screen: { width, height: 800, scale: 1, fontScale: 1 },
      });
    });

  afterEach(() => setWidth(750));

  it("reports the size class and the width of the window", async () => {
    await setWidth(700);
    const { result } = await renderHook(() => useBreakpoint());
    expect(result.current.width).toBe(700);
    expect(result.current.sizeClass).toBe("medium");
  });

  it("atLeast reads the way the docs do", async () => {
    await setWidth(900);
    const { result } = await renderHook(() => useBreakpoint());
    expect(result.current.atLeast("compact")).toBe(true);
    expect(result.current.atLeast("expanded")).toBe(true);
    expect(result.current.atLeast("large")).toBe(false);
  });

  it("follows the window live", async () => {
    await setWidth(500);
    const { result } = await renderHook(() => useBreakpoint());
    expect(result.current.sizeClass).toBe("compact");
    await setWidth(1300);
    expect(result.current.sizeClass).toBe("large");
  });

  it("takes custom thresholds", async () => {
    await setWidth(1250);
    const { result } = await renderHook(() => useBreakpoint({ large: 1300 }));
    expect(result.current.sizeClass).toBe("expanded");
    expect(result.current.atLeast("large")).toBe(false);
  });
});

it("exports useReduceMotion", async () => {
  expect(typeof useReduceMotion).toBe("function");
});
