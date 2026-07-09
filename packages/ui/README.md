# @glowup/ui

A **Material You (Material Design 3)** component library for **React Native + Web** (Expo).
~50 theme-reactive components — buttons, inputs, navigation, dialogs, data grids, progress
indicators and more — built on a single design-token system with light/dark support.

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
| `DateTimePicker` | `react-native-modal-datetime-picker`, `@react-native-community/datetimepicker`, `expo-localization` |
| `StatusBar` | `expo-status-bar` |

## Usage

Wrap your app in the providers, then use components:

```tsx
import { ThemeProvider, AlertProvider, Button, Typography } from "@glowup/ui";

export default function App() {
  return (
    <ThemeProvider>
      <AlertProvider>
        <Typography variant="headlineMedium">Hello</Typography>
        <Button onPress={() => {}}>Tap me</Button>
      </AlertProvider>
    </ThemeProvider>
  );
}
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
