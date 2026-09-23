---
"@its/glowup-ui": minor
---

`ProgressButton`: a button that carries the progress of the task it started
inside its own surface — idle → loading → success | error. `status` is
controlled; `progress` (0–1) drives a fill that sweeps across the surface or,
with `indicator="bar"`, a 4dp line along its bottom edge, and leaving it unset
gives an indeterminate sweep. While loading the button is busy, not disabled:
it keeps its colours, stays focusable, reports `aria-busy` and names its
percentage. Success and error switch tone with a Material reveal (skipped under
reduced motion) and are announced once through an `aria-live="polite"` region
on web and `announceForAccessibility` on native. It takes every `Button` mode.

It is built on `Button` and `LinearProgress`, which gain what it needed, all
additive:

- `Button`: `tone="success"` (a fixed green kept off the seed, like error),
  `busy` (blocks presses and reports busy without swapping the label for a
  spinner), `underlay` (a layer behind the label, clipped to the shape),
  `labelStyle`, `accessibilityHint` and `testID`. `loading` and `busy` now set
  `aria-busy` on web, where `accessibilityState.busy` never reached the DOM.
- `LinearProgress`: the determinate bar grows with `transform: scaleX` on the
  native driver instead of tweening `width`; `height` accepts a percentage;
  `decorative` hides it from assistive technology.

Palettes: `palettes` now holds the Material 3 baseline plus the nineteen named
Material hues (`red` … `blueGrey`), each derived from its 500 seed. `grey` is
monochrome and `brown` / `blueGrey` muted, so a near-neutral seed does not come
out in full colour. `cobalt`, `forest` and `rose` stay readable as deprecated,
non-enumerable aliases of `blue`, `green` and `pink`. **`amber` changes colour**:
it was seeded from `#FF9800`, which is Material's Orange, and is now the real
Amber `#FFC107`; an app that picked `palettes.amber` for its old look wants
`palettes.orange`.
