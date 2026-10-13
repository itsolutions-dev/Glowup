/**
 * The static web export prerenders in Node: useBattery must render "loading"
 * there without touching the adapter, and useKeepAwakeSupport must say false
 * (what the browser's first render says too, until it hydrates).
 */
import { renderToString } from "react-dom/server";

import { DeviceAdaptersProvider } from "..";
import { useBattery } from "../battery";
import { useKeepAwake, useKeepAwakeSupport } from "../keep-awake";
import {
  createMockBatteryAdapter,
  createMockKeepAwakeAdapter,
} from "../testing";

jest.mock("expo-battery", () => ({ BatteryState: {} }));
jest.mock("expo-keep-awake", () => ({}));

it("prerenders as loading, without a wake lock", () => {
  const battery = createMockBatteryAdapter();
  const keepAwake = createMockKeepAwakeAdapter();
  const subscribe = jest.spyOn(battery, "subscribe");
  const getStatus = jest.spyOn(battery, "getStatus");
  const activate = jest.spyOn(keepAwake, "activate");
  function Probe() {
    const status = useBattery();
    useKeepAwake();
    const supported = useKeepAwakeSupport();
    return <>{`${status.isLoading}|${status.level}|${supported}`}</>;
  }
  const html = renderToString(
    <DeviceAdaptersProvider adapters={{ battery, keepAwake }}>
      <Probe />
    </DeviceAdaptersProvider>,
  );
  expect(html).toBe("true|null|false");
  expect(subscribe).not.toHaveBeenCalled();
  expect(getStatus).not.toHaveBeenCalled();
  expect(activate).not.toHaveBeenCalled();
});
