import { act, renderHook, waitFor } from "@testing-library/react-native";
import * as TaskManager from "expo-task-manager";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { AppState, Linking } from "react-native";

import { DeviceAdaptersProvider } from "..";
import {
  defineGeofenceTask,
  defineLocationTask,
  LocationError,
  useBackgroundLocation,
  useBackgroundLocationPermission,
  useGeofencing,
  type BackgroundLocationAdapter,
  type BackgroundLocationOptions,
  type GeofenceEvent,
  type GeofenceRegion,
  type LocationTaskEvent,
} from "../background-location";
import {
  buildPosition,
  createMockBackgroundLocationAdapter,
  type MockBackgroundLocationAdapter,
  type MockBackgroundLocationOptions,
} from "../testing";

jest.mock("expo-location", () => ({
  LocationAccuracy: {},
  LocationActivityType: {},
}));
jest.mock("expo-task-manager", () => ({
  defineTask: jest.fn(),
  getTaskOptionsAsync: jest.fn(),
}));

// jest-expo's AppState.addEventListener is a jest.fn: swap it for one that
// lets the test move the app between states.
let appStateListeners: ((state: string) => void)[] = [];
const originalAddEventListener = AppState.addEventListener;

beforeEach(() => {
  appStateListeners = [];
  AppState.addEventListener = ((_type: string, listener: never) => {
    appStateListeners.push(listener);
    return {
      remove: () => {
        appStateListeners = appStateListeners.filter((l) => l !== listener);
      },
    };
  }) as never;
});

afterEach(() => {
  AppState.addEventListener = originalAddEventListener;
});

async function moveTo(...states: string[]) {
  for (const state of states) {
    await act(async () => appStateListeners.forEach((l) => l(state)));
  }
}

const SERVICE: BackgroundLocationOptions = {
  foregroundService: { title: "Recording your trip", body: "Tap to open" },
};

// Task names are global, as on the platform: one per test.
let taskCount = 0;
function defineTask(handler: (event: LocationTaskEvent) => void = () => {}) {
  const name = `trip-${++taskCount}`;
  defineLocationTask(name, handler);
  return name;
}

function wrapperFor(backgroundLocation: BackgroundLocationAdapter) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <DeviceAdaptersProvider adapters={{ backgroundLocation }}>
        {children}
      </DeviceAdaptersProvider>
    );
  };
}

async function setup(
  name: string,
  options?: MockBackgroundLocationOptions,
  adapter: MockBackgroundLocationAdapter = createMockBackgroundLocationAdapter(
    options,
  ),
) {
  const { result } = await renderHook(() => useBackgroundLocation(name), {
    wrapper: wrapperFor(adapter),
  });
  await waitFor(() => expect(result.current.isRunning).not.toBeNull());
  return { adapter, result };
}

describe("defineLocationTask", () => {
  it("hands the platform an executor that delivers sorted positions", async () => {
    const handler = jest.fn();
    defineLocationTask("platform-task", handler);
    const [name, executor] = jest.mocked(TaskManager.defineTask).mock.calls[
      jest.mocked(TaskManager.defineTask).mock.calls.length - 1
    ];
    expect(name).toBe("platform-task");
    const later = { coords: { latitude: 2, longitude: 2 }, timestamp: 2000 };
    const earlier = { coords: { latitude: 1, longitude: 1 }, timestamp: 1000 };
    await executor({
      data: { locations: [later, earlier] },
      error: null,
      executionInfo: { eventId: "1", taskName: name },
    });
    expect(handler).toHaveBeenCalledWith({
      type: "positions",
      positions: [
        buildPosition({ latitude: 1, longitude: 1, accuracy: null }, 1000),
        buildPosition({ latitude: 2, longitude: 2, accuracy: null }, 2000),
      ],
    });
  });

  it("delivers iOS failures as errors", async () => {
    const handler = jest.fn();
    defineLocationTask("failing-task", handler);
    const executor = jest.mocked(TaskManager.defineTask).mock.calls.at(-1)![1];
    const executionInfo = { eventId: "1", taskName: "failing-task" };
    await executor({
      data: null,
      error: { code: 1, message: "denied" },
      executionInfo,
    });
    await executor({
      data: null,
      error: { code: 0, message: "unknown" },
      executionInfo,
    });
    expect(handler.mock.calls.map(([event]) => event.error.code)).toEqual([
      "permission-denied",
      "unavailable",
    ]);
    expect(handler.mock.calls[0][0].error.message).toBe("denied");
  });

  it.each([[""], ["  "], [undefined], [7]])("refuses the name %j", (name) => {
    expect(() => defineLocationTask(name as never, () => {})).toThrow(
      TypeError,
    );
  });

  it("refuses a handler that is not a function", () => {
    expect(() => defineLocationTask("no-handler", null as never)).toThrow(
      "the handler must be a function",
    );
  });
});

describe("useBackgroundLocation", () => {
  it("starts and stops, with the options checked and reduced to the known keys", async () => {
    const name = defineTask();
    const { adapter, result } = await setup(name);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isSupported).toBe(true);
    await act(() =>
      result.current.start({
        ...SERVICE,
        accuracy: "high",
        distanceInterval: 20,
        extra: "dropped",
      } as BackgroundLocationOptions),
    );
    expect(result.current.isRunning).toBe(true);
    expect(adapter.running.get(name)).toEqual({
      accuracy: "high",
      distanceInterval: 20,
      timeInterval: undefined,
      batchInterval: undefined,
      batchDistance: undefined,
      pausesAutomatically: undefined,
      activityType: undefined,
      showsIndicator: undefined,
      foregroundService: {
        title: "Recording your trip",
        body: "Tap to open",
        color: undefined,
        stopWithApp: undefined,
      },
    });
    await act(() => result.current.stop());
    expect(result.current.isRunning).toBe(false);
    expect(adapter.running.size).toBe(0);
  });

  it("reads updates an earlier launch started", async () => {
    const name = defineTask();
    const adapter = createMockBackgroundLocationAdapter();
    await adapter.start(name, SERVICE);
    const { result } = await setup(name, undefined, adapter);
    expect(result.current.isRunning).toBe(true);
  });

  it("shares one state between the components using a name", async () => {
    const name = defineTask();
    const adapter = createMockBackgroundLocationAdapter();
    const { result } = await renderHook(
      () => [useBackgroundLocation(name), useBackgroundLocation(name)],
      { wrapper: wrapperFor(adapter) },
    );
    await waitFor(() => expect(result.current[1].isRunning).toBe(false));
    await act(() => result.current[0].start(SERVICE));
    expect(result.current[1].isRunning).toBe(true);
  });

  it("reads again on the way back to the foreground", async () => {
    const name = defineTask();
    const { adapter, result } = await setup(name);
    await act(() => result.current.start({ foregroundService: false }));
    adapter.stopBySystem(name);
    await moveTo("background");
    expect(result.current.isRunning).toBe(true);
    await moveTo("active");
    await waitFor(() => expect(result.current.isRunning).toBe(false));
  });

  it("delivers positions to the task while running", async () => {
    const handler = jest.fn();
    const name = defineTask(handler);
    const { adapter, result } = await setup(name);
    await expect(adapter.deliver(name)).rejects.toThrow("nothing runs under");
    await act(() => result.current.start(SERVICE));
    const fix = buildPosition({ latitude: 45 });
    await adapter.deliver(name, [fix]);
    await adapter.deliverError(name, "unavailable");
    expect(handler.mock.calls.map(([event]) => event.type)).toEqual([
      "positions",
      "error",
    ]);
    expect(handler.mock.calls[0][0].positions).toEqual([fix]);
  });

  it.each<[string, unknown, string]>([
    ["no options", undefined, "options are required"],
    ["no foregroundService", {}, "foregroundService is required"],
    [
      "a service without a title",
      { foregroundService: { title: " ", body: "b" } },
      "foregroundService.title",
    ],
    [
      "a service without a body",
      { foregroundService: { title: "t" } },
      "foregroundService.body",
    ],
    [
      "a bad color",
      { foregroundService: { title: "t", body: "b", color: "red" } },
      "#RRGGBB",
    ],
    [
      "a bad stopWithApp",
      { foregroundService: { title: "t", body: "b", stopWithApp: "yes" } },
      "stopWithApp must be a boolean",
    ],
    [
      "an unknown accuracy",
      { ...SERVICE, accuracy: "max" },
      "accuracy must be one of",
    ],
    [
      "an unknown activity",
      { ...SERVICE, activityType: "walking" },
      "activityType must be one of",
    ],
    [
      "a negative distance",
      { ...SERVICE, distanceInterval: -1 },
      "distanceInterval",
    ],
    [
      "an infinite batch interval",
      { ...SERVICE, batchInterval: Infinity },
      "batchInterval",
    ],
    [
      "a string time interval",
      { ...SERVICE, timeInterval: "5" },
      "timeInterval",
    ],
    [
      "a bad batch distance",
      { ...SERVICE, batchDistance: Number.NaN },
      "batchDistance",
    ],
    [
      "a bad flag",
      { ...SERVICE, showsIndicator: 1 },
      "showsIndicator must be a boolean",
    ],
    [
      "a bad pause flag",
      { ...SERVICE, pausesAutomatically: "no" },
      "pausesAutomatically must be a boolean",
    ],
  ])("refuses %s before anything starts", async (_label, options, message) => {
    const name = defineTask();
    const { adapter, result } = await setup(name);
    const call = result.current.start(options as never);
    await expect(call).rejects.toBeInstanceOf(TypeError);
    await expect(call).rejects.toThrow(message);
    expect(adapter.running.size).toBe(0);
  });

  it("accepts the edges of every option", async () => {
    const name = defineTask();
    const { adapter, result } = await setup(name);
    await act(() =>
      result.current.start({
        accuracy: "best",
        distanceInterval: 0,
        timeInterval: 0,
        batchInterval: 0,
        batchDistance: 0,
        pausesAutomatically: true,
        activityType: "airborne",
        showsIndicator: false,
        foregroundService: {
          title: "t",
          body: "b",
          color: "#80FF0000",
          stopWithApp: true,
        },
      }),
    );
    expect(adapter.running.get(name)).toMatchObject({
      activityType: "airborne",
      foregroundService: { color: "#80FF0000", stopWithApp: true },
    });
  });

  it("refuses a task nobody defined", async () => {
    const { adapter, result } = await setup("never-defined");
    await expect(result.current.start(SERVICE)).rejects.toThrow(
      'Call defineLocationTask("never-defined", handler) at module scope first.',
    );
    expect(adapter.running.size).toBe(0);
  });

  it.each<[string, MockBackgroundLocationOptions, string]>([
    ["unsupported", { supported: false }, "unsupported"],
    [
      "without the foreground permission",
      { foregroundPermission: "denied" },
      "permission-denied",
    ],
    [
      "before the foreground permission was asked",
      { foregroundPermission: "undetermined" },
      "permission-denied",
    ],
    [
      "where the foreground permission does not exist",
      { foregroundPermission: "unsupported" },
      "unsupported",
    ],
    [
      "with location switched off",
      { servicesEnabled: false },
      "services-disabled",
    ],
  ])("rejects %s, before the adapter", async (_label, options, code) => {
    const name = defineTask();
    const { adapter, result } = await setup(name, options);
    await expect(result.current.start(SERVICE)).rejects.toMatchObject({
      name: "LocationError",
      code,
    });
    expect(adapter.running.size).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it("passes the adapter's LocationError through", async () => {
    const name = defineTask();
    const { adapter, result } = await setup(name);
    adapter.failNextStart("permission-denied");
    await expect(
      result.current.start({ foregroundService: false }),
    ).rejects.toMatchObject({ code: "permission-denied" });
    expect(result.current.isRunning).toBe(false);
  });

  it("reports any other failure of a custom adapter as unavailable", async () => {
    const name = defineTask();
    const failing: BackgroundLocationAdapter = {
      ...createMockBackgroundLocationAdapter(),
      start: () => Promise.reject(new Error("native crash")),
      stop: () => Promise.reject(new Error("stop crash")),
    };
    const { result } = await setup(name, undefined, failing as never);
    await expect(result.current.start(SERVICE)).rejects.toMatchObject({
      name: "LocationError",
      code: "unavailable",
      message: "native crash",
    });
    await expect(result.current.stop()).rejects.toMatchObject({
      code: "unavailable",
      message: "stop crash",
    });
  });

  it("stops nothing where unsupported, not even the adapter", async () => {
    const name = defineTask();
    const stop = jest.fn(() => Promise.reject(new Error("not on the web")));
    const web: BackgroundLocationAdapter = {
      ...createMockBackgroundLocationAdapter({ supported: false }),
      stop,
    };
    const { result } = await setup(name, undefined, web as never);
    await expect(result.current.stop()).resolves.toBeUndefined();
    expect(stop).not.toHaveBeenCalled();
  });

  it("does nothing where unsupported", async () => {
    const name = defineTask();
    const { result } = await setup(name, { supported: false });
    expect(result.current.isSupported).toBe(false);
    expect(result.current.isRunning).toBe(false);
    await expect(result.current.stop()).resolves.toBeUndefined();
  });

  it("keeps a start that lands while a read is still on its way", async () => {
    const name = defineTask();
    const adapter = createMockBackgroundLocationAdapter();
    let answer: (running: boolean) => void = () => {};
    const slow: BackgroundLocationAdapter = {
      ...adapter,
      hasStarted: () => new Promise((resolve) => (answer = resolve)),
    };
    const { result } = await renderHook(() => useBackgroundLocation(name), {
      wrapper: wrapperFor(slow),
    });
    expect(result.current.isRunning).toBeNull();
    await act(() => result.current.start(SERVICE));
    expect(result.current.isRunning).toBe(true);
    await act(async () => answer(false));
    expect(result.current.isRunning).toBe(true);
  });

  it("refuses an empty name while rendering", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      renderHook(() => useBackgroundLocation(""), {
        wrapper: wrapperFor(createMockBackgroundLocationAdapter()),
      }),
    ).rejects.toThrow("the task name must be a non-empty string");
    error.mockRestore();
  });

  it("is unknown while a static page renders", () => {
    let seen: { isSupported: unknown; isRunning: unknown } | undefined;
    function Probe() {
      const { isSupported, isRunning } = useBackgroundLocation("ssr");
      seen = { isSupported, isRunning };
      return null;
    }
    renderToString(
      <DeviceAdaptersProvider
        adapters={{ backgroundLocation: createMockBackgroundLocationAdapter() }}
      >
        <Probe />
      </DeviceAdaptersProvider>,
    );
    expect(seen).toEqual({ isSupported: null, isRunning: null });
  });
});

describe("useBackgroundLocationPermission", () => {
  async function setupPermission(options?: MockBackgroundLocationOptions) {
    const adapter = createMockBackgroundLocationAdapter(options);
    const { result } = await renderHook(
      () => useBackgroundLocationPermission(),
      { wrapper: wrapperFor(adapter) },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    return { adapter, result };
  }

  it("asks once the foreground permission is granted", async () => {
    const { adapter, result } = await setupPermission();
    expect(result.current).toMatchObject({
      status: "undetermined",
      canAskAgain: true,
    });
    await act(() => result.current.request());
    expect(adapter.requestCount).toBe(1);
    expect(result.current.status).toBe("granted");
  });

  it.each(["undetermined", "denied"] as const)(
    "asks nothing while the foreground permission is %s",
    async (foregroundPermission) => {
      const { adapter, result } = await setupPermission({
        foregroundPermission,
      });
      await expect(result.current.request()).resolves.toMatchObject({
        status: "undetermined",
      });
      expect(adapter.requestCount).toBe(0);
    },
  );

  it("answers a blocked permission without a prompt", async () => {
    const { adapter, result } = await setupPermission({ permission: "denied" });
    await expect(result.current.request()).resolves.toEqual({
      status: "denied",
      canAskAgain: false,
    });
    expect(adapter.requestCount).toBe(1);
  });

  it("reads denied without a way to ask, then opens the settings", async () => {
    const { result } = await setupPermission({
      permission: "denied",
    });
    expect(result.current).toMatchObject({
      status: "denied",
      canAskAgain: false,
    });
    const openSettings = jest
      .spyOn(Linking, "openSettings")
      .mockResolvedValue(undefined);
    await result.current.openSettings();
    expect(openSettings).toHaveBeenCalled();
    openSettings.mockRestore();
  });

  it("reads again on the way back from the settings", async () => {
    const { adapter, result } = await setupPermission({ permission: "denied" });
    adapter.setPermission("granted");
    await moveTo("active");
    await waitFor(() => expect(result.current.status).toBe("granted"));
  });

  it("is unsupported where the platform has none", async () => {
    const { result } = await setupPermission({ supported: false });
    expect(result.current).toMatchObject({
      status: "unsupported",
      canAskAgain: false,
    });
  });
});

it("is the same LocationError class as /location's", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the other subpath, loaded as an app would
  const location = require("../location");
  expect(location.LocationError).toBe(LocationError);
});

// The executor expo-task-manager received for the latest defineTask call.
function lastExecutor() {
  return jest.mocked(TaskManager.defineTask).mock.calls.at(-1)![1];
}

const EXECUTION = { eventId: "1", taskName: "x" };

function geofenceBody(eventType: number, identifier = "office") {
  return {
    data: {
      eventType,
      region: { identifier, latitude: 45, longitude: 9, radius: 150, state: 1 },
    },
    error: null,
    executionInfo: EXECUTION,
  };
}

describe("defineGeofenceTask", () => {
  beforeEach(() => {
    jest.mocked(TaskManager.getTaskOptionsAsync).mockReset();
  });

  it("delivers enter and exit with the region's id", async () => {
    const handler = jest.fn();
    defineGeofenceTask("geo-events", handler);
    jest.mocked(TaskManager.getTaskOptionsAsync).mockResolvedValue({
      regions: [{ identifier: "office" }],
    });
    await lastExecutor()(geofenceBody(1));
    await lastExecutor()(geofenceBody(2));
    expect(handler.mock.calls.map(([event]) => event)).toEqual([
      {
        type: "enter",
        region: { id: "office", latitude: 45, longitude: 9, radius: 150 },
      },
      {
        type: "exit",
        region: { id: "office", latitude: 45, longitude: 9, radius: 150 },
      },
    ]);
    expect(TaskManager.getTaskOptionsAsync).toHaveBeenCalledWith("geo-events");
  });

  it("drops a transition the region turned off (iOS reports it anyway)", async () => {
    const handler = jest.fn();
    defineGeofenceTask("geo-filter", handler);
    jest.mocked(TaskManager.getTaskOptionsAsync).mockResolvedValue({
      regions: [
        { identifier: "office", notifyOnEnter: true, notifyOnExit: false },
        { identifier: "depot", notifyOnEnter: false, notifyOnExit: true },
      ],
    });
    await lastExecutor()(geofenceBody(2, "office"));
    await lastExecutor()(geofenceBody(1, "depot"));
    expect(handler).not.toHaveBeenCalled();
    await lastExecutor()(geofenceBody(1, "office"));
    await lastExecutor()(geofenceBody(2, "depot"));
    expect(
      handler.mock.calls.map(([event]) => [event.type, event.region.id]),
    ).toEqual([
      ["enter", "office"],
      ["exit", "depot"],
    ]);
  });

  it("delivers when the options cannot be read or do not name the region", async () => {
    const handler = jest.fn();
    defineGeofenceTask("geo-open", handler);
    jest
      .mocked(TaskManager.getTaskOptionsAsync)
      .mockRejectedValueOnce(new Error("no options"))
      .mockResolvedValueOnce({ regions: [{ identifier: "elsewhere" }] })
      .mockResolvedValueOnce(null);
    await lastExecutor()(geofenceBody(2));
    await lastExecutor()(geofenceBody(2));
    await lastExecutor()(geofenceBody(2));
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it("reads the failures each platform reports", async () => {
    const handler = jest.fn();
    defineGeofenceTask("geo-errors", handler);
    for (const error of [
      { code: 1, message: "denied" },
      { message: "Geofencing not available." },
      { message: "Too many geofences." },
    ]) {
      // Android sends a message alone, though expo's type declares a code.
      await lastExecutor()({
        data: null,
        error: error as never,
        executionInfo: EXECUTION,
      });
    }
    expect(handler.mock.calls.map(([event]) => event.error.code)).toEqual([
      "permission-denied",
      "services-disabled",
      "unavailable",
    ]);
    expect(TaskManager.getTaskOptionsAsync).not.toHaveBeenCalled();
  });

  it("keeps a name to one kind of task", () => {
    defineLocationTask("taken-by-location", () => {});
    expect(() => defineGeofenceTask("taken-by-location", () => {})).toThrow(
      '"taken-by-location" is already a location task',
    );
    defineGeofenceTask("taken-by-geofence", () => {});
    expect(() => defineLocationTask("taken-by-geofence", () => {})).toThrow(
      '"taken-by-geofence" is already a geofence task',
    );
  });

  it("refuses a bad name or handler", () => {
    expect(() => defineGeofenceTask("", () => {})).toThrow(TypeError);
    expect(() => defineGeofenceTask("geo-no-handler", 1 as never)).toThrow(
      "defineGeofenceTask(): the handler must be a function",
    );
  });
});

const OFFICE: GeofenceRegion = {
  id: "office",
  latitude: 45.4642,
  longitude: 9.19,
  radius: 150,
};

let geofenceCount = 0;
function defineGeofence(handler: (event: GeofenceEvent) => void = () => {}) {
  const name = `sites-${++geofenceCount}`;
  defineGeofenceTask(name, handler);
  return name;
}

describe("useGeofencing", () => {
  async function setupGeofencing(
    name: string,
    options: MockBackgroundLocationOptions = { permission: "granted" },
    adapter: MockBackgroundLocationAdapter = createMockBackgroundLocationAdapter(
      options,
    ),
  ) {
    const { result } = await renderHook(() => useGeofencing(name), {
      wrapper: wrapperFor(adapter),
    });
    await waitFor(() => expect(result.current.isRunning).not.toBeNull());
    return { adapter, result };
  }

  it("watches regions, delivers their events and stops", async () => {
    const handler = jest.fn();
    const name = defineGeofence(handler);
    const { adapter, result } = await setupGeofencing(name);
    expect(result.current).toMatchObject({
      isSupported: true,
      isRunning: false,
      limit: 20,
    });
    await act(() =>
      result.current.start([
        { ...OFFICE, extra: true } as GeofenceRegion,
        { ...OFFICE, id: "depot", notifyOnExit: false },
      ]),
    );
    expect(result.current.isRunning).toBe(true);
    expect(adapter.geofences.get(name)).toEqual([
      { ...OFFICE, notifyOnEnter: undefined, notifyOnExit: undefined },
      { ...OFFICE, id: "depot", notifyOnEnter: undefined, notifyOnExit: false },
    ]);
    await adapter.deliverGeofence(name, "enter", "office");
    expect(handler).toHaveBeenCalledWith({
      type: "enter",
      region: { id: "office", latitude: 45.4642, longitude: 9.19, radius: 150 },
    });
    await expect(
      adapter.deliverGeofence(name, "exit", "nowhere"),
    ).rejects.toThrow('watches no region "nowhere"');
    await adapter.deliverGeofenceError(name, "unavailable");
    expect(handler).toHaveBeenLastCalledWith({
      type: "error",
      error: expect.objectContaining({ code: "unavailable" }),
    });
    await act(() => result.current.stop());
    expect(result.current.isRunning).toBe(false);
    await expect(
      adapter.deliverGeofence(name, "enter", "office"),
    ).rejects.toThrow("nothing runs under");
  });

  it("keeps its state apart from the location updates of another name", async () => {
    const name = defineGeofence();
    const adapter = createMockBackgroundLocationAdapter({
      permission: "granted",
    });
    await adapter.startGeofencing(name, [OFFICE]);
    const { result } = await setupGeofencing(name, undefined, adapter);
    expect(result.current.isRunning).toBe(true);
    adapter.stopBySystem(name);
    await moveTo("active");
    await waitFor(() => expect(result.current.isRunning).toBe(false));
  });

  it("needs the background permission", async () => {
    const name = defineGeofence();
    const { adapter, result } = await setupGeofencing(name, {
      permission: "denied",
    });
    await expect(result.current.start([OFFICE])).rejects.toMatchObject({
      code: "permission-denied",
      message: expect.stringContaining("background location permission"),
    });
    expect(adapter.geofences.size).toBe(0);
  });

  it.each<[string, MockBackgroundLocationOptions, string]>([
    ["unsupported", { supported: false, permission: "granted" }, "unsupported"],
    [
      "without the foreground permission",
      { foregroundPermission: "denied", permission: "granted" },
      "permission-denied",
    ],
    [
      "with location switched off",
      { servicesEnabled: false, permission: "granted" },
      "services-disabled",
    ],
  ])("rejects %s, before the adapter", async (_label, options, code) => {
    const name = defineGeofence();
    const { adapter, result } = await setupGeofencing(name, options);
    await expect(result.current.start([OFFICE])).rejects.toMatchObject({
      code,
    });
    expect(adapter.geofences.size).toBe(0);
  });

  it("refuses a task nobody defined, or one of the other kind", async () => {
    const location = defineTask();
    const { result } = await setupGeofencing(location);
    await expect(result.current.start([OFFICE])).rejects.toThrow(
      `no geofence task "${location}". Call defineGeofenceTask("${location}", handler)`,
    );
  });

  it.each<[string, unknown, string]>([
    ["no regions", [], "non-empty array"],
    ["a non-array", "office", "non-empty array"],
    ["a region that is not an object", [null], "regions[0] must be an object"],
    ["an empty id", [{ ...OFFICE, id: " " }], "regions[0].id"],
    ["a latitude off the globe", [{ ...OFFICE, latitude: 91 }], "latitude"],
    ["a string latitude", [{ ...OFFICE, latitude: "45" }], "latitude"],
    [
      "a longitude off the globe",
      [{ ...OFFICE, longitude: -181 }],
      "longitude",
    ],
    [
      "an infinite longitude",
      [{ ...OFFICE, longitude: Infinity }],
      "longitude",
    ],
    ["a zero radius", [{ ...OFFICE, radius: 0 }], "radius"],
    ["a NaN radius", [{ ...OFFICE, radius: Number.NaN }], "radius"],
    [
      "a bad flag",
      [{ ...OFFICE, notifyOnExit: "no" }],
      "notifyOnExit must be a boolean",
    ],
    [
      "a region that reports nothing",
      [{ ...OFFICE, notifyOnEnter: false, notifyOnExit: false }],
      "reports nothing",
    ],
    [
      "a duplicate id",
      [OFFICE, { ...OFFICE, latitude: 0 }],
      'the region id "office" appears twice',
    ],
  ])("refuses %s with a TypeError", async (_label, regions, message) => {
    const name = defineGeofence();
    const { adapter, result } = await setupGeofencing(name);
    const call = result.current.start(regions as never);
    await expect(call).rejects.toBeInstanceOf(TypeError);
    await expect(call).rejects.toThrow(message);
    expect(adapter.geofences.size).toBe(0);
  });

  it("accepts the edges of the globe and up to the limit", async () => {
    const name = defineGeofence();
    const { adapter, result } = await setupGeofencing(name, {
      permission: "granted",
      geofenceLimit: 2,
    });
    await act(() =>
      result.current.start([
        { id: "a", latitude: -90, longitude: 180, radius: 0.5 },
        { id: "b", latitude: 90, longitude: -180, radius: 100 },
      ]),
    );
    expect(adapter.geofences.get(name)).toHaveLength(2);
  });

  it("refuses more regions than the platform watches, with a RangeError", async () => {
    const name = defineGeofence();
    const { adapter, result } = await setupGeofencing(name, {
      permission: "granted",
      geofenceLimit: 2,
    });
    expect(result.current.limit).toBe(2);
    const call = result.current.start(
      ["a", "b", "c"].map((id) => ({ ...OFFICE, id })),
    );
    await expect(call).rejects.toBeInstanceOf(RangeError);
    await expect(call).rejects.toThrow("at most 2");
    expect(adapter.geofences.size).toBe(0);
  });

  it("passes the adapter's errors on, and anything else as unavailable", async () => {
    const name = defineGeofence();
    const { adapter, result } = await setupGeofencing(name);
    adapter.failNextStart("unsupported");
    await expect(result.current.start([OFFICE])).rejects.toMatchObject({
      code: "unsupported",
    });
    const failing: BackgroundLocationAdapter = {
      ...createMockBackgroundLocationAdapter({ permission: "granted" }),
      startGeofencing: () => Promise.reject(new Error("native crash")),
      stopGeofencing: () => Promise.reject(new Error("stop crash")),
    };
    const other = await setupGeofencing(name, undefined, failing as never);
    await expect(other.result.current.start([OFFICE])).rejects.toMatchObject({
      code: "unavailable",
      message: "native crash",
    });
    await expect(other.result.current.stop()).rejects.toMatchObject({
      code: "unavailable",
      message: "stop crash",
    });
  });

  it("stops nothing where unsupported", async () => {
    const name = defineGeofence();
    const stopGeofencing = jest.fn(() => Promise.reject(new Error("web")));
    const web: BackgroundLocationAdapter = {
      ...createMockBackgroundLocationAdapter({ supported: false }),
      stopGeofencing,
    };
    const { result } = await setupGeofencing(name, undefined, web as never);
    expect(result.current.isSupported).toBe(false);
    expect(result.current.isRunning).toBe(false);
    await expect(result.current.stop()).resolves.toBeUndefined();
    expect(stopGeofencing).not.toHaveBeenCalled();
  });

  it("refuses an empty name while rendering", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      renderHook(() => useGeofencing(" "), {
        wrapper: wrapperFor(createMockBackgroundLocationAdapter()),
      }),
    ).rejects.toThrow(
      "useGeofencing(): the task name must be a non-empty string",
    );
    error.mockRestore();
  });
});
