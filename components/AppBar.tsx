import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icons from "expo-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../providers/ThemeProvider";

interface AppBarProps {
  navigation: any;
  route: any;
  options: any;
  back?: boolean;
  isPinned?: boolean;
}

const AppBar = ({
  navigation,
  route,
  options,
  back,
  isPinned = false,
}: AppBarProps) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const hideDrawerToggle =
    options.headerLeft === null || options.hideMenuIcon === true || isPinned;

  const title =
    options.headerTitle !== undefined
      ? options.headerTitle
      : options.title !== undefined
        ? options.title
        : route.name;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          paddingTop: insets.top,
          borderBottomColor: theme.colors.outlineVariant,
          borderBottomWidth: Platform.OS === "web" ? 1 : 0,
        },
      ]}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.leftAction,
            back || (!hideDrawerToggle && navigation.openDrawer)
              ? {}
              : { width: 0 },
          ]}
        >
          {back ? (
            <Pressable onPress={navigation.goBack} style={styles.iconButton}>
              <Icons
                name="arrow-left"
                size={24}
                color={theme.colors.onSurface}
              />
            </Pressable>
          ) : (
            !hideDrawerToggle &&
            navigation.openDrawer && (
              <Pressable
                onPress={navigation.openDrawer}
                style={styles.iconButton}
              >
                <Icons name="menu" size={24} color={theme.colors.onSurface} />
              </Pressable>
            )
          )}
        </View>

        <View style={styles.titleContainer}>
          <Text
            numberOfLines={1}
            style={[
              theme.typography.titleLarge,
              { color: theme.colors.onSurface },
            ]}
          >
            {title}
          </Text>
        </View>

        {/* 3. Right Actions (Optional) */}
        <View style={styles.rightActions}>
          {options.headerRight && options.headerRight()}
        </View>
      </View>
    </View>
  );
};

export default AppBar;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    zIndex: 100,
  },
  content: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  leftAction: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  rightActions: {
    flexDirection: "row",
    paddingRight: 4,
  },
  iconButton: {
    padding: 12,
    borderRadius: 24,
  },
});
