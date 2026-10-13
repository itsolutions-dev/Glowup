/**
 * The static web export prerenders in Node, where there is no network to
 * read: useNetwork must render "loading" there without touching the adapter.
 */
import { renderToString } from "react-dom/server";

import { DeviceAdaptersProvider } from "..";
import { useNetwork } from "../network";
import { createMockNetworkAdapter } from "../testing";

jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: {},
}));

it("prerenders as loading", () => {
  const network = createMockNetworkAdapter();
  const subscribe = jest.spyOn(network, "subscribe");
  const getState = jest.spyOn(network, "getState");
  function Probe() {
    const state = useNetwork();
    return <>{`${state.isLoading}|${state.isConnected}`}</>;
  }
  const html = renderToString(
    <DeviceAdaptersProvider adapters={{ network }}>
      <Probe />
    </DeviceAdaptersProvider>,
  );
  expect(html).toBe("true|null");
  expect(subscribe).not.toHaveBeenCalled();
  expect(getState).not.toHaveBeenCalled();
});
