import React, { useMemo, useState } from "react";
import {
  GestureResponderEvent,
  Platform,
  View,
  Text,
  Pressable,
  StyleSheet,
  StyleProp,
  TextStyle,
} from "react-native";
import Icons from "../Glyph";
import {
  useTheme,
  Theme,
  getGlowStyles,
  getStateColor,
} from "../../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs } from "../types";
import { a11yState } from "../internal/a11yState";

export type ListItemVariant = "standard" | "outlined" | "contained";

export interface ListItemProps {
  /** The first line. Text is drawn in the theme's type; any other node is drawn as given. */
  primaryText: React.ReactNode;
  /** Second line below `primaryText`. Text or any node, like `primaryText`. */
  secondaryText?: React.ReactNode;
  /**
   * Called when the row is pressed. Giving it makes the whole row pressable,
   * the `action` zone included. The `action` is a sibling of the row's button,
   * never inside it: a control in it (an `IconButton`, a Switch) runs its own
   * handler and never this one, while a bare icon, chip or text there presses
   * the row.
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
  /**
   * How the row is drawn. `"contained"` (the default) fills it with the
   * `secondaryContainer` surface; `"outlined"` draws it on no fill with an
   * outline; `"standard"` is transparent with no border, like the rows of a
   * sidebar. The border is the same width in all three and in every state, so
   * hover and press never move the layout.
   */
  variant?: ListItemVariant;
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

const CONTROL =
  'button,a,input,select,textarea,[role="button"],[role="switch"],[role="checkbox"],[role="radio"],[role="menuitem"],[role="tab"],[tabindex]:not([tabindex="-1"])';

// Web only: the click of a control in the action (a Switch's input) bubbles
// to the slot, which is not the control's row to press. A click on a bare
// decoration is not from a control and presses the row.
const pressRow = (event: GestureResponderEvent, onClick: () => void) => {
  const { target, currentTarget } = event as unknown as {
    target?: Element;
    currentTarget?: Element;
  };
  const control = Platform.OS === "web" && target?.closest?.(CONTROL);
  if (
    control &&
    control !== currentTarget &&
    currentTarget?.contains(control)
  ) {
    event.stopPropagation();
    return;
  }
  onClick();
};

function ListItem({
  primaryText,
  secondaryText,
  onClick,
  icon,
  action,
  primaryTextStyle,
  secondaryTextStyle,
  indicatorColor,
  variant = "contained",
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
  // The row's hover and press state, shared by its button and its action zone:
  // the container, which draws the feedback, is not either of them.
  const [state, setState] = useState({ hovered: false, pressed: false });

  // With no slots filled this stays the original single-line centred tile.
  const isRow = !!icon || !!action || !!secondaryText;

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
            isRow && variant !== "contained" && styles.itemTextRowPlain,
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

  const trailingStyle = [
    styles.trailing,
    trailingWidth !== undefined && {
      width: trailingWidth,
      alignItems: "flex-end" as const,
    },
  ];
  // Its own box, so the right edge holds even for a child with an alignSelf of its own (StatusBadge).
  const slot = trailingWidth !== undefined ? <View>{action}</View> : action;

  const accent = indicatorColor
    ? { borderLeftWidth: 4, borderLeftColor: indicatorColor }
    : null;

  // The glow's border is 1.5 wide: pinned back to the row's own width, so a
  // hover or a press recolours the border and never resizes the box.
  const glow = { ...getGlowStyles(theme, true), borderWidth: BORDER };
  // A fill laid over the row's own, as for any M3 state layer. `contained`
  // keeps its inverted fill.
  const layer = (state: "hover" | "press") =>
    variant === "contained"
      ? state === "hover"
        ? styles.itemHovered
        : styles.itemPressed
      : {
          backgroundColor: getStateColor(
            theme.colors.surface,
            theme.colors.onSurface,
            state,
          ),
        };
  const feedback = (hovered?: boolean, pressed?: boolean) => [
    (hovered || pressed) && variant !== "standard" && glow,
    hovered && { ...layer("hover"), ...itemHoveredStyle }, // Web-only hover
    pressed && { ...layer("press"), ...itemPressedStyle }, // Mobile-friendly press state
  ];

  let row: React.ReactNode;
  if (onClick) {
    // The row is two siblings, never a button inside a button (invalid HTML on
    // the web): the button holds the icon and the texts, and the action zone
    // beside it is not a button. Both report hover and press to one state the
    // container draws, so the row looks like one control.
    const track = {
      onHoverIn: () => setState((s) => ({ ...s, hovered: true })),
      onHoverOut: () => setState((s) => ({ ...s, hovered: false })),
      onPressIn: () => setState((s) => ({ ...s, pressed: true })),
      onPressOut: () => setState((s) => ({ ...s, pressed: false })),
    };
    row = (
      <View
        style={[
          styles.itemContainer,
          styles[variant],
          styles.splitRow,
          accent,
          itemContainerStyle,
          feedback(state.hovered, state.pressed),
        ]}
      >
        <Pressable
          {...track}
          onPress={onClick}
          disabled={disabled}
          accessibilityRole="button"
          {...a11yState("button", { disabled })}
          style={[styles.press, isRow && styles.pressRow]}
        >
          {leading}
          {texts}
        </Pressable>
        {!!action && (
          // Not a button: no role, not focusable, out of the accessibility
          // tree. It is here so a bare decoration (an Icon, a Chip, a Text)
          // presses the row; a control inside keeps its own press, being the
          // deeper responder, and on the web is skipped by pressRow.
          <Pressable
            {...track}
            accessible={false}
            focusable={false}
            importantForAccessibility="no"
            onPress={disabled ? undefined : (event) => pressRow(event, onClick)}
            style={styles.action}
          >
            <View style={trailingStyle}>{slot}</View>
          </Pressable>
        )}
      </View>
    );
  } else {
    row = (
      // Not a disabled Pressable: that marks the row disabled for screen
      // readers (aria-disabled on the web), and with it the controls in
      // its slots, such as a Switch in `action`.
      <View
        style={[
          styles.itemContainer,
          styles[variant],
          accent,
          itemContainerStyle,
        ]}
      >
        <View style={[styles.content, isRow && styles.row]}>
          {leading}
          {texts}
          {!!action && <View style={trailingStyle}>{slot}</View>}
        </View>
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

/** One width for every variant and state, so the box never moves. */
const BORDER = 1;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    outerContainer: {
      padding: theme.spacing.xs,
    },
    itemContainer: {
      borderWidth: BORDER,
      borderColor: "transparent",
      shadowColor: theme.colors.shadow,
      borderRadius: theme.shape.medium,
    },
    contained: {
      backgroundColor: theme.colors.secondaryContainer,
    },
    outlined: {
      backgroundColor: "transparent",
      borderColor: theme.colors.outlineVariant,
    },
    standard: {
      backgroundColor: "transparent",
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
    splitRow: {
      flexDirection: "row",
    },
    // The padding of `row`, split between the button and the action zone so
    // each reaches its edge of the row.
    press: {
      flex: 1,
    },
    pressRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: theme.spacing.m,
      paddingRight: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      gap: theme.spacing.m,
    },
    action: {
      justifyContent: "center",
      paddingRight: theme.spacing.m,
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
    // On the surface rather than on the secondary container.
    itemTextRowPlain: {
      color: theme.colors.onSurface,
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
