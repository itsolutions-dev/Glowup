import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  IconButton,
  Input,
  Select,
  Switch,
  Typography,
  useTheme,
  type MaterialCommunityIconsGlyphs,
  type Theme,
} from "@its/glowup-ui";
import type { ComponentMetadata, PropDefinition } from "../catalogue/types";
import { IconPicker } from "./IconPicker";
import { sameValue } from "./exampleProps";
import { OUTLINED_PAIRS, isIconName } from "./iconCatalog";

interface PropControlsProps {
  meta: ComponentMetadata;
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onReset: () => void;
  /**
   * Whether there is anything to reset. By default: whether a value differs from
   * the registry's default. A page whose example starts from values of its own
   * says so itself.
   */
  dirty?: boolean;
}

/**
 * The live controls for the component on the stage.
 *
 * Numbers are committed as numbers. The previous panel wrote whatever the text
 * field held, so every numeric prop reached its component as a string and had
 * to be coerced at the other end with `Number(x) || fallback` — a pattern
 * repeated twenty times in the preview renderer and one that silently turns a
 * legitimate `0` into the fallback.
 */
export const PropControls = ({
  meta,
  values,
  onChange,
  onReset,
  dirty: dirtyProp,
}: PropControlsProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const allKeys = Object.keys(meta.props);
  const keys = allKeys.filter(
    (key) => meta.props[key].appliesWhen?.(values) ?? true,
  );

  // Over every key, not just the visible ones: a value left behind by a prop
  // that has since become inapplicable is still a value the reset clears, and
  // hiding the button would leave no way back to it.
  const dirty =
    dirtyProp ?? allKeys.some((key) => values[key] !== meta.props[key].default);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Typography
          variant="labelSmall"
          style={[styles.eyebrow, { color: theme.colors.onSurfaceVariant }]}
        >
          Properties
        </Typography>
        <Typography
          variant="labelSmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {keys.length} {keys.length === 1 ? "control" : "controls"}
        </Typography>
      </View>

      {keys.length === 0 ? (
        <Typography
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          This component takes no props worth a control — see the API reference
          below for its full surface.
        </Typography>
      ) : (
        keys.map((key) => (
          <PropControl
            key={key}
            name={key}
            definition={meta.props[key]}
            value={values[key]}
            onChange={(next) => onChange(key, next)}
          />
        ))
      )}

      {dirty && (
        <Button variant="text" iconName="restore" onClick={onReset}>
          Reset to defaults
        </Button>
      )}
    </View>
  );
};

const PropControl = ({
  name,
  definition,
  value,
  onChange,
}: {
  name: string;
  definition: PropDefinition;
  value: any;
  onChange: (value: any) => void;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // A numeric field needs its own text buffer: "1." and "-" are states a user
  // passes through while typing and neither survives a round trip through
  // Number().
  const [draft, setDraft] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  switch (definition.type) {
    case "text":
      return (
        <Input
          label={definition.label}
          value={value?.toString() ?? ""}
          onChange={onChange}
        />
      );

    case "icon": {
      const glyph = isIconName(value) ? value : undefined;
      return (
        <View style={styles.iconField}>
          <View style={styles.iconInput}>
            <Input
              label={definition.label}
              value={value?.toString() ?? ""}
              onChange={onChange}
              leadingIcon={glyph as MaterialCommunityIconsGlyphs | undefined}
              placeholder="Type a name or search"
            />
          </View>
          <IconButton
            icon="magnify"
            variant="tonal"
            accessibilityLabel={`Search icons for ${definition.label}`}
            onClick={() => setPickerOpen(true)}
            style={styles.iconSearch}
          />
          <IconPicker
            visible={pickerOpen}
            value={glyph}
            allowClear={definition.default === ""}
            names={definition.withOutline ? OUTLINED_PAIRS : undefined}
            onClose={() => setPickerOpen(false)}
            onSelect={(next) => {
              onChange(next);
              setPickerOpen(false);
            }}
          />
        </View>
      );
    }

    case "number":
      return (
        <Input
          type="number"
          label={definition.label}
          value={draft ?? value?.toString() ?? ""}
          onChange={(text) => {
            setDraft(text);
            const parsed = Number(text);
            // Commit only a complete number; an empty field falls back to the
            // declared default so the component never receives NaN.
            if (text.trim() === "") onChange(definition.default);
            else if (!Number.isNaN(parsed)) onChange(parsed);
          }}
        />
      );

    case "boolean":
      return (
        <View style={styles.row}>
          <Typography
            variant="bodyMedium"
            style={{ color: theme.colors.onSurface, flexShrink: 1 }}
          >
            {definition.label}
          </Typography>
          <Switch value={!!value} onChange={onChange} />
        </View>
      );

    case "select": {
      // An option whose value is an object matches by structure: the value
      // comes back from the example's code, a new object each time.
      const match = (definition.options ?? []).find((option) =>
        sameValue(option.value, value),
      );
      return (
        <Select
          label={definition.label}
          options={(definition.options ?? []).map((option, index) => ({
            id: String(index),
            ...option,
          }))}
          value={match ? match.value : value}
          onChange={onChange}
        />
      );
    }

    case "node":
      // Declared by the catalogue but never renderable from a control: say so
      // instead of rendering nothing, which is what the previous panel did and
      // which reads as a missing control rather than an inapplicable one.
      return (
        <View style={styles.row}>
          <Typography
            variant="bodyMedium"
            style={{ color: theme.colors.onSurface }}
          >
            {definition.label}
          </Typography>
          <Typography
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            set in the demo
          </Typography>
        </View>
      );

    default:
      return (
        <Typography variant="labelSmall" style={{ color: theme.colors.error }}>
          {name}: no control for type “{definition.type}”
        </Typography>
      );
  }
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: { gap: theme.spacing.m, width: "100%" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: theme.spacing.s,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    eyebrow: {
      textTransform: "uppercase",
      letterSpacing: 1.6,
      fontWeight: "700",
    },
    // The search button sits beside the field, level with the box rather than
    // with its label above it.
    iconField: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: theme.spacing.s,
    },
    iconInput: { flex: 1, minWidth: 0 },
    // `Input` keeps room under its box for a helper line; lifting the button by
    // that much centres it on the box.
    iconSearch: { marginBottom: theme.spacing.xl - theme.spacing.xs },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing.m,
      minHeight: 40,
    },
  });

export default PropControls;
