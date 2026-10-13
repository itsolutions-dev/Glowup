import NetInfo from "@react-native-community/netinfo";

import { netInfoNetworkAdapter } from "../network/netinfo";
import { webNetworkAdapter } from "../network/web";

jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(),
    refresh: jest.fn(),
    addEventListener: jest.fn(),
  },
}));

// The web adapter reads `hasDOM()`, false under the native jest preset.
jest.mock("../core/support", () => ({
  ...jest.requireActual("../core/support"),
  hasDOM: () => true,
}));

const netinfo = jest.mocked(NetInfo);

describe("netInfoNetworkAdapter", () => {
  it("maps a cellular state", async () => {
    netinfo.fetch.mockResolvedValue({
      type: "cellular",
      isConnected: true,
      isInternetReachable: true,
      details: { isConnectionExpensive: true, cellularGeneration: "5g" },
    } as never);
    expect(await netInfoNetworkAdapter.getState()).toEqual({
      isConnected: true,
      isInternetReachable: true,
      type: "cellular",
      isExpensive: true,
      cellularGeneration: "5g",
    });
  });

  it("keeps unknowns as null", async () => {
    netinfo.refresh.mockResolvedValue({
      type: "unknown",
      isConnected: null,
      isInternetReachable: null,
      details: null,
    } as never);
    expect(await netInfoNetworkAdapter.refresh()).toEqual({
      isConnected: null,
      isInternetReachable: null,
      type: "unknown",
      isExpensive: null,
      cellularGeneration: null,
    });
  });

  it("reports the generation on cellular only", async () => {
    netinfo.fetch.mockResolvedValue({
      type: "wifi",
      isConnected: true,
      isInternetReachable: false,
      details: { isConnectionExpensive: false, cellularGeneration: "4g" },
    } as never);
    const state = await netInfoNetworkAdapter.getState();
    expect(state.cellularGeneration).toBeNull();
    expect(state.isInternetReachable).toBe(false);
  });

  it("subscribes and unsubscribes through netinfo", () => {
    const unsubscribe = jest.fn();
    let handler!: (raw: unknown) => void;
    netinfo.addEventListener.mockImplementation((h) => {
      handler = h as never;
      return unsubscribe;
    });
    const listener = jest.fn();
    const stop = netInfoNetworkAdapter.subscribe(listener);
    handler({
      type: "none",
      isConnected: false,
      isInternetReachable: false,
      details: null,
    });
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: "none", isConnected: false }),
    );
    stop();
    expect(unsubscribe).toHaveBeenCalled();
  });
});

describe("webNetworkAdapter", () => {
  const originalNavigator = globalThis.navigator;
  const originalWindow = globalThis.window;
  let connection: {
    type?: string;
    effectiveType?: string;
    saveData?: boolean;
    addEventListener: jest.Mock;
    removeEventListener: jest.Mock;
  } | null;
  let online: boolean;
  const windowListeners: Record<string, (() => void)[]> = {};

  beforeEach(() => {
    online = true;
    connection = null;
    for (const key of Object.keys(windowListeners)) delete windowListeners[key];
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        get onLine() {
          return online;
        },
        get connection() {
          return connection ?? undefined;
        },
      },
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        addEventListener: (type: string, fn: () => void) =>
          (windowListeners[type] ??= []).push(fn),
        removeEventListener: (type: string, fn: () => void) => {
          windowListeners[type] = (windowListeners[type] ?? []).filter(
            (f) => f !== fn,
          );
        },
      },
    });
  });
  afterAll(() => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });

  it("never claims the internet answers: it cannot know without a request", async () => {
    expect(await webNetworkAdapter.getState()).toEqual({
      isConnected: true,
      isInternetReachable: null,
      type: "unknown",
      isExpensive: null,
      cellularGeneration: null,
    });
  });

  it("reports offline as no network and no internet", async () => {
    online = false;
    expect(await webNetworkAdapter.getState()).toMatchObject({
      isConnected: false,
      isInternetReachable: false,
      type: "none",
    });
  });

  it("reads the Network Information API where there is one", async () => {
    connection = {
      type: "cellular",
      effectiveType: "slow-2g",
      saveData: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    expect(await webNetworkAdapter.getState()).toMatchObject({
      type: "cellular",
      isExpensive: true,
      cellularGeneration: "2g",
    });
    connection.type = "wifi";
    connection.effectiveType = "4g";
    expect((await webNetworkAdapter.getState()).cellularGeneration).toBeNull();
  });

  it("follows online / offline and connection changes", () => {
    connection = {
      type: "wifi",
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    const listener = jest.fn();
    const stop = webNetworkAdapter.subscribe(listener);
    online = false;
    windowListeners.offline.forEach((fn) => fn());
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ isConnected: false, type: "none" }),
    );
    expect(connection.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
    stop();
    expect(windowListeners.online).toHaveLength(0);
    expect(windowListeners.offline).toHaveLength(0);
    expect(connection.removeEventListener).toHaveBeenCalled();
  });
});
