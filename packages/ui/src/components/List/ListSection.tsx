import React, { useMemo } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Theme, useTheme } from "../../providers/ThemeProvider";
import Divider from "../Divider";
import ListSubheader from "./ListSubheader";

export interface ListSectionProps {
  children: React.ReactNode;
  /** Group label rendered above the rows as a heading. */
  title?: string;
  /** Rule below the section, for a settings screen of stacked groups. */
  divider?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Groups related `ListItem`s under an optional heading.
 *
 * Use this instead of wrapping each group in a `Card`: a settings screen is a
 * sequence of labelled groups, not a pile of equally-weighted surfaces.
 */
const ListSection = ({
  children,
  title,
  divider = false,
  style,
}: ListSectionProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.section, style]}>
      {!!title && <ListSubheader>{title}</ListSubheader>}
      {children}
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
