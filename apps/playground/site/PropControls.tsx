import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  Input,
  NumericInput,
  Select,
  Toggle,
  Typography,
  useTheme,
  type Theme,
} from "@its/glowup-ui";
import type { ComponentMetadata, PropDefinition } from "../catalogue/types";

interface PropControlsProps {
  meta: ComponentMetadata;
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onReset: () => void;
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
}: PropControlsProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const keys = Object.keys(meta.props);

  const dirty = keys.some((key) => values[key] !== meta.props[key].default);

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
          style={{ color: theme.colors.outline }}
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
        <Button mode="text" iconName="restore" onPress={onReset}>
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

  switch (definition.type) {
    case "text":
      return (
        <Input
          label={definition.label}
          value={value?.toString() ?? ""}
          onChangeText={onChange}
        />
      );

    case "number":
      return (
        <NumericInput
          label={definition.label}
          value={draft ?? value?.toString() ?? ""}
          onChangeText={(text) => {
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
          <Toggle value={!!value} onValueChange={onChange} />
        </View>
      );

    case "select":
      return (
        <Select
          label={definition.label}
          options={(definition.options ?? []).map((option, index) => ({
            id: String(index),
            ...option,
          }))}
          value={value}
          onSelect={onChange}
        />
      );

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
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing.m,
      minHeight: 40,
    },
  });

export default PropControls;
