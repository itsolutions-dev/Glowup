import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppBar, useTheme } from "@its/glowup-ui";
import RouteProp from "./Route";

export interface StackNavigationProps {
  routes: RouteProp[];
  initialRouteName: string;
}

const Stack = createNativeStackNavigator();

const StackNavigation = ({
  routes,
  initialRouteName,
}: StackNavigationProps) => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      id={undefined}
      initialRouteName={initialRouteName}
      screenOptions={{
        header: (props) => <AppBar {...props} />,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerShadowVisible: false,
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontSize: theme.typography.titleLarge.fontSize,
          fontWeight: theme.typography.titleLarge.fontWeight,
        },
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
        animation: "slide_from_right",
      }}
    >
      {routes.map((route) => (
        <Stack.Screen
          key={route.name}
          name={route.name}
          component={route.component}
          options={route.options || {}}
        />
      ))}
    </Stack.Navigator>
  );
};

export default StackNavigation;
