---
"@its/glowup-ui": minor
---

Additions found by building a report screen with the library. Nothing changes for code that doesn't use them:

- **`Card` takes `selected`**: a primary border for the chosen card of a set, drawn without moving the content (the border takes its width from the padding), and the state reaches screen readers (`aria-pressed` on the web, selected on iOS and Android). Left out, the card is as before.
- **`Select` options no longer need an `id`**: an option without one is keyed by its `value`, so `{ label, value }` is enough.
- **`Tooltip` takes a node as `content`**, for a rich tooltip whose body is laid out (a small sum, a list). A node never names the anchor for screen readers: give the tooltip a `title` for that.
- **`gradientStyle(from, to, angle?)`**: a linear gradient as a style, drawn by React Native itself on iOS and Android (no extra package) and by CSS on the web; the start colour is also the background colour, the fallback. The brand gradient is `gradientStyle(theme.colors.primary, theme.colors.tertiary)`: with the `databeasy` palette that is the CRM's blue into green.
