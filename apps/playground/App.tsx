import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import {
  AlertProviderWrapper,
  AlertProvider,
  ThemeProvider,
  ToastProvider,
  StatusBar,
} from "@its/glowup-ui";

// Navigation lives in the app: the library is navigation-agnostic and does not
// depend on @react-navigation/*.
import DrawerNavigation from "./navigation/DrawerNavigation";
import { NavigationContainer } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

// Side-effect import: starts i18next so the screens' `t()` calls resolve to real
// copy instead of rendering the raw UPPER_SNAKE_CASE keys.
import "./i18n";

import Start from "./screens/Start";
import Playground from "./screens/Playground";

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AlertProvider>
          <AlertProviderWrapper>
            <ToastProvider>
              <InternalApp />
            </ToastProvider>
          </AlertProviderWrapper>
        </AlertProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const APP_ROUTES = [
  {
    name: "Playground",
    component: Playground,
    icon: "view-dashboard-outline",
    options: { title: "Component Playground" },
  },
  {
    name: "Start",
    component: Start,
    icon: "home",
    options: { title: "Kitchen sink" },
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
        name: "Glowup",
        email: "playground@glowup.dev",
        status: "online",
      }}
      onProfilePress={() => console.log("Profile")}
    />
  );
};

const InternalApp = () => {
  return (
    <>
      <StatusBar />
      <SafeAreaView style={{ flex: 1 }}>
        <NavigationContainer>
          <DrawerNavigationWrapper />
        </NavigationContainer>
      </SafeAreaView>
    </>
  );
};
