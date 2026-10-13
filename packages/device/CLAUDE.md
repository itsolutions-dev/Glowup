# packages/device — the headless device hardware package

Roadmap and decisions: `docs/device-package-plan.md`. Read it before adding a capability.

- **Private until v1.** `"private": true` keeps `changeset publish` (which publishes any
  non-private package whose version is not on npm, changeset or not) from shipping a
  half-built package on the next push to `master`. Phase 6 removes it and adds the first
  changeset; do not add one before.
- **One subpath per capability.** `./info`, `./location`, `./camera`, plus `./testing`. Each
  capability owns its Expo modules (`expo-device` + `expo-application`, `expo-location`,
  `expo-camera`), and those are **optional** peers (`peerDependenciesMeta`): Metro resolves
  every static import reachable from an entry point, so a native import is only safe inside
  the folder of the subpath that needs it. ESLint enforces it (`DEVICE_CAPABILITIES` in the
  root `eslint.config.js`): a capability cannot import another capability or another
  capability's Expo module; the root entry, `core/` and `testing/` import no native module and
  may only `import type` from a capability. Add a new Expo module to `DEVICE_CAPABILITIES`
  in the same change that adds it as a peer.
- **Adding a subpath** means four things kept in step: the `exports` entry, the node10
  fallback folder (`<name>/package.json`, which attw checks), its name in `files`, and the
  list in `src/__tests__/package-exports.test.ts` (which fails when any of them drifts).
- **Adapters.** Hooks and components talk only to a capability's adapter interface, never to
  Expo. The interface's types are the package's own: an Expo type in a public signature
  ties the API to one implementation. The Expo adapter is the default (imported by its
  subpath); an app overrides it through the provider, and `/testing` supplies in-memory
  adapters the same way — no `jest.mock` of Expo modules.
- **The provider** (`src/core/adapters.tsx`) lives in core and names each capability's adapter
  by `import type` only. A new capability adds its key to `DeviceAdapters` and to the
  provider's `useMemo` (one dependency per adapter, because `adapters` is usually an inline
  literal). Hooks read `useDeviceAdapter(key) ?? <expo default>`.
- **Static values go through `useSyncExternalStore`** with a server snapshot (see
  `info/useDeviceInfo.ts`): the web export prerenders in Node, and rendering the adapter's
  answer there would mismatch on hydration. `__tests__/info-ssr.test.tsx` pins it with
  `react-dom/server`.
- **Permissions.** Every capability reports `PermissionState` (`src/core/types.ts`).
  Expo adapters convert with `toPermissionState()`; a capability needing several
  permissions (camera + microphone) combines them with `combinePermissions()`. It is a copy
  of the notifications model on purpose: the two packages stay independent.
- **Web.** The static export prerenders in Node. Read browser globals at call time
  (`hasDOM()`), never at module scope, and keep an `isSupported` / `assertSupported()`
  guard on every imperative API.
- **`react` and `react-dom` are pinned dev dependencies** at the playground's versions. Without
  them, adding an Expo module whose peer is `expo` fails with ERESOLVE: npm resolves expo's
  optional `react-dom` peer to the latest release, whose `react` peer the tree cannot meet.
  Bump them with the Expo SDK, like every other native version.
- Build, `files`, source maps and `validate-package` work as in `packages/ui` (see its
  CLAUDE.md).
