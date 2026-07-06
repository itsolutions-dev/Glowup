import React, { useMemo, useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme, Theme, getGlowStyles } from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs } from "./types";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: (text: string) => void;
  /** Called after the clear button empties the field. */
  onClear?: () => void;
  placeholder?: string;
  leadingIcon?: MaterialCommunityIconsGlyphs;
  disabled?: boolean;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SearchBar = ({
  value,
  onChangeText,
  onSubmit,
  onClear,
  placeholder = "Search",
  leadingIcon = "magnify",
  disabled,
  autoFocus,
  style,
}: SearchBarProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        getGlowStyles(theme, isFocused),
        disabled && { opacity: 0.38 },
        style,
      ]}
    >
      <Icons
        name={leadingIcon}
        size={24}
        color={theme.colors.onSurfaceVariant}
        style={styles.leadingIcon}
      />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={() => onSubmit?.(value)}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        editable={!disabled}
        autoFocus={autoFocus}
        returnKeyType="search"
        accessibilityRole="search"
        accessibilityLabel={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[theme.typography.bodyLarge, styles.input]}
      />

      {value.length > 0 && (
        <Pressable
          onPress={() => {
            onChangeText("");
            onClear?.();
          }}
          accessibilityLabel="Clear search"
          accessibilityRole="button"
          style={styles.clearButton}
        >
          <Icons name="close" size={20} color={theme.colors.onSurfaceVariant} />
        </Pressable>
      )}
    </View>
  );
};

export default SearchBar;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      height: 56,
      borderRadius: 28,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surfaceContainerHigh,
      width: "100%",
    },
    leadingIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      color: theme.colors.onSurface,
      paddingVertical: 0,
      ...Platform.select({
        web: { outlineStyle: "none" as any },
      }),
    },
    clearButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
      ...Platform.select({
        web: { cursor: "pointer" },
      }),
    },
  });
