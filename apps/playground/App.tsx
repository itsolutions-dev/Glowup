import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { AlertProviderWrapper, AlertProvider, ThemeProvider, DrawerNavigation, StatusBar } from "@glowup/ui";
import { NavigationContainer } from "@react-navigation/native";

import { useTranslation } from "react-i18next";
/* 
import { WorkOrderProvider } from "./store/workorder-context";
import "./i18n";
import StackNavigation from "components/Navigation/StackNavigation";


import { Alert } from "providers/AlertProvider"; */

import Start from "screens/Start";
import Playground from "screens/Playground";
import LoginScreen from "screens/LoginScreen";

import ChangePasswordScreen from "screens/ChangePasswordScreen";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AlertProvider>
          <AlertProviderWrapper>
            <InternalApp />
          </AlertProviderWrapper>
        </AlertProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const APP_ROUTES = [
  {
    name: "Start",
    component: Start,
    icon: "home",
    options: { title: "Start page" },
  },
  {
    name: "Playground",
    component: Playground,
    icon: "view-dashboard-outline",
    options: { title: "Component Playground" },
  },
  {
    name: "ChangePassword",
    component: ChangePasswordScreen,
    icon: "lock-reset",
    options: { title: "Change Password" },
  },
];

const DrawerNavigationWrapper = () => {
  const { t } = useTranslation();

  return (
    <DrawerNavigation
      routes={APP_ROUTES}
      initialRouteName="Playground"
      logoutText={t("LOGOUT")}
      onLogout={() => console.log("Logout")}
      user={{
        name: "Adriano Buscema",
        email: "a.buscema@it-sol.it",
        status: "online",
      }}
      onProfilePress={() => console.log("Profile")}
    />
  );
};

const AuthScreen = ({ navigation }: any) => {
  return <LoginScreen onLoginSuccess={() => navigation.replace("AppDrawer")} />;
};

const InternalApp = () => {
  return (
    <>
      <StatusBar />
      <SafeAreaView style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator
            id="MainStack"
            initialRouteName="AppDrawer"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen
              name="AppDrawer"
              component={DrawerNavigationWrapper}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </>
  );
};
