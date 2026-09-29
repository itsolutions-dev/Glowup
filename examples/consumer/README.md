# Glowup consumer smoke test

A minimal Expo app that consumes **`@its/glowup-ui` installed from the npm registry**.

## Why this exists

`apps/playground` is an npm workspace, so its `@its/glowup-ui` is a symlink to
`packages/ui`: it always runs the local **source**. That is the right trade-off for
development — edit a component, see it immediately — but it means nothing in this repo
exercises the artefact that npm actually ships. `npm run validate-package` checks the
tarball's manifest and types statically; this app is the runtime half:

- the **export map** resolves for a real bundler,
- the **published `.d.ts`** resolves and type-checks (it once shipped a `.d.ts` that
  imported `theme.json`, a file the declaration build does not emit — `App.tsx` annotates a
  value as `ThemeColorTokens` so a regression like that fails here),
- the **declared peer dependencies** are sufficient to render.

## Why it is NOT in the workspaces

The root `package.json` lists `apps/*` and `packages/*`. This app lives under `examples/` on
purpose: npm links a local workspace whenever its version satisfies the requested range, so
adding it to the workspaces (or moving it under `apps/`) would silently turn it back into a
symlink to `packages/ui` and the smoke test would stop testing anything. The CI job fails
explicitly if that happens.

The consequence is that this app has its own `node_modules` and its own lockfile-less
install, and that it validates the **last published version**, not your working tree.

## Running it

```bash
cd examples/consumer
npm install          # pulls @its/glowup-ui from the registry
npm run smoke        # tsc --noEmit + expo export -p web
npm run web          # or open it in a browser
```

## Which version it tests

CI does not trust a range: it reads the version `packages/ui/package.json` declares at
the commit being tested and installs exactly that (`npm install --no-save
@its/glowup-ui@<version>`), waiting for it to appear on the registry first. On `master`
that is the version Release just published, so a publish that failed shows up here as a
failure instead of a green run against an older release.

`package.json` still lists `0.x`, which is only what a local `npm install` resolves: the
newest published 0.x. (A caret would be wrong in 0.x — `^0.5.0` stops at 0.5.x — which is
how this app once kept testing 0.5 after 0.7 shipped.) Keep `App.tsx` to API that exists in
the version being released: a component removed in a minor has to leave this file in the
same PR.
