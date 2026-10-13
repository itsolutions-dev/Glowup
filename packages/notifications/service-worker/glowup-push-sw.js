/*
 * @its/glowup-notifications — Web Push service worker.
 *
 * Serve this file from your web app's origin (for an Expo web app: copy it into
 * `public/`) at the path passed as `webPush.serviceWorkerPath`, by default
 * `/glowup-push-sw.js`. If the app already has a service worker, load this one
 * from it instead: `importScripts("/glowup-push-sw.js")`.
 *
 * A push whose body is JSON ({ id, title, body, data, icon, badge, url, actions })
 * is handed to a visible tab, where NotificationsProvider applies its foreground
 * policy and calls onReceived; with no visible tab it is shown here. A tap is
 * posted to an open tab, or opens `url` with the tap in the URL hash, and reaches
 * onResponse either way.
 *
 * Plain script, no imports and no build step: it runs as served.
 */
(function () {
  const SOURCE = "glowup-notifications";
  const HASH_KEY = "glowup-notification=";

  function readPayload(event) {
    if (!event.data) return {};
    try {
      return event.data.json();
    } catch {
      return { body: event.data.text() };
    }
  }

  function toNotification(payload) {
    return {
      id:
        payload.id ||
        Date.now().toString(36) + Math.random().toString(36).slice(2),
      date: Date.now(),
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      icon: payload.icon,
      badge: payload.badge,
      url: payload.url,
      actions: payload.actions,
    };
  }

  function show(notification) {
    return self.registration.showNotification(notification.title || "", {
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge,
      tag: notification.id,
      actions: notification.actions || [],
      data: { glowup: notification },
    });
  }

  function windows() {
    return self.clients.matchAll({ type: "window", includeUncontrolled: true });
  }

  self.addEventListener("install", function () {
    self.skipWaiting();
  });

  self.addEventListener("activate", function (event) {
    event.waitUntil(self.clients.claim());
  });

  self.addEventListener("push", function (event) {
    const notification = toNotification(readPayload(event));
    event.waitUntil(
      windows().then(function (clients) {
        const visible = clients.find(function (client) {
          return client.focused || client.visibilityState === "visible";
        });
        if (visible) {
          // The page decides whether to show it (foreground policy). Browsers
          // accept a push that shows nothing while one of the site's tabs is visible.
          visible.postMessage({
            source: SOURCE,
            type: "push",
            notification: notification,
          });
          return undefined;
        }
        return show(notification);
      }),
    );
  });

  self.addEventListener("notificationclick", function (event) {
    const shown = event.notification;
    const notification = (shown.data && shown.data.glowup) || {
      id: shown.tag || String(Date.now()),
      date: Date.now(),
      title: shown.title,
      body: shown.body,
      data: {},
    };
    const action = event.action || "";
    shown.close();
    event.waitUntil(
      windows().then(function (clients) {
        const client =
          clients.find(function (candidate) {
            return candidate.focused;
          }) || clients[0];
        if (client) {
          client.postMessage({
            source: SOURCE,
            type: "click",
            notification: notification,
            action: action,
          });
          return client.focus ? client.focus() : undefined;
        }
        const url = new URL(notification.url || "/", self.location.origin);
        url.hash =
          HASH_KEY +
          encodeURIComponent(
            JSON.stringify({ notification: notification, action: action }),
          );
        return self.clients.openWindow(url.href);
      }),
    );
  });

  // The browser rotated or dropped the subscription: open tabs subscribe again
  // and report the new one through onTokenChange.
  self.addEventListener("pushsubscriptionchange", function (event) {
    event.waitUntil(
      windows().then(function (clients) {
        clients.forEach(function (client) {
          client.postMessage({ source: SOURCE, type: "subscription-change" });
        });
      }),
    );
  });
})();
