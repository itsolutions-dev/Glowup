import { Loading } from "react-native";
import { Text } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { AlertProviderWrapper, AlertProvider } from "providers/AlertProvider";
import { ThemeProvider } from "providers/ThemeProvider";
import { NavigationContainer } from "@react-navigation/native";
import DrawerNavigation from "components/Navigation/DrawerNavigation";
import { useTheme } from "providers/ThemeProvider";
import { useTranslation } from "react-i18next";
import StatusBar from "components/StatusBar";
/* 
import { WorkOrderProvider } from "./store/workorder-context";
import "./i18n";
import StackNavigation from "components/Navigation/StackNavigation";


import { Alert } from "providers/AlertProvider"; */

import Start from "screens/Start";
import Playground from "screens/Playground";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" darkTheme="dark" lightTheme="light">
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
];

const InternalApp = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <StatusBar style={theme.isDark ? "dark" : "light"} />
      <SafeAreaView style={{ flex: 1 }}>
        <NavigationContainer>
          <DrawerNavigation
            routes={APP_ROUTES}
            initialRouteName="Start"
            logoutText={t("LOGOUT")}
            onLogout={() => Alert("LOGOUT", "Premuto il tasto logout")}
            user={{ name: "Adriano Buscema", email: "a.buscema@it-sol.it" }}
            onProfilePress={() => Alert("Profile", "Premuto il tasto profilo")}
          />
        </NavigationContainer>
      </SafeAreaView>
    </>
  );
};
