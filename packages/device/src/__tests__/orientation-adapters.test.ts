// isolateModules needs require(): the Expo adapter keeps the app's saved lock
// at module scope, and every test starts without one.
/* eslint-disable @typescript-eslint/no-require-imports */
import * as ScreenOrientation from "expo-screen-orientation";
import { Platform } from "react-native";

import { isOrientationError } from "../orientation/errors";
import type { OrientationAdapter } from "../orientation/types";
import { webOrientationAdapter } from "../orientation/web";

jest.mock("expo-screen-orientation", () => ({
  Orientation: {
    UNKNOWN: 0,
    PORTRAIT_UP: 1,
    PORTRAIT_DOWN: 2,
    LANDSCAPE_LEFT: 3,
    LANDSCAPE_RIGHT: 4,
  },
  OrientationLock: {
    DEFAULT: 0,
    ALL: 1,
    PORTRAIT: 2,
    PORTRAIT_UP: 3,
    PORTRAIT_DOWN: 4,
    LANDSCAPE: 5,
    LANDSCAPE_LEFT: 6,
    LANDSCAPE_RIGHT: 7,
  },
  getOrientationAsync: jest.fn(),
  addOrientationChangeListener: jest.fn(),
  getPlatformOrientationLockAsync: jest.fn(),
  lockAsync: jest.fn(),
  lockPlatformAsync: jest.fn(),
  unlockAsync: jest.fn(),
}));

// The web adapter reads `hasDOM()`, false under the native jest preset.
jest.mock("../core/support", () => ({
  ...jest.requireActual("../core/support"),
  hasDOM: () => true,
}));

const expo = jest.mocked(ScreenOrientation);
const { OrientationLock } = ScreenOrientation;

describe("expoOrientationAdapter", () => {
  let adapter: OrientationAdapter;
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    expo.lockAsync.mockResolvedValue();
    expo.lockPlatformAsync.mockResolvedValue();
    expo.unlockAsync.mockResolvedValue();
    expo.getPlatformOrientationLockAsync.mockResolvedValue({
      screenOrientationArrayIOS: [ScreenOrientation.Orientation.PORTRAIT_UP],
    });
    jest.isolateModules(() => {
      adapter = require("../orientation/expo").expoOrientationAdapter;
    });
  });
  afterEach(() => {
    Platform.OS = originalOS;
  });

  it("maps the orientation", async () => {
    expo.getOrientationAsync.mockResolvedValue(
      ScreenOrientation.Orientation.LANDSCAPE_RIGHT,
    );
    expect(await adapter.getOrientation()).toBe("landscape-right");
    expo.getOrientationAsync.mockResolvedValue(
      ScreenOrientation.Orientation.UNKNOWN,
    );
    expect(await adapter.getOrientation()).toBe("unknown");
  });

  it("follows changes and removes its listener", () => {
    const remove = jest.fn();
    let handler!: (event: ScreenOrientation.OrientationChangeEvent) => void;
    expo.addOrientationChangeListener.mockImplementation((h) => {
      handler = h;
      return { remove };
    });
    const listener = jest.fn();
    const stop = adapter.subscribe(listener);
    handler({
      orientationLock: OrientationLock.DEFAULT,
      orientationInfo: {
        orientation: ScreenOrientation.Orientation.PORTRAIT_DOWN,
      },
    });
    expect(listener).toHaveBeenCalledWith("portrait-down");
    stop();
    expect(remove).toHaveBeenCalled();
  });

  it("locks portrait upright, never with upside down", async () => {
    await adapter.lock("portrait");
    expect(expo.lockAsync).toHaveBeenCalledWith(OrientationLock.PORTRAIT_UP);
  });

  it("saves the app's lock once and puts it back on unlock", async () => {
    await adapter.lock("landscape");
    await adapter.lock("landscape-left");
    expect(expo.getPlatformOrientationLockAsync).toHaveBeenCalledTimes(1);
    await adapter.unlock();
    expect(expo.lockPlatformAsync).toHaveBeenCalledWith({
      screenOrientationArrayIOS: [ScreenOrientation.Orientation.PORTRAIT_UP],
    });
    expect(expo.unlockAsync).not.toHaveBeenCalled();
    // The next lock reads the app's lock again.
    await adapter.lock("landscape");
    expect(expo.getPlatformOrientationLockAsync).toHaveBeenCalledTimes(2);
  });

  it("restores Android's landscape attribute (0) through lockAsync", async () => {
    Platform.OS = "android";
    expo.getPlatformOrientationLockAsync.mockResolvedValue({
      screenOrientationConstantAndroid: 0,
    });
    await adapter.lock("portrait");
    await adapter.unlock();
    expect(expo.lockPlatformAsync).not.toHaveBeenCalled();
    expect(expo.lockAsync).toHaveBeenLastCalledWith(
      OrientationLock.LANDSCAPE_RIGHT,
    );
  });

  it("falls back to unlockAsync when the saved lock cannot be restored", async () => {
    expo.lockPlatformAsync.mockRejectedValue(new Error("invalid"));
    await adapter.lock("landscape");
    await expect(adapter.unlock()).resolves.toBeUndefined();
    expect(expo.unlockAsync).toHaveBeenCalled();
  });

  it("does nothing on unlock when it never locked", async () => {
    await adapter.unlock();
    expect(expo.lockPlatformAsync).not.toHaveBeenCalled();
    expect(expo.unlockAsync).not.toHaveBeenCalled();
  });

  it("rejects a refused lock with an OrientationError", async () => {
    expo.lockAsync.mockRejectedValue(new Error("not supported by device"));
    const error = await adapter.lock("landscape").catch((e: unknown) => e);
    expect(isOrientationError(error)).toBe(true);
    expect(error).toMatchObject({
      code: "failed",
      message: "not supported by device",
    });
  });
});

describe("webOrientationAdapter", () => {
  const originalScreen = globalThis.screen;
  let orientation: {
    type: string;
    listeners: Set<() => void>;
    addEventListener(type: "change", fn: () => void): void;
    removeEventListener(type: "change", fn: () => void): void;
    lock?: jest.Mock;
    unlock?: jest.Mock;
  } | null;

  beforeEach(() => {
    orientation = {
      type: "portrait-primary",
      listeners: new Set(),
      addEventListener(_type, fn) {
        this.listeners.add(fn);
      },
      removeEventListener(_type, fn) {
        this.listeners.delete(fn);
      },
      lock: jest.fn(async () => {}),
      unlock: jest.fn(),
    };
    Object.defineProperty(globalThis, "screen", {
      configurable: true,
      get: () => ({ orientation: orientation ?? undefined }),
    });
  });
  afterAll(() => {
    Object.defineProperty(globalThis, "screen", {
      configurable: true,
      value: originalScreen,
    });
  });

  it("reads screen.orientation, named as on native", async () => {
    expect(await webOrientationAdapter.getOrientation()).toBe("portrait-up");
    orientation!.type = "landscape-secondary";
    expect(await webOrientationAdapter.getOrientation()).toBe(
      "landscape-right",
    );
  });

  it("is unsupported without screen.orientation", () => {
    expect(webOrientationAdapter.isSupported()).toBe(true);
    orientation = null;
    expect(webOrientationAdapter.isSupported()).toBe(false);
    expect(webOrientationAdapter.supportsLock()).toBe(false);
  });

  it("follows change events, then lets go", () => {
    const listener = jest.fn();
    const stop = webOrientationAdapter.subscribe(listener);
    orientation!.type = "landscape-primary";
    orientation!.listeners.forEach((fn) => fn());
    expect(listener).toHaveBeenCalledWith("landscape-left");
    stop();
    expect(orientation!.listeners.size).toBe(0);
  });

  it("locks with the browser's names", async () => {
    await webOrientationAdapter.lock("portrait");
    expect(orientation!.lock).toHaveBeenCalledWith("portrait-primary");
    await webOrientationAdapter.lock("landscape");
    expect(orientation!.lock).toHaveBeenLastCalledWith("landscape");
  });

  it("reports a refused lock as unsupported", async () => {
    orientation!.lock!.mockRejectedValue(new Error("NotSupportedError"));
    await expect(webOrientationAdapter.lock("landscape")).rejects.toMatchObject(
      { name: "OrientationError", code: "unsupported" },
    );
    delete orientation!.lock;
    expect(webOrientationAdapter.supportsLock()).toBe(false);
    await expect(webOrientationAdapter.lock("landscape")).rejects.toMatchObject(
      { code: "unsupported" },
    );
  });

  it("unlocks with unlock(), never with another lock", async () => {
    await webOrientationAdapter.unlock();
    expect(orientation!.unlock).toHaveBeenCalled();
    expect(orientation!.lock).not.toHaveBeenCalled();
    orientation!.unlock!.mockImplementation(() => {
      throw new Error("InvalidStateError");
    });
    await expect(webOrientationAdapter.unlock()).resolves.toBeUndefined();
  });
});
