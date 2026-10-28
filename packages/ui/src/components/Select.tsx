import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  LayoutChangeEvent,
} from "react-native";
import Icons from "./Glyph";
import { Theme, useTheme, getGlowStyles } from "../providers/ThemeProvider";

import Popover from "./Popover";
import Checkbox from "./Checkbox";
import Chip from "./Chip";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";
import { useDensity, type Density } from "../providers/Density";
import { fieldWidth } from "./internal/fieldWidth";
import { filledField } from "./internal/fieldVariant";

export interface Option {
  id: string;
  label: string;
  value: any;
  icon?: MaterialCommunityIconsGlyphs;
}

type SelectVariant = "outlined" | "filled";

export interface SelectProps {
  label?: string;
  error?: string;
  disabled?: boolean;
  options: Option[];
  /**
   * The `value` of the selected option, `null` for none. With `multiple`: the
   * array of selected `value`s (defaults to `[]`).
   */
  value?: any;
  /**
   * Called with the picked option's `value`, or with `null` when a
   * `nullable` select is cleared. With `multiple`: called with the new array
   * of selected `value`s on every toggle (a new array, never the one passed
   * as `value`).
   */
  onChange?: (value: any) => void;
  placeholder?: string;
  /**
   * The look of the box: `"outlined"` is a bordered box on the surface,
   * `"filled"` a tinted box (like `PinInput`'s) that shows its border only
   * while focused or in error. Where the label sits is `labelPlacement`'s
   * business, not the variant's. Defaults to `"outlined"`.
   */
  variant?: SelectVariant;
  /**
   * Where the label is drawn: `"outside"` above the box, or `"inside"`, small,
   * above the value. Independent of `variant`; with chips showing it stays
   * above the box. Defaults to `"outside"`.
   */
  labelPlacement?: "inside" | "outside";
  /**
   * Stretches the select to its container's width. `false` shrinks it to its
   * content, with a minimum width. Defaults to `true`.
   */
  fullWidth?: boolean;
  /**
   * Lets the user go back to no selection: a clear button shows in the field
   * while an option is selected, and pressing the selected option again
   * deselects it. Both call `onChange(null)`. Ignored with `multiple`, where
   * every option can already be unchecked. Defaults to `false`.
   */
  nullable?: boolean;
  /** Shown in the open list when `options` is empty. Defaults to `"No options"`. */
  emptyMessage?: string;
  /**
   * Options that stay visible but cannot be picked, announced as disabled:
   * the `value`s to disable, or a pattern tested against each `String(value)`.
   */
  disabledOptions?: RegExp | (string | number)[];
  style?: object;
  optionStyle?: object;
  /** Picks several options at once; the list stays open. `value` and `onChange` then carry arrays. */
  multiple?: boolean;
  /** With `multiple`, shows the selection as removable chips in the field. */
  showAsChips?: boolean;
  /** Mount with the option list already open. Uncontrolled after that. */
  defaultOpen?: boolean;
  /**
   * Control height. `"dense"` is for desktop forms and tables: a 40 px field instead of 52, 14 px text, less space below.
   */
  density?: Density;
}

const Select = ({
  label,
  error,
  disabled,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  variant = "outlined",
  labelPlacement = "outside",
  fullWidth = true,
  nullable = false,
  emptyMessage = "No options",
  disabledOptions,
  style,
  optionStyle,
  multiple = false,
  showAsChips = false,
  defaultOpen = false,
  density,
}: SelectProps) => {
  const dense = useDensity(density) === "dense";
  const [visible, setVisible] = useState(defaultOpen);
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme, dense), [theme, dense]);
  const valueType = dense
    ? theme.typography.bodyMedium
    : theme.typography.bodyLarge;

  const labelColor = error ? theme.colors.error : theme.colors.primary;

  const isOptionDisabled = (option: Option) =>
    Array.isArray(disabledOptions)
      ? disabledOptions.includes(option.value)
      : // `search` ignores a global/sticky flag's lastIndex, which `test` would not.
        !!disabledOptions && String(option.value).search(disabledOptions) >= 0;

  const selectedValues: any[] = useMemo(
    () => (multiple && Array.isArray(value) ? value : []),
    [multiple, value],
  );
  const selectedOption = useMemo(
    () => (multiple ? undefined : options.find((opt) => opt.value === value)),
    [options, value, multiple],
  );

  const internalToggleOption = useCallback(
    (optionValue: any) => {
      onChange?.(
        selectedValues.includes(optionValue)
          ? selectedValues.filter((item) => item !== optionValue)
          : [...selectedValues, optionValue],
      );
    },
    [onChange, selectedValues],
  );

  const placeholderColor = selectedOption
    ? theme.colors.onSurface
    : theme.colors.onSurfaceVariant;

  const getDisplayContent = useCallback(() => {
    if (showAsChips && multiple && selectedValues.length > 0) {
      return options
        .filter((opt) => selectedValues.includes(opt.value))
        .map((opt) => (
          <Chip
            label={opt.label}
            key={opt.id}
            onClose={() => internalToggleOption(opt.value)}
          />
        ));
    }
    if (multiple) {
      const selectedLabels = options
        .filter((opt) => selectedValues.includes(opt.value))
        .map((opt) => opt.label);
      const concatOptions = selectedLabels.slice(0, 2).join(", ");
      const text =
        selectedValues.length === 0
          ? placeholder || "Select options"
          : selectedValues.length <= 2
            ? concatOptions
            : `${concatOptions} (+${selectedValues.length - 2})`;
      return (
        <Text
          style={[
            valueType,
            {
              color:
                selectedValues.length > 0
                  ? theme.colors.onSurface
                  : theme.colors.onSurfaceVariant,
            },
          ]}
          numberOfLines={1}
        >
          {text}
        </Text>
      );
    }
    return (
      <View style={styles.leftSlot}>
        {selectedOption && !!selectedOption.icon && (
          <Icons
            name={selectedOption.icon}
            size={20}
            color={theme.colors.primary}
            style={styles.leadingIcon}
          />
        )}
        <Text
          style={[valueType, { color: placeholderColor }]}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
      </View>
    );
  }, [
    showAsChips,
    multiple,
    selectedValues,
    options,
    selectedOption,
    placeholder,
    theme,
    styles,
    valueType,
    internalToggleOption,
    placeholderColor,
  ]);

  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const chipsShown = showAsChips && multiple && selectedValues.length > 0;
  // With chips the field has no row for a label, so it stays above the box.
  const labelInside = labelPlacement === "inside" && !!label && !chipsShown;
  const clearable = nullable && !multiple && !!selectedOption && !disabled;

  const Anchor = (
    <Pressable
      accessibilityLabel={selectedOption?.label || label || placeholder}
      accessibilityRole={(Platform.OS === "web" ? "listbox" : "none") as any}
      accessibilityState={{ expanded: visible, disabled }}
      disabled={disabled}
      onPress={() => setVisible(true)}
      style={[
        styles.selectContainer,
        getGlowStyles(theme, visible, error),
        variant === "filled" && filledField(theme, visible, error),
      ]}
    >
      {!chipsShown && (
        <View style={[styles.content, labelInside && styles.contentStacked]}>
          {labelInside && (
            <Text
              style={[
                theme.typography.labelSmall,
                { color: visible ? labelColor : theme.colors.onSurfaceVariant },
              ]}
            >
              {label}
            </Text>
          )}
          {getDisplayContent()}
        </View>
      )}
      <View
        onLayout={onLayout}
        style={[{ flexDirection: "row" }, chipsShown && { width: "100%" }]}
      >
        {chipsShown && (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              width: containerWidth - 24,
            }}
          >
            {getDisplayContent()}
          </View>
        )}

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {clearable && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear selection"
              hitSlop={8}
              onPress={() => onChange?.(null)}
              style={styles.clearButton}
            >
              <Icons
                name="close"
                size={18}
                color={theme.colors.onSurfaceVariant}
              />
            </Pressable>
          )}
          <Icons
            name={visible ? "menu-up" : "menu-down"}
            size={24}
            color={error ? theme.colors.error : theme.colors.onSurfaceVariant}
          />
        </View>
      </View>
    </Pressable>
  );

  return (
    <View
      style={[
        styles.wrapper,
        fieldWidth(fullWidth),
        style,
        disabled && { opacity: 0.38 },
      ]}
    >
      {!!label && !labelInside && (
        <Text
          style={[
            theme.typography.bodySmall,
            { color: theme.colors.primary, marginBottom: 4, marginLeft: 4 },
          ]}
        >
          {label}
        </Text>
      )}

      <Popover
        visible={visible && !disabled}
        onDismiss={() => setVisible(false)}
        matchAnchorWidth
        anchor={Anchor}
      >
        <View style={styles.menuContent}>
          {options.length === 0 ? (
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
            <ScrollView bounces={false} style={{ maxHeight: 250 }}>
              {options.map((option) => {
                const optionDisabled = disabled || isOptionDisabled(option);
                const isSelected = multiple
                  ? selectedValues.includes(option.value)
                  : value === option.value;
                return (
                  <Pressable
                    key={option.id}
                    // Not `disabled`: a disabled Pressable lets the touch through to
                    // the popover's backdrop, which would close the list.
                    onPress={() => {
                      if (optionDisabled) return;
                      if (multiple) {
                        // Keep the menu open while toggling multiple options
                        internalToggleOption(option.value);
                      } else {
                        onChange?.(
                          nullable && isSelected ? null : option.value,
                        );
                        setVisible(false);
                      }
                    }}
                    aria-disabled={optionDisabled}
                    accessibilityLabel={option.label}
                    accessibilityRole={
                      (Platform.OS === "web" ? "option" : "none") as any
                    }
                    accessibilityState={{
                      selected: isSelected,
                      disabled: optionDisabled,
                    }}
                    style={({ hovered, pressed }: PressableState) => [
                      styles.optionItem,
                      multiple && { paddingVertical: 0 },
                      optionStyle,
                      {
                        backgroundColor: optionDisabled
                          ? "transparent"
                          : pressed
                            ? theme.colors.primaryContainer // Pressed state
                            : hovered
                              ? theme.colors.surfaceContainerHigh // Hover state (Web only)
                              : "transparent",
                      },
                      // The checkbox dims itself in a multiple select.
                      optionDisabled && !multiple && { opacity: 0.38 },
                    ]}
                    {...(Platform.OS === "android" &&
                      !optionDisabled && {
                        android_ripple: { color: theme.colors.onPrimary },
                      })}
                  >
                    <View style={styles.optionLabelRow}>
                      {multiple && (
                        <Checkbox
                          label={option.label}
                          checked={isSelected}
                          disabled={optionDisabled}
                          onValueChange={() =>
                            internalToggleOption(option.value)
                          }
                        />
                      )}
                      {!multiple && (
                        <View style={styles.innerContent}>
                          <View style={styles.leftSlot}>
                            {!!option.icon && (
                              <Icons
                                name={option.icon}
                                size={20}
                                color={
                                  isSelected
                                    ? theme.colors.primary
                                    : theme.colors.onSurfaceVariant
                                }
                                style={styles.leadingIcon}
                              />
                            )}
                            <Text
                              style={[
                                theme.typography.bodyLarge,
                                {
                                  color: isSelected
                                    ? theme.colors.primary
                                    : theme.colors.onSurface,
                                },
                              ]}
                            >
                              {option.label}
                            </Text>
                          </View>
                        </View>
                      )}
                      {!multiple && isSelected && option.value != null && (
                        <Icons
                          name="check"
                          size={18}
                          color={theme.colors.primary}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Popover>
      {!!error && (
        <Text
          style={[
            theme.typography.bodySmall,
            { color: theme.colors.error, marginTop: 4, marginLeft: 16 },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

export default Select;

const makeStyles = (theme: Theme, dense: boolean) =>
  StyleSheet.create({
    wrapper: {
      marginBottom: dense ? 12 : 20,
    },
    selectContainer: {
      // No `height: "100%"`: its parents have no height, and on iOS and Android
      // it resolved to a tall box that `density` could not shrink.
      minHeight: dense ? 40 : 52,
      borderRadius: 12,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.colors.surface,
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
    },
    // The label sits on its own line above the value.
    contentStacked: {
      flexDirection: "column",
      alignItems: "flex-start",
    },
    clearButton: {
      marginRight: 4,
    },
    leftSlot: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    leadingIcon: {
      marginRight: 12,
    },
    innerContent: {
      flex: 1,
      flexDirection: "column",
      justifyContent: "center",
      height: "100%",
    },
    menuContent: {
      minWidth: 150,
    },
    emptyMessage: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    optionItem: {
      paddingHorizontal: 8,
      paddingVertical: 12,
      marginHorizontal: 4,
      borderRadius: 8,
      transitionProperty: "background-color" as any,
      transitionDuration: "150ms" as any,
    },

    optionLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
  } as any);
