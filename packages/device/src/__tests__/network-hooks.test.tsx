import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { DeviceAdaptersProvider } from "..";
import { useIsOnline, useNetwork, type NetworkAdapter } from "../network";
import {
  createMockNetworkAdapter,
  MOCK_NETWORK,
  OFFLINE_NETWORK,
  type MockNetworkAdapter,
} from "../testing";

// Only for the module-level default; every test injects a mock adapter.
jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: {},
}));

function wrapperFor(network: NetworkAdapter) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <DeviceAdaptersProvider adapters={{ network }}>
        {children}
      </DeviceAdaptersProvider>
    );
  };
}

let adapter: MockNetworkAdapter;
beforeEach(() => {
  adapter = createMockNetworkAdapter();
});

describe("useNetwork", () => {
  it("loads, then reports the state", async () => {
    const { result } = await renderHook(() => useNetwork(), {
      wrapper: wrapperFor(adapter),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject(MOCK_NETWORK);
  });

  it("follows the platform's changes", async () => {
    const { result } = await renderHook(() => useNetwork(), {
      wrapper: wrapperFor(adapter),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => adapter.setState(OFFLINE_NETWORK));
    expect(result.current).toMatchObject(OFFLINE_NETWORK);
  });

  it("shares one platform subscription and closes it with the last listener", async () => {
    const wrapper = wrapperFor(adapter);
    const first = await renderHook(() => useNetwork(), { wrapper });
    const second = await renderHook(() => useNetwork(), { wrapper });
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));
    expect(adapter.subscriberCount).toBe(1);
    await first.unmount();
    expect(adapter.subscriberCount).toBe(1);
    await second.unmount();
    expect(adapter.subscriberCount).toBe(0);
  });

  it("refreshes through the platform and tells every listener", async () => {
    const wrapper = wrapperFor(adapter);
    const first = await renderHook(() => useNetwork(), { wrapper });
    const second = await renderHook(() => useNetwork(), { wrapper });
    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    await act(async () => {
      await first.result.current.refresh();
    });
    expect(adapter.refreshCount).toBe(1);
    expect(second.result.current.type).toBe("wifi");
  });

  it("does not re-render on an equal state", async () => {
    let renders = 0;
    const { result } = await renderHook(
      () => {
        renders++;
        return useNetwork();
      },
      { wrapper: wrapperFor(adapter) },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const before = renders;
    await act(async () => adapter.setState({}));
    expect(renders).toBe(before);
  });

  it("reports unknown without subscribing where unsupported", async () => {
    const unsupported: MockNetworkAdapter = {
      ...createMockNetworkAdapter(),
      isSupported: () => false,
    };
    const subscribe = jest.spyOn(unsupported, "subscribe");
    const { result } = await renderHook(() => useNetwork(), {
      wrapper: wrapperFor(unsupported),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isConnected).toBeNull();
    expect(subscribe).not.toHaveBeenCalled();
  });
});

describe("useIsOnline", () => {
  const online = async () => {
    const { result } = await renderHook(() => useIsOnline(), {
      wrapper: wrapperFor(adapter),
    });
    return result;
  };

  it("trusts the reachability probe when there is one", async () => {
    adapter = createMockNetworkAdapter({
      isConnected: true,
      isInternetReachable: false,
    });
    const result = await online();
    await waitFor(() => expect(result.current).toBe(false));
  });

  it("falls back to the interface when reachability is unknown (web)", async () => {
    adapter = createMockNetworkAdapter({
      isConnected: true,
      isInternetReachable: null,
    });
    const result = await online();
    await waitFor(() => expect(result.current).toBe(true));
  });

  it("is null until the first answer", async () => {
    const pending = createMockNetworkAdapter();
    pending.getState = () => new Promise(() => {});
    adapter = pending;
    const result = await online();
    expect(result.current).toBeNull();
  });
});
