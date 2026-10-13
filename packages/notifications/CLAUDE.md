# packages/notifications — the headless notifications package

- **Headless and standalone.** No UI, no `@its/glowup-ui`, no navigator, no API client. ESLint
  blocks all of them. Routing happens in the app's `onResponse`; token registration in its
  `onTokenChange`.
- **Peers.** `expo-notifications`, `react` and `react-native` are the only peers, and all of
  them are required. Metro resolves every static import reachable from the barrel, so a new
  native dependency (for example `expo-task-manager` for background tasks) is a new
  _required_ peer for every consumer. Put it in a separate package instead.
- **Web.** `isNotificationsSupported` is false on web, and every native call is guarded by it.
  Keep that guard on anything new.
- **Callbacks through `latest`.** The provider registers its native listeners once and reads
  props through a ref. Don't put callback props in effect dependencies.
- **Response dedupe** (`src/responses.ts`) is module-scoped on purpose: it must survive a
  provider remount.
- Tests (`src/__tests__`) mock `expo-notifications` with a small listener registry. RTL 14 is
  async: `await renderHook(...)`, `await act(...)`.
- Build, `files`, source maps and `validate-package` work as in `packages/ui` (see its
  CLAUDE.md). The declaration-map stripper is shared at the repo root
  (`scripts/strip-declaration-maps.mjs`).
