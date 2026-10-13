import { readFileSync } from "fs";
import { join } from "path";

import { MESSAGE_SOURCE, takeLaunchResponseFromUrl } from "../web/webPush";

// webPush.ts imports expo-notifications; the real one warns about Expo Go on load.
jest.mock(
  "expo-notifications",
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("../testing").notificationsMock.module,
);

/**
 * The service worker is a plain script consumers serve as is, so it is tested
 * as is: evaluated against a fake `self` that records what it does.
 */
const SOURCE = readFileSync(
  join(__dirname, "../../service-worker/glowup-push-sw.js"),
  "utf8",
);

interface FakeClient {
  focused: boolean;
  visibilityState: "visible" | "hidden";
  postMessage: jest.Mock;
  focus: jest.Mock;
}

const client = (state: Partial<FakeClient> = {}): FakeClient => ({
  focused: false,
  visibilityState: "hidden",
  postMessage: jest.fn(),
  focus: jest.fn(async () => {}),
  ...state,
});

function bootWorker(clients: FakeClient[] = []) {
  const handlers: Record<string, (event: any) => void> = {};
  const self = {
    addEventListener: (type: string, handler: (event: any) => void) => {
      handlers[type] = handler;
    },
    skipWaiting: jest.fn(),
    location: { origin: "https://app.example" },
    registration: { showNotification: jest.fn(async () => {}) },
    clients: {
      matchAll: jest.fn(async () => clients),
      claim: jest.fn(async () => {}),
      openWindow: jest.fn(async (_url: string) => null),
    },
  };
  new Function("self", SOURCE)(self);

  /** Fires an event and waits for what it passed to waitUntil. */
  const fire = async (type: string, event: object = {}) => {
    let pending: Promise<unknown> = Promise.resolve();
    handlers[type]({
      ...event,
      waitUntil: (promise: Promise<unknown>) => {
        pending = promise;
      },
    });
    await pending;
  };
  return { self, fire };
}

const pushEvent = (payload: unknown) => ({
  data: {
    json: () => {
      if (typeof payload !== "object") throw new SyntaxError("not JSON");
      return payload;
    },
    text: () => String(payload),
  },
});

describe("service worker", () => {
  it("hands a push to a visible tab instead of showing it", async () => {
    const tab = client({ visibilityState: "visible" });
    const { self, fire } = bootWorker([tab]);

    await fire("push", pushEvent({ id: "n1", title: "Hi", data: { a: 1 } }));

    expect(self.registration.showNotification).not.toHaveBeenCalled();
    expect(tab.postMessage).toHaveBeenCalledWith({
      source: MESSAGE_SOURCE,
      type: "push",
      notification: expect.objectContaining({
        id: "n1",
        title: "Hi",
        data: { a: 1 },
      }),
    });
  });

  it("shows the push when no tab is visible", async () => {
    const { self, fire } = bootWorker([client()]);

    await fire(
      "push",
      pushEvent({
        id: "n2",
        title: "Order shipped",
        body: "Tap to open",
        actions: [{ action: "track", title: "Track" }],
      }),
    );

    expect(self.registration.showNotification).toHaveBeenCalledWith(
      "Order shipped",
      expect.objectContaining({
        body: "Tap to open",
        tag: "n2",
        actions: [{ action: "track", title: "Track" }],
        data: { glowup: expect.objectContaining({ id: "n2" }) },
      }),
    );
  });

  it("shows a plain-text push as its body", async () => {
    const { self, fire } = bootWorker();
    await fire("push", pushEvent("just text"));
    expect(self.registration.showNotification).toHaveBeenCalledWith(
      "",
      expect.objectContaining({ body: "just text" }),
    );
  });

  it("posts a tap to the focused tab and focuses it", async () => {
    const background = client();
    const focused = client({ focused: true });
    const { fire } = bootWorker([background, focused]);
    const close = jest.fn();

    await fire("notificationclick", {
      action: "track",
      notification: {
        close,
        data: { glowup: { id: "n3", title: "Hi", data: {} } },
      },
    });

    expect(close).toHaveBeenCalled();
    expect(focused.postMessage).toHaveBeenCalledWith({
      source: MESSAGE_SOURCE,
      type: "click",
      notification: { id: "n3", title: "Hi", data: {} },
      action: "track",
    });
    expect(focused.focus).toHaveBeenCalled();
    expect(background.postMessage).not.toHaveBeenCalled();
  });

  it("opens a tab with the tap in the hash, which the page reads back", async () => {
    const { self, fire } = bootWorker([]);
    const notification = {
      id: "n4",
      title: "Hi",
      data: { orderId: "42" },
      url: "/orders",
    };

    await fire("notificationclick", {
      action: "",
      notification: { close: jest.fn(), data: { glowup: notification } },
    });

    const opened = new URL(self.clients.openWindow.mock.calls[0][0]);
    expect(opened.origin + opened.pathname).toBe("https://app.example/orders");

    // The page side of the same contract.
    const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { hash: opened.hash, pathname: "/orders", search: "" },
        history: { state: null, replaceState: jest.fn() },
      },
    });
    try {
      expect(takeLaunchResponseFromUrl()).toEqual({ notification, action: "" });
    } finally {
      if (previous) Object.defineProperty(globalThis, "window", previous);
      else delete (globalThis as Record<string, unknown>).window;
    }
  });

  it("tells every tab when the subscription changes", async () => {
    const tabs = [client(), client({ visibilityState: "visible" })];
    const { fire } = bootWorker(tabs);

    await fire("pushsubscriptionchange");

    for (const tab of tabs) {
      expect(tab.postMessage).toHaveBeenCalledWith({
        source: MESSAGE_SOURCE,
        type: "subscription-change",
      });
    }
  });
});
