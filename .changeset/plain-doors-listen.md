---
"@its/glowup-ui": minor
---

Make the theme's public types self-contained, declare the `react-dom` peer, and give the
package its own tests and README.

**Theme types no longer depend on a JSON import.** `Theme` used to be derived from
`typeof themeConfig`, which made the emitted `ThemeProvider.d.ts` import `./theme.json` — a
file the declaration build does not emit, so a consumer's `tsc` could not resolve the theme
type at all (and would have needed `resolveJsonModule` even if it could). The tokens are now
spelled out as `ThemeColorTokens`, `ThemeSpacingTokens`, `ThemeShapeTokens` and
`TypographyVariant`, all exported; `theme.json` stays the runtime source of truth and a
type-level guard fails the build if the two ever drift apart. `Theme` itself is structurally
unchanged, so consumer code needs no edits.

**`react-dom` is now declared as an optional peer dependency.** `DateTimePicker.web.tsx`
imports `createPortal` from it, and the dependency was previously undeclared.

Also: the package ships with its own jest-expo test suite instead of relying on the demo
app's, `npm run validate-package` runs publint + are-the-types-wrong over the built artefact,
and the README now carries the full component reference (it used to live only in the
monorepo's root README, so npm consumers never saw it).
