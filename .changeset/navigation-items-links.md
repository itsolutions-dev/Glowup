---
"@its/glowup-ui": minor
---

Navigation items can be links. `DrawerItem`, and `NavBar` and `NavigationRail` items (`NavBarItem`), take an `href`:

- **On the web the item is a real anchor**: its URL shows on hover, the context menu offers "Open in new tab", and a Ctrl, Cmd or Shift click or a middle click is left to the browser (a new tab or window). A plain click runs the item's handler (`onClick`, `onItemPress`) and then the app's router, without loading the page; with neither, the browser follows the link. The current item is `aria-current="page"`, and a bar with links is a `navigation` landmark of links instead of a tab list.
- **On iOS and Android** a press runs the handler and then the router.
- **`LinkProvider`** plugs the router in without the library importing one: `<LinkProvider navigate={(href) => router.push(href)}>` for expo-router. It takes the router's function rather than its `Link` component, because `Link asChild` re-dresses its child (it merges a pressable's state styles into a plain object and passes an `onClick` that react-native-web's `Pressable` overrides).
- `NavBar`'s `onClick` and `NavigationRail`'s `onItemPress` are optional, for a bar whose items all have an `href` under a `LinkProvider`.
- A group `DrawerItem` (with `children`) still opens and closes rather than navigating, unless the drawer is `collapsed`; its sub-items can be links at any depth.
