# Documentation map

Where things live, what each document is for, and when to read it. If you are starting a session, read
the four under **Start here** and nothing else until you need it.

Language: the roadmap and handoffs are in Italian, everything else is in English.

## Start here

| Document                                 | What it is                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [`../CLAUDE.md`](../CLAUDE.md)           | Rules for working in the repo: commands, the library/app boundary, tests, releasing, handoffs.          |
| [`status.md`](status.md)                 | Done / left per workstream with percentages, and the "do not redo" list. Read before starting work.     |
| [`handoff/`](handoff)                    | One file per working day: what was done, what was verified, open questions, next step. Read the newest. |
| [`solaris-native.md`](solaris-native.md) | The master plan (decisions D1–D17, phases 0–9, rules, risks). Italian.                                  |

## Plans and roadmap

| Document                                             | What it is                                                                                               |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [`library-roadmap.md`](library-roadmap.md)           | What the library still needs: verified bugs, API gaps, missing components, in priority order.            |
| [`decisions.md`](decisions.md)                       | Decisions already taken ("do not re-propose") and the ones waiting for a yes or no.                      |
| [`solaris-native.md`](solaris-native.md)             | Phases 0–9 of the Solaris UI plan: native readiness, charts, PDF, pivot, pilot screens. Italian.         |
| [`work-split.md`](work-split.md)                     | Who does what between the two people on the plan, and where the two streams meet. Italian.               |
| [`crm-component-matrix.md`](crm-component-matrix.md) | The CRM families mapped onto Glowup components: the Phase 3 work list, with a "done" column. Italian.    |
| [`device-package-plan.md`](device-package-plan.md)   | Design and phases of `@its/glowup-device`. Linked from the published package's README, so it stays here. |

## Reference

| Document                                                                                                   | What it is                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`component-inventory.md`](component-inventory.md)                                                         | Every component and prop, marked added / changed / kept since `14a148f`. **Generated**, never hand-edit: `npm run docgen && npm run inventory -w @its/glowup-playground`. Italian. |
| [`../packages/ui/README.md`](../packages/ui/README.md)                                                     | The library's usage guide and per-component reference (published on npm).                                                                                                          |
| [`../packages/ui/src/components/components.md`](../packages/ui/src/components/components.md)               | The library's specification: design tokens, then every component's props and behaviour.                                                                                            |
| `../packages/device/README.md`, `../packages/notifications/README.md`                                      | Usage guides of the two headless packages.                                                                                                                                         |
| [`../.design-sync/NOTES.md`](../.design-sync/NOTES.md), [`conventions.md`](../.design-sync/conventions.md) | Notes and conventions of the design-sync tooling (previews, `config.json`).                                                                                                        |

## Reports

| Document                                                                   | What it is                                                                         |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [`reports/2026-10-session-summary.md`](reports/2026-10-session-summary.md) | Everything done between 19 and 23 October, organised to be presented in a meeting. |

## Per-workspace rules

`packages/ui/CLAUDE.md`, `packages/device/CLAUDE.md`, `packages/notifications/CLAUDE.md` and
`apps/playground/CLAUDE.md` load when you work under those folders. The playground one describes the
documentation site: the one-example-per-component model, the generators, the icons page.

## Keeping this folder tidy

- **A plan that is finished goes.** Keep its outcome in `decisions.md` or the roadmap, and let git hold the
  text (`git log -- docs/<file>` finds the last version). Nine finished documents were removed on
  2026-10-23 this way: the library-split and npm-publishing plans, the NativeBase comparison, the four
  Phase 0 spikes, and the two earliest handoffs.
- **One handoff per calendar day**, in `handoff/AAAA-MM-GG.md`; update today's file rather than adding a second.
- **Generated files are never edited by hand**: the inventory here, and `docgen`, `variants`, `templates`,
  `examples` in the playground (see the root `CLAUDE.md`).
- **A new document gets a row in this table** in the same change.
