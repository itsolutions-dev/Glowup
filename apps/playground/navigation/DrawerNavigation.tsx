import { useMemo, useState } from "react";
import {
  createDrawerNavigator,
  DrawerNavigationOptions,
} from "@react-navigation/drawer";
import { AppBar, Avatar, LanguageSelector, useTheme } from "@its/glowup-ui";
import type { MaterialCommunityIconsGlyphs } from "@its/glowup-ui";
import { CustomDrawerContent } from "./DrawerContent";
import { useWindowDimensions, View } from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";

import RouteProp from "./Route";
import UserProps from "./User";

const Drawer = createDrawerNavigator();

export interface DrawerNavigationProps {
  routes: RouteProp[];
  user: UserProps;
  logoutText?: string;
  onLogout: () => void;
  onProfilePress: () => void;
  initialRouteName: string;
}

const DrawerNavigation = ({
  routes,
  initialRouteName,
  logoutText,
  onLogout,
  onProfilePress,
  user,
}: DrawerNavigationProps) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  // null = follow the responsive default; true/false = user override via pin toggle
  const [pinOverride, setPinOverride] = useState<boolean | null>(null);
  const [lang, setLang] = useState("it");

  const isPinned = pinOverride ?? width >= 840;

  const screenOptions = useMemo((): DrawerNavigationOptions => {
    return {
      drawerType: isPinned ? "permanent" : "front",
      //headerShown: !isPinned,
      drawerStyle: {
        backgroundColor: !isPinned
          ? theme.colors.surface
          : theme.colors.surfaceContainerLow,
        borderTopRightRadius: isPinned ? 0 : theme.shape.large,
        borderBottomRightRadius: isPinned ? 0 : theme.shape.large,
        borderRightWidth: isPinned ? 0 : 1,
        borderRightColor: theme.colors.outlineVariant,
      },
    };
  }, [isPinned, theme]);

  return (
    <Drawer.Navigator
      id={undefined}
      initialRouteName={initialRouteName}
      drawerContent={(props) => (
        <CustomDrawerContent
          user={user}
          logoutText={logoutText}
          onProfilePress={onProfilePress}
          onLogout={onLogout}
          onTogglePin={() => setPinOverride(!isPinned)}
          isPinned={isPinned}
          {...props}
        />
      )}
      screenOptions={{
        ...screenOptions,
        header: (props) => (
          <AppBar
            {...props}
            isPinned={isPinned}
            options={{
              headerRight: () => (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingRight: 8,
                  }}
                >
                  <LanguageSelector currentLang={lang} onChange={setLang} />
                  {user && (
                    <Avatar
                      name={user.name}
                      onPress={onProfilePress}
                      size={32}
                    />
                  )}
                </View>
              ),
            }}
          />
        ),
        drawerActiveTintColor: theme.colors.onSecondaryContainer,
        drawerActiveBackgroundColor: theme.colors.secondaryContainer,
        drawerInactiveTintColor: theme.colors.onSurfaceVariant,
        drawerItemStyle: {
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.outlineVariant,
          borderRadius: theme.shape.large,
        },
        drawerLabelStyle: {
          fontSize: theme.typography.labelLarge.fontSize,
          fontWeight: theme.typography.labelLarge.fontWeight,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerShadowVisible: false,
        headerTintColor: theme.colors.onSurface,
        overlayColor: "rgba(0, 0, 0, 0.4)",
      }}
    >
      {routes.map((route) => (
        <Drawer.Screen
          key={route.name}
          name={route.name}
          component={route.component}
          options={{
            title: route.name,
            drawerIcon: route.icon
              ? ({ focused, color, size }) => (
                  <Icons
                    name={
                      (focused
                        ? route.icon
                        : route.icon +
                          "-outline") as MaterialCommunityIconsGlyphs
                    }
                    size={size}
                    color={color}
                  />
                )
              : undefined,
            ...route.options,
          }}
        />
      ))}
    </Drawer.Navigator>
  );
};

export default DrawerNavigation;
