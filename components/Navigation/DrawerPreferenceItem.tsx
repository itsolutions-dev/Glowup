import { View, Text, StyleSheet } from "react-native";
import Icons from "expo-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../providers/ThemeProvider";

interface DrawerPreferenceItemProps {
  icon: string;
  label: string;
  children?: React.ReactNode;
}

const DrawerPreferenceItem = ({
  icon,
  label,
  children,
}: DrawerPreferenceItemProps) => {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.labelGroup}>
        <Icons name={icon} size={22} color={theme.colors.onSurfaceVariant} />
        <Text
          style={[
            theme.typography.labelLarge,
            { color: theme.colors.onSurface, marginLeft: 12 },
          ]}
        >
          {label}
        </Text>
      </View>
      {children}
    </View>
  );
};

export default DrawerPreferenceItem;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  labelGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
});
