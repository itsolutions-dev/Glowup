import { useCallback, useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { IconButton, Typography, useTheme, type Theme } from "@its/glowup-ui";

interface CodeBlockProps {
  code: string;
  /** Shown above the snippet — a filename, or what the snippet is for. */
  title?: string;
  language?: "tsx" | "bash" | "json";
}

const MONOSPACE = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
});

/**
 * A snippet with a copy button. Every code sample on the site goes through
 * here, so the copy affordance and the type treatment are the same whether the
 * snippet was written by hand or generated from the properties panel.
 */
export const CodeBlock = ({
  code,
  title,
  language = "tsx",
}: CodeBlockProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    // No cleanup on unmount: the worst case is a setState on an unmounted
    // component, which React 19 ignores, and cancelling it would need a ref
    // dance for a two-second label.
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Typography
          variant="labelSmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {title ?? language.toUpperCase()}
        </Typography>
        <IconButton
          icon={copied ? "check" : "content-copy"}
          size="small"
          accessibilityLabel={copied ? "Copied" : "Copy code"}
          onPress={copy}
        />
      </View>
      {/* Code is the one thing allowed to scroll sideways: wrapping a JSX
          sample at a phone width makes it unreadable. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text selectable style={styles.code}>
          {code}
        </Text>
      </ScrollView>
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: {
      width: "100%",
      borderRadius: theme.shape.medium,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerHighest,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingLeft: theme.spacing.m,
      paddingRight: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    code: {
      fontFamily: MONOSPACE,
      fontSize: 13,
      lineHeight: 20,
      color: theme.colors.onSurface,
      padding: theme.spacing.m,
    },
  });

export default CodeBlock;
