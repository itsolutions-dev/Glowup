// isolateModules needs require(): the web adapter keeps its holds at module
// scope, and every test starts from none.
/* eslint-disable @typescript-eslint/no-require-imports */
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";

import { expoKeepAwakeAdapter } from "../keep-awake/expo";
import type { KeepAwakeAdapter } from "../keep-awake/types";

jest.mock("expo-keep-awake", () => ({
  activateKeepAwakeAsync: jest.fn(async () => {}),
  deactivateKeepAwake: jest.fn(async () => {}),
}));

// The web adapter reads `hasDOM()`, false under the native jest preset.
jest.mock("../core/support", () => ({
  ...jest.requireActual("../core/support"),
  hasDOM: () => true,
}));

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe("expoKeepAwakeAdapter", () => {
  it("activates and deactivates by tag", async () => {
    await expoKeepAwakeAdapter.activate("a");
    expect(activateKeepAwakeAsync).toHaveBeenCalledWith("a");
    await expoKeepAwakeAdapter.deactivate("a");
    expect(deactivateKeepAwake).toHaveBeenCalledWith("a");
  });

  it("swallows a failed deactivation", async () => {
    jest
      .mocked(deactivateKeepAwake)
      .mockRejectedValueOnce(new Error("unknown tag"));
    await expect(expoKeepAwakeAdapter.deactivate("x")).resolves.toBeUndefined();
  });
});

describe("webKeepAwakeAdapter", () => {
  const originalNavigator = globalThis.navigator;
  const originalDocument = globalThis.document;

  interface Sentinel {
    released: boolean;
    release: jest.Mock;
    addEventListener(type: "release", fn: () => void): void;
    /** What the browser does when the tab is hidden. */
    browserRelease(): void;
  }

  let adapter: KeepAwakeAdapter;
  let visibility: "visible" | "hidden";
  let documentListeners: Set<() => void>;
  let sentinels: Sentinel[];
  let pending: ((sentinel: Sentinel) => void)[];
  let autoResolve: boolean;

  function makeSentinel(): Sentinel {
    const onRelease: (() => void)[] = [];
    const sentinel: Sentinel = {
      released: false,
      release: jest.fn(async () => sentinel.browserRelease()),
      addEventListener: (_type, fn) => onRelease.push(fn),
      browserRelease() {
        if (sentinel.released) return;
        sentinel.released = true;
        onRelease.forEach((fn) => fn());
      },
    };
    sentinels.push(sentinel);
    return sentinel;
  }

  const held = () => sentinels.filter((s) => !s.released).length;

  function setVisibility(next: "visible" | "hidden") {
    visibility = next;
    if (next === "hidden") sentinels.forEach((s) => s.browserRelease());
    documentListeners.forEach((fn) => fn());
  }

  beforeEach(() => {
    visibility = "visible";
    documentListeners = new Set();
    sentinels = [];
    pending = [];
    autoResolve = true;
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        wakeLock: {
          request: () =>
            autoResolve
              ? Promise.resolve(makeSentinel())
              : new Promise<Sentinel>((resolve) => pending.push(resolve)),
        },
      },
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        get visibilityState() {
          return visibility;
        },
        addEventListener: (_type: string, fn: () => void) =>
          documentListeners.add(fn),
        removeEventListener: (_type: string, fn: () => void) =>
          documentListeners.delete(fn),
      },
    });
    jest.isolateModules(() => {
      adapter = require("../keep-awake/web").webKeepAwakeAdapter;
    });
  });
  afterAll(() => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: originalDocument,
    });
  });

  it("is supported only with the Screen Wake Lock API", () => {
    expect(adapter.isSupported()).toBe(true);
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {},
    });
    expect(adapter.isSupported()).toBe(false);
  });

  it("holds one lock per tag and releases each with its tag", async () => {
    await adapter.activate("a");
    await adapter.activate("b");
    expect(held()).toBe(2);
    await adapter.deactivate("a");
    expect(held()).toBe(1);
    await adapter.deactivate("b");
    expect(held()).toBe(0);
  });

  it("re-acquires the lock the browser drops when the tab is hidden", async () => {
    await adapter.activate("a");
    setVisibility("hidden");
    expect(held()).toBe(0);
    setVisibility("visible");
    await flush();
    expect(held()).toBe(1);
  });

  it("waits for the tab to show when activated while hidden", async () => {
    visibility = "hidden";
    await adapter.activate("a");
    expect(sentinels).toHaveLength(0);
    setVisibility("visible");
    await flush();
    expect(held()).toBe(1);
  });

  it("releases a lock granted after its deactivation", async () => {
    autoResolve = false;
    const activation = adapter.activate("a");
    await adapter.deactivate("a");
    pending[0](makeSentinel());
    await activation;
    expect(held()).toBe(0);
  });

  it("sends one request while one is in flight", async () => {
    autoResolve = false;
    const activation = adapter.activate("a");
    setVisibility("visible");
    expect(pending).toHaveLength(1);
    pending[0](makeSentinel());
    await activation;
    expect(held()).toBe(1);
  });

  it("stops listening to visibility once the last tag lets go", async () => {
    await adapter.activate("a");
    await adapter.activate("b");
    expect(documentListeners.size).toBe(1);
    await adapter.deactivate("a");
    expect(documentListeners.size).toBe(1);
    await adapter.deactivate("b");
    expect(documentListeners.size).toBe(0);
  });

  it("ignores an unknown tag", async () => {
    await expect(adapter.deactivate("nope")).resolves.toBeUndefined();
  });
});
