/**
 * The static web export prerenders in Node: the orientation renders as
 * loading, no lock is taken and none is supported, as in the browser's
 * first (hydrating) render.
 */
import { renderToString } from "react-dom/server";

import { DeviceAdaptersProvider } from "..";
import {
  useOrientation,
  useOrientationLock,
  useOrientationLockSupport,
} from "../orientation";
import { createMockOrientationAdapter } from "../testing";

jest.mock("expo-screen-orientation", () => ({
  Orientation: {},
  OrientationLock: {},
}));

it("prerenders as loading, without a lock", () => {
  const orientation = createMockOrientationAdapter();
  const subscribe = jest.spyOn(orientation, "subscribe");
  const getOrientation = jest.spyOn(orientation, "getOrientation");
  function Probe() {
    const { orientation: value, isLoading } = useOrientation();
    const { isActive } = useOrientationLock("landscape");
    const supported = useOrientationLockSupport();
    return <>{`${isLoading}|${value}|${isActive}|${supported}`}</>;
  }
  const html = renderToString(
    <DeviceAdaptersProvider adapters={{ orientation }}>
      <Probe />
    </DeviceAdaptersProvider>,
  );
  expect(html).toBe("true|unknown|false|false");
  expect(subscribe).not.toHaveBeenCalled();
  expect(getOrientation).not.toHaveBeenCalled();
  expect(orientation.calls).toEqual([]);
});
