# CRM props B3/B4 — short design (2026-11-04)

Approved by Alice on 4/11.

## Why

The CRM's screens will be rebuilt on Glowup. These are the pieces the CRM draws today that the library cannot
yet, each checked in the CRM's source (`Documents\Dev\DBE-CRM-qa`, read only). They are built while the CI
artefacts of the 3/11 push are awaited. None of them is needed to call the work "done" (`status.md`, "Road to
done"); adding a prop is a minor change, so nothing existing changes.

## Goals

1. **`ToggleButtonGroup` with typed values.** `ToggleButtonOption<T>`: `value` of any type (the CRM's
   `TriStateFilter`: `null` / `true` / `false`, 4 uses in 3 files). Per option `tooltip?: string`, drawn with the
   library's `Tooltip` and used as the segment's accessible name (the CRM's buttons are icon-only with a tooltip).
2. **`Skeleton preset="list"`.** `count`, `itemHeight`, `gap`; rounded rows, radius from `theme.shape`
   (the CRM's `SkeletonList`: 3 files, fixed 16 px radius).
3. **`DayTimeline`, new component.** Nothing existing draws it (declared per "extend before creating"). The
   CRM's `MobileAgenda` day list: time on the left (46 px), a coloured card with an overline (type), the title
   (one line) and "start – end · note". `events: { id, title, start, end, overline?, note?, color?, canceled? }[]`;
   `color` through `toneFromColor` plus a 4 px accent bar on the left (the CRM's `getEventStyle`); `canceled`
   grey and struck through. `onEventPress(event)`, `loading` (the list preset of point 2), `emptyState`
   (the library's `EmptyState`).
4. **`Stepper variant="dots" | "progress"`.** Extends `Stepper` (same concept: where am I in a sequence).
   `steps` also takes a count. Back and Next buttons are drawn only with `onBack` / `onNext`;
   `backLabel` / `nextLabel`; `submitStep` makes the last step's Next a filled `type="submit"` button;
   `onCancel` gives Back an action on the first step (off without it). The CRM's `PagesStepper` (MUI
   `MobileStepper`, 3 uses).
5. **`Dialog` `overline`, `leadingActions`, `dividers`.** A small line above the title (1 use), actions on the
   left of the actions row (2 uses), lines above and below the body (12 files).

## Non-goals

- `DataGrid` row actions and group rows: only `GrantMatrix` uses them, already deferred (`decisions.md`).
- `DayTimeline` `layout="grid"` (hours): only if the desktop asks.
- `Stepper` vertical / error / optional steps: no evidence.
- `Skeleton` `card` and `table` presets: no evidence.

## Constraints

- Each behaviour test first (iOS and Android projects); web-only behaviour in `__web_tests__`.
- One changeset per point (minor), docgen, variants, examples, inventory, `crm-component-matrix.md` "Fatto",
  `status.md`.
- No existing caller changes: every new prop is optional and defaults to today's behaviour.

## Approaches

Stepper: extend `Stepper` with a `variant` (chosen) vs a new `PageStepper` component. Extending keeps one
component for one concept, and the dots without buttons also serve as a page indicator; the buttons only
appear with their handlers. The rest has one sensible way (the matrix's proposals, narrowed to what the CRM
uses).

## Left to the builder

Exact spacing and typography inside `DayTimeline` (from theme tokens, close to the CRM's 13/12 px), the
accessible names of the stepper buttons and dots, how the dots look on hover.
