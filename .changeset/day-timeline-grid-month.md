---
"@its/glowup-ui": minor
---

**`DayTimeline`** gets two more layouts beside the phone list, for a desktop calendar (the CRM's agenda, today on `react-big-calendar`). `layout="grid"` draws one column per day of `days` on a grid of hours (`startHour`–`endHour`, `hourHeight`), events placed by time and overlapping ones side by side; `layout="month"` draws the weeks of `month` (`weekDays`, `firstDayOfWeek`), the first `maxPerDay` events of each day and "+N" opening all of them in a popover. With `onEventChange` the events are draggable — to another time or day in the grid, snapped to `step`, to another day at the same time in the month, keeping their length — and `resizable` adds a handle at the foot of each grid event that drags its end (screen readers lengthen or shorten it by a step). `onSlotPress` reports a press on an empty slot (its time) or day, `onDayPress` one on a day's heading or number. `labels` gains `more` and `resize`. The list is unchanged and stays the default.
