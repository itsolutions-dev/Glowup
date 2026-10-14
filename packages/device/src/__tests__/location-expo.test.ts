import * as Location from "expo-location";

import {
  expoGeocoderAdapter,
  expoLocationAdapter,
  toGeocodedAddress,
  toGeocodedLocation,
  toHeading,
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
  watchHeadingAsync: jest.fn(),
  geocodeAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
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
    ["ERR_NO_GEOCODE", "unsupported"],
    ["ERR_GEOCODE", "unavailable"],
    ["ERR_GEOCODING_NETWORK", "unavailable"],
    ["ERR_GEOCODING_FAILED", "unavailable"],
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

describe("heading", () => {
  it.each([
    [{ magHeading: 90, trueHeading: 92.5, accuracy: 3 }, 90, 92.5, "high"],
    [{ magHeading: 360, trueHeading: 0, accuracy: 2 }, 0, 0, "medium"],
    [{ magHeading: -10, trueHeading: 725, accuracy: 1 }, 350, 5, "low"],
    [{ magHeading: 12, trueHeading: -1, accuracy: 0 }, 12, null, "unreliable"],
  ])("maps %j", (raw, magneticHeading, trueHeading, accuracy) => {
    expect(toHeading(raw)).toEqual({
      magneticHeading,
      trueHeading,
      accuracy,
      timestamp: expect.any(Number),
    });
  });

  function nativeWatch() {
    const remove = jest.fn();
    let resolve!: (sub: { remove: () => void }) => void;
    let reject!: (error: unknown) => void;
    mocked.watchHeadingAsync.mockImplementation(
      () =>
        new Promise((done, fail) => {
          resolve = done;
          reject = fail;
        }) as never,
    );
    return {
      remove,
      created: () => resolve({ remove }),
      failed: (error: unknown) => reject(error),
      callback: () => mocked.watchHeadingAsync.mock.calls[0][0],
      errorHandler: () => mocked.watchHeadingAsync.mock.calls[0][1]!,
    };
  }

  const rawHeading = { magHeading: 45, trueHeading: 47, accuracy: 3 };

  beforeEach(() => mocked.watchHeadingAsync.mockReset());

  it("forwards readings and errors while subscribed", async () => {
    const native = nativeWatch();
    const onHeading = jest.fn();
    const onError = jest.fn();
    const stop = expoLocationAdapter.watchHeading!(onHeading, onError);
    native.created();
    await Promise.resolve();
    native.callback()(rawHeading);
    native.errorHandler()("no magnetometer");
    expect(onHeading).toHaveBeenCalledWith(
      expect.objectContaining({ magneticHeading: 45, trueHeading: 47 }),
    );
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "unavailable",
        message: "no magnetometer",
      }),
    );
    stop();
    expect(native.remove).toHaveBeenCalled();
    native.callback()(rawHeading);
    native.errorHandler()("late");
    expect(onHeading).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("turns a refused watch into a LocationError", async () => {
    const native = nativeWatch();
    const onError = jest.fn();
    expoLocationAdapter.watchHeading!(jest.fn(), onError);
    native.failed(coded("ERR_LOCATION_UNAUTHORIZED"));
    await Promise.resolve();
    await Promise.resolve();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "LocationError",
        code: "permission-denied",
      }),
    );
  });

  it("stays silent about a refusal after unsubscribing", async () => {
    const native = nativeWatch();
    const onError = jest.fn();
    const stop = expoLocationAdapter.watchHeading!(jest.fn(), onError);
    stop();
    native.failed(coded("ERR_LOCATION_UNAUTHORIZED"));
    await Promise.resolve();
    await Promise.resolve();
    expect(onError).not.toHaveBeenCalled();
  });

  it("removes a subscription that resolves after unsubscribing", async () => {
    const native = nativeWatch();
    const onHeading = jest.fn();
    const stop = expoLocationAdapter.watchHeading!(onHeading, jest.fn());
    stop();
    native.created();
    await Promise.resolve();
    expect(native.remove).toHaveBeenCalled();
    native.callback()(rawHeading);
    expect(onHeading).not.toHaveBeenCalled();
  });
});

describe("geocoding", () => {
  const ios = {
    city: "Roma",
    district: "Municipio I",
    streetNumber: "",
    street: "Piazza Venezia",
    region: "Lazio",
    subregion: "Roma Capitale",
    country: "Italia",
    postalCode: "00186",
    name: "  Piazza Venezia ",
    isoCountryCode: "IT",
    timezone: "Europe/Rome",
  };

  it("normalises an iOS address: blanks and the missing line read null", () => {
    expect(toGeocodedAddress(ios as never)).toEqual({
      ...ios,
      name: "Piazza Venezia",
      streetNumber: null,
      formattedAddress: null,
    });
  });

  it("normalises an Android address: no time zone", () => {
    const android = {
      ...ios,
      name: "12",
      timezone: null,
      formattedAddress: "Piazza Venezia, 12, 00186 Roma RM, Italia",
    };
    expect(toGeocodedAddress(android as never)).toMatchObject({
      name: "12",
      timezone: null,
      formattedAddress: "Piazza Venezia, 12, 00186 Roma RM, Italia",
    });
  });

  it.each([
    [{ latitude: 41.9, longitude: 12.5, accuracy: 70.5 }, 70.5],
    [{ latitude: 41.9, longitude: 12.5, accuracy: 0, altitude: 0 }, null],
    [{ latitude: 41.9, longitude: 12.5, accuracy: -1 }, null],
    [{ latitude: 41.9, longitude: 12.5 }, null],
  ])("keeps a meaningful accuracy only: %j", (raw, accuracy) => {
    expect(toGeocodedLocation(raw)).toEqual({
      latitude: 41.9,
      longitude: 12.5,
      accuracy,
    });
  });

  it.each([
    [{ latitude: null, longitude: 12.5 }],
    [{ latitude: 41.9, longitude: undefined }],
    [{ latitude: Number.NaN, longitude: 12.5 }],
  ])("drops a placemark without a location: %j", (raw) => {
    expect(toGeocodedLocation(raw as never)).toBeNull();
  });

  it("geocodes through expo and drops unusable results", async () => {
    mocked.geocodeAsync.mockResolvedValue([
      { latitude: 41.9, longitude: 12.5, accuracy: 0, altitude: 0 },
      { latitude: null, longitude: null },
    ] as never);
    await expect(expoGeocoderAdapter.geocode("Roma")).resolves.toEqual([
      { latitude: 41.9, longitude: 12.5, accuracy: null },
    ]);
    expect(mocked.geocodeAsync).toHaveBeenCalledWith("Roma");
  });

  it("reverse-geocodes only the point through expo", async () => {
    mocked.reverseGeocodeAsync.mockResolvedValue([ios] as never);
    const results = await expoGeocoderAdapter.reverseGeocode({
      latitude: 41.9,
      longitude: 12.5,
      accuracy: 5,
    } as never);
    expect(mocked.reverseGeocodeAsync).toHaveBeenCalledWith({
      latitude: 41.9,
      longitude: 12.5,
    });
    expect(results[0].city).toBe("Roma");
  });

  it("turns expo's rejections into LocationErrors", async () => {
    mocked.geocodeAsync.mockRejectedValue(coded("ERR_LOCATION_UNAUTHORIZED"));
    await expect(expoGeocoderAdapter.geocode("Roma")).rejects.toMatchObject({
      name: "LocationError",
      code: "permission-denied",
    });
    mocked.reverseGeocodeAsync.mockRejectedValue(coded("ERR_NO_GEOCODE"));
    await expect(
      expoGeocoderAdapter.reverseGeocode({ latitude: 0, longitude: 0 }),
    ).rejects.toMatchObject({ code: "unsupported" });
  });

  it("is supported on native", () => {
    expect(expoGeocoderAdapter.isSupported()).toBe(true);
  });

  it("is unsupported on the web, where expo would answer not found", async () => {
    let web!: typeof expoGeocoderAdapter;
    jest.isolateModules(() => {
      jest.doMock("../core/support", () => ({
        ...jest.requireActual("../core/support"),
        isNativePlatform: false,
      }));
      // isolateModules needs require(): the platform is read at import.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      web = require("../location/expo").expoGeocoderAdapter;
    });
    mocked.geocodeAsync.mockClear();
    mocked.reverseGeocodeAsync.mockClear();
    expect(web.isSupported()).toBe(false);
    await expect(web.geocode("Roma")).rejects.toMatchObject({
      code: "unsupported",
    });
    await expect(
      web.reverseGeocode({ latitude: 0, longitude: 0 }),
    ).rejects.toMatchObject({ code: "unsupported" });
    expect(mocked.geocodeAsync).not.toHaveBeenCalled();
    expect(mocked.reverseGeocodeAsync).not.toHaveBeenCalled();
  });
});
