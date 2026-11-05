---
"@its/glowup-ui": minor
---

New component **`DayTimeline`**: a day's events as a list, as in a phone agenda (the CRM's mobile agenda, under `WeekStrip`). Each row shows the start time and a card with an `overline` (the kind of event), the title and "start – end · note"; events are shown by start time whatever order they come in. `color` tints the card, readable in both schemes, with a bar on its start edge; `canceled` greys it out and strikes it through. `onEventPress` makes each card a button; `loading` shows a list skeleton, and with no events it shows `emptyState` ("Nothing scheduled" by default). `labels` renames the words screen readers hear.
