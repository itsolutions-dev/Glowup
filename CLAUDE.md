# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Expo dev server
npm run android        # Start on Android
npm run ios            # Start on iOS
npm run web            # Start on Web
npm run lint           # ESLint
npm run type-check     # TypeScript (tsc --noEmit)
npm test               # Jest
```

## Architecture

This is an **Expo React Native** app (targets iOS, Android, Web) that doubles as a UI component library built on the **Material You (Material Design 3)** design system.

### Navigation structure

```
App.tsx
└── ThemeProvider / SafeAreaProvider / AlertProvider
    └── NavigationContainer (Stack)
        ├── Auth → LoginScreen (onLoginSuccess navigates to AppDrawer)
        └── AppDrawer → DrawerNavigation (routes passed as config array)
```

`DrawerNavigation` is responsive: permanent sidebar at width ≥ 840px, slide-over below. Routes are defined in `App.tsx` as the `APP_ROUTES` array and passed as props to `DrawerNavigation`.

### Providers

- `ThemeProvider` (`providers/ThemeProvider.tsx`) — Material You theme derived from `providers/theme.json`. Exposes `useTheme()` hook and utilities `getStateColor()` / `getGlowStyles()`. Syncs with OS color scheme and supports manual toggle.
- `AuthProvider` (`providers/AuthProvider.tsx`) — Token storage via `expo-secure-store` (native) / HttpOnly cookies (web). Provides `authAxios` with automatic 401 → token-refresh interceptor. Not yet wired into `App.tsx`; currently the root uses a stub auth flow.
- `AlertProvider` (`providers/AlertProvider.tsx`) — Cross-platform alert: native `Alert.alert` on iOS/Android, custom Modal on web. Call via the `Alert(title, message, buttons)` singleton exported from the provider.

### Theme system

All colors, typography, spacing, and shape tokens live in `providers/theme.json`. The `Theme` type is exported from `ThemeProvider.tsx`. `common/themes.ts` is an older duplicate — prefer `providers/theme.json`.

**Styling pattern used throughout:** theme-reactive styles via `useMemo`:
```tsx
const styles = useMemo(() => makeStyles(theme), [theme]);
// ...
const makeStyles = (theme: Theme) => StyleSheet.create({ ... });
```

### Module resolution

`tsconfig.json` sets `baseUrl: "."`, so all imports are relative to the project root:
```tsx
import Button from "components/Button";
import { useTheme } from "providers/ThemeProvider";
```

### WebAuthn / Passkeys

- `services/WebAuthnService.ts` — Web Credentials API wrapper (web only)
- `hooks/useWebAuthn.ts` — React hook abstracting passkey register/authenticate; falls back to a biometric simulation on native (iOS/Android) since `expo-local-authentication` is not yet integrated

### i18n

`i18n/` using `i18next` + `react-i18next`. Translation keys are UPPER_SNAKE_CASE (e.g., `t("ADD")`, `t("LOGOUT")`).

## Code style

- Prettier: `trailingComma: "all"`, `endOfLine: "lf"`
- ESLint enforces `linebreak-style: unix`
- `.gitattributes` (`* text=auto eol=lf`) is the source of truth: every checkout gets
  LF on disk regardless of the machine's `core.autocrlf`, so the two rules above always
  match the working tree. `npm run lint` gates CI.
- Icons: `expo-vector-icons/MaterialCommunityIcons` — icon names are kebab-case strings; outline variants append `-outline` suffix
