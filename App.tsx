import { Loading } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { AlertProviderWrapper, AlertProvider } from "providers/AlertProvider";
import { ThemeProvider } from "providers/ThemeProvider";
import { WorkOrderProvider } from "./store/workorder-context";
import { useTheme } from "providers/ThemeProvider";
import { useTranslation } from "react-i18next";
import "./i18n";
import StackNavigation from "components/Navigation/StackNavigation";
import DrawerNavigation from "components/Navigation/DrawerNavigation";
import StatusBar from "components/StatusBar";
import { Alert } from "providers/AlertProvider";

import Start from "screens/Start";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" darkTheme="dark" lightTheme="light">
      <SafeAreaProvider>
        <AlertProvider>
          <AlertProviderWrapper>
            <WorkOrderProvider>
              <InternalApp />
            </WorkOrderProvider>
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
