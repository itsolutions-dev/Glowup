import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { DeviceAdaptersProvider } from "..";
import {
  useOrientation,
  useOrientationLock,
  useOrientationLockSupport,
  type OrientationAdapter,
  type OrientationLock,
} from "../orientation";
import {
  createMockOrientationAdapter,
  type MockOrientationAdapter,
} from "../testing";
import { createLockStack } from "../orientation/lockStack";

// Only for the module-level default; every test injects a mock adapter.
jest.mock("expo-screen-orientation", () => ({
  Orientation: {},
  OrientationLock: {},
}));

function wrapperFor(orientation: OrientationAdapter) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <DeviceAdaptersProvider adapters={{ orientation }}>
        {children}
      </DeviceAdaptersProvider>
    );
  };
}

// Lock calls run on a promise queue: let it drain.
const settle = () => act(async () => {});

let adapter: MockOrientationAdapter;
beforeEach(() => {
  adapter = createMockOrientationAdapter();
});

describe("useOrientation", () => {
  it("loads, then reports the orientation", async () => {
    const { result } = await renderHook(() => useOrientation(), {
      wrapper: wrapperFor(adapter),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toEqual({
      orientation: "portrait-up",
      isLandscape: false,
      isLoading: false,
    });
  });

  it("follows rotations through one shared subscription", async () => {
    const wrapper = wrapperFor(adapter);
    const first = await renderHook(() => useOrientation(), { wrapper });
    const second = await renderHook(() => useOrientation(), { wrapper });
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));
    expect(adapter.subscriberCount).toBe(1);
    await act(async () => adapter.setOrientation("landscape-right"));
    expect(first.result.current).toMatchObject({
      orientation: "landscape-right",
      isLandscape: true,
    });
    await first.unmount();
    await second.unmount();
    expect(adapter.subscriberCount).toBe(0);
  });

  it("reports an unknown orientation as neither", async () => {
    adapter.setOrientation("unknown");
    const { result } = await renderHook(() => useOrientation(), {
      wrapper: wrapperFor(adapter),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isLandscape).toBeNull();
  });
});

describe("useOrientationLock", () => {
  function renderLock(lock: OrientationLock, options?: { enabled?: boolean }) {
    return renderHook(
      (props: { lock: OrientationLock; enabled?: boolean }) =>
        useOrientationLock(props.lock, { enabled: props.enabled }),
      {
        wrapper: wrapperFor(adapter),
        initialProps: { lock, enabled: options?.enabled },
      },
    );
  }

  it("locks while mounted and gives the orientation back on unmount", async () => {
    const { result, unmount } = await renderLock("landscape");
    await settle();
    expect(adapter.currentLock).toBe("landscape");
    expect(result.current).toEqual({ isActive: true, error: null });
    await unmount();
    await settle();
    expect(adapter.currentLock).toBeNull();
    expect(adapter.calls).toEqual(["landscape", "unlock"]);
  });

  it("lets the most recent lock win and brings the previous one back", async () => {
    const outer = await renderLock("portrait");
    const inner = await renderLock("landscape-left");
    await settle();
    expect(adapter.currentLock).toBe("landscape-left");
    expect(outer.result.current.isActive).toBe(false);
    expect(inner.result.current.isActive).toBe(true);
    await inner.unmount();
    await settle();
    expect(adapter.currentLock).toBe("portrait");
    expect(outer.result.current.isActive).toBe(true);
    // Back to the outer lock directly: no unlock in between.
    expect(adapter.calls).not.toContain("unlock");
  });

  it("replaces a lock in one commit without unlocking in between", async () => {
    // One screen replacing another: the old lock's cleanup and the new lock
    // run in the same commit, and the queue sees only the final state.
    const { rerender } = await renderLock("landscape");
    await settle();
    await rerender({ lock: "portrait" });
    await settle();
    expect(adapter.currentLock).toBe("portrait");
    expect(adapter.calls).toEqual(["landscape", "portrait"]);
  });

  it("does not re-lock for an equal lock", async () => {
    await renderLock("portrait");
    await renderLock("portrait");
    await settle();
    expect(adapter.calls).toEqual(["portrait"]);
  });

  it("follows enabled and a changed lock", async () => {
    const { rerender, result } = await renderLock("portrait", {
      enabled: false,
    });
    await settle();
    expect(adapter.calls).toEqual([]);
    expect(result.current.isActive).toBe(false);
    await rerender({ lock: "portrait", enabled: true });
    await settle();
    expect(adapter.currentLock).toBe("portrait");
    await rerender({ lock: "landscape", enabled: true });
    await settle();
    expect(adapter.currentLock).toBe("landscape");
    await rerender({ lock: "landscape", enabled: false });
    await settle();
    expect(adapter.currentLock).toBeNull();
  });

  it("reports a refused lock in error, never throws", async () => {
    adapter = createMockOrientationAdapter({ lockable: false });
    const { result, unmount } = await renderLock("landscape");
    await settle();
    expect(result.current.isActive).toBe(false);
    expect(result.current.error).toMatchObject({ code: "unsupported" });
    await unmount();
    await settle();
    // The platform's state is unknown after a failure: unlock anyway.
    expect(adapter.calls).toEqual(["landscape", "unlock"]);
  });

  it("says whether a lock can work here", async () => {
    adapter = createMockOrientationAdapter({ lockable: false });
    const { result } = await renderHook(() => useOrientationLockSupport(), {
      wrapper: wrapperFor(adapter),
    });
    expect(result.current).toBe(false);
  });
});

describe("createLockStack", () => {
  const drain = () => new Promise((resolve) => setImmediate(resolve));

  it("runs against the stack as it is when the queue gets to it", async () => {
    const stack = createLockStack(adapter);
    stack.set("outer", "portrait");
    stack.set("inner", "landscape");
    stack.remove("inner");
    await drain();
    expect(adapter.calls).toEqual(["portrait"]);
    expect(stack.getState("outer")).toEqual({ isActive: true, error: null });
    expect(stack.getState("inner")).toEqual({ isActive: false, error: null });
  });

  it("never unlocks what it never locked", async () => {
    const stack = createLockStack(adapter);
    stack.set("a", "portrait");
    stack.remove("a");
    await drain();
    expect(adapter.calls).toEqual([]);
  });
});
