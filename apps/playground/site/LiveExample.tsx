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
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";
import { setStringAsync } from "expo-clipboard";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  Button,
  Clipboard,
  CODE_FONT_FAMILY,
  HighlightedCode,
  ToggleButtonGroup,
  Typography,
  ViewportProvider,
  useTheme,
  type PressableState,
  type Theme,
} from "@its/glowup-ui";

import type { LiveExampleDef } from "../catalogue/examples";
import type { ComponentMetadata } from "../catalogue/types";
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

/** How many lines of code the collapsed editor shows. */
const COLLAPSED_LINES = 8;

/**
 * The first line that renders the component the page is about (`<Button`, not
 * `<ButtonProps`), or the top when there is none.
 */
const firstRenderLine = (code: string, name: string) => {
  const opening = new RegExp(`<${name}(?![\\w.])`);
  return Math.max(
    0,
    code.split("\n").findIndex((line) => opening.test(line)),
  );
};

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

  // Collapsed, the editor is a short window onto the code that is about the
  // component the page describes: it opens at the first line that renders it.
  // Worked out from the live text, since a control adds lines to the literal
  // above it.
  const [expanded, setExpanded] = useState(false);
  const collapsible = lines > COLLAPSED_LINES;
  const collapsed = collapsible && !expanded;
  const windowTop = Math.min(
    firstRenderLine(code, name),
    Math.max(0, lines - COLLAPSED_LINES),
  );

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
          <View
            style={[styles.controls, layout.hasSidebar && styles.controlsWide]}
          >
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
                <Clipboard
                  value={code}
                  size="small"
                  label="Copy code"
                  copy={setStringAsync}
                />
              </View>
            </View>
            {/* The same tree open or closed (the field keeps its focus): closed,
                the clip is a few lines tall and the code is moved up inside
                it, so the editor stays whole and editable. */}
            <View style={collapsed ? styles.window : undefined}>
              <View
                style={
                  collapsed
                    ? { marginTop: -windowTop * LINE_HEIGHT }
                    : undefined
                }
              >
                {Platform.OS === "web" ? (
                  // The highlighted copy gives the box its size and the
                  // colours; the field lies over it with transparent text and
                  // keeps the caret, the selection and the input. Both use the
                  // same type, so they line up.
                  <ScrollView
                    horizontal
                    contentContainerStyle={styles.overlayScroll}
                    keyboardShouldPersistTaps="handled"
                  >
                    <View style={styles.overlay}>
                      <HighlightedCode
                        code={`${code}\n`}
                        decorative
                        style={styles.overlayText}
                      />
                      {field}
                    </View>
                  </ScrollView>
                ) : (
                  field
                )}
              </View>
              {collapsed ? <View style={styles.fade} /> : null}
            </View>
            {collapsible ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  expanded ? "Collapse code" : "Show full code"
                }
                accessibilityState={{ expanded }}
                onPress={() => setExpanded((open) => !open)}
                style={({ hovered, focused }: PressableState) => [
                  styles.toggle,
                  (hovered || focused) && {
                    backgroundColor: theme.colors.surfaceContainerHigh,
                  },
                ]}
              >
                <Icons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={theme.colors.primary}
                />
                <Typography
                  variant="labelLarge"
                  style={{ color: theme.colors.primary }}
                >
                  {expanded ? "Collapse code" : "Show full code"}
                </Typography>
              </Pressable>
            ) : null}
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
  <Typography variant="labelSmall" style={{ fontFamily: CODE_FONT_FAMILY }}>
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
    // Beside the code the fields keep one width and the code takes the rest.
    controlsWide: { flexGrow: 0, flexShrink: 0, flexBasis: 288, width: 288 },
    unbound: { gap: theme.spacing.s, alignItems: "flex-start" },
    editorColumn: { flex: 1, minWidth: 0 },
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
    // Half a line more than the window's lines: the next one peeks out under the fade.
    window: {
      height: (COLLAPSED_LINES + 0.5) * LINE_HEIGHT + theme.spacing.m,
      overflow: "hidden",
    },
    // A soft fade over the window's last lines: the editor's own colour,
    // clear at the top. The field under it stays editable.
    fade: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: LINE_HEIGHT * 3,
      pointerEvents: "none",
      ...(Platform.OS === "web"
        ? ({
            backgroundImage: `linear-gradient(to bottom, transparent, ${theme.colors.surfaceContainerHighest})`,
          } as object)
        : {
            backgroundColor: theme.colors.surfaceContainerHighest,
            opacity: 0.7,
          }),
    },
    toggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.s,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    code: {
      fontFamily: CODE_FONT_FAMILY,
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
    // The type of the field laid over it, so the two line up.
    overlayText: {
      pointerEvents: "none",
      fontSize: 13,
      lineHeight: LINE_HEIGHT,
      padding: theme.spacing.m,
    },
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
