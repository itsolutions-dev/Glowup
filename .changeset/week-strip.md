---
"@its/glowup-ui": minor
---

New component **`WeekStrip`**: a week as a row of days, as in a phone agenda (the CRM's mobile agenda). Press a day to pick it; swipe the row sideways to move a week, keeping the weekday (on the web, where a mouse cannot swipe, an arrow on each side does the same; `arrows` turns them on or off anywhere) (a sideways drag cancels the press on the day under the finger, an upright one still scrolls the page). Monday to Friday by default (`weekDays` takes any days, shown from the locale's first day of the week); the weekday names follow `locale`. `gradient` fills the chosen day with the brand gradient. Screen readers move a week through each day's actions ("Next week", "Previous week", renamed with `labels`, which also names the arrows).
