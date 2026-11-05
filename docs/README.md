# Documentation map

Where things live, what each document is for, and when to read it. If you are starting a session, read
the four under **Start here** and nothing else until you need it.

Language: the roadmap and handoffs are in Italian, everything else is in English.

## Start here

| Document                                 | What it is                                                                                                                                   |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| [`../CLAUDE.md`](../CLAUDE.md)           | Rules for working in the repo: commands, the library/app boundary, tests, releasing, handoffs.                                               |
| [`status.md`](status.md)                 | Done / left per workstream with percentages, the library backlog, the decisions taken and the "do not redo" list. Read before starting work. |
| [`handoff/`](handoff)                    | One file per working day: what was done, what was verified, open questions, next step. Read the newest.                                      |
| [`pilots/`](pilots)                      | Screenshots of the temporary CRM pilot screens (web, phone, Android), one folder per day and screen.                                         |
| [`solaris-native.md`](solaris-native.md) | The master plan (decisions D1–D17, phases 0–9, rules, risks). Italian.                                                                       |

## Plans and roadmap

| Document                                                                                                                                     | What it is                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| [`solaris-native.md`](solaris-native.md)                                                                                                     | Phases 0–9 of the Solaris UI plan: native readiness, charts, PDF, pivot, pilot screens. Italian.                                             |
| [`crm-component-matrix.md`](crm-component-matrix.md)                                                                                         | The CRM families mapped onto Glowup components: the Phase 3 work list, with a "done" column. Italian.                                        |
| [`release-1.0.md`](release-1.0.md)                                                                                                           | **Draft**: the 1.0 criteria, versioning and Expo support policy, and the adoption guide, with the decisions still to take.                   |
| [`mac-testing/`](mac-testing/README.md)                                                                                                      | **Instructions for the Mac and iPhone checks** (Italian), with the two lists below.                                                          |
| [`mac-testing/native-verification.md`](mac-testing/native-verification.md)                                                                   | Component × platform: what was seen working on web, iPhone, Android, a phone and screen readers, with the proof.                             |
| [`device-package-plan.md`](device-package-plan.md)                                                                                           | Design and phases of `@its/glowup-device`. Linked from the published package's README, so it stays here.                                     |
| [`superpowers/specs/2026-10-26-layout-editor-design.md`](superpowers/specs/2026-10-26-layout-editor-design.md)                               | The layout editor: canvas on a grid, palette, nesting, props panel, JSON and code export. Approved.                                          |
| [`superpowers/plans/2026-10-27-layout-editor-1-foundations.md`](superpowers/plans/2026-10-27-layout-editor-1-foundations.md)                 | Plan 1 for the layout editor: drag and drop additions and `GridLayout` in the library.                                                       |
| [`superpowers/plans/2026-10-28-layout-editor-2-core.md`](superpowers/plans/2026-10-28-layout-editor-2-core.md)                               | Plan 2: the editor's pure core (document, grid maths, manifest, forms, operations, undo).                                                    |
| [`superpowers/plans/2026-10-29-layout-editor-3-canvas.md`](superpowers/plans/2026-10-29-layout-editor-3-canvas.md)                           | Plan 3: the canvas (render tree and edit layer, select, move with a landing preview, resize, nested grids) and the `/templates/editor` page. |
| [`superpowers/plans/2026-10-29-layout-editor-4-palette-containers.md`](superpowers/plans/2026-10-29-layout-editor-4-palette-containers.md)   | Plan 4: the palette (drag or tap to add), stacks and lists as drop zones, TabbedPanel tabs on the canvas, moves between containers.          |
| [`superpowers/plans/2026-10-29-layout-editor-5-export.md`](superpowers/plans/2026-10-29-layout-editor-5-export.md)                           | Plan 5: the Export panel (generated `.tsx` with copy and download, a Preview that runs it, the JSON with copy, download and import).         |
| [`superpowers/plans/2026-11-05-layout-editor-6-panels.md`](superpowers/plans/2026-11-05-layout-editor-6-panels.md)                           | Plan 6: the Properties panel (text, props, data, position, field, tabs) and the Layers tree with "Move into…".                               |
| [`superpowers/plans/2026-11-05-layout-editor-7-saved-layouts.md`](superpowers/plans/2026-11-05-layout-editor-7-saved-layouts.md)             | Plan 7: saved layouts in local storage (autosave, open, rename, delete) and the two new starters.                                            |
| [`superpowers/plans/2026-11-05-layout-editor-8-responsive-keyboard.md`](superpowers/plans/2026-11-05-layout-editor-8-responsive-keyboard.md) | Plan 8: the editor at every width (columns, sheets, phone), its keyboard shortcuts, and the device checklist.                                |
| [`mac-testing/layout-editor-device-checklist.md`](mac-testing/layout-editor-device-checklist.md)                                             | The layout editor's manual pass on an iPhone and an Android phone, upright and sideways (spec §20).                                          |

## Reference

| Document                                                                                                   | What it is                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`component-inventory.md`](component-inventory.md)                                                         | Every component and prop, marked added / changed / kept since `14a148f`. **Generated**, never hand-edit: `npm run docgen && npm run inventory -w @its/glowup-playground`. Italian. |
| [`../packages/ui/README.md`](../packages/ui/README.md)                                                     | The library's usage guide and per-component reference (published on npm).                                                                                                          |
| [`../packages/ui/src/components/components.md`](../packages/ui/src/components/components.md)               | The library's specification: design tokens, then every component's props and behaviour.                                                                                            |
| `../packages/device/README.md`, `../packages/notifications/README.md`                                      | Usage guides of the two headless packages.                                                                                                                                         |
| [`../.design-sync/NOTES.md`](../.design-sync/NOTES.md), [`conventions.md`](../.design-sync/conventions.md) | Notes and conventions of the design-sync tooling (previews, `config.json`).                                                                                                        |

## Per-workspace rules

`packages/ui/CLAUDE.md`, `packages/device/CLAUDE.md`, `packages/notifications/CLAUDE.md` and
`apps/playground/CLAUDE.md` load when you work under those folders. The playground one describes the
documentation site: the one-example-per-component model, the generators, the icons page.

## Keeping this folder tidy

- **A plan that is finished goes.** Keep its outcome in `status.md`, and let git hold the
  text (`git log -- docs/<file>` finds the last version). Nine finished documents were removed on
  2026-10-23 this way: the library-split and npm-publishing plans, the NativeBase comparison, the four
  Phase 0 spikes, and the two earliest handoffs. Three more on 2026-11-05: `work-split.md` (the two-person split
  ended on 30/10), `ui-fixes-from-the-native-check.md` and the 19–23 October meeting report; `decisions.md` and
  `library-roadmap.md` were fused into `status.md` the same day.
- **One handoff per calendar day**, in `handoff/AAAA-MM-GG.md`; update today's file rather than adding a second.
- **Generated files are never edited by hand**: the inventory here, and `docgen`, `variants`, `templates`,
  `examples` in the playground (see the root `CLAUDE.md`).
- **A new document gets a row in this table** in the same change.
