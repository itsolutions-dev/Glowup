import * as Location from "expo-location";

import {
  expoBackgroundLocationAdapter,
  toLocationTaskOptions,
  toStartError,
} from "../background-location/expo";
import { systemSheet } from "../core/systemSheet";

jest.mock("expo-location", () => ({
  LocationAccuracy: {
    Lowest: 1,
    Low: 2,
    Balanced: 3,
    High: 4,
    Highest: 5,
    BestForNavigation: 6,
  },
  LocationActivityType: {
    Other: 1,
    AutomotiveNavigation: 2,
    Fitness: 3,
    OtherNavigation: 4,
    Airborne: 5,
  },
  getBackgroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  startLocationUpdatesAsync: jest.fn(),
  stopLocationUpdatesAsync: jest.fn(),
  hasStartedLocationUpdatesAsync: jest.fn(),
}));

const mocked = jest.mocked(Location);

function coded(code: string, message = "native message") {
  return Object.assign(new Error(message), { code });
}

beforeEach(() => jest.clearAllMocks());

describe("toLocationTaskOptions", () => {
  it("turns iOS's automatic pause off unless asked, and maps the rest", () => {
    expect(toLocationTaskOptions({ foregroundService: false })).toEqual({
      accuracy: 3,
      distanceInterval: undefined,
      timeInterval: undefined,
      deferredUpdatesInterval: undefined,
      deferredUpdatesDistance: undefined,
      pausesUpdatesAutomatically: false,
      activityType: 1,
      showsBackgroundLocationIndicator: false,
    });
  });

  it("passes every option under expo's name", () => {
    expect(
      toLocationTaskOptions({
        accuracy: "best",
        distanceInterval: 10,
        timeInterval: 5000,
        batchInterval: 60_000,
        batchDistance: 100,
        pausesAutomatically: true,
        activityType: "fitness",
        showsIndicator: true,
        foregroundService: {
          title: "Trip",
          body: "Recording",
          color: "#FF0000",
          stopWithApp: true,
        },
      }),
    ).toEqual({
      accuracy: 5,
      distanceInterval: 10,
      timeInterval: 5000,
      deferredUpdatesInterval: 60_000,
      deferredUpdatesDistance: 100,
      pausesUpdatesAutomatically: true,
      activityType: 3,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Trip",
        notificationBody: "Recording",
        notificationColor: "#FF0000",
        killServiceOnDestroy: true,
      },
    });
  });

  it.each([
    ["low", 2],
    ["balanced", 3],
    ["high", 4],
    ["best", 5],
  ] as const)("maps accuracy %s", (accuracy, expected) => {
    expect(
      toLocationTaskOptions({ accuracy, foregroundService: false }).accuracy,
    ).toBe(expected);
  });

  it.each([
    ["other", 1],
    ["automotive", 2],
    ["fitness", 3],
    ["navigation", 4],
    ["airborne", 5],
  ] as const)("maps activity %s", (activityType, expected) => {
    expect(
      toLocationTaskOptions({ activityType, foregroundService: false })
        .activityType,
    ).toBe(expected);
  });

  it("keeps the service running with the app by default", () => {
    expect(
      toLocationTaskOptions({
        foregroundService: { title: "t", body: "b" },
      }).foregroundService,
    ).toEqual({
      notificationTitle: "t",
      notificationBody: "b",
      notificationColor: undefined,
      killServiceOnDestroy: false,
    });
  });
});

describe("toStartError", () => {
  it.each([
    ["ERR_LOCATION_UPDATES_UNAVAILABLE", "unsupported"],
    ["ERR_FOREGROUND_SERVICE_PERMISSIONS", "unsupported"],
    ["ERR_FOREGROUND_SERVICE_START_NOT_ALLOWED", "unavailable"],
    ["ERR_LOCATION_BACKGROUND_UNAUTHORIZED", "permission-denied"],
    ["ERR_DENIED_FOREGROUND_LOCATION_PERMISSION", "permission-denied"],
    ["ERR_LOCATION_SERVICES_DISABLED", "services-disabled"],
    ["ERR_UNEXPECTED", "unavailable"],
  ])("reads %s as %s", (code, expected) => {
    const native = coded(code);
    const error = toStartError(native);
    expect(error).toMatchObject({ name: "LocationError", code: expected });
    expect((error as { cause?: unknown }).cause).toBe(native);
  });

  it("says how to fix a build without the background setup", () => {
    expect(
      toStartError(coded("ERR_LOCATION_UPDATES_UNAVAILABLE")).message,
    ).toContain(
      "add `backgroundLocation` to the @its/glowup-device config plugin",
    );
    expect(
      toStartError(coded("ERR_FOREGROUND_SERVICE_START_NOT_ALLOWED")).message,
    ).toContain("only while the app is in the foreground");
  });
});

describe("expoBackgroundLocationAdapter", () => {
  it("is native only", () => {
    expect(expoBackgroundLocationAdapter.isSupported()).toBe(true);
  });

  it("reads and requests the background permission", async () => {
    mocked.getBackgroundPermissionsAsync.mockResolvedValue({
      status: "denied",
      granted: false,
      canAskAgain: false,
      expires: "never",
    } as never);
    await expect(
      expoBackgroundLocationAdapter.getPermission(),
    ).resolves.toEqual({ status: "denied", canAskAgain: false });

    let openDuringRequest: boolean | null = null;
    mocked.requestBackgroundPermissionsAsync.mockImplementation(async () => {
      openDuringRequest = systemSheet.isOpen();
      return {
        status: "granted",
        granted: true,
        canAskAgain: true,
        expires: "never",
      } as never;
    });
    await expect(
      expoBackgroundLocationAdapter.requestPermission(),
    ).resolves.toEqual({ status: "granted", canAskAgain: false });
    // Android 11+ leaves for the settings page: the app lock must not count it.
    expect(openDuringRequest).toBe(true);
    expect(systemSheet.isOpen()).toBe(false);
  });

  it("reads the foreground permission with its precision", async () => {
    mocked.getForegroundPermissionsAsync.mockResolvedValue({
      status: "granted",
      granted: true,
      canAskAgain: true,
      expires: "never",
      android: { accuracy: "coarse" },
    } as never);
    await expect(
      expoBackgroundLocationAdapter.getForegroundPermission(),
    ).resolves.toEqual({
      status: "granted",
      canAskAgain: false,
      precision: "approximate",
    });
  });

  it("asks the services", async () => {
    mocked.hasServicesEnabledAsync.mockResolvedValue(false);
    await expect(
      expoBackgroundLocationAdapter.hasServicesEnabled(),
    ).resolves.toBe(false);
  });

  it("starts with expo's options and converts its failures", async () => {
    mocked.startLocationUpdatesAsync.mockResolvedValue();
    await expoBackgroundLocationAdapter.start("trip", {
      foregroundService: false,
      accuracy: "high",
    });
    expect(mocked.startLocationUpdatesAsync).toHaveBeenCalledWith(
      "trip",
      expect.objectContaining({
        accuracy: 4,
        pausesUpdatesAutomatically: false,
      }),
    );
    mocked.startLocationUpdatesAsync.mockRejectedValue(
      coded("ERR_FOREGROUND_SERVICE_PERMISSIONS"),
    );
    await expect(
      expoBackgroundLocationAdapter.start("trip", { foregroundService: false }),
    ).rejects.toMatchObject({ code: "unsupported" });
  });

  it("stops only what runs: Android throws for an unknown task", async () => {
    mocked.hasStartedLocationUpdatesAsync.mockResolvedValue(false);
    await expoBackgroundLocationAdapter.stop("trip");
    expect(mocked.stopLocationUpdatesAsync).not.toHaveBeenCalled();
    mocked.hasStartedLocationUpdatesAsync.mockResolvedValue(true);
    await expoBackgroundLocationAdapter.stop("trip");
    expect(mocked.stopLocationUpdatesAsync).toHaveBeenCalledWith("trip");
  });

  it("converts a failure to stop or to read", async () => {
    mocked.hasStartedLocationUpdatesAsync.mockRejectedValue(
      coded("ERR_TASK_MANAGER_UNAVAILABLE"),
    );
    await expect(
      expoBackgroundLocationAdapter.stop("trip"),
    ).rejects.toMatchObject({ name: "LocationError", code: "unavailable" });
    await expect(
      expoBackgroundLocationAdapter.hasStarted("trip"),
    ).rejects.toMatchObject({ name: "LocationError", code: "unavailable" });
  });

  it("reads whether updates run", async () => {
    mocked.hasStartedLocationUpdatesAsync.mockResolvedValue(true);
    await expect(
      expoBackgroundLocationAdapter.hasStarted("trip"),
    ).resolves.toBe(true);
    expect(mocked.hasStartedLocationUpdatesAsync).toHaveBeenCalledWith("trip");
  });
});

it("is unsupported on the web", () => {
  jest.isolateModules(() => {
    jest.doMock("../core/support", () => ({
      ...jest.requireActual("../core/support"),
      isNativePlatform: false,
    }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- loaded after the mock above
    const expo = require("../background-location/expo");
    expect(expo.expoBackgroundLocationAdapter.isSupported()).toBe(false);
  });
});
