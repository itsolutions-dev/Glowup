import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StyleProp,
  TextStyle,
} from "react-native";
import Icons from "../Glyph";
import { useTheme, Theme, getGlowStyles } from "../../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs, PressableState } from "../types";

export interface ListItemProps {
  /** The first line. Text is drawn in the theme's type; any other node is drawn as given. */
  primaryText: React.ReactNode;
  /** Second line below `primaryText`. Text or any node, like `primaryText`. */
  secondaryText?: React.ReactNode;
  /**
   * Called when the row is pressed. Giving it makes the row a button. With an
   * `action` as well, only the icon and the texts are the button: the action is
   * a control of its own beside it, so a button never sits inside a button.
   */
  onClick?: () => void;
  /** Leading slot: a glyph name, or any node (an Avatar, a Checkbox). */
  icon?: MaterialCommunityIconsGlyphs | Exclude<React.ReactNode, string>;
  /** Trailing slot: a value, a Switch, an `IconButton`, a chevron. */
  action?: React.ReactNode;
  /** Merged after the type of `primaryText`; applies when it is text, a node styles itself. */
  primaryTextStyle?: StyleProp<TextStyle>;
  /** Merged after the type of `secondaryText`; applies when it is text, a node styles itself. */
  secondaryTextStyle?: StyleProp<TextStyle>;
  /** A coloured bar on the left edge, for a status or a priority. */
  indicatorColor?: string;
  /** Faded, for a row that is removed or inactive. Still pressable. */
  dimmed?: boolean;
  /** Fixes the width of the `action` slot and right-aligns it, so a column of rows lines its actions up. */
  trailingWidth?: number;
  /** Fades the row and stops it being pressed. The `action` is not disabled with it: it is a control of its own. */
  disabled?: boolean;
  itemContainerStyle?: object;
  itemPressedStyle?: object;
  itemHoveredStyle?: object;
  testID?: string;
}

const isText = (node: React.ReactNode) =>
  typeof node === "string" || typeof node === "number";

function ListItem({
  primaryText,
  secondaryText,
  onClick,
  icon,
  action,
  primaryTextStyle,
  secondaryTextStyle,
  indicatorColor,
  dimmed = false,
  trailingWidth,
  disabled = false,
  itemContainerStyle,
  itemPressedStyle,
  itemHoveredStyle,
  testID,
}: ListItemProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  // The split layout's own hover and press state: its container, which draws
  // the feedback, is not the Pressable.
  const [state, setState] = useState({ hovered: false, pressed: false });

  // With no slots filled this stays the original single-line centred tile.
  const isRow = !!icon || !!action || !!secondaryText;
  // A pressable row holding an action: the two are siblings, not nested.
  const split = !!onClick && !!action;

  const iconNode =
    typeof icon === "string" ? (
      <Icons
        name={icon as MaterialCommunityIconsGlyphs}
        size={24}
        color={theme.colors.onSurfaceVariant}
      />
    ) : (
      icon
    );

  const leading = !!icon && <View style={styles.leading}>{iconNode}</View>;

  const texts = (
    <View style={isRow ? styles.textBlock : undefined}>
      {isText(primaryText) ? (
        <Text
          style={[
            styles.itemText,
            isRow && styles.itemTextRow,
            primaryTextStyle,
          ]}
          numberOfLines={1}
        >
          {primaryText}
        </Text>
      ) : (
        primaryText
      )}
      {!!secondaryText &&
        (isText(secondaryText) ? (
          <Text
            style={[styles.secondaryText, secondaryTextStyle]}
            numberOfLines={2}
          >
            {secondaryText}
          </Text>
        ) : (
          secondaryText
        ))}
    </View>
  );

  const trailing = !!action && (
    <View
      style={[
        styles.trailing,
        split && styles.trailingSplit,
        trailingWidth !== undefined && {
          width: trailingWidth,
          alignItems: "flex-end",
        },
      ]}
    >
      {/* Its own box, so the right edge holds even for a child with an alignSelf of its own (StatusBadge). */}
      {trailingWidth !== undefined ? <View>{action}</View> : action}
    </View>
  );

  const accent = indicatorColor
    ? { borderLeftWidth: 4, borderLeftColor: indicatorColor }
    : null;

  const feedback = (hovered?: boolean, pressed?: boolean) => [
    (hovered || pressed) && getGlowStyles(theme, true),
    hovered && { ...styles.itemHovered, ...itemHoveredStyle }, // Web-only hover
    pressed && { ...styles.itemPressed, ...itemPressedStyle }, // Mobile-friendly press state
  ];

  const press = {
    onPress: onClick,
    disabled,
    accessibilityRole: "button" as const,
    accessibilityState: { disabled },
  };

  let row: React.ReactNode;
  if (split) {
    row = (
      <View
        style={[
          styles.itemContainer,
          styles.splitRow,
          accent,
          itemContainerStyle,
          feedback(state.hovered, state.pressed),
        ]}
      >
        <Pressable
          {...press}
          onHoverIn={() => setState((s) => ({ ...s, hovered: true }))}
          onHoverOut={() => setState((s) => ({ ...s, hovered: false }))}
          onPressIn={() => setState((s) => ({ ...s, pressed: true }))}
          onPressOut={() => setState((s) => ({ ...s, pressed: false }))}
          style={styles.splitPress}
        >
          {leading}
          {texts}
        </Pressable>
        {trailing}
      </View>
    );
  } else {
    const content = (
      <View style={[styles.content, isRow && styles.row]}>
        {leading}
        {texts}
        {trailing}
      </View>
    );
    row = onClick ? (
      <Pressable
        {...press}
        style={({ hovered, pressed }: PressableState) => [
          styles.itemContainer,
          accent,
          itemContainerStyle,
          feedback(hovered, pressed),
        ]}
      >
        {content}
      </Pressable>
    ) : (
      // Not a disabled Pressable: that marks the row disabled for screen
      // readers (aria-disabled on the web), and with it the controls in
      // its slots, such as a Switch in `action`.
      <View style={[styles.itemContainer, accent, itemContainerStyle]}>
        {content}
      </View>
    );
  }

  return (
    <View
      testID={testID}
      style={[
        styles.outerContainer,
        dimmed && styles.dimmed,
        disabled && styles.disabled,
      ]}
    >
      {row}
    </View>
  );
}

export default ListItem;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    outerContainer: {
      padding: theme.spacing.xs,
    },
    itemContainer: {
      backgroundColor: theme.colors.secondaryContainer,
      shadowColor: theme.colors.shadow,
      borderRadius: theme.shape.medium,
    },
    dimmed: {
      opacity: 0.55,
    },
    disabled: {
      opacity: 0.38,
    },
    content: {
      flex: 1,
      justifyContent: "center",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      gap: theme.spacing.m,
    },
    // The padding of `row`, split between the button and the action so the
    // button reaches the row's left edge.
    splitRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingRight: theme.spacing.m,
    },
    splitPress: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: theme.spacing.m,
      paddingRight: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      gap: theme.spacing.m,
    },
    textBlock: {
      flex: 1,
    },
    leading: {
      justifyContent: "center",
    },
    trailing: {
      justifyContent: "center",
    },
    trailingSplit: {
      paddingVertical: theme.spacing.xs,
    },
    itemText: {
      ...theme.typography.titleMedium,
      padding: theme.spacing.m,
      textAlign: "center",
      color: theme.colors.secondary,
    },
    // In row mode the padding lives on the row and the text aligns left.
    itemTextRow: {
      padding: 0,
      textAlign: "left",
      color: theme.colors.onSecondaryContainer,
    },
    secondaryText: {
      ...theme.typography.bodyMedium,
      marginTop: 2,
      color: theme.colors.onSurfaceVariant,
    },
    itemHovered: {
      backgroundColor: theme.colors.onPrimary,
      borderRadius: theme.shape.medium,
      shadowColor: theme.colors.shadow,
    },
    itemPressed: {
      backgroundColor: theme.colors.onPrimary,
      borderRadius: theme.shape.medium,
      shadowColor: theme.colors.shadow,
    },
  });
