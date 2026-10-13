import * as Location from "expo-location";

import {
  expoLocationAdapter,
  toLocationError,
  toLocationPermissionState,
} from "../location/expo";

jest.mock("expo-location", () => ({
  LocationAccuracy: {
    Lowest: 1,
    Low: 2,
    Balanced: 3,
    High: 4,
    Highest: 5,
    BestForNavigation: 6,
  },
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
}));

const mocked = jest.mocked(Location);

const granted = {
  status: "granted",
  granted: true,
  canAskAgain: true,
} as const;
const raw = {
  coords: {
    latitude: 45.46,
    longitude: 9.19,
    altitude: null,
    accuracy: 5,
    altitudeAccuracy: null,
    heading: null,
    speed: 0,
  },
  timestamp: 1700000000000,
};

const coded = (code: string, message = code) =>
  Object.assign(new Error(message), { code });

describe("permission precision", () => {
  it.each([
    [{ ios: { scope: "whenInUse", accuracy: "full" } }, "precise"],
    [{ ios: { scope: "whenInUse", accuracy: "reduced" } }, "approximate"],
    [{ android: { scope: "fine", accuracy: "fine" } }, "precise"],
    [{ android: { scope: "coarse", accuracy: "coarse" } }, "approximate"],
    [{}, null],
  ])("maps %j to %s", (details, precision) => {
    expect(
      toLocationPermissionState({
        ...granted,
        expires: "never",
        ...details,
      } as never),
    ).toEqual({ status: "granted", canAskAgain: false, precision });
  });

  it("has no precision until granted", () => {
    expect(
      toLocationPermissionState({
        status: "denied",
        granted: false,
        canAskAgain: false,
        expires: "never",
        ios: { scope: "none", accuracy: "full" },
      } as never),
    ).toEqual({ status: "denied", canAskAgain: false, precision: null });
  });

  it("reads and requests the foreground permission", async () => {
    mocked.getForegroundPermissionsAsync.mockResolvedValue({
      ...granted,
      expires: "never",
      ios: { scope: "whenInUse", accuracy: "reduced" },
    } as never);
    mocked.requestForegroundPermissionsAsync.mockResolvedValue({
      status: "denied",
      granted: false,
      canAskAgain: true,
      expires: "never",
    } as never);
    expect((await expoLocationAdapter.getPermission()).precision).toBe(
      "approximate",
    );
    expect((await expoLocationAdapter.requestPermission()).status).toBe(
      "denied",
    );
  });
});

describe("errors", () => {
  it.each([
    ["ERR_LOCATION_UNAUTHORIZED", "permission-denied"],
    ["ERR_DENIED_FOREGROUND_LOCATION_PERMISSION", "permission-denied"],
    ["ERR_LOCATION_SERVICES_DISABLED", "services-disabled"],
    ["ERR_LOCATION_SETTINGS_UNSATISFIED", "services-disabled"],
    ["ERR_CURRENT_LOCATION_IS_UNAVAILABLE", "unavailable"],
    ["ERR_SOMETHING_NEW", "unavailable"],
  ])("maps %s to %s", (code, expected) => {
    const error = toLocationError(coded(code, "native message"));
    expect(error.code).toBe(expected);
    expect(error.message).toBe("native message");
  });

  it("rejects getCurrentPosition with a LocationError", async () => {
    mocked.getCurrentPositionAsync.mockRejectedValue(
      coded("ERR_LOCATION_UNAUTHORIZED"),
    );
    await expect(
      expoLocationAdapter.getCurrentPosition({}),
    ).rejects.toMatchObject({
      name: "LocationError",
      code: "permission-denied",
    });
  });
});

describe("positions", () => {
  it("maps the accuracy and the fix", async () => {
    mocked.getCurrentPositionAsync.mockResolvedValue(raw as never);
    const position = await expoLocationAdapter.getCurrentPosition({
      accuracy: "best",
    });
    expect(mocked.getCurrentPositionAsync).toHaveBeenCalledWith({
      accuracy: 5,
    });
    expect(position).toEqual(raw);
  });

  it("passes maxAge and requiredAccuracy to the last known fix", async () => {
    mocked.getLastKnownPositionAsync.mockResolvedValue(null);
    const options = { maxAge: 60000, requiredAccuracy: 100 };
    expect(await expoLocationAdapter.getLastKnownPosition(options)).toBeNull();
    expect(mocked.getLastKnownPositionAsync).toHaveBeenCalledWith(options);
  });
});

describe("watchPosition", () => {
  function nativeWatch() {
    const remove = jest.fn();
    let resolve!: (sub: { remove: () => void }) => void;
    mocked.watchPositionAsync.mockImplementation(
      () => new Promise((r) => (resolve = r)) as never,
    );
    return {
      remove,
      created: () => resolve({ remove }),
      callback: () => mocked.watchPositionAsync.mock.calls[0][1],
      errorHandler: () => mocked.watchPositionAsync.mock.calls[0][2]!,
    };
  }

  beforeEach(() => mocked.watchPositionAsync.mockReset());

  it("forwards fixes and errors while subscribed", async () => {
    const native = nativeWatch();
    const onPosition = jest.fn();
    const onError = jest.fn();
    const stop = expoLocationAdapter.watchPosition(
      { accuracy: "high", distanceInterval: 10 },
      onPosition,
      onError,
    );
    expect(mocked.watchPositionAsync).toHaveBeenCalledWith(
      { accuracy: 4, distanceInterval: 10, timeInterval: undefined },
      expect.any(Function),
      expect.any(Function),
    );
    native.created();
    await Promise.resolve();
    native.callback()(raw as never);
    native.errorHandler()("signal lost");
    expect(onPosition).toHaveBeenCalledWith(raw);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: "unavailable", message: "signal lost" }),
    );
    stop();
    expect(native.remove).toHaveBeenCalled();
    native.callback()(raw as never);
    expect(onPosition).toHaveBeenCalledTimes(1);
  });

  it("removes a subscription that resolves after unsubscribing", async () => {
    const native = nativeWatch();
    const onPosition = jest.fn();
    const stop = expoLocationAdapter.watchPosition({}, onPosition, jest.fn());
    stop();
    native.created();
    await Promise.resolve();
    expect(native.remove).toHaveBeenCalled();
    native.callback()(raw as never);
    expect(onPosition).not.toHaveBeenCalled();
  });
});
