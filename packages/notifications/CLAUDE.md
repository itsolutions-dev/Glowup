# packages/notifications — the headless notifications package

- **Headless and standalone.** No UI, no `@its/glowup-ui`, no navigator, no API client. ESLint
  blocks all of them. Routing happens in the app's `onResponse`; token registration in its
  `onTokenChange`.
- **Peers.** `expo-notifications`, `react` and `react-native` are the only peers, and all of
  them are required. Metro resolves every static import reachable from the barrel, so a new
  native dependency (for example `expo-task-manager` for background tasks) is a new
  _required_ peer for every consumer. Put it in a separate package instead.
- **Web.** `isNotificationsSupported` (`src/support.ts`) is false on web. The provider skips
  every native call there, and the imperative helpers (scheduling, badge, presented) call
  `assertSupported()` and reject. Keep one of the two guards on anything new.
- **Web Push** (`src/web/webPush.ts`, `service-worker/glowup-push-sw.js`) uses browser APIs
  directly, not expo-notifications. Browser globals are read at call time only: the static
  export prerenders in Node. The worker is a plain script that consumers serve as is (no
  imports, no build). It talks to the page with `postMessage` (`source: "glowup-notifications"`)
  and through the URL hash when a tap opens a new tab, so change both sides together.
  `validate-package` excludes `./service-worker.js` from attw because it is a script, not a module.
- **Callbacks through `latest`.** The provider registers its native listeners once and reads
  props through a ref. Don't put callback props in effect dependencies.
- **Response dedupe** (`src/responses.ts`) is module-scoped on purpose: it must survive a
  provider remount.
- **`/testing` subpath** (`src/testing`) is public API: an in-memory `expo-notifications` for
  apps' tests. It must not import `expo-notifications` at runtime (it replaces it) or need
  Jest. When the package starts calling a new `expo-notifications` function, add it to the
  mock's `module` too, or every consumer test breaks. `testing/package.json` is the node10
  fallback for the subpath (attw checks it); keep it beside the `exports` entry.
- **One build for every resolver.** The root and `testing/package.json` point only at
  `lib/commonjs` (`main`, `types`, `source`): no `react-native` or `module` field. Metro reads a
  subpath through its fallback folder, the root through `exports`; a field in either that leads
  elsewhere bundles the package twice. `src/__tests__/package-exports.test.ts` pins it.
- Tests (`src/__tests__`) run on that same mock. RTL 14 is async: `await renderHook(...)`,
  `await act(...)`.
- Build, `files`, source maps and `validate-package` work as in `packages/ui` (see its
  CLAUDE.md). The declaration-map stripper is shared at the repo root
  (`scripts/strip-declaration-maps.mjs`).
