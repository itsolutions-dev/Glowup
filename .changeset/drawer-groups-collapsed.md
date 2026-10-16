---
"@its/glowup-ui": minor
---

The navigation drawer gets nesting, a collapsible section, a header and an icons-only mode. `DrawerItem` with `children` becomes a group: pressing it opens and closes its sub-items, indented one level (`defaultExpanded`, `onToggle`; `onPress` is optional on a group). `DrawerSection` takes `collapsible`, `defaultExpanded` and `onToggle`. `NavigationDrawer` takes `header` (pinned above the items) and `collapsed` (72 wide, icons only: labels, badges, titles and sub-items hidden; an item with no icon shows its first letter).
