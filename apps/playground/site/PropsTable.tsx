import { useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import {
  Chip,
  Divider,
  Input,
  Typography,
  useTheme,
  type Theme,
} from "@its/glowup-ui";
import type { ComponentDoc, PropDoc } from "./propsData";
import { useLayout } from "./breakpoints";

const MONOSPACE = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
});

interface PropsTableProps {
  doc: ComponentDoc;
}

/**
 * The generated API reference for one component.
 *
 * Two presentations of the same rows rather than one that degrades: a real
 * four-column table where there is room for it, and a stack of labelled blocks
 * below `expanded`, because a table squeezed into 360dp is a column of
 * truncated type signatures — the one thing a reader came here to read.
 */
export const PropsTable = ({ doc }: PropsTableProps) => {
  const { theme } = useTheme();
  const { hasSidebar } = useLayout();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [filter, setFilter] = useState("");

  const rows = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return doc.props;
    return doc.props.filter(
      (prop) =>
        prop.name.toLowerCase().includes(needle) ||
        prop.type.toLowerCase().includes(needle) ||
        (prop.description ?? "").toLowerCase().includes(needle),
    );
  }, [doc.props, filter]);

  return (
    <View style={styles.wrap}>
      <View style={styles.heading}>
        <Typography
          variant="titleMedium"
          style={{ color: theme.colors.onSurface }}
        >
          Props
        </Typography>
        <Typography
          variant="labelMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {doc.props.length} on {doc.propsTypeName ?? `${doc.name}Props`}
        </Typography>
      </View>

      {doc.extends.length > 0 && (
        <Typography
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Also accepts everything from{" "}
          <Text style={styles.inlineCode}>{doc.extends.join(", ")}</Text>.
        </Typography>
      )}

      {doc.props.length > 8 && (
        <Input
          label="Filter props"
          value={filter}
          onChangeText={setFilter}
          leadingIcon="magnify"
        />
      )}

      {rows.length === 0 ? (
        <Typography
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          No prop matches “{filter}”.
        </Typography>
      ) : hasSidebar ? (
        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            <Typography
              variant="labelSmall"
              style={[styles.cellName, styles.th]}
            >
              NAME
            </Typography>
            <Typography
              variant="labelSmall"
              style={[styles.cellType, styles.th]}
            >
              TYPE
            </Typography>
            <Typography
              variant="labelSmall"
              style={[styles.cellDefault, styles.th]}
            >
              DEFAULT
            </Typography>
            <Typography
              variant="labelSmall"
              style={[styles.cellDesc, styles.th]}
            >
              DESCRIPTION
            </Typography>
          </View>
          {rows.map((prop, index) => (
            <View key={prop.name}>
              {index > 0 && <Divider />}
              <View style={styles.row}>
                <View style={styles.cellName}>
                  <Text style={styles.propName}>{prop.name}</Text>
                  {prop.required && (
                    <Text style={styles.required}>required</Text>
                  )}
                  {prop.deprecated && (
                    <Text style={styles.deprecated}>deprecated</Text>
                  )}
                </View>
                <Text style={[styles.cellType, styles.type]}>{prop.type}</Text>
                <Text style={[styles.cellDefault, styles.default]}>
                  {prop.default ?? "—"}
                </Text>
                <Typography
                  variant="bodySmall"
                  style={[
                    styles.cellDesc,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {prop.description ?? ""}
                </Typography>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.stack}>
          {rows.map((prop) => (
            <PropCard key={prop.name} prop={prop} />
          ))}
        </View>
      )}
    </View>
  );
};

const PropCard = ({ prop }: { prop: PropDoc }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.propName}>{prop.name}</Text>
        {prop.required && <Chip label="required" size="small" />}
        {prop.deprecated && <Chip label="deprecated" size="small" />}
      </View>
      <Text style={styles.type}>{prop.type}</Text>
      {prop.default !== undefined && (
        <Text style={styles.default}>default: {prop.default}</Text>
      )}
      {prop.description ? (
        <Typography
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {prop.description}
        </Typography>
      ) : null}
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: { width: "100%", gap: theme.spacing.m },
    heading: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: theme.spacing.s,
    },
    table: {
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.shape.medium,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.spacing.m,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },
    headerRow: { backgroundColor: theme.colors.surfaceContainerHigh },
    th: {
      color: theme.colors.onSurfaceVariant,
      letterSpacing: 1.2,
      fontWeight: "700",
    },
    // Flex, not fixed widths: the table lives in a column whose width depends
    // on whether the props panel is open.
    cellName: { flex: 2.2, gap: 2 },
    cellType: { flex: 3 },
    cellDefault: { flex: 1.6 },
    cellDesc: { flex: 3.4 },
    propName: {
      fontFamily: MONOSPACE,
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    type: {
      fontFamily: MONOSPACE,
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.primary,
    },
    default: {
      fontFamily: MONOSPACE,
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.onSurfaceVariant,
    },
    inlineCode: {
      fontFamily: MONOSPACE,
      fontSize: 12,
      color: theme.colors.primary,
    },
    required: {
      fontSize: 10,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: theme.colors.error,
    },
    deprecated: {
      fontSize: 10,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: theme.colors.onSurfaceVariant,
    },
    stack: { gap: theme.spacing.s },
    card: {
      gap: theme.spacing.xs,
      padding: theme.spacing.m,
      borderRadius: theme.shape.medium,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    cardHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s,
      flexWrap: "wrap",
    },
  });

export default PropsTable;
