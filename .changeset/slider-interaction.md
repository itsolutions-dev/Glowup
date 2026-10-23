---
"@its/glowup-ui": minor
---

`Slider` takes `interaction` (`"both"` default, `"drag"`, `"click"`) to choose between dragging the thumb and jumping to the pressed point. The first touch now reads the track's position from the event (no stale offset), a drag is not taken over by a ScrollView, and the web slider is focusable with arrow, Page Up/Down, Home and End keys and `aria-valuenow`; native gets increment / decrement actions. The thumb's shadow uses the theme's `shadow` colour.
