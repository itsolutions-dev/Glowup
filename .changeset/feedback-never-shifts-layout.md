---
"@its/glowup-ui": minor
---

Hover, press and focus feedback no longer changes a control's box: `Button`, `Chip`, `IconButton`, `ToggleButton`, `FAB`, `Card`, `Avatar`, `Accordion`, `Stepper`, `Table` headers, `Tree` rows and the `Switch` hover drew a border that moved the page. The border is now constant and the ring is a shadow (`getFocusRing`); `Tabs` rely on their state layer. `getGlowStyles` keeps a 1px border active or not.
