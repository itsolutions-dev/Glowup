# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets) — it
drives versioning and changelog generation for the publishable packages in this monorepo
(`@its/glowup-ui`, `@its/glowup-notifications`, `@its/glowup-device` and `@its/rfid-honeywell`,
versioned independently; the private `@its/glowup-playground` and `@its/rfid-diagnostics` apps are
ignored).

## Adding a changeset

When you make a change to a published package that should ship in a release, run:

```bash
npx changeset
```

Pick the bump type (patch / minor / major) and write a short summary. This creates a
markdown file here that gets committed with your PR.

## How releases happen

On push to `master`, the release workflow (`.github/workflows/release.yml`) opens (or
updates) a **"Version Packages"** PR that consumes the pending changesets, bumps versions,
and updates changelogs. Merging that PR publishes every bumped package to npm.

Publishing uses npm trusted publishing: the job's OIDC token is traded for a short-lived
credential, so there is no `NPM_TOKEN` secret. Each package needs its trusted publisher set up
once on npmjs.com (package → Settings → Trusted publishing → GitHub Actions, repository
`itsolutions-dev/Glowup`, workflow `release.yml`).

Trusted publishing cannot create a package: for one npm does not know yet it answers `E404`
on `PUT`. A package's **first** version therefore goes out through a
temporary granular token in the `NPM_TOKEN` secret, still from the workflow and still with
provenance (`publishConfig.provenance`): npm tries OIDC first and falls back to the token only
where the exchange fails. Once every package has its trusted publisher, delete the secret and
the `NODE_AUTH_TOKEN` line in `release.yml`.
