import React, { createContext, useContext } from "react";
import { Platform } from "react-native";
import type { GestureResponderEvent } from "react-native";

/** Client-side navigation to `href`, done by the app's router. */
export type NavigateHandler = (href: string) => void;

const NavigateContext = createContext<NavigateHandler | null>(null);

export interface LinkProviderProps {
  /**
   * Called with an item's `href` when the user follows it inside the app: a
   * plain click on the web, a press on iOS and Android. Pass the router's
   * push: expo-router's `router.push`, react-navigation's `linkTo`.
   */
  navigate: NavigateHandler;
  children: React.ReactNode;
}

/**
 * Plugs the app's router into the navigation items that take an `href`
 * (`DrawerItem`, `NavigationRail` and `NavBar` items). The library depends on
 * no router: it draws the item as a real anchor on the web, leaves a
 * Ctrl/Cmd/Shift-click or a middle click to the browser (a new tab, a new
 * window), and hands a plain click to `navigate` so the route changes without
 * reloading the page.
 *
 * It takes the router's function rather than its `Link` component: a router's
 * `Link asChild` re-dresses its child with its own props (expo-router's merges
 * the child's style into an object, which drops a pressable's state styles, and
 * passes `onClick`, which react-native-web's `Pressable` overrides).
 *
 * ```tsx
 * import { router } from "expo-router";
 *
 * <LinkProvider navigate={(href) => router.push(href)}>
 *   <App />
 * </LinkProvider>
 * ```
 */
const LinkProvider = ({ navigate, children }: LinkProviderProps) => (
  <NavigateContext.Provider value={navigate}>
    {children}
  </NavigateContext.Provider>
);

export default LinkProvider;

/** Internal: the nearest `LinkProvider`'s `navigate`, or `null`. */
export const useNavigateHandler = () => useContext(NavigateContext);

// The parts of a browser click that decide who handles it.
type Click = {
  button?: number;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  preventDefault?: () => void;
};

/**
 * Internal: what a pressable item spreads to be a link to `href`. On the web
 * it is an anchor (react-native-web draws a `View` with `href` as `<a>`): a
 * click with a modifier key or another button is the browser's; a plain click
 * calls `onPress` and `navigate` instead of loading the page, unless neither
 * is there, and then the browser follows the link. On iOS and Android a press
 * calls both. Without `href` it is just `onPress`.
 */
export const linkPressProps = (
  href: string | undefined,
  onPress: (() => void) | undefined,
  navigate: NavigateHandler | null,
): { onPress?: (e?: GestureResponderEvent) => void; href?: string } => {
  if (!href) return { onPress: onPress && (() => onPress()) };
  const web = Platform.OS === "web";
  return {
    ...(web ? { href } : null),
    onPress: (e) => {
      if (web) {
        const click = e as unknown as Click | undefined;
        if (
          click &&
          (click.metaKey ||
            click.ctrlKey ||
            click.shiftKey ||
            click.altKey ||
            (click.button ?? 0) !== 0)
        )
          return;
        if (!onPress && !navigate) return;
        click?.preventDefault?.();
      }
      onPress?.();
      navigate?.(href);
    },
  };
};
