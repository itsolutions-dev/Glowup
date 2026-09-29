# apps/playground — the presentation app

The playground is also the **published documentation site**: the same Expo app runs on
device and exports to static HTML for GitHub Pages.

The site is **English only** and carries no i18n layer: `i18n/` and the
`@react-navigation`-based `navigation/` folder were removed once nothing rendered
them. The navigator wiring survives as a snippet on /templates, because `AppBar`
takes react-navigation's header contract and a consumer still needs to see it.

## Three generated artefacts, all committed

- `docgen/props.generated.json` — every exported component's prop table, read from the
  library's TypeScript with ts-morph: name, type as written, optionality, JSDoc, and the
  default taken from the destructuring pattern. `npm run docgen -w @its/glowup-playground`
  regenerates it; CI regenerates and fails on a diff. **Never hand-edit it**, and never
  hand-write a prop table beside it.
- `catalogue/variants/generated/` — the variant galleries, rewritten from
  `.design-sync/previews/*.tsx` (the authored demos) into React Native primitives by
  `catalogue/variants/generate.mjs`. The previews stay in the browser dialect because the
  design-sync converter cannot resolve `react-native`; **edit the preview, then run
  `npm run variants -w @its/glowup-playground`**. Seven previews are excluded by name in the
  generator, each with its reason; hand-written galleries live in
  `catalogue/variants/manual/` and win over the generated entry for the same component.
  A catalogued component with no gallery at all fails the playground test.
- `assets/*.png` and `public/og-image.png` — the icon set and the share card, drawn from
  `theme.json`'s primary colours by `scripts/generate-icons.mjs` (a hand-rolled PNG encoder;
  no image dependency). `npm run icons -w @its/glowup-playground` regenerates them. Not checked
  by CI — deflate output is not guaranteed byte-identical across zlib versions — so regenerate
  them by hand when the theme's primary colours change.

Adding a component to the catalogue means: an entry in the right `catalogue/registry/*.ts`
module, its name in the right group in `catalogue/categories.ts`, and its name in the
`CATALOGUE` list in `__tests__/playground-catalogue.test.tsx`. When the stage needs more than
`<Component {...props} />` (sample data, controlled state, an overlay behind a trigger), give the
entry a `Demo` component (`catalogue/demos.tsx`) instead of adding a branch to
`ComponentPreview.tsx`; a component with no authored preview can reuse that demo as its
gallery (`catalogue/variants/manual/fromDemos.tsx`). The test pins the `CATALOGUE` list
against `FLAT_ORDER`, the registry and the generated docs, so a component catalogued without a
working demo fails there.
It gets its page, its props table and its URL for free.

## Keyboard

`site/useKeyboardShortcuts.ts` binds the site's shortcuts to `document` on web and is a no-op
on native. `SiteShell` owns the list — ⌘/Ctrl+K or `/` for the command palette, `[` and `]` to
step through the catalogue, `t` for the scheme, `?` for the list itself — and `ShortcutsDialog`
renders that same array, so a shortcut cannot exist without being documented.

## Responsive

`site/breakpoints.ts` holds the Material 3 window size classes (compact / medium / expanded /
large / extraLarge) and `useLayout()` is the only way to ask about width. Do not compare
`useWindowDimensions().width` to a number anywhere else: the previous screen switched layout at
960 while the drawer switched at 840, and between the two you got a permanent drawer beside a
layout that still believed it was on a phone.

## Publishing the documentation site

`apps/playground` is exported to static HTML (`expo-router` with `output: "static"`) and
deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `master`. Each
route — including every component page — is prerendered to its own file with its own title
and meta description, so a component URL is shareable and crawlable.

Pages serves a project site from a subpath (`/<repo>/`), so the workflow sets
`GLOWUP_BASE_URL` and `app.config.ts` feeds it to `experiments.baseUrl`. Locally the variable
is unset and the site serves from the root. The workflow also writes `.nojekyll` (Jekyll would
drop `_expo/`, where the bundle lives) and copies `+not-found.html` to `404.html`.

The repository must have Pages enabled with **GitHub Actions** as the source; Pages on a
private repository requires GitHub Enterprise Cloud.
