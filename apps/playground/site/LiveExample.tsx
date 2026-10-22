import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import {
  Button,
  IconButton,
  ToggleButtonGroup,
  Typography,
  ViewportProvider,
  useTheme,
  type Theme,
} from "@its/glowup-ui";

import type { LiveExampleDef } from "../catalogue/examples";
import type { ComponentMetadata } from "../catalogue/types";
import { HighlightedText, MONOSPACE } from "./CodeBlock";
import { DemoErrorBoundary } from "./ErrorBoundary";
import { PropControls } from "./PropControls";
import { useLayout } from "./breakpoints";
import { useHydrated } from "./useHydrated";
import { readProps, sameValue, withoutProps, writeProps } from "./exampleProps";
import { compileExample } from "./liveCode";
import { STAGE_WIDTHS, STAGE_WIDTH_OPTIONS, type StageWidth } from "./stage";

/** How long typing pauses before the text is compiled and the stage redrawn. */
const COMPILE_DELAY = 250;

const LINE_HEIGHT = 20;

interface LiveExampleProps {
  /** The catalogue page's name: the component the example is about. */
  name: string;
  example: LiveExampleDef;
  /** The component's controls: the props the Properties panel edits. */
  meta: ComponentMetadata;
}

/** The registry defaults of a component's controls. */
const defaultsOf = (meta: ComponentMetadata) =>
  Object.fromEntries(
    Object.entries(meta.props).map(([key, definition]) => [
      key,
      definition.default,
    ]),
  );

/** Replaces what `bag` holds with `values`, keeping the same object. */
const fill = (
  bag: Record<string, unknown>,
  values: Record<string, unknown>,
) => {
  for (const key of Object.keys(bag)) delete bag[key];
  Object.assign(bag, values);
};

/**
 * The page's one example: a component as an app would use it, on a stage, with
 * its code to change and the Properties panel that edits the same code.
 *
 * The code starts with a `props` object, and that object is what the panel
 * reads and writes (`site/exampleProps.ts`): moving a control rewrites the
 * literal, typing in it moves the control. The component itself is compiled
 * from the rest of the text and reads `props` from an object held here, so a
 * control redraws it without compiling again and without losing what it has in
 * state.
 *
 * Until the text is touched the stage shows the real component the file
 * exports, so a page prerenders and hydrates like any other and nothing is
 * evaluated. After the first change it shows the compiled text; a compile error
 * keeps the last good render on the stage and shows the message under the
 * editor, and "Reset to default" puts the original text back.
 */
export const LiveExample = ({ name, example, meta }: LiveExampleProps) => {
  const { theme } = useTheme();
  const layout = useLayout();
  const hydrated = useHydrated();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [code, setCode] = useState(example.source);
  const [stageWidth, setStageWidth] = useState<StageWidth>("full");
  const [copied, setCopied] = useState(false);

  // The values of the `props` literal, held outside the compiled component so
  // it can read them on every render. Kept current wherever the code changes
  // (an event handler), never while rendering.
  const bag = useRef<Record<string, unknown>>(readProps(example.source) ?? {});
  // Whether the last change came from a control (compile at once) or typing.
  const fromPanel = useRef(false);

  // The compiled component of the text that last compiled, and the error of the
  // text that did not. `version` remounts the stage on each new component, so
  // state held by the old one cannot leak into code that no longer matches it.
  const [compiled, setCompiled] = useState<{
    Component: ComponentType;
    source: string;
    version: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pristine = code === example.source;
  const compiledSource = useMemo(() => withoutProps(code), [code]);
  const bound = useMemo(() => readProps(code), [code]);
  const authored = useMemo(
    () => new Set(Object.keys(readProps(example.source) ?? {})),
    [example.source],
  );
  const values = useMemo(
    () => ({ ...defaultsOf(meta), ...(bound ?? {}) }),
    [meta, bound],
  );

  useEffect(() => {
    if (pristine) return;
    // Only the `props` literal changed: the compiled component has it already.
    if (compiled?.source === compiledSource) return;
    const timer = setTimeout(
      () => {
        const result = compileExample(code, bag.current);
        if (result.ok) {
          setCompiled((previous) => ({
            Component: result.Component,
            source: compiledSource,
            version: (previous?.version ?? 0) + 1,
          }));
          setError(null);
        } else {
          setError(result.error);
        }
      },
      fromPanel.current ? 0 : COMPILE_DELAY,
    );
    return () => clearTimeout(timer);
  }, [code, compiledSource, compiled, pristine]);

  // The error of an edit that has since been undone is not worth showing.
  const visibleError = pristine ? null : error;

  const edit = useCallback((next: string, byPanel: boolean) => {
    fromPanel.current = byPanel;
    fill(bag.current, readProps(next) ?? {});
    setCode(next);
  }, []);

  const reset = useCallback(() => {
    fill(bag.current, readProps(example.source) ?? {});
    setCode(example.source);
    setCompiled(null);
    setError(null);
  }, [example.source]);

  const setProp = useCallback(
    (key: string, value: unknown) => {
      const current = readProps(code);
      if (!current) return;
      const next: Record<string, unknown> = { ...current };
      const definition = meta.props[key];
      // A control moved back to its default leaves the literal, unless the
      // example wrote it there on purpose.
      if (sameValue(value, definition?.default) && !authored.has(key)) {
        delete next[key];
      } else {
        next[key] = value;
      }
      // Registry order, then whatever else the literal holds.
      const ordered: Record<string, unknown> = {};
      for (const known of Object.keys(meta.props)) {
        if (known in next) ordered[known] = next[known];
      }
      for (const other of Object.keys(next)) {
        if (!(other in ordered)) ordered[other] = next[other];
      }
      edit(writeProps(code, ordered), true);
    },
    [authored, code, edit, meta.props],
  );

  const copy = useCallback(async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  // The real component while the text is the file's, the last good compile
  // once it has been edited (and still the real one if nothing has compiled
  // yet, so a first change does not blank the stage).
  const Shown = pristine || !compiled ? example.Component : compiled.Component;
  const version = pristine || !compiled ? 0 : compiled.version;

  const input = useRef<TextInput>(null);
  // Tab indents, which would trap a keyboard user in the editor: Escape lets
  // the next Tab through, as in every code editor on the web.
  const tabLeavesEditor = useRef(false);
  const onKeyPress = useCallback(
    (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (Platform.OS !== "web") return;
      const { key, shiftKey } =
        event.nativeEvent as typeof event.nativeEvent & {
          shiftKey?: boolean;
        };
      if (key === "Escape") {
        tabLeavesEditor.current = true;
        return;
      }
      if (key !== "Tab" || shiftKey || tabLeavesEditor.current) {
        if (key !== "Tab") tabLeavesEditor.current = false;
        return;
      }
      const field = input.current as unknown as HTMLTextAreaElement | null;
      if (!field || typeof field.setRangeText !== "function") return;
      (event as unknown as { preventDefault: () => void }).preventDefault();
      field.setRangeText("  ", field.selectionStart, field.selectionEnd, "end");
      edit(field.value, false);
    },
    [edit],
  );

  const lines = code.split("\n").length;
  const field = (
    <TextInput
      ref={input}
      accessibilityLabel={`${name} example: code`}
      multiline
      value={code}
      onChangeText={(next) => edit(next, false)}
      onKeyPress={onKeyPress}
      autoCapitalize="none"
      autoCorrect={false}
      spellCheck={false}
      scrollEnabled={false}
      style={[
        styles.code,
        Platform.OS === "web"
          ? styles.overlayField
          : { height: lines * LINE_HEIGHT + theme.spacing.m * 2 },
      ]}
    />
  );

  const hasControls = Object.keys(meta.props).length > 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.toolbar}>
        <Typography
          variant="labelSmall"
          style={[styles.eyebrow, { color: theme.colors.onSurfaceVariant }]}
        >
          Example
        </Typography>
        <ToggleButtonGroup
          accessibilityLabel={`${name} example: stage width`}
          value={stageWidth}
          onValueChange={(value) => setStageWidth(value as StageWidth)}
          options={[...STAGE_WIDTH_OPTIONS]}
        />
      </View>

      <View
        style={[
          styles.stage,
          STAGE_WIDTHS[stageWidth] !== undefined && {
            width: STAGE_WIDTHS[stageWidth],
            maxWidth: "100%",
            alignSelf: "center",
          },
        ]}
      >
        <ViewportProvider width={STAGE_WIDTHS[stageWidth]}>
          <DemoErrorBoundary key={version} label={name}>
            {/* A component that reads the reader's clock or locale draws after
                hydration: the exported HTML has the build's (see `clientOnly`). */}
            {(hydrated || !meta.clientOnly) && <Shown />}
          </DemoErrorBoundary>
        </ViewportProvider>
      </View>

      <View style={[styles.below, layout.hasSidebar && styles.belowWide]}>
        {hasControls ? (
          <View style={styles.controls}>
            {bound ? (
              <PropControls
                meta={meta}
                values={values}
                onChange={setProp}
                onReset={reset}
                dirty={!pristine}
              />
            ) : (
              <View style={styles.unbound}>
                <Typography
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  The controls edit the example&apos;s <Code>props</Code>{" "}
                  object, and the code no longer has one that can be read. Fix
                  it, or reset the example to get the controls back.
                </Typography>
                <Button variant="tonal" iconName="restore" onClick={reset}>
                  Reset to default
                </Button>
              </View>
            )}
          </View>
        ) : null}

        <View style={styles.editorColumn}>
          <View style={styles.editor}>
            <View style={styles.editorBar}>
              <Typography
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {example.file}
                {pristine ? "" : " · edited"}
              </Typography>
              <View style={styles.editorActions}>
                <Button
                  variant="text"
                  iconName="restore"
                  disabled={pristine}
                  onClick={reset}
                >
                  Reset to default
                </Button>
                <IconButton
                  icon={copied ? "check" : "content-copy"}
                  size="small"
                  accessibilityLabel={copied ? "Copied" : "Copy code"}
                  onClick={copy}
                />
              </View>
            </View>
            {Platform.OS === "web" ? (
              // The highlighted copy gives the box its size and the colours; the
              // field lies over it with transparent text and keeps the caret,
              // the selection and the input. Both use the same type, so they
              // line up.
              <ScrollView
                horizontal
                contentContainerStyle={styles.overlayScroll}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.overlay}>
                  <HighlightedText
                    code={`${code}\n`}
                    hidden
                    style={styles.overlayText}
                  />
                  {field}
                </View>
              </ScrollView>
            ) : (
              field
            )}
            {visibleError ? (
              <View style={styles.error} accessible accessibilityRole="alert">
                <Typography
                  variant="labelSmall"
                  style={{ color: theme.colors.onErrorContainer }}
                >
                  {visibleError}
                </Typography>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
};

const Code = ({ children }: { children: string }) => (
  <Typography variant="labelSmall" style={{ fontFamily: MONOSPACE }}>
    {children}
  </Typography>
);

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: { gap: theme.spacing.s },
    toolbar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: theme.spacing.s,
    },
    eyebrow: {
      textTransform: "uppercase",
      letterSpacing: 1.6,
      fontWeight: "700",
    },
    stage: {
      minHeight: 260,
      padding: theme.spacing.l,
      borderRadius: theme.shape.large,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    below: { gap: theme.spacing.l },
    belowWide: { flexDirection: "row", alignItems: "flex-start" },
    controls: { flex: 1, minWidth: 0 },
    unbound: { gap: theme.spacing.s, alignItems: "flex-start" },
    editorColumn: { flex: 1.4, minWidth: 0 },
    editor: {
      borderRadius: theme.shape.medium,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerHighest,
      overflow: "hidden",
    },
    editorBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      paddingLeft: theme.spacing.m,
      paddingRight: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    editorActions: { flexDirection: "row", alignItems: "center" },
    code: {
      fontFamily: MONOSPACE,
      fontSize: 13,
      lineHeight: LINE_HEIGHT,
      color: theme.colors.onSurface,
      padding: theme.spacing.m,
      // Code does not wrap: a JSX line that does is unreadable, and the field
      // scrolls sideways instead. Web only; native text inputs ignore it.
      ...(Platform.OS === "web"
        ? ({
            whiteSpace: "pre",
            outlineStyle: "none",
          } as object)
        : null),
    },
    // The web editor: a box the size of the highlighted text, with the field
    // laid over it.
    overlayScroll: { minWidth: "100%" },
    overlay: { flexGrow: 1, position: "relative" },
    overlayText: { pointerEvents: "none" },
    overlayField: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      color: "transparent",
      backgroundColor: "transparent",
      ...(Platform.OS === "web"
        ? ({
            caretColor: theme.colors.onSurface,
            resize: "none",
            overflow: "hidden",
          } as object)
        : null),
    },
    error: {
      padding: theme.spacing.m,
      backgroundColor: theme.colors.errorContainer,
    },
  });

export default LiveExample;
