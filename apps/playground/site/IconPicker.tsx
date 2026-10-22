import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  Dialog,
  SearchBar,
  Typography,
  useTheme,
  type Theme,
} from "@its/glowup-ui";

import { IconGrid } from "./IconGrid";
import { IconStyleFilter } from "./IconStyleFilter";
import {
  ICON_NAMES,
  filterByStyle,
  searchIcons,
  type IconStyle,
} from "./iconCatalog";
import { useLayout } from "./breakpoints";

interface IconPickerProps {
  visible: boolean;
  /** The icon the field holds now, drawn as chosen. */
  value?: string;
  /** Called with the chosen name, or "" for "No icon". */
  onSelect: (name: string) => void;
  onClose: () => void;
  /** Offers "No icon", for a prop that may be left out. */
  allowClear?: boolean;
  /** Narrows the font to these names, for a prop that takes only some of them. */
  names?: readonly string[];
}

/**
 * Search the whole icon font from a prop's field. A dialog with a search box
 * and the virtualised grid; picking an icon hands it to `onSelect`.
 */
export const IconPicker = ({
  visible,
  value,
  onSelect,
  onClose,
  allowClear = false,
  names = ICON_NAMES,
}: IconPickerProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const layout = useLayout();
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState<IconStyle>("all");
  const results = useMemo(
    () => searchIcons(query, filterByStyle(names, style)),
    [query, names, style],
  );
  // An explicit width. The dialog's card is as wide as its content, and the
  // grid picks its columns from the width it is given: left to size itself it
  // chases its own tail, each column count changing the width that decides it.
  const width = Math.max(280, Math.min(720, layout.width - 96));

  return (
    <Dialog
      visible={visible}
      onClose={onClose}
      title="Choose an icon"
      width="lg"
    >
      <View style={[styles.body, { width }]}>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={`Search ${names.length.toLocaleString("en")} icons`}
          autoFocus
        />
        <IconStyleFilter value={style} onChange={setStyle} />
        <View style={styles.meta}>
          <Typography
            variant="labelMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {results.length.toLocaleString("en")}{" "}
            {results.length === 1 ? "icon" : "icons"}
            {query.trim() ? ` matching “${query.trim()}”` : ""}
          </Typography>
          {allowClear ? (
            <Button
              variant="text"
              iconName="close-circle-outline"
              onClick={() => onSelect("")}
            >
              No icon
            </Button>
          ) : null}
        </View>
        <IconGrid
          names={results}
          selected={value}
          onSelect={onSelect}
          height={Math.max(240, Math.min(420, layout.height * 0.5))}
          emptyText={`No icon is named like “${query.trim()}”.`}
        />
      </View>
    </Dialog>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    body: { gap: theme.spacing.s },
    meta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 40,
    },
  });

export default IconPicker;
