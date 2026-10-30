import { useContext } from "react";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

const NONE = { top: 0, bottom: 0, left: 0, right: 0 };

/**
 * The safe-area insets of the `SafeAreaProvider` above, or zero without one.
 * `useSafeAreaInsets()` throws there, which took down any app that had not
 * mounted the provider just to show an `AppBar` or a `FAB`.
 */
export const useInsets = () => useContext(SafeAreaInsetsContext) ?? NONE;
