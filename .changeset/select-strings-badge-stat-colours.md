---
"@its/glowup-ui": minor
---

Three additions asked for by the CRM's forms and reports:

- **`Select` takes plain strings as options:** `options={["Rome", "Milan"]}`, each string its own label and value, mixed freely with `{ label, value }` objects. And **`reserveHelperText`**, as on `Input`: the line under the field is kept even with no error, so an error appearing does not push the next field down.
- **`StatusBadge` `type` takes `"info"` and `"neutral"`**, coloured from the theme's status roles (`infoContainer`, `neutralContainer`) with their own icons.
- **`Stat` takes `valueColor`:** the colour of the number, a theme colour token (`"error"` for an overdue count) or any colour string, like `trendColor`.
