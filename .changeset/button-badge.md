---
"@its/glowup-ui": minor
---

`Button` and `IconButton` take `badge`, a count drawn with `Badge`: after the label on a `Button`, on the top-right corner of an `IconButton`. It is hidden at 0, capped like `Badge` (99+), and exposed to assistive tech as the button's value. A "filters" button with the number of active filters is `<Button iconName="filter-outline" badge={count}>Filters</Button>`.
