---
"@its/glowup-ui": minor
---

**Breaking: the navigators are gone. The library is navigation-agnostic.**

`DrawerNavigation`, `StackNavigation` and the drawer body `CustomDrawerContent` no longer
ship with `@its/glowup-ui`, along with the types they needed: `DrawerNavigationProps`,
`StackNavigationProps`, `Route`, `UserProps` and `UserStatus`.

With them go all three navigation peer dependencies — `@react-navigation/drawer`,
`@react-navigation/native-stack` and `@react-navigation/native`. (The last one was declared
but never actually imported by any component.) Installing the library no longer drags a
navigator, `react-native-screens` or `react-native-reanimated` into a consumer's dependency
graph unless the consumer wants them.

What stays: every navigation **widget**, because none of them depends on a navigator —
`AppBar`, `NavigationBar`, `Tabs`/`TabContent`, `Breadcrumbs`, `Pagination`, `Stepper` and
`DrawerPreferenceItem`. `AppBar`'s props are still navigator-shaped (`navigation`, `route`,
`options`, `back`, `isPinned`) and structurally typed, so it still drops straight into a
React Navigation `header` renderer.

### Migration

The navigators were thin wrappers around React Navigation — a routes array, the themed
`AppBar` as `header`, and a drawer body — so they belong to the app that owns its routing.
Copy them into your app: this repo's playground now keeps its own copies at
`apps/playground/navigation/` (`DrawerNavigation.tsx`, `DrawerContent.tsx`,
`StackNavigation.tsx`, `Route.ts`, `User.ts`, ~380 lines total, unchanged except that they
import the library by package name).

```diff
-import { DrawerNavigation } from "@its/glowup-ui";
+import DrawerNavigation from "./navigation/DrawerNavigation";
```

Everything those files need from the library is part of its public API (`AppBar`, `Avatar`,
`LanguageSelector`, `Toggle`, `Typography`, `DrawerPreferenceItem`, `useTheme`, `Theme`,
`MaterialCommunityIconsGlyphs`), so the copy compiles as-is.
