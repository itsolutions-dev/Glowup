// The Properties panel (spec §13): the selected node's text, props (the
// component pages' controls), data (as JSON), position, form field and tabs.
// Every change is an operation applied with a key, so the keystrokes in one
// field are one undo step (§14).

import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  Dialog,
  IconButton,
  Input,
  InputArea,
  ScrollArea,
  Switch,
  Typography,
  useTheme,
  type Theme,
} from "@its/glowup-ui";

import { ComponentRegistry } from "../../catalogue/registry";
import { PropControls } from "../../site/PropControls";
import type { LayoutNode, NodeId } from "../document";
import { findNode } from "../document";
import { fieldNameProblem, setFieldName, setFieldRules } from "../forms";
import { entryFor } from "../manifest";
import {
  addTab,
  duplicateNode,
  moveTab,
  placeNode,
  removeNode,
  removeTab,
  renameTab,
  setProps,
  setText,
} from "../operations";
import { codeProps, dataProps } from "../panels";
import type { Editor } from "./useEditor";

const kindOf = (value: unknown) =>
  Array.isArray(value) ? "array" : value === null ? "null" : typeof value;

/**
 * A field that keeps what was typed while it is refused: `commit` applies the
 * text and returns why it could not, or null. A new value from outside (an
 * undo, another node) replaces the text.
 */
const DraftField = ({
  label,
  value,
  commit,
  area = false,
  onLeave = false,
}: {
  label: string;
  value: string;
  commit: (text: string) => string | null;
  area?: boolean;
  /**
   * Commit when the field is left (or Enter is pressed), not on every
   * keystroke: a position typed digit by digit would otherwise place the node
   * at every number on the way ("1", then "10") and push others for nothing.
   */
  onLeave?: boolean;
}) => {
  const [text, setText] = useState(value);
  const [problem, setProblem] = useState<string | null>(null);
  // A new value from outside replaces the text (React's "adjusting state
  // when a prop changes": during the render, not in an effect).
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setText(value);
    setProblem(null);
  }
  const onChange = (next: string) => {
    setText(next);
    setProblem(onLeave ? null : commit(next));
  };
  const leave = () => {
    const why = commit(text);
    setProblem(why);
    // Applied, or nothing to apply: the field shows the stored value again
    // (a changed one arrives as a new value and replaces it anyway).
    if (!why) setText(value);
  };
  return area ? (
    <InputArea
      label={label}
      value={text}
      onChange={onChange}
      error={problem ?? undefined}
      minRows={3}
    />
  ) : (
    <Input
      label={label}
      value={text}
      onChange={onChange}
      error={problem ?? undefined}
      {...(onLeave
        ? { onBlur: leave, inputProps: { onSubmitEditing: leave } }
        : {})}
    />
  );
};

const Section = ({
  title,
  children,
  styles,
}: {
  title: string;
  children: React.ReactNode;
  styles: ReturnType<typeof makeStyles>;
}) => (
  <View style={styles.section}>
    <Typography variant="labelLarge" color="onSurfaceVariant">
      {title}
    </Typography>
    {children}
  </View>
);

const LAYOUT_KEYS = ["x", "y", "w", "h"] as const;

/**
 * The controls for a type: its catalogue entry, or for VStack and HStack
 * (no page of their own) Stack's, less the direction their name fixes.
 */
const registryFor = (type: string) => {
  if (ComponentRegistry[type]) return ComponentRegistry[type];
  if (type !== "VStack" && type !== "HStack") return undefined;
  const { direction: _fixed, ...props } = ComponentRegistry.Stack.props;
  return { ...ComponentRegistry.Stack, name: type, props };
};

const Body = ({
  editor,
  node,
  styles,
}: {
  editor: Editor;
  node: LayoutNode;
  styles: ReturnType<typeof makeStyles>;
}) => {
  const { doc, apply } = editor;
  const id: NodeId = node.id;
  const entry = entryFor(node.type);
  const meta = registryFor(node.type);
  const [removing, setRemoving] = useState<number | null>(null);

  // The registry's controls, but not its `children` (Content owns the text)
  // nor, for a bound field, `required` (the Field section's rule sets it).
  const bound = node.field !== undefined;
  const controls = useMemo(() => {
    if (!meta) return null;
    const { children: _text, ...props } = meta.props;
    if (bound) delete props.required;
    return { ...meta, props };
  }, [meta, bound]);
  const values = controls
    ? {
        ...Object.fromEntries(
          Object.entries(controls.props).map(([k, d]) => [k, d.default]),
        ),
        ...node.props,
      }
    : {};
  const data = dataProps(node, Object.keys(meta?.props ?? {}));
  const code = codeProps(node.type);

  return (
    <>
      <View style={styles.header}>
        <Typography variant="titleSmall" style={styles.grow}>
          {[node.type, id, node.field?.name].filter(Boolean).join(" · ")}
        </Typography>
        <IconButton
          icon="content-copy"
          size="small"
          accessibilityLabel="Duplicate"
          onClick={() => {
            const copy = duplicateNode(doc, id);
            apply(copy.doc);
            if (copy.id) editor.select(copy.id);
          }}
        />
        <IconButton
          icon="delete-outline"
          size="small"
          accessibilityLabel="Delete"
          onClick={() => apply(removeNode(doc, id))}
        />
      </View>

      {entry?.kind === "text" ? (
        <Section title="Content" styles={styles}>
          <Input
            label="Text"
            value={node.text ?? ""}
            onChange={(text) => apply(setText(doc, id, text), `text:${id}`)}
          />
        </Section>
      ) : null}

      {controls ? (
        <Section title="Props" styles={styles}>
          <PropControls
            meta={controls}
            values={values}
            onChange={(key, value) =>
              apply(
                setProps(doc, id, {
                  // A prop left at its default is not stored (§13).
                  [key]:
                    JSON.stringify(value) ===
                    JSON.stringify(controls.props[key]?.default)
                      ? undefined
                      : value,
                }),
                `props:${id}:${key}`,
              )
            }
            onReset={() =>
              apply(
                setProps(
                  doc,
                  id,
                  Object.fromEntries(
                    Object.keys(controls.props).map((k) => [k, undefined]),
                  ),
                ),
              )
            }
          />
        </Section>
      ) : null}

      {data.length > 0 ? (
        <Section title="Data" styles={styles}>
          {data.map((name) => {
            const current = node.props[name] ?? entry?.defaultProps[name];
            return (
              <DraftField
                key={name}
                area
                label={name}
                value={JSON.stringify(current, null, 2)}
                commit={(text) => {
                  let parsed: unknown;
                  try {
                    parsed = JSON.parse(text);
                  } catch {
                    return "Not valid JSON";
                  }
                  const kind = kindOf(current);
                  // A list keeps the kind of its items: a Select's options
                  // given [null] would break the component, and the page.
                  const item = Array.isArray(current) ? current[0] : undefined;
                  if (
                    item !== undefined &&
                    Array.isArray(parsed) &&
                    parsed.some((p) => kindOf(p) !== kindOf(item))
                  ) {
                    const k = kindOf(item);
                    return `Every item must be ${k === "object" || k === "array" ? "an" : "a"} ${k}`;
                  }
                  if (current !== undefined && kindOf(parsed) !== kind) {
                    return `Expected ${kind === "array" ? "an array" : `a${kind === "object" ? "n" : ""} ${kind}`}`;
                  }
                  apply(
                    setProps(doc, id, { [name]: parsed }),
                    `data:${id}:${name}`,
                  );
                  return null;
                }}
              />
            );
          })}
        </Section>
      ) : null}

      {node.layout ? (
        <Section title="Layout" styles={styles}>
          <View style={styles.row}>
            {LAYOUT_KEYS.map((key) => (
              <View key={key} style={styles.grow}>
                <DraftField
                  label={key}
                  value={String(node.layout?.[key] ?? "")}
                  onLeave
                  commit={(text) => {
                    const n = Number(text);
                    if (text.trim() === "" || !Number.isFinite(n)) {
                      return "Not a number";
                    }
                    // Same rules as dragging: placeNode clamps what it is given.
                    if (node.layout) {
                      apply(
                        placeNode(doc, id, {
                          ...node.layout,
                          [key]: Math.round(n),
                        }),
                        `layout:${id}:${key}`,
                      );
                    }
                    return null;
                  }}
                />
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      {node.field ? (
        <Section title="Field" styles={styles}>
          <DraftField
            label="Field name"
            value={node.field.name}
            commit={(name) => {
              const problem = fieldNameProblem(doc, id, name);
              if (problem) return problem;
              apply(setFieldName(doc, id, name), `field:${id}`);
              return null;
            }}
          />
          <View style={styles.row}>
            <Typography variant="bodyMedium" style={styles.grow}>
              Required
            </Typography>
            <Switch
              value={node.field.rules.some((r) => r.required)}
              onChange={(on: boolean) => {
                const rules = node.field!.rules.filter((r) => !r.required);
                apply(
                  setFieldRules(
                    doc,
                    id,
                    on ? [{ required: true }, ...rules] : rules,
                  ),
                );
              }}
            />
          </View>
        </Section>
      ) : null}

      {node.tabs ? (
        <Section title="Tabs" styles={styles}>
          {node.tabs.map((tab, i) => (
            <View key={i} style={styles.row}>
              <View style={styles.grow}>
                <Input
                  label={`Tab ${i + 1}`}
                  value={tab.label}
                  onChange={(label) =>
                    apply(renameTab(doc, id, i, label), `tab:${id}:${i}`)
                  }
                />
              </View>
              <IconButton
                icon="arrow-up"
                size="small"
                accessibilityLabel="Move up"
                disabled={i === 0}
                onClick={() => apply(moveTab(doc, id, i, i - 1))}
              />
              <IconButton
                icon="arrow-down"
                size="small"
                accessibilityLabel="Move down"
                disabled={i === node.tabs!.length - 1}
                onClick={() => apply(moveTab(doc, id, i, i + 1))}
              />
              <IconButton
                icon="close"
                size="small"
                accessibilityLabel="Remove tab"
                disabled={node.tabs!.length === 1}
                onClick={() =>
                  tab.children.length > 0
                    ? setRemoving(i)
                    : apply(removeTab(doc, id, i))
                }
              />
            </View>
          ))}
          <Button
            variant="text"
            iconName="plus"
            onClick={() =>
              apply(addTab(doc, id, `Tab ${(node.tabs?.length ?? 0) + 1}`))
            }
          >
            Add tab
          </Button>
          <Dialog
            visible={removing !== null}
            title="Remove the tab and its content?"
            onClose={() => setRemoving(null)}
          >
            <View style={styles.row}>
              <Button variant="text" onClick={() => setRemoving(null)}>
                Cancel
              </Button>
              <Button
                variant="tonal"
                onClick={() => {
                  if (removing !== null) apply(removeTab(doc, id, removing));
                  setRemoving(null);
                }}
              >
                Remove
              </Button>
            </View>
          </Dialog>
        </Section>
      ) : null}

      {code.length > 0 ? (
        <Section title="Set in code" styles={styles}>
          <Typography variant="bodySmall" color="onSurfaceVariant">
            {code.join(", ")}
          </Typography>
        </Section>
      ) : null}
    </>
  );
};

export const PropertiesPanel = ({ editor }: { editor: Editor }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const node = editor.selected ? findNode(editor.doc, editor.selected) : null;
  return (
    <View testID="properties" style={styles.panel}>
      <ScrollArea style={styles.scroll}>
        <View style={styles.content}>
          {node ? (
            // Keyed by node: another node's fields start from its own values.
            <Body key={node.id} editor={editor} node={node} styles={styles} />
          ) : (
            <Typography variant="bodyMedium" color="onSurfaceVariant">
              Select a component to edit it.
            </Typography>
          )}
        </View>
      </ScrollArea>
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    panel: {
      width: 320,
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    scroll: { flexGrow: 1, flexShrink: 1 },
    content: { padding: theme.spacing.m, gap: theme.spacing.l },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    section: { gap: theme.spacing.s },
    row: { flexDirection: "row", alignItems: "center", gap: theme.spacing.s },
    grow: { flexGrow: 1, flexShrink: 1 },
  });
