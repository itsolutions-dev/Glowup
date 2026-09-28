# Security Policy

## Supported versions

`@its/glowup-ui` is pre-1.0: only the latest published minor receives fixes. A fix
ships as a new version; older minors are not patched.

| Version                   | Supported |
| ------------------------- | --------- |
| latest `0.x` minor        | ✅        |
| any earlier `0.x` minor   | ❌        |

The documentation site (`apps/playground`) and the smoke-test app
(`examples/consumer`) are not published packages and are not versioned.

## Reporting a vulnerability

Please **do not open a public issue**. Report it privately through GitHub's
[private vulnerability reporting](https://github.com/itsolutions-dev/Glowup/security/advisories/new)
(repository → Security → Report a vulnerability).

Include the affected version, the platform (iOS, Android or web), and a minimal
reproduction. You can expect an acknowledgement within 5 working days and an
assessment within 10. If the report is accepted, the fix is released as a new
version and credited in the advisory unless you ask otherwise; if it is declined,
you will get the reasoning.

## Supply chain

- Releases are published from GitHub Actions only, through npm trusted publishing
  (OIDC), with npm provenance: every version on npm links back to the workflow run
  and commit that built it. A version without a provenance attestation did not
  come from this repository.
- CI and the release job install from the committed `package-lock.json` with
  `npm ci --ignore-scripts`.
- The library's runtime dependencies are limited to `polished`; everything else is
  a peer dependency supplied by the consuming app.
