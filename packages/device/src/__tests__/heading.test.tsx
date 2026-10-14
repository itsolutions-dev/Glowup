import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AppState } from "react-native";

import { DeviceAdaptersProvider } from "..";
import { useHeading, type LocationAdapter } from "../location";
import {
  buildHeading,
  createMockLocationAdapter,
  type MockLocationAdapter,
  type MockLocationOptions,
} from "../testing";

jest.mock("expo-location", () => ({ LocationAccuracy: {} }));

// jest-expo's AppState.addEventListener is a jest.fn: swap it for one that
// lets the test move the app between states.
let appStateListeners: ((state: string) => void)[] = [];
const originalAddEventListener = AppState.addEventListener;
const originalCurrentState = AppState.currentState;

beforeEach(() => {
  appStateListeners = [];
  AppState.currentState = "active";
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
  AppState.currentState = originalCurrentState;
});

async function moveTo(...states: string[]) {
  for (const state of states) {
    await act(async () => appStateListeners.forEach((l) => l(state)));
  }
}

function wrapperFor(location: LocationAdapter) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <DeviceAdaptersProvider adapters={{ location }}>
        {children}
      </DeviceAdaptersProvider>
    );
  };
}

async function setup(options: MockLocationOptions = { permission: "granted" }) {
  const location = createMockLocationAdapter(options);
  const rendered = await renderHook(() => useHeading(), {
    wrapper: wrapperFor(location),
  });
  return { location, ...rendered };
}

const opened = (location: MockLocationAdapter) =>
  waitFor(() => expect(location.headingWatches).toBe(1));

describe("useHeading", () => {
  it("follows the heading once the permission is granted", async () => {
    const { location, result } = await setup();
    expect(result.current).toEqual({ heading: null, error: null });
    await opened(location);

    const north = buildHeading({ magneticHeading: 2, trueHeading: 4 });
    await act(async () => location.emitHeading(north));
    expect(result.current.heading).toEqual(north);
  });

  it("never prompts: without the permission it reports permission-denied", async () => {
    const { location, result } = await setup({ permission: "undetermined" });
    await waitFor(() =>
      expect(result.current.error?.code).toBe("permission-denied"),
    );
    expect(location.requestCount).toBe(0);
    expect(location.headingWatchesOpened).toBe(0);
  });

  it("does not need the location services", async () => {
    const { location } = await setup({
      permission: "granted",
      servicesEnabled: false,
    });
    await opened(location);
  });

  it("is unsupported where the adapter has no compass", async () => {
    const { result } = await setup({ permission: "granted", heading: false });
    await waitFor(() => expect(result.current.error?.code).toBe("unsupported"));
  });

  it("is unsupported where the adapter cannot locate at all", async () => {
    const { location, result } = await setup({
      permission: "granted",
      supported: false,
    });
    await waitFor(() => expect(result.current.error?.code).toBe("unsupported"));
    expect(location.headingWatchesOpened).toBe(0);
  });

  it("reads nothing while disabled", async () => {
    const location = createMockLocationAdapter({ permission: "granted" });
    const { result, rerender } = await renderHook(
      ({ enabled }: { enabled: boolean }) => useHeading({ enabled }),
      { initialProps: { enabled: false }, wrapper: wrapperFor(location) },
    );
    await act(async () => {});
    expect(location.headingWatchesOpened).toBe(0);
    expect(result.current.heading).toBeNull();
    await rerender({ enabled: true });
    await opened(location);
  });

  it("keeps one native watch for every reader, and closes it after the last", async () => {
    const location = createMockLocationAdapter({ permission: "granted" });
    const first = await renderHook(() => useHeading(), {
      wrapper: wrapperFor(location),
    });
    const second = await renderHook(() => useHeading(), {
      wrapper: wrapperFor(location),
    });
    await opened(location);
    expect(location.headingWatchesOpened).toBe(1);

    await act(async () => location.emitHeading({ magneticHeading: 90 }));
    expect(first.result.current.heading?.magneticHeading).toBe(90);
    expect(second.result.current.heading?.magneticHeading).toBe(90);

    await first.unmount();
    expect(location.headingWatches).toBe(1);
    await second.unmount();
    expect(location.headingWatches).toBe(0);
    expect(appStateListeners).toHaveLength(0);

    // A reader that comes back later does not get the old reading.
    const later = await renderHook(() => useHeading(), {
      wrapper: wrapperFor(location),
    });
    await opened(location);
    expect(later.result.current.heading).toBeNull();
  });

  it("opens nothing while the app starts in the background", async () => {
    AppState.currentState = "background";
    const { location } = await setup();
    await act(async () => {});
    expect(location.headingWatchesOpened).toBe(0);
    await moveTo("active");
    expect(location.headingWatches).toBe(1);
  });

  it("gives a reader that joins the latest heading at once", async () => {
    const location = createMockLocationAdapter({ permission: "granted" });
    await renderHook(() => useHeading(), { wrapper: wrapperFor(location) });
    await opened(location);
    await act(async () => location.emitHeading({ magneticHeading: 180 }));

    const late = await renderHook(() => useHeading(), {
      wrapper: wrapperFor(location),
    });
    await waitFor(() =>
      expect(late.result.current.heading?.magneticHeading).toBe(180),
    );
  });

  it("stops in the background, not on inactive, and resumes on return", async () => {
    const { location, result } = await setup();
    await opened(location);
    await act(async () => location.emitHeading({ magneticHeading: 10 }));

    await moveTo("inactive");
    expect(location.headingWatches).toBe(1);

    await moveTo("background");
    expect(location.headingWatches).toBe(0);
    await moveTo("active");
    expect(location.headingWatches).toBe(1);
    expect(location.headingWatchesOpened).toBe(2);
    // The reading from before the pause is not handed to a new reader.
    const late = await renderHook(() => useHeading(), {
      wrapper: wrapperFor(location),
    });
    await act(async () => {});
    expect(late.result.current.heading).toBeNull();
    expect(result.current.heading?.magneticHeading).toBe(10);
  });

  it("tells every reader about a failure, and does not reopen on its own", async () => {
    const location = createMockLocationAdapter({ permission: "granted" });
    const first = await renderHook(() => useHeading(), {
      wrapper: wrapperFor(location),
    });
    await opened(location);
    await act(async () => location.emitHeading());
    await act(async () => location.failHeading("unavailable"));
    expect(first.result.current).toMatchObject({
      heading: null,
      error: { code: "unavailable" },
    });
    expect(location.headingWatches).toBe(0);

    // A trip to the background and back does not retry it.
    await moveTo("background", "active");
    expect(location.headingWatchesOpened).toBe(1);

    // A new reader does.
    await renderHook(() => useHeading(), { wrapper: wrapperFor(location) });
    await opened(location);
    expect(location.headingWatchesOpened).toBe(2);
    await act(async () => location.emitHeading({ magneticHeading: 1 }));
    expect(first.result.current).toMatchObject({
      heading: { magneticHeading: 1 },
      error: null,
    });
  });

  it("gives a reader after a failure nothing from before it", async () => {
    const { location } = await setup();
    await opened(location);
    await act(async () => location.emitHeading());
    await act(async () => location.failHeading("unavailable"));

    const late = await renderHook(() => useHeading(), {
      wrapper: wrapperFor(location),
    });
    await opened(location);
    expect(late.result.current.heading).toBeNull();
  });

  it("opens nothing when unmounted before the permission answered", async () => {
    const location = createMockLocationAdapter({ permission: "granted" });
    let resolve!: () => void;
    jest.spyOn(location, "getPermission").mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = () =>
            done({
              status: "granted",
              canAskAgain: false,
              precision: "precise",
            });
        }),
    );
    const { unmount } = await renderHook(() => useHeading(), {
      wrapper: wrapperFor(location),
    });
    await unmount();
    await act(async () => resolve());
    expect(location.headingWatchesOpened).toBe(0);
  });
});
