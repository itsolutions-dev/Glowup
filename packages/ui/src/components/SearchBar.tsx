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
import Icons from "./Glyph";
import CircularProgress from "./Progress/CircularProgress";
import { useTheme, Theme, getGlowStyles } from "../providers/ThemeProvider";
import { useDebouncedCallback } from "../hooks/useDebounce";
import { MaterialCommunityIconsGlyphs } from "./types";

export interface SearchBarProps {
  value: string;
  /**
   * Called with the text as it changes. With `debounceTime` it waits until the
   * user has stopped typing; submitting or clearing reports at once.
   */
  onChange: (text: string) => void;
  onSubmit?: (text: string) => void;
  /** Called after the clear button empties the field. */
  onClear?: () => void;
  placeholder?: string;
  /** Glyph at the start of the bar. Defaults to `"magnify"`. */
  icon?: MaterialCommunityIconsGlyphs;
  /**
   * Milliseconds the user must stop typing before `onChange` fires. The field
   * itself always updates at once; a `value` set from outside replaces the
   * text and drops a pending `onChange`. Defaults to 0: every keystroke.
   */
  debounceTime?: number;
  /**
   * Tells the bar a search is running: a progress indicator takes the place of
   * the clear button. Defaults to `false`.
   */
  showLoading?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SearchBar = ({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = "Search",
  icon = "magnify",
  debounceTime = 0,
  showLoading = false,
  disabled,
  autoFocus,
  style,
}: SearchBarProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [isFocused, setIsFocused] = useState(false);

  // With a delay the field shows what was typed while `value` still holds what
  // was last reported; without one `value` stays the single source of truth.
  const [text, setText] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const debounced = useDebouncedCallback(onChange, debounceTime);
  if (prevValue !== value) {
    setPrevValue(value);
    setText(value);
    debounced.cancel();
  }
  const shown = debounceTime > 0 ? text : value;

  const handleChange = (next: string) => {
    setText(next);
    if (debounceTime > 0) debounced(next);
    else onChange(next);
  };

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
        name={icon}
        size={24}
        color={theme.colors.onSurfaceVariant}
        style={styles.leadingIcon}
      />

      <TextInput
        value={shown}
        onChangeText={handleChange}
        onSubmitEditing={() => {
          debounced.flush();
          onSubmit?.(shown);
        }}
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

      {showLoading && (
        <View style={styles.loading}>
          <CircularProgress
            size={20}
            strokeWidth={2}
            color={theme.colors.onSurfaceVariant}
            accessibilityLabel="Searching"
          />
        </View>
      )}
      {!showLoading && shown.length > 0 && (
        <Pressable
          onPress={() => {
            setText("");
            debounced.cancel();
            onChange("");
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

const makeStyles = (theme: Theme) =>
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
    loading: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
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
