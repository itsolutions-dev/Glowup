import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import Icons, {
  MaterialCommunityIconsGlyphs,
} from "@expo/vector-icons/MaterialCommunityIcons";
import { Theme, useTheme, getGlowStyles } from "../providers/ThemeProvider";

import Popover from "./Popover";
import Checkbox from "./Checkbox";
import Chip from "./Chip";

export interface Option {
  id: string;
  label: string;
  value: any;
  icon?: MaterialCommunityIconsGlyphs;
}

type SelectVariant = "outlined" | "filled";

interface SelectProps {
  label?: string;
  error?: string;
  disabled?: boolean;
  options: Option[];
  value: any;
  onSelect: (value: any) => void;
  placeholder?: string;
  variant?: SelectVariant;
  style?: object;
  optionStyle?: object;
  multiSelect?: boolean;
  showAsChips?: boolean;
  selectedValues?: any[];
  toggleOptions?: (value: any) => void;
}

const Select = ({
  label,
  error,
  disabled,
  options,
  value,
  onSelect,
  placeholder = "Select an option",
  variant = "outlined",
  style,
  optionStyle,
  multiSelect = false,
  showAsChips = false,
  selectedValues = [],
  toggleOptions,
}: SelectProps) => {
  const [visible, setVisible] = useState(false);
  const [layout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const variantStyles = useMemo(() => {
    return getVariantStyles(variant, theme, visible, !!error);
  }, [variant, theme, visible, error]);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  const internalToggleOption = (value) => {
    const isAlreadySelected = selectedValues.includes(value);
    if (isAlreadySelected) {
      toggleOptions(selectedValues.filter((item) => item !== value));
    } else {
      toggleOptions([...selectedValues, value]);
    }
  };

  const getDisplayContent = useCallback(() => {
    if (showAsChips && multiSelect && selectedValues.length > 0) {
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
    if (multiSelect) {
      if (selectedValues.length === 0) return placeholder || "Select options";
      const concatOptions = options
        .filter((opt) => selectedValues.includes(opt.value))
        .map((opt) => opt.label)
        .filter((_, i) => i < 2)
        .join(", ");
      if (selectedValues.length <= 2) {
        return concatOptions;
      }
      return (
        <Text
          style={[
            theme.typography.bodyLarge,
            {
              color: selectedOption
                ? theme.colors.onSurface
                : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {`${concatOptions} (+${selectedValues.length - 2})`}
        </Text>
      );
    } else {
      return (
        <View style={styles.leftSlot}>
          {selectedOption && selectedOption.icon && (
            <Icons
              name={selectedOption.icon}
              size={20}
              color={
                value === selectedOption.value
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
                color: selectedOption
                  ? theme.colors.onSurface
                  : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
        </View>
      );
    }
  }, [multiSelect, selectedValues, options, selectedOption, placeholder]);

  const handleSelect = (val) => {
    onSelect(val);
    setVisible(false);
  };

  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const Anchor = (
    <Pressable
      accessibilityLabel={selectedOption?.label}
      accessibilityRole={(Platform.OS === "web" ? "listbox" : "none") as any}
      accessibilityState={{ selected: value }}
      disabled={disabled}
      onPress={() => setVisible(true)}
      style={[styles.selectContainer, getGlowStyles(theme, visible, error)]}

      /*       style={[
        styles.selectBox,
        {
          borderColor: theme.colors.outline,
          backgroundColor: theme.colors.surface,
        },
        variantStyles.container,
      ]} */
    >
      {(!showAsChips || !multiSelect || selectedValues.length === 0) && (
        <Text
          style={[
            theme.typography.bodyLarge,
            {
              color: selectedOption
                ? theme.colors.onSurface
                : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {getDisplayContent()}
        </Text>
      )}
      <View
        onLayout={onLayout}
        style={[
          { flexDirection: "row" },
          showAsChips && selectedValues.length > 0 && { width: "100%" },
        ]}
      >
        {showAsChips && selectedValues.length > 0 && (
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
    <View style={[styles.wrapper, style, disabled && { opacity: 0.38 }]}>
      {label && variant === "outlined" && (
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
          <ScrollView bounces={false} style={{ maxHeight: 250 }}>
            {options.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => {
                  onSelect(option.value);
                  setVisible(false);
                }}
                disabled={disabled}
                accessibilityLabel={option.label}
                accessibilityRole={
                  (Platform.OS === "web" ? "option" : "none") as any
                }
                accessibilityState={{ selected: value === option.value }}
                style={({ hovered, pressed }: any) => [
                  styles.optionItem,
                  multiSelect && { paddingVertical: 0 },
                  optionStyle,
                  {
                    backgroundColor: pressed
                      ? theme.colors.primaryContainer // Pressed state
                      : hovered
                        ? theme.colors.surfaceContainerHigh // Hover state (Web only)
                        : "transparent",
                  },
                ]}
                {...(Platform.OS === "android" && {
                  android_ripple: { color: theme.colors.onPrimary },
                })}
              >
                <View style={styles.optionLabelRow}>
                  {multiSelect && (
                    <Checkbox
                      label={option.label}
                      checked={selectedValues.includes(option.value)}
                      onValueChange={() => internalToggleOption(option.value)}
                    />
                  )}
                  {!multiSelect && (
                    <View style={styles.innerContent}>
                      {variant === "filled" && label && option.value && (
                        <Text
                          style={[
                            theme.typography.labelSmall,
                            { color: variantStyles.labelColor },
                          ]}
                        >
                          {label}
                        </Text>
                      )}

                      <View style={styles.leftSlot}>
                        {option.icon && (
                          <Icons
                            name={option.icon}
                            size={20}
                            color={
                              value === option.value
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
                              color:
                                value === option.value
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
                  {!multiSelect && value === option.value && option.value && (
                    <Icons
                      name="check"
                      size={18}
                      color={theme.colors.primary}
                    />
                  )}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Popover>
      {error && (
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

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    wrapper: {
      marginBottom: 20,
      width: "100%",
    },
    staticLabel: {
      marginBottom: 8,
      marginLeft: 4,
      fontWeight: "500",
    },
    selectContainer: {
      minHeight: 52,
      height: "100%",
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
    leftSlot: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    leadingIcon: {
      marginRight: 12,
    },
    selectBox: {
      minHeight: 56,
      width: "99%",
      height: "auto",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      ...Platform.select({
        web: {
          transitionProperty:
            "border-color, background-color, box-shadow" as any,
          transitionDuration: "0.2s" as any,
          outlineStyle: "none" as any,
        },
      }),
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

const getVariantStyles = (
  variant: SelectVariant,
  theme: any,
  isFocused: boolean,
  hasError: boolean,
) => {
  const { colors } = theme;

  if (variant === "filled") {
    return {
      container: {
        backgroundColor: colors.surfaceContainerHighest,
        borderBottomWidth: isFocused ? 2 : 1,
        borderBottomColor: hasError
          ? colors.error
          : isFocused
            ? colors.primary
            : colors.onSurfaceVariant,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      },
      labelColor: hasError ? colors.error : colors.primary,
    };
  }

  return {
    container: {
      backgroundColor: "transparent",
      borderWidth: isFocused ? 2 : 1,
      borderColor: hasError
        ? colors.error
        : isFocused
          ? colors.primary
          : colors.outline,
      borderRadius: 4,
    },
    labelColor: hasError ? colors.error : colors.primary,
  };
};
