/**
 * The static web export prerenders in Node: useDeviceInfo must render the
 * server snapshot there, never the adapter's answer, or hydration mismatches.
 */
import { renderToString } from "react-dom/server";

import { DeviceAdaptersProvider } from "..";
import { useDeviceInfo } from "../info";
import { createMockDeviceInfoAdapter } from "../testing";

jest.mock("expo-device", () => ({ DeviceType: {} }));
jest.mock("expo-application", () => ({}));

it("prerenders every field as unknown", () => {
  const adapter = createMockDeviceInfoAdapter();
  const getDeviceInfo = jest.spyOn(adapter, "getDeviceInfo");
  function Probe() {
    const info = useDeviceInfo();
    return <>{`${info.model}|${info.deviceType}|${info.app.version}`}</>;
  }
  const html = renderToString(
    <DeviceAdaptersProvider adapters={{ info: adapter }}>
      <Probe />
    </DeviceAdaptersProvider>,
  );
  expect(html).toBe("null|unknown|null");
  expect(getDeviceInfo).not.toHaveBeenCalled();
});
