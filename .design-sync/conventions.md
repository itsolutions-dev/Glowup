## How to build with @glowup/ui

Material Design 3 (Material You) for **Expo React Native**, rendered here through
react-native-web. It is a **prop-and-theme** system: there are **no CSS classes, no CSS
custom properties, and no stylesheet to import**. Every colour, type size, space and
radius comes from the theme object at runtime. Class names you invent will not resolve.

### Wrap the app, or nothing is styled

Three providers, in this order. `ThemeProvider` supplies every token — without it
components mount but render unthemed. `SafeAreaProvider` is required by `AppBar` and
`SpeedDial` (they read insets and throw without it). `AlertProviderWrapper` is what binds
the imperative `Alert()` singleton; omit it and every `Alert()` call is a no-op warning.

```tsx
<SafeAreaProvider>
  <ThemeProvider>
    <AlertProvider>
      <AlertProviderWrapper>{/* app */}</AlertProviderWrapper>
    </AlertProvider>
  </ThemeProvider>
</SafeAreaProvider>
```

### The styling idiom

Read tokens with `useTheme()` and put them in a `StyleSheet`-shaped object memoised on
the theme — this is the pattern used in every file of the library:

```tsx
const { theme, toggleTheme } = useTheme();
const styles = useMemo(() => makeStyles(theme), [theme]);
```

The real token vocabulary, all under `theme`:

| Group | Names |
|---|---|
| `colors` | `primary`, `onPrimary`, `primaryContainer`, `onPrimaryContainer`, and the same four for `secondary` / `tertiary` / `error`; `background`, `onBackground`, `surface`, `onSurface`, `surfaceVariant`, `onSurfaceVariant`, `surfaceContainer`, `surfaceContainerLow`, `surfaceContainerHigh`, `surfaceContainerHighest`, `surfaceDim`, `outline`, `outlineVariant`, `shadow` |
| `typography` | `displayLarge/Medium/Small`, `headlineLarge/Medium/Small`, `titleLarge/Medium/Small`, `bodyLarge/Medium/Small`, `labelLarge/Medium/Small` |
| `spacing` | `xs` 4, `s` 8, `m` 16, `l` 24, `xl` 32 |
| `shape` | `small` 8, `medium` 12, `large` 16, `extraLarge` 28 |
| | `isDark` — boolean; the palette follows the OS scheme, `toggleTheme()` overrides it |

Helpers: `getStateColor(base, on, "hover" | "press" | "focus")` for M3 state layers, and
`getGlowStyles(theme, isActive, error?)` for the library's focus/error border treatment.

**Text goes in `<Typography variant="...">`**, never a bare string — that is the only way
type picks up the scale. **Icons** are MaterialCommunityIcons kebab-case name strings
(`iconName="plus"`, `leadingIcon="email-outline"`); outline variants take `-outline`.

The library exports **no layout primitives** — no `View`, no `Text`. Use plain `<div>`
with inline styles for your own layout glue (react-native-web renders real DOM, so they
compose fine) and take spacing values from `theme.spacing`.

### Where the truth lives

Read `_ds/<folder>/components/<group>/<Name>/<Name>.prompt.md` for a component's real
prop table and usage, and its `<Name>.d.ts` for the exact contract. The M3 principles,
full token tables and type scale are in `_ds/<folder>/guidelines/design-system.md`.
`styles.css` is intentionally near-empty: react-native-web injects all styles at runtime.

### A representative screen

```tsx
const { theme } = useTheme();

<div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.m, padding: theme.spacing.l }}>
  <Typography variant="headlineSmall">Invoices</Typography>
  <SearchBar value={query} onChangeText={setQuery} placeholder="Search invoices" />
  <div style={{ display: "flex", gap: theme.spacing.s, flexWrap: "wrap" }}>
    <Chip label="Paid" mode="tonal" selected onPress={() => {}} />
    <Chip label="Overdue" mode="outlined" onPress={() => {}} />
  </div>
  <Paper elevation={0} outline style={{ borderRadius: theme.shape.large }}>
    <DataGrid data={rows} columns={columns} sortColumn="issued" sortDirection="asc" onSort={onSort} />
  </Paper>
  <Button mode="filled" iconName="plus" fullWidth onPress={() => {}}>New invoice</Button>
</div>
```

### Known gaps — do not design around them

`disabled` has **no visual treatment** on `Toggle`, `FAB`, `Input` or `NumericInput`; a
disabled control there looks identical to an enabled one. `ListItem` is a single-line
centred text tile, not an M3 list row — build rows from `<div>` + `Typography` + `Avatar`
instead. `Popover` (and `Menu`, which uses it) is fixed at 200px wide unless
`matchAnchorWidth` is set, so keep menu labels short.
