import { useMemo } from "react";
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import UserProps from "./User";
import { View, Text, StyleSheet } from "react-native";
import Avatar from "../Avatar"; // Using the avatar we built earlier
import { useTheme, Theme } from "../../providers/ThemeProvider";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import DrawerPreferenceItem from "./DrawerPreferenceItem";
import Toggle from "../Toggle";
import Typography from "components/Typography";

interface CustomDrawerContentProps extends DrawerContentComponentProps {
  isPinned: boolean;
  onTogglePin: () => void;
  user: UserProps;
  onProfilePress: () => void;
  logoutText?: string;
  onLogout: () => void;
}

export const CustomDrawerContent = ({
  isPinned,
  onTogglePin,
  user,
  onProfilePress,
  logoutText,
  onLogout,
  ...props
}: CustomDrawerContentProps) => {
  const { theme, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ paddingTop: 0, flex: 1 }}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.surfaceContainerHighest },
        ]}
      >
        <Avatar
          name={user?.name}
          size={64}
          status={user?.status}
          onPress={onProfilePress}
        />
        <View style={styles.headerText}>
          <Text
            style={[
              theme.typography.titleMedium,
              { color: theme.colors.onSurface },
            ]}
          >
            {user?.name}
          </Text>
          <Text
            style={[
              theme.typography.bodySmall,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {user?.email}
          </Text>
        </View>
      </View>

      <View style={styles.drawerSection}>
        <DrawerItemList {...props} />
      </View>

      <View style={styles.footerContainer}>
        <View
          style={[
            styles.footer,
            { borderTopColor: theme.colors.outlineVariant },
          ]}
        >
          <View style={styles.preferencesContainer}>
            <Typography variant="labelLarge" style={styles.preferenceText}>
              Preferences
            </Typography>

            <DrawerPreferenceItem icon="theme-light-dark" label="Dark Mode">
              <Toggle value={theme.isDark} onValueChange={toggleTheme} />
            </DrawerPreferenceItem>
            <DrawerPreferenceItem icon="pin" label="Pin Sidebar">
              <Toggle value={isPinned} onValueChange={onTogglePin} />
            </DrawerPreferenceItem>
          </View>

          <DrawerItem
            label={logoutText || "Logout"}
            labelStyle={[
              theme.typography.labelLarge,
              { color: theme.colors.onSurfaceVariant },
            ]}
            onPress={onLogout}
            icon={({ color, size }) => (
              <Icons
                name="logout"
                color={theme.colors.onSurfaceVariant}
                size={size}
              />
            )}
          />
        </View>
      </View>
    </DrawerContentScrollView>
  );
};

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    header: {
      marginTop: 16,
      padding: 24,
      paddingTop: 16,
      paddingBottom: 20,
      marginBottom: 8,
      borderRadius: theme.shape.large,
      alignItems: "center",
      justifyContent: "center",
    },
    headerText: {
      marginTop: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    drawerSection: {
      marginTop: 8,
    },
    footerContainer: {
      flex: 1,
      flexDirection: "column",
      justifyContent: "flex-end",
      paddingTop: 8,
    },
    footer: {
      marginTop: "auto",
      borderTopWidth: 1,
      paddingTop: 8,
    },
    preferencesContainer: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    preferenceText: {
      marginLeft: 16,
      marginBottom: 8,
    },
  });
