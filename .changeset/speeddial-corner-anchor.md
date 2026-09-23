---
"@its/glowup-ui": patch
---

`SpeedDial`: the trigger now sits in the corner `position` names. The collapsed action rows kept their layout width, so the trigger was centred under the widest label, and on the `*-left` positions FAB's own `left` offset was applied a second time. Left positions also mirror the action rows so labels sit on the open side.
