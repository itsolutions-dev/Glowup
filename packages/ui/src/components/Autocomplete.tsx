import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  StyleSheet,
  StyleProp,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { Theme, useTheme, getGlowStyles } from "../providers/ThemeProvider";
import CircularProgress from "./Progress/CircularProgress";
import HelperText from "./HelperText";
import Portal, { usePortalHost } from "./Portal";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";

export interface AutocompleteOption {
  id: string;
  label: string;
  value: any;
  /** Secondary line under the label. */
  description?: string;
  icon?: MaterialCommunityIconsGlyphs;
}

export interface AutocompleteProps {
  /** The text in the field. Free text is allowed — this is not a Select. */
  value: string;
  onChangeText: (text: string) => void;
  options: AutocompleteOption[];
  onSelect: (option: AutocompleteOption) => void;
  label?: string;
  placeholder?: string;
  /**
   * Custom matcher. Defaults to a case- and accent-insensitive substring test
   * over `label`. Pass `() => true` when the options are filtered server-side.
   */
  filter?: (option: AutocompleteOption, query: string) => boolean;
  /** Characters required before suggestions appear. Defaults to 1. */
  minChars?: number;
  /** Caps the visible suggestions. Defaults to 8. */
  maxSuggestions?: number;
  /** Shows a spinner in the field — for options still being fetched. */
  loading?: boolean;
  /** Shown when nothing matches. Omit to hide the list instead. */
  emptyMessage?: string;
  error?: string;
  /** Supporting text below the field; hidden while an error is shown. */
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  leadingIcon?: MaterialCommunityIconsGlyphs;
  /** Adds a clear button once there is text. Defaults to `true`. */
  clearable?: boolean;
  clearAccessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Strips diacritics so "cafe" matches "Café". */
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const defaultFilter = (option: AutocompleteOption, query: string) =>
  normalize(option.label).includes(normalize(query));

/**
 * Text field with a suggestion list — NativeBase's Typeahead, adapted to M3.
 *
 * The list is positioned inside the field's own container rather than in a
 * modal, so typing never loses focus. It therefore needs a parent that does
 * not clip overflow when the list is open.
 */
const Autocomplete = ({
  value,
  onChangeText,
  options,
  onSelect,
  label,
  placeholder,
  filter = defaultFilter,
  minChars = 1,
  maxSuggestions = 8,
  loading,
  emptyMessage,
  error,
  helperText,
  required,
  disabled,
  leadingIcon,
  clearable = true,
  clearAccessibilityLabel,
  style,
  testID,
}: AutocompleteProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const inputRef = useRef<TextInput>(null);
  const anchorRef = useRef<View>(null);
  const window = useWindowDimensions();
  const hasPortalHost = usePortalHost();
  // Window rect of the field, only needed on the portalled path.
  const [anchorRect, setAnchorRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [focused, setFocused] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  // Selecting an option fills the field, which would otherwise immediately
  // re-open the list with a single exact match in it.
  const [suppressed, setSuppressed] = useState(false);

  const suggestions = useMemo(() => {
    if (value.length < minChars) return [];
    return options
      .filter((option) => filter(option, value))
      .slice(0, maxSuggestions);
  }, [options, value, filter, minChars, maxSuggestions]);

  const listVisible =
    focused &&
    !suppressed &&
    !disabled &&
    value.length >= minChars &&
    (suggestions.length > 0 || !!emptyMessage);

  useEffect(() => {
    if (!hasPortalHost || !listVisible || !anchorRef.current) return;
    anchorRef.current.measureInWindow((x, y, width, height) =>
      setAnchorRect({ x, y, width, height }),
    );
  }, [hasPortalHost, listVisible, window.width, window.height, suggestions]);

  // Portalled, the list is no longer a child of the field, so `top: 100%` and
  // `left/right: 0` mean nothing: it needs the field's window rect. The two
  // paths therefore carry disjoint offsets rather than one unsetting the other.
  const listPlacement = useMemo(() => {
    if (!hasPortalHost) return styles.listInline;

    const gap = 4;
    const below = anchorRect.y + anchorRect.height + gap;
    const spaceBelow = window.height - below;
    // Flip above when the list would run off the bottom and there is more room
    // up there — the inline path could never do this.
    const flipAbove = spaceBelow < 160 && anchorRect.y > spaceBelow;

    return flipAbove
      ? {
          left: anchorRect.x,
          width: anchorRect.width,
          bottom: window.height - anchorRect.y + gap,
        }
      : { left: anchorRect.x, width: anchorRect.width, top: below };
  }, [hasPortalHost, anchorRect, window.height, styles.listInline]);

  // Portal moves its children to the host wherever the element itself sits, so
  // the block below stays put in the source either way.
  const ListContainer = hasPortalHost ? Portal : React.Fragment;

  const commit = useCallback(
    (option: AutocompleteOption) => {
      setSuppressed(true);
      onChangeText(option.label);
      onSelect(option);
    },
    [onChangeText, onSelect],
  );

  const handleChange = (text: string) => {
    setSuppressed(false);
    // A new query invalidates the old highlight position.
    setHighlighted(0);
    onChangeText(text);
  };

  // Arrow/Enter navigation over the suggestion list. Web only: React Native
  // has no key events for soft keyboards.
  useEffect(() => {
    if (Platform.OS !== "web" || !listVisible || suggestions.length === 0) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          return setHighlighted((index) => (index + 1) % suggestions.length);
        case "ArrowUp":
          event.preventDefault();
          return setHighlighted(
            (index) => (index - 1 + suggestions.length) % suggestions.length,
          );
        case "Enter": {
          const option = suggestions[highlighted];
          if (!option) return;
          event.preventDefault();
          return commit(option);
        }
        case "Escape":
          event.preventDefault();
          return setSuppressed(true);
        default:
          return;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [listVisible, suggestions, highlighted, commit]);

  return (
    <View style={[styles.wrapper, style]} testID={testID}>
      {!!label && (
        <Text
          style={[
            theme.typography.bodySmall,
            styles.label,
            {
              color: focused
                ? error
                  ? theme.colors.error
                  : theme.colors.primary
                : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {required ? `${label} *` : label}
        </Text>
      )}

      <View ref={anchorRef} style={styles.anchor} collapsable={false}>
        <View
          style={[
            styles.field,
            getGlowStyles(theme, focused, error),
            disabled && styles.disabled,
          ]}
        >
          {!!leadingIcon && (
            <Icons
              name={leadingIcon}
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          )}
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={handleChange}
            onFocus={() => setFocused(true)}
            // Blur closes the list; the option Pressables fire before blur on
            // both platforms because they are inside the same responder tree.
            onBlur={() => setFocused(false)}
            editable={!disabled}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel={label}
            accessibilityState={{ disabled: !!disabled, expanded: listVisible }}
            style={[
              styles.input,
              theme.typography.bodyLarge,
              { color: theme.colors.onSurface },
            ]}
          />
          {loading && (
            <CircularProgress size={18} color={theme.colors.primary} />
          )}
          {clearable && value.length > 0 && !disabled && !loading && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={clearAccessibilityLabel}
              hitSlop={8}
              onPress={() => {
                setSuppressed(false);
                onChangeText("");
                inputRef.current?.focus();
              }}
              style={({ hovered }: PressableState) => [
                styles.clearButton,
                hovered && {
                  backgroundColor: theme.colors.surfaceContainerHighest,
                },
              ]}
            >
              <Icons
                name="close"
                size={18}
                color={theme.colors.onSurfaceVariant}
              />
            </Pressable>
          )}
        </View>

        {listVisible && (
          <ListContainer>
            <View
              role="list"
              style={[
                styles.list,
                listPlacement,
                {
                  backgroundColor: theme.colors.surfaceContainerLow,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
            >
              {suggestions.length === 0 ? (
                <Text
                  style={[
                    theme.typography.bodyMedium,
                    styles.emptyMessage,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {emptyMessage}
                </Text>
              ) : (
                <ScrollView keyboardShouldPersistTaps="handled">
                  {suggestions.map((option, index) => (
                    <Pressable
                      key={option.id}
                      accessibilityRole="menuitem"
                      accessibilityState={{ selected: index === highlighted }}
                      onPress={() => commit(option)}
                      onHoverIn={() => setHighlighted(index)}
                      style={({ hovered, pressed }: PressableState) => [
                        styles.option,
                        (index === highlighted || hovered || pressed) && {
                          backgroundColor: theme.colors.surfaceContainerHighest,
                        },
                      ]}
                    >
                      {!!option.icon && (
                        <Icons
                          name={option.icon}
                          size={20}
                          color={theme.colors.onSurfaceVariant}
                        />
                      )}
                      <View style={styles.optionText}>
                        <Text
                          numberOfLines={1}
                          style={[
                            theme.typography.bodyLarge,
                            { color: theme.colors.onSurface },
                          ]}
                        >
                          {option.label}
                        </Text>
                        {!!option.description && (
                          <Text
                            numberOfLines={1}
                            style={[
                              theme.typography.bodySmall,
                              { color: theme.colors.onSurfaceVariant },
                            ]}
                          >
                            {option.description}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          </ListContainer>
        )}
      </View>

      {!!(error || helperText) && (
        <HelperText type={error ? "error" : "info"}>
          {error || helperText}
        </HelperText>
      )}
    </View>
  );
};

export default Autocomplete;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: { marginBottom: theme.spacing.m, width: "100%" },
    label: { marginBottom: theme.spacing.xs, marginLeft: theme.spacing.xs },
    anchor: { position: "relative", zIndex: 10 },
    field: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s,
      borderRadius: theme.shape.medium,
      paddingHorizontal: theme.spacing.m,
      backgroundColor: theme.colors.surface,
    },
    input: {
      flex: 1,
      paddingVertical: 12,
      ...Platform.select({ web: { outlineWidth: 0 } }),
    },
    clearButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    list: {
      position: "absolute",
      maxHeight: 240,
      borderWidth: 1,
      borderRadius: theme.shape.medium,
      overflow: "hidden",
      elevation: 6,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
      zIndex: 20,
    },
    // Anchored inside the field wrapper (no portal host mounted).
    listInline: {
      top: "100%",
      left: 0,
      right: 0,
      marginTop: theme.spacing.xs,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },
    optionText: { flex: 1 },
    emptyMessage: {
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.m,
    },
    disabled: { opacity: 0.38 },
  });
