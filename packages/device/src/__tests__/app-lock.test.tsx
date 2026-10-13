import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AppState } from "react-native";
import { renderToString } from "react-dom/server";

import { DeviceAdaptersProvider } from "..";
import {
  useAppLock,
  type AppLockOptions,
  type BiometricsAdapter,
} from "../biometrics";
import {
  createMockBiometricsAdapter,
  type MockBiometricsOptions,
} from "../testing";

jest.mock("expo-local-authentication", () => ({ SecurityLevel: { NONE: 0 } }));

const PROMPT = { promptMessage: "Sblocca", cancelLabel: "Annulla" };

// jest-expo's AppState.addEventListener is a jest.fn: swap it for one that
// lets the test move the app between states.
let appStateListeners: ((state: string) => void)[] = [];
const removed = jest.fn();
const originalAddEventListener = AppState.addEventListener;
const originalCurrentState = AppState.currentState;

beforeEach(() => {
  appStateListeners = [];
  removed.mockClear();
  AppState.currentState = "active";
  AppState.addEventListener = ((_type: string, listener: never) => {
    appStateListeners.push(listener);
    return {
      remove: () => {
        removed();
        appStateListeners = appStateListeners.filter((l) => l !== listener);
      },
    };
  }) as never;
});

afterEach(() => {
  AppState.addEventListener = originalAddEventListener;
  AppState.currentState = originalCurrentState;
  jest.restoreAllMocks();
});

async function moveTo(...states: string[]) {
  for (const state of states) {
    await act(async () => appStateListeners.forEach((l) => l(state)));
  }
}

function wrapperFor(adapter: BiometricsAdapter) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <DeviceAdaptersProvider adapters={{ biometrics: adapter }}>
        {children}
      </DeviceAdaptersProvider>
    );
  };
}

async function setup(
  options: Partial<AppLockOptions> = {},
  mock: MockBiometricsOptions = {},
) {
  const biometrics = createMockBiometricsAdapter(mock);
  const hook = await renderHook(
    (props: Partial<AppLockOptions>) =>
      useAppLock({ prompt: PROMPT, ...options, ...props }),
    { wrapper: wrapperFor(biometrics), initialProps: {} },
  );
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return { biometrics, ...hook };
}

it("starts locked and opens on a successful prompt", async () => {
  const { result, biometrics } = await setup();
  expect(result.current).toMatchObject({ isLocked: true, isLockable: true });
  const outcome = await act(() => result.current.unlock());
  expect(outcome).toEqual({ success: true });
  expect(result.current.isLocked).toBe(false);
  expect(biometrics.calls).toEqual([PROMPT]);
});

it("stays locked when the prompt is cancelled", async () => {
  const { result } = await setup(
    {},
    { result: { success: false, error: "cancelled" } },
  );
  const outcome = await act(() => result.current.unlock());
  expect(outcome).toEqual({ success: false, error: "cancelled" });
  expect(result.current.isLocked).toBe(true);
});

it("is shared by every component", async () => {
  const biometrics = createMockBiometricsAdapter();
  const wrapper = wrapperFor(biometrics);
  const a = await renderHook(() => useAppLock({ prompt: PROMPT }), {
    wrapper,
  });
  const b = await renderHook(() => useAppLock({ prompt: PROMPT }), {
    wrapper,
  });
  await waitFor(() => expect(b.result.current.isLoading).toBe(false));
  await act(() => a.result.current.unlock());
  expect(b.result.current.isLocked).toBe(false);
  await act(async () => b.result.current.lock());
  expect(a.result.current.isLocked).toBe(true);
});

it("locks again as soon as the app leaves, by default", async () => {
  const { result } = await setup();
  await act(() => result.current.unlock());
  await moveTo("background", "active");
  expect(result.current.isLocked).toBe(true);
});

it("ignores inactive: Face ID's own prompt goes through it", async () => {
  const { result } = await setup();
  await act(() => result.current.unlock());
  await moveTo("inactive", "active");
  expect(result.current.isLocked).toBe(false);
});

it("waits relockAfter in the background before locking", async () => {
  const now = jest.spyOn(Date, "now").mockReturnValue(1_000);
  const { result } = await setup({ relockAfter: 60_000 });
  await act(() => result.current.unlock());

  await moveTo("background");
  now.mockReturnValue(30_000);
  await moveTo("active");
  expect(result.current.isLocked).toBe(false);

  await moveTo("background");
  now.mockReturnValue(30_000 + 60_000);
  await moveTo("active");
  expect(result.current.isLocked).toBe(true);
});

it("does not count a trip to the background a prompt caused", async () => {
  const { result, biometrics } = await setup({}, { manual: true });
  let pending!: Promise<unknown>;
  await act(async () => {
    pending = result.current.unlock();
  });
  // Android pauses the activity behind the device-credential screen, and
  // delivers its result before resuming it.
  await moveTo("background");
  await act(async () => biometrics.resolve());
  await expect(pending).resolves.toEqual({ success: true });
  await moveTo("active");
  expect(result.current.isLocked).toBe(false);
});

it("never locks while disabled, and unlock still prompts", async () => {
  const { result, biometrics, rerender } = await setup({ enabled: false });
  expect(result.current.isLocked).toBe(false);

  // Enabling it from a settings screen: confirm with a prompt first.
  await act(() => result.current.unlock());
  expect(biometrics.calls).toHaveLength(1);
  // A trip while disabled does not lock it behind the user's back.
  await moveTo("background", "active");
  await rerender({ enabled: true });
  expect(result.current.isLocked).toBe(false);
});

it("opens on a device with nothing to authenticate with, by default", async () => {
  const { result } = await setup(
    {},
    { status: { level: "none", isEnrolled: false } },
  );
  expect(result.current).toMatchObject({
    isLocked: false,
    isLockable: false,
  });
});

it("stays shut there with stay-locked", async () => {
  const { result } = await setup(
    { whenUnavailable: "stay-locked" },
    { status: { level: "none", isEnrolled: false } },
  );
  expect(result.current).toMatchObject({ isLocked: true, isLockable: false });
});

it("needs enrolled biometrics when the prompt has no fallback", async () => {
  const { result } = await setup(
    { prompt: { ...PROMPT, fallback: "none" } },
    { status: { level: "passcode", isEnrolled: false } },
  );
  expect(result.current.isLockable).toBe(false);

  const withPasscode = await setup(
    {},
    { status: { level: "passcode", isEnrolled: false } },
  );
  expect(withPasscode.result.current.isLockable).toBe(true);
});

it("is locked while the status loads", async () => {
  const biometrics = createMockBiometricsAdapter({
    status: { level: "none" },
  });
  const renders: { isLocked: boolean; isLoading: boolean }[] = [];
  const { result } = await renderHook(
    () => {
      const lock = useAppLock({ prompt: PROMPT });
      renders.push({ isLocked: lock.isLocked, isLoading: lock.isLoading });
      return lock;
    },
    { wrapper: wrapperFor(biometrics) },
  );
  // The first render, before the status answers: no content behind the lock.
  expect(renders[0]).toEqual({ isLocked: true, isLoading: true });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.isLocked).toBe(false);
});

describe("promptOnLock", () => {
  it("prompts once per lock, and not again after a cancel", async () => {
    const { result, biometrics, rerender } = await setup(
      { promptOnLock: true },
      { result: { success: false, error: "cancelled" } },
    );
    await waitFor(() => expect(biometrics.calls).toHaveLength(1));
    await rerender({});
    await moveTo("inactive", "active");
    // The device becomes unlockable again (a lock screen set meanwhile):
    // still the same lock, so no second prompt.
    await act(async () => biometrics.setStatus({ level: "none" }));
    await act(async () => biometrics.setStatus({ level: "biometric-strong" }));
    expect(biometrics.calls).toHaveLength(1);
    expect(result.current.isLocked).toBe(true);

    // A new lock owes a new prompt.
    biometrics.setResult({ success: true });
    await moveTo("background", "active");
    await waitFor(() => expect(biometrics.calls).toHaveLength(2));
    expect(result.current.isLocked).toBe(false);
  });

  it("waits for the app to be in the foreground", async () => {
    AppState.currentState = "background";
    const { biometrics } = await setup({ promptOnLock: true });
    expect(biometrics.calls).toHaveLength(0);
    await moveTo("active");
    await waitFor(() => expect(biometrics.calls).toHaveLength(1));
  });

  it("does not prompt by default", async () => {
    const { biometrics } = await setup();
    expect(biometrics.calls).toHaveLength(0);
  });

  it("does not prompt what cannot be answered", async () => {
    const { biometrics } = await setup(
      { promptOnLock: true, whenUnavailable: "stay-locked" },
      { status: { level: "none", isEnrolled: false } },
    );
    expect(biometrics.calls).toHaveLength(0);
  });
});

describe("several hooks", () => {
  it("the strictest options win", async () => {
    const biometrics = createMockBiometricsAdapter();
    const wrapper = wrapperFor(biometrics);
    await renderHook(() => useAppLock({ prompt: PROMPT, relockAfter: 0 }), {
      wrapper,
    });
    const disabled = await renderHook(
      () => useAppLock({ prompt: PROMPT, enabled: false }),
      { wrapper },
    );
    const lax = await renderHook(
      () => useAppLock({ prompt: PROMPT, relockAfter: 60_000 }),
      { wrapper },
    );
    await waitFor(() => expect(lax.result.current.isLoading).toBe(false));
    await act(() => lax.result.current.unlock());
    await moveTo("background", "active");
    expect(lax.result.current.isLocked).toBe(true);
    // One lock for the whole app: a component that did not enable it sees it.
    expect(disabled.result.current.isLocked).toBe(true);
  });

  it("stops listening to the app state with the last one", async () => {
    const biometrics = createMockBiometricsAdapter();
    const wrapper = wrapperFor(biometrics);
    const a = await renderHook(() => useAppLock({ prompt: PROMPT }), {
      wrapper,
    });
    const b = await renderHook(() => useAppLock({ prompt: PROMPT }), {
      wrapper,
    });
    // One for the lock, one for the biometric status.
    expect(appStateListeners).toHaveLength(2);
    await a.unmount();
    expect(removed).not.toHaveBeenCalled();
    await b.unmount();
    expect(appStateListeners).toHaveLength(0);
  });
});

it("prerenders locked, without prompting", () => {
  const biometrics = createMockBiometricsAdapter();
  function Probe() {
    const lock = useAppLock({ prompt: PROMPT, promptOnLock: true });
    return <>{`${lock.isLocked}|${lock.isLockable}|${lock.isLoading}`}</>;
  }
  const html = renderToString(
    <DeviceAdaptersProvider adapters={{ biometrics }}>
      <Probe />
    </DeviceAdaptersProvider>,
  );
  expect(html).toBe("true|false|true");
  expect(biometrics.calls).toHaveLength(0);
});
