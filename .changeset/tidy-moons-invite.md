---
"@its/glowup-ui": patch
---

Fix Divider's sizing, and stop the language selector falling back to Italian.

- A labelled `Divider` no longer carries `contentSpacing` on its own container.
  The margin belonged to the label alone; on the container it made the rule
  `contentSpacing * 2` wider than the box it was asked to fill and pushed it
  off-centre by `contentSpacing`, so in a 360px-wide parent the right-hand
  segment ran out past the edge.
- A `Divider` with no label is now one unbroken line. It used to render the
  label's spacing anyway, opening a `contentSpacing * 2` hole in the middle of
  itself — visible in `<Divider />`, in `ListSection`'s `divider` prop and in
  the date-time picker surface, and the reason `Menu` passes
  `contentSpacing={0}`.
- A vertical `Divider` sizes itself: `alignSelf: "stretch"` for the height, and
  no `flex: 1`, which in the row a vertical rule lives in made the hairline grow
  across the whole row instead of separating it. It no longer needs a wrapper
  to be visible.
- `LanguageSelector` falls back to the first configured language rather than
  hardcoded `"it"` when `currentLang` is not one it knows.
