---
"@its/glowup-ui": patch
---

Overlays opened inside a `Dialog`, a `BottomSheet` or a side sheet (`Drawer`, `SideSheet`) are drawn above it: each of those windows is now a `PortalHost`, so an `Autocomplete` list, a `Tooltip` or a `HoverCard` portals into it instead of under it (or inline, under the fields that follow). The web date and time pickers' docked popover is a `Modal` above the window it opened from, and Escape closes the popover without closing the dialog under it.
