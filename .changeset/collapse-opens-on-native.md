---
"@its/glowup-ui": patch
---

On iOS and Android, a `Collapse` that starts closed now opens to its content. Fabric sends no `onLayout` to the content of a box laid out at height 0, so the content was measured as 0 when it mounted and the box opened to nothing: a `DrawerItem` group showed no sub-items, and `Accordion` and `Tree` used the same `Collapse`. The closed box is now one physical pixel tall (`StyleSheet.hairlineWidth`), empty and transparent. The web is unchanged.
