# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets) — it
drives versioning and changelog generation for the publishable packages in this monorepo
(currently `@glowup/ui`; the private `@glowup/playground` app is ignored).

## Adding a changeset

When you make a change to `@glowup/ui` that should ship in a release, run:

```bash
npx changeset
```

Pick the bump type (patch / minor / major) and write a short summary. This creates a
markdown file here that gets committed with your PR.

## How releases happen

On push to `master`, the release workflow (`.github/workflows/release.yml`) opens (or
updates) a **"Version Packages"** PR that consumes the pending changesets, bumps versions,
and updates changelogs. Merging that PR publishes `@glowup/ui` to npm.

Publishing requires an `NPM_TOKEN` repository secret with publish rights to the `@glowup`
scope.
