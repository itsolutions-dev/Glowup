import React from "react";
import { Platform } from "react-native";
import IconButton from "./IconButton";
import TopAppBar from "./TopAppBar";

export interface AppBarProps {
  navigation: any;
  route: any;
  options: any;
  /** Truthy when a back destination exists (native-stack passes { title, href }) */
  back?: { title?: string; href?: string } | boolean;
  isPinned?: boolean;
}

/**
 * `TopAppBar` behind react-navigation's header contract: pass it as a
 * navigator's `header` and it reads the title from `options`/`route`, shows a
 * back button when there is somewhere to go back to and a menu button for a
 * drawer navigator. The library itself never imports react-navigation.
 */
const AppBar = ({
  navigation,
  route,
  options,
  back,
  isPinned = false,
}: AppBarProps) => {
  const hideDrawerToggle =
    options.headerLeft === null || options.hideMenuIcon === true || isPinned;

  const title =
    options.headerTitle !== undefined
      ? options.headerTitle
      : options.title !== undefined
        ? options.title
        : route.name;

  const leading = back ? (
    <IconButton
      icon="arrow-left"
      accessibilityLabel="Go back"
      onPress={navigation.goBack}
    />
  ) : !hideDrawerToggle && navigation.openDrawer ? (
    <IconButton
      icon="menu"
      accessibilityLabel="Open navigation menu"
      onPress={navigation.openDrawer}
    />
  ) : undefined;

  return (
    <TopAppBar
      title={title}
      leading={leading}
      actions={options.headerRight ? options.headerRight() : undefined}
      divider={Platform.OS === "web"}
    />
  );
};

export default AppBar;
