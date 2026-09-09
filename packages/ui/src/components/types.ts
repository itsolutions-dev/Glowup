import type { ComponentProps } from "react";
import type { PressableStateCallbackType } from "react-native";
import type MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

/**
 * Valid MaterialCommunityIcons icon names.
 * Replacement for the `MaterialCommunityIconsGlyphs` export of the old
 * (deprecated) `expo-vector-icons` package.
 */
export type MaterialCommunityIconsGlyphs = ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

/**
 * Pressable state including the web-only `hovered` and `focused` flags that
 * react-native-web provides but the core react-native typings omit.
 */
export interface PressableState extends PressableStateCallbackType {
  hovered?: boolean;
  focused?: boolean;
}
