import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import {
  getStateColor,
  useTheme,
  type Theme,
} from "../providers/ThemeProvider";
import Clipboard, {
  isClipboardAvailable,
  type ClipboardWriter,
} from "./Clipboard";
import Typography from "./Typography";
import {
  highlight,
  splitLines,
  type CodeLanguage,
  type Token,
  type TokenKind,
} from "./internal/highlight";

/** The monospace family `CodeBlock` draws in: a field laid over `HighlightedCode` needs the same one to line up. */
export const CODE_FONT_FAMILY = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
});

const GUTTER_BORDER = 3;

// Token colours, all theme roles, so a snippet follows the palette and the
// scheme like every other surface.
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
      minHeight: 40,
      paddingLeft: theme.spacing.m,
      paddingRight: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    title: { flex: 1 },
    code: {
      ...theme.typography.bodyMedium,
      fontFamily: CODE_FONT_FAMILY,
      letterSpacing: 0,
      color: theme.colors.onSurface,
    },
    pad: { padding: theme.spacing.m },
    // Lines (line numbers, marked lines) share one column so a marked line's
    // band runs the full width of the block.
    lines: { flexGrow: 1, paddingVertical: theme.spacing.m },
    line: {
      flexDirection: "row",
      paddingRight: theme.spacing.m,
      borderLeftWidth: GUTTER_BORDER,
      borderLeftColor: "transparent",
    },
    marked: {
      borderLeftColor: theme.colors.primary,
      backgroundColor: getStateColor(
        theme.colors.surfaceContainerHighest,
        theme.colors.primary,
        "press",
      ),
    },
    gutter: {
      color: theme.colors.outline,
      textAlign: "right",
      marginHorizontal: theme.spacing.s,
      userSelect: "none",
    },
    lineText: { flexShrink: 1 },
    grow: { flexGrow: 1 },
    ...({
      comment: { color: theme.colors.outline, fontStyle: "italic" },
      string: { color: theme.colors.tertiary },
      keyword: { color: theme.colors.primary, fontStyle: "italic" },
      tag: { color: theme.colors.primary, fontWeight: "700" },
      attribute: { color: theme.colors.secondary },
      type: { color: theme.colors.primary },
      number: { color: theme.colors.tertiary },
    } satisfies Record<TokenKind, TextStyle>),
  });

const Runs = ({
  tokens,
  styles,
}: {
  tokens: Token[];
  styles: ReturnType<typeof makeStyles>;
}) => (
  <>
    {tokens.map((token, index) =>
      token.kind ? (
        <Text key={index} style={styles[token.kind]}>
          {token.text}
        </Text>
      ) : (
        token.text
      ),
    )}
  </>
);

export interface HighlightedCodeProps {
  /** The source to colour. */
  code: string;
  /** What the source is written in. Defaults to `"tsx"`. */
  language?: CodeLanguage;
  /** Lets the reader select the text. */
  selectable?: boolean;
  /** Hides the text from assistive technology, for a copy that only decorates (a field's own text is read instead). */
  decorative?: boolean;
  /** Merged after the code type: padding, font size. */
  style?: StyleProp<TextStyle>;
  testID?: string;
}

/**
 * Just the coloured runs of a snippet, in one `Text` with no chrome: what
 * `CodeBlock` draws, and what a live editor draws under its text field
 * (set the field's font to `CODE_FONT_FAMILY` too, so the two line up).
 *
 * ```tsx
 * <HighlightedCode code={'<Button onClick={save}>Save</Button>'} />
 * ```
 */
export const HighlightedCode = ({
  code,
  language = "tsx",
  selectable,
  decorative,
  style,
  testID,
}: HighlightedCodeProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const tokens = useMemo(() => highlight(code, language), [code, language]);

  return (
    <Text
      testID={testID}
      selectable={selectable}
      aria-hidden={decorative}
      style={[styles.code, style]}
    >
      <Runs tokens={tokens} styles={styles} />
    </Text>
  );
};

export interface CodeBlockProps {
  /** The source to show. */
  code: string;
  /** What it is written in, for the colours. Defaults to `"tsx"`. */
  language?: CodeLanguage;
  /** Shown above the snippet: a file name, or what it is for. Defaults to the language's name. */
  title?: string;
  /** Numbers the lines, in a gutter that is not selected with the code. */
  showLineNumbers?: boolean;
  /**
   * Shows a copy button in the header. On web it works as is; on native it is
   * drawn only with a `copy` writer or an `onCopy`. Defaults to `true`.
   */
  copyable?: boolean;
  /** Wraps long lines instead of scrolling the block sideways. */
  wrap?: boolean;
  /** Height of the block's body before it scrolls vertically. Left out, it grows with the code. */
  maxHeight?: DimensionValue;
  /** Lines to mark with a band and an accent edge, counted from 1. */
  highlightLines?: number[];
  /** Called with the code after the copy button copied it. */
  onCopy?: (code: string) => void;
  /**
   * Writes the copied text: `expo-clipboard`'s `setStringAsync` on native. On
   * web it defaults to `navigator.clipboard.writeText`.
   */
  copy?: ClipboardWriter;
  /** Read by screen readers as the name of the block. Defaults to the title, or "{LANGUAGE} code". */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * A snippet with syntax colours and a copy button, in a bordered block: the
 * text is selectable, long lines scroll sideways unless `wrap`, and the colours
 * follow the theme.
 *
 * ```tsx
 * <CodeBlock title="App.tsx" code={source} showLineNumbers highlightLines={[3, 4]} />
 * ```
 */
const CodeBlock = ({
  code,
  language = "tsx",
  title,
  showLineNumbers = false,
  copyable = true,
  wrap = false,
  maxHeight,
  highlightLines,
  onCopy,
  copy,
  accessibilityLabel,
  style,
  testID,
}: CodeBlockProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  // One trailing newline is the end of the last line, not an empty one.
  const source = useMemo(
    () => code.replace(/\r\n?/g, "\n").replace(/\n$/, ""),
    [code],
  );
  // Line by line only where a line needs its own box (a number, a band): one
  // `Text` is better to select across, and cheaper.
  const perLine = showLineNumbers || !!highlightLines?.length;
  const lines = useMemo(
    () => (perLine ? splitLines(highlight(source, language)) : null),
    [perLine, source, language],
  );

  const showCopy = copyable && isClipboardAvailable(copy, onCopy);
  const showHeader = !!title || showCopy;

  // Monospace: a digit is about 0.6 of the font size wide.
  const gutterWidth = lines
    ? Math.ceil(
        String(lines.length).length *
          0.62 *
          (theme.typography.bodyMedium.fontSize ?? 14),
      )
    : 0;

  const content = lines ? (
    <View style={styles.lines}>
      {lines.map((line, index) => (
        <View
          key={index}
          testID={testID && `${testID}-line-${index + 1}`}
          style={[
            styles.line,
            highlightLines?.includes(index + 1) && styles.marked,
          ]}
        >
          {showLineNumbers && (
            <Text
              aria-hidden
              importantForAccessibility="no"
              style={[styles.code, styles.gutter, { width: gutterWidth }]}
            >
              {index + 1}
            </Text>
          )}
          <Text selectable style={[styles.code, wrap && styles.lineText]}>
            {line.length ? <Runs tokens={line} styles={styles} /> : " "}
          </Text>
        </View>
      ))}
    </View>
  ) : (
    <HighlightedCode
      code={source}
      language={language}
      selectable
      style={styles.pad}
    />
  );

  const scrolled = wrap ? (
    content
  ) : (
    <ScrollView horizontal contentContainerStyle={styles.grow}>
      {content}
    </ScrollView>
  );

  return (
    <View
      role="group"
      accessibilityLabel={
        accessibilityLabel ?? title ?? `${language.toUpperCase()} code`
      }
      style={[styles.wrap, style]}
      testID={testID}
    >
      {showHeader && (
        <View style={styles.header}>
          <Typography
            variant="labelSmall"
            color="onSurfaceVariant"
            nowrap
            style={styles.title}
          >
            {title ?? language.toUpperCase()}
          </Typography>
          {showCopy && (
            <Clipboard
              value={code}
              size="small"
              label="Copy code"
              onCopy={onCopy}
              copy={copy}
            />
          )}
        </View>
      )}
      {maxHeight != null ? (
        <ScrollView style={{ maxHeight }} nestedScrollEnabled>
          {scrolled}
        </ScrollView>
      ) : (
        scrolled
      )}
    </View>
  );
};

export default CodeBlock;
