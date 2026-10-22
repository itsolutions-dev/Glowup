import { useCallback, useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import {
  Button,
  SearchBar,
  Typography,
  useTheme,
  type Theme,
} from "@its/glowup-ui";

import { IconDialog } from "../site/IconDialog";
import { IconGrid } from "../site/IconGrid";
import { IconStyleFilter } from "../site/IconStyleFilter";
import { Page } from "../site/Page";
import { useLayout } from "../site/breakpoints";
import {
  ICON_NAMES,
  filterByStyle,
  searchIcons,
  type IconStyle,
} from "../site/iconCatalog";

const DESCRIPTION = `All ${ICON_NAMES.length.toLocaleString("en")} icons of the Material Design Icons font: the set every icon prop in the library takes, by name. Search, filter by look, press an icon for its details, and export the list.`;

/** The whole list as a file, on the web where a page can offer one. */
const download = (name: string, text: string) => {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};

export default function IconsPage() {
  const { theme } = useTheme();
  const layout = useLayout();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState<IconStyle>("all");
  const [selected, setSelected] = useState<string>();
  const [copied, setCopied] = useState(false);

  const results = useMemo(
    () => searchIcons(query, filterByStyle(ICON_NAMES, style)),
    [query, style],
  );

  const copyList = useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const list = JSON.stringify(results, null, 2);

  return (
    <Page eyebrow="Reference" title="Icons" description={DESCRIPTION}>
      <View style={styles.toolbar}>
        <View style={styles.search}>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder={`Search ${ICON_NAMES.length.toLocaleString("en")} icons, e.g. “account”, “arrow left”`}
          />
        </View>
        <View style={styles.exports}>
          <Button
            variant="outlined"
            iconName={copied ? "check" : "code-json"}
            onClick={() => void copyList(list)}
          >
            {copied
              ? "Copied"
              : `Copy ${results.length.toLocaleString("en")} names`}
          </Button>
          {Platform.OS === "web" ? (
            <Button
              variant="outlined"
              iconName="download"
              onClick={() => download("icons.json", list)}
            >
              Download JSON
            </Button>
          ) : null}
        </View>
      </View>

      <View style={styles.filters}>
        <IconStyleFilter value={style} onChange={setStyle} />
        <View accessibilityLiveRegion="polite">
          <Typography
            variant="labelMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {results.length.toLocaleString("en")}{" "}
            {results.length === 1 ? "icon" : "icons"}
            {query.trim() ? ` matching “${query.trim()}”` : ""}
          </Typography>
        </View>
      </View>

      <View style={styles.grid}>
        <IconGrid
          names={results}
          selected={selected}
          onSelect={setSelected}
          height={Math.max(320, Math.min(560, layout.height * 0.6))}
          emptyText={`No icon is named like “${query.trim()}”.`}
        />
      </View>

      <IconDialog name={selected} onClose={() => setSelected(undefined)} />
    </Page>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    toolbar: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: theme.spacing.m,
    },
    search: { flexGrow: 1, flexBasis: 320 },
    exports: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.s },
    filters: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing.s,
      marginTop: -theme.spacing.m,
    },
    grid: {
      borderRadius: theme.shape.extraLarge,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
      padding: theme.spacing.s,
    },
  });
