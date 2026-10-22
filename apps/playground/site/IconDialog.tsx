import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Clipboard from "expo-clipboard";
import {
  Button,
  Dialog,
  Typography,
  useTheme,
  type Theme,
} from "@its/glowup-ui";

import { CodeBlock } from "./CodeBlock";
import { codepointOf, styleOf } from "./iconCatalog";

const SIZES = [16, 24, 32, 48, 64];

interface IconDialogProps {
  /** The icon shown, or `undefined` for none (the dialog is closed). */
  name?: string;
  onClose: () => void;
}

/**
 * One icon, larger: its name, code point and look, in the sizes a component
 * uses, with the name and the usage to copy.
 */
export const IconDialog = ({ name, onClose }: IconDialogProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [copied, setCopied] = useState<string>();

  const copy = useCallback(async (kind: string, text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(kind);
    setTimeout(() => setCopied(undefined), 2000);
  }, []);

  return (
    <Dialog visible={!!name} onClose={onClose} title={name ?? ""} width="md">
      {name ? (
        <View style={styles.body}>
          <View style={styles.preview}>
            <View style={styles.hero}>
              <Icons
                name={name as never}
                size={96}
                color={theme.colors.onSecondaryContainer}
              />
            </View>
            <View style={styles.sizes}>
              {SIZES.map((size) => (
                <View key={size} style={styles.size}>
                  <Icons
                    name={name as never}
                    size={size}
                    color={theme.colors.onSurface}
                  />
                  <Typography
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {size}
                  </Typography>
                </View>
              ))}
            </View>
          </View>

          <Typography
            variant="labelMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {styleOf(name) === "outlined" ? "Outlined" : "Contained"} · code
            point {codepointOf(name)}
          </Typography>

          <View style={styles.actions}>
            <Button
              variant="tonal"
              iconName={copied === "name" ? "check" : "content-copy"}
              onClick={() => void copy("name", name)}
            >
              {copied === "name" ? "Copied" : "Copy name"}
            </Button>
            <Button
              variant="outlined"
              iconName={copied === "jsx" ? "check" : "code-tags"}
              onClick={() =>
                void copy("jsx", `<Icon source="${name}" size={24} />`)
              }
            >
              {copied === "jsx" ? "Copied" : "Copy <Icon />"}
            </Button>
          </View>

          <CodeBlock
            title="Usage"
            code={`<Icon source="${name}" size={24} />\n<Button iconName="${name}">Label</Button>`}
          />
        </View>
      ) : null}
    </Dialog>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    body: { gap: theme.spacing.m, minWidth: 280, maxWidth: 520 },
    preview: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: theme.spacing.l,
    },
    hero: {
      width: 128,
      height: 128,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: theme.shape.extraLarge,
      backgroundColor: theme.colors.secondaryContainer,
    },
    sizes: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: theme.spacing.m,
    },
    size: { alignItems: "center", gap: theme.spacing.xs },
    actions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.s },
  });

export default IconDialog;
