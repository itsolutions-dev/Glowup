# @glowup/ui

A **Material You (Material Design 3)** component library for **React Native + Web** (Expo).
~60 theme-reactive components — layout primitives, buttons, inputs, navigation, dialogs, data
grids, progress indicators and a locale-aware date/time picker family — built on a single
design-token system with light/dark support.

> Status: `0.1.0` — first extraction from the Glowup app. API may change before `1.0.0`.

## Installation

```bash
npm install @glowup/ui
```

Then install the peer dependencies your app doesn't already have. The core set:

```bash
npx expo install react-native-safe-area-context react-native-svg @expo/vector-icons
```

Some components need additional peers (installed only if you use them):

| Component(s) | Peer dependency |
|---|---|
| `DrawerNavigation`, `StackNavigation` | `@react-navigation/native`, `@react-navigation/drawer`, `@react-navigation/native-stack` |
| `DateTimePicker`, `DatePicker`, `TimePicker` | `react-native-modal-datetime-picker`, `@react-native-community/datetimepicker`, `expo-localization` |
| `StatusBar` | `expo-status-bar` |

`Calendar` and `TimeSelect` are pure React Native and need none of the date-picker peers, so
`variant="inline"` works without them.

## Usage

Wrap your app in the providers, then use components:

```tsx
import {
  ThemeProvider,
  AlertProvider,
  ToastProvider,
  Button,
  Typography,
  VStack,
} from "@glowup/ui";

export default function App() {
  return (
    <ThemeProvider>
      <AlertProvider>
        <ToastProvider>
          <VStack p="m" spacing="s">
            <Typography variant="headlineMedium">Hello</Typography>
            <Button onPress={() => {}}>Tap me</Button>
          </VStack>
        </ToastProvider>
      </AlertProvider>
    </ThemeProvider>
  );
}
```

### Layout

`Box`, `Stack`/`HStack`/`VStack`, `Center`, `Spacer`, `Grid` and `AspectRatio` take spacing,
shape and color as **token names** rather than numbers, so screens never hardcode a magic value:

```tsx
<Grid columns={2} spacing="m">
  <Box p="m" bg="primaryContainer" radius="large">…</Box>
  <Box p="m" bg="secondaryContainer" radius="large">…</Box>
</Grid>
```

### Toasts

```tsx
const toast = useToast();
toast.success("Saved");
toast.error("Upload failed", { action: { label: "Retry", onPress: retry } });
```

### Dates

Month and weekday names, week start, 12h/24h and AM/PM labels all come from `Intl`, driven by the
device locale (or a `locale` override). Chrome strings default to English — pass i18n values via
`labels`:

```tsx
<DatePicker
  label={t("DUE_DATE")}
  value={dueDate}
  onChange={setDueDate}
  onClear={() => setDueDate(null)}
  clearable
  minimumDate={new Date()}
  isDateDisabled={(d) => d.getDay() === 0 || d.getDay() === 6}
  labels={{ today: t("TODAY"), confirm: t("OK"), cancel: t("CANCEL") }}
/>
```

### Theme

All colors, typography, spacing and shape tokens come from the built-in Material You theme.
Access it with the `useTheme()` hook:

```tsx
import { useTheme } from "@glowup/ui";

const { theme, toggleTheme } = useTheme();
```

Helpers `getStateColor()` and `getGlowStyles()` are also exported for building custom
theme-reactive components.

## Live demo

The `apps/playground` example app in this monorepo (`screens/Playground.tsx`) exercises every
component — run `npm start` from the repo root to browse them.

## License

MIT
