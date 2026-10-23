import React, { Children, useMemo } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Theme, useTheme } from "../../providers/ThemeProvider";
import Divider from "../Divider";
import ListSubheader from "./ListSubheader";

export interface ListSectionProps {
  children: React.ReactNode;
  /** Group label rendered above the rows as a heading. */
  title?: string;
  /**
   * One rule below the section, after its last item: it closes the group, for
   * a settings screen of stacked groups. `showDividers` is the rules *between*
   * the items, and the two can be used together.
   */
  divider?: boolean;
  /**
   * Space between consecutive items: a spacing token (`"xs"` 4, `"s"` 8, `"m"`
   * 16, `"l"` 24, `"xl"` 32) or a number of pixels. Each `ListItem` already
   * keeps a small margin of its own: this is added to it.
   */
  gap?: "xs" | "s" | "m" | "l" | "xl" | number;
  /**
   * A rule between each pair of consecutive items, so `n` items get `n - 1`
   * rules, none before the first or after the last (that one is `divider`).
   * With a `gap`, the rule sits in the middle of it.
   */
  showDividers?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Groups related `ListItem`s under an optional heading.
 *
 * Use this instead of wrapping each group in a `Card`: a settings screen is a
 * sequence of labelled groups, not a pile of equally-weighted surfaces. With
 * `ListItem`'s `variant="standard"`, `gap` and `showDividers` it is also a plain
 * list, like a sidebar's.
 */
const ListSection = ({
  children,
  title,
  divider = false,
  gap,
  showDividers = false,
  style,
}: ListSectionProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const space = typeof gap === "string" ? theme.spacing[gap] : (gap ?? 0);
  // `toArray` drops what draws nothing (null, false), so a conditional item
  // leaves neither a gap nor a rule behind.
  const items = Children.toArray(children).flatMap((child, index) =>
    index > 0 && (space > 0 || showDividers)
      ? [
          <View
            key={`separator-${index}`}
            style={space > 0 ? { marginVertical: space / 2 } : undefined}
          >
            {showDividers && <Divider contentSpacing={theme.spacing.s} />}
          </View>,
          child,
        ]
      : [child],
  );

  return (
    <View style={[styles.section, style]}>
      {!!title && <ListSubheader>{title}</ListSubheader>}
      {items}
      {divider && <Divider contentSpacing={theme.spacing.s} />}
    </View>
  );
};

export default ListSection;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    section: {
      marginBottom: theme.spacing.s,
    },
  });
