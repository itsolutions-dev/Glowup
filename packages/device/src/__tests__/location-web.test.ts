import { webLocationAdapter } from "../location/web";

// The adapter reads `hasDOM()`, which is false under the native jest preset.
jest.mock("../core/support", () => ({
  ...jest.requireActual("../core/support"),
  hasDOM: () => true,
}));

type Success = (position: GeolocationPosition) => void;
type Failure = (error: GeolocationPositionError) => void;

const fix = (
  latitude: number,
  longitude: number,
  extra: Partial<GeolocationCoordinates> = {},
  timestamp = 1700000000000,
) =>
  ({
    coords: {
      latitude,
      longitude,
      altitude: null,
      accuracy: 20,
      altitudeAccuracy: null,
      heading: NaN,
      speed: null,
      ...extra,
    },
    timestamp,
  }) as unknown as GeolocationPosition;

const positionError = (code: 1 | 2 | 3, message = "") =>
  ({ code, message }) as GeolocationPositionError;

let geolocation: {
  getCurrentPosition: jest.Mock;
  watchPosition: jest.Mock;
  clearWatch: jest.Mock;
};
let permissionState: PermissionState | null;
const originalNavigator = globalThis.navigator;

function install({ withGeolocation = true } = {}) {
  geolocation = {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(() => 7),
    clearWatch: jest.fn(),
  };
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      ...(withGeolocation && { geolocation }),
      permissions: {
        query: jest.fn(async () => {
          if (permissionState === null) throw new TypeError("unsupported");
          return { state: permissionState };
        }),
      },
    },
  });
}

const answer = (outcome: GeolocationPosition | GeolocationPositionError) =>
  geolocation.getCurrentPosition.mockImplementation(
    (ok: Success, fail: Failure) =>
      "coords" in outcome ? ok(outcome) : fail(outcome),
  );

beforeEach(() => {
  permissionState = "prompt";
  install();
});
afterAll(() => {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: originalNavigator,
  });
});

describe("support", () => {
  it("needs navigator.geolocation", async () => {
    expect(webLocationAdapter.isSupported()).toBe(true);
    install({ withGeolocation: false });
    expect(webLocationAdapter.isSupported()).toBe(false);
    expect((await webLocationAdapter.getPermission()).status).toBe(
      "unsupported",
    );
  });
});

describe("permission", () => {
  it.each([
    ["granted", { status: "granted", canAskAgain: false }],
    ["denied", { status: "denied", canAskAgain: false }],
    ["prompt", { status: "undetermined", canAskAgain: true }],
  ] as const)("maps %s", async (state, expected) => {
    permissionState = state;
    expect(await webLocationAdapter.getPermission()).toEqual({
      ...expected,
      precision: null,
    });
  });

  it("reads undetermined without the Permissions API", async () => {
    permissionState = null;
    expect((await webLocationAdapter.getPermission()).status).toBe(
      "undetermined",
    );
  });

  it("prompts by asking for a position", async () => {
    answer(fix(1, 2));
    expect((await webLocationAdapter.requestPermission()).status).toBe(
      "granted",
    );
    answer(positionError(1));
    expect((await webLocationAdapter.requestPermission()).status).toBe(
      "denied",
    );
  });

  it("counts an allowed request without a fix as granted", async () => {
    permissionState = null;
    answer(positionError(2));
    expect((await webLocationAdapter.requestPermission()).status).toBe(
      "granted",
    );
  });

  it("does not prompt once the state is known", async () => {
    permissionState = "denied";
    await webLocationAdapter.requestPermission();
    expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });
});

describe("getCurrentPosition", () => {
  it("asks for a fresh fix and maps it", async () => {
    answer(fix(45, 9));
    const position = await webLocationAdapter.getCurrentPosition({
      accuracy: "high",
    });
    expect(geolocation.getCurrentPosition.mock.calls[0][2]).toEqual({
      enableHighAccuracy: true,
      maximumAge: 0,
    });
    expect(position.coords).toMatchObject({
      latitude: 45,
      longitude: 9,
      heading: null,
    });
  });

  it.each([
    [1, "permission-denied"],
    [2, "unavailable"],
    [3, "timeout"],
  ] as const)("maps error %i to %s", async (code, expected) => {
    answer(positionError(code));
    await expect(
      webLocationAdapter.getCurrentPosition({}),
    ).rejects.toMatchObject({ code: expected });
  });
});

describe("getLastKnownPosition", () => {
  it("answers from the browser cache only", async () => {
    answer(fix(45, 9));
    expect(
      await webLocationAdapter.getLastKnownPosition({ maxAge: 60000 }),
    ).not.toBeNull();
    expect(geolocation.getCurrentPosition.mock.calls[0][2]).toEqual({
      maximumAge: 60000,
      timeout: 0,
    });
  });

  it("is null when the cache is empty or too rough", async () => {
    answer(positionError(3));
    expect(await webLocationAdapter.getLastKnownPosition({})).toBeNull();
    answer(fix(45, 9, { accuracy: 500 }));
    expect(
      await webLocationAdapter.getLastKnownPosition({ requiredAccuracy: 100 }),
    ).toBeNull();
  });
});

describe("watchPosition", () => {
  it("filters by distance, reports errors and clears the watch", () => {
    const onPosition = jest.fn();
    const onError = jest.fn();
    const stop = webLocationAdapter.watchPosition(
      { distanceInterval: 100 },
      onPosition,
      onError,
    );
    const [ok, fail] = geolocation.watchPosition.mock.calls[0] as [
      Success,
      Failure,
    ];
    ok(fix(45, 9));
    ok(fix(45.0001, 9)); // ~11 m: filtered
    ok(fix(45.01, 9)); // ~1.1 km
    expect(onPosition).toHaveBeenCalledTimes(2);
    fail(positionError(2));
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: "unavailable" }),
    );
    stop();
    expect(geolocation.clearWatch).toHaveBeenCalledWith(7);
  });

  it("reports unsupported instead of throwing", () => {
    install({ withGeolocation: false });
    const onError = jest.fn();
    webLocationAdapter.watchPosition({}, jest.fn(), onError)();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: "unsupported" }),
    );
  });
});
