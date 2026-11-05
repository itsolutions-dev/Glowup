// The code export (spec §15): a layout document as the text of a component
// file that renders it with the library, in the examples' shape (2 spaces,
// double quotes, trailing commas, nothing past 80 columns that can be broken).
// Pure: the component defaults come from the generated prop tables, as data.

import { componentProps } from "./docgen";
import type { LayoutDocument, LayoutNode } from "./document";
import { camelName } from "./forms";
import { entryFor } from "./manifest";

const WIDTH = 80;
const GRID_DEFAULTS = { columns: 12, rowHeight: 48, gap: 16 };
/** What a node leaves to wire, by type (§15: handlers are not invented). */
const HANDLERS: Record<string, string> = {
  Button: "onClick",
  IconButton: "onClick",
  ProgressButton: "onClick",
  Form: "onSubmit",
};
const RESERVED = new Set(
  (
    "break case catch class const continue debugger default delete do else enum " +
    "export extends false finally for function if import in instanceof let new " +
    "null return static super switch this throw true try typeof var void while " +
    "with yield await implements interface package private protected public " +
    "eval arguments React useState field"
  ).split(" "),
);

/**
 * The state type where the starting value alone would type it too narrowly
 * (`useState(null)` takes only null, `useState([])` only never[]).
 */
const STATE_TYPES: Record<string, string> = {
  CheckboxGroup: "string[]",
  DatePicker: "Date | null",
  TimePicker: "Date | null",
  DateTimePicker: "Date | null",
};

const ind = (level: number) => "  ".repeat(level);
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
const key = (name: string) =>
  IDENTIFIER.test(name) ? name : JSON.stringify(name);

/** A value on one line: `[1, 2]`, `{ a: "x" }`, `"text"`. */
const inline = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(inline).join(", ")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    return entries.length === 0
      ? "{}"
      : `{ ${entries.map(([k, v]) => `${key(k)}: ${inline(v)}`).join(", ")} }`;
  }
  return JSON.stringify(value) ?? "undefined";
};

/** A value in `room` columns, or one entry per line, `level` deep. */
const block = (value: unknown, level: number, room: number): string => {
  const one = inline(value);
  if (one.length <= room || !value || typeof value !== "object") return one;
  const array = Array.isArray(value);
  const entries: [string, unknown][] = array
    ? (value as unknown[]).map((v) => ["", v])
    : Object.entries(value).map(([k, v]) => [`${key(k)}: `, v]);
  if (entries.length === 0) return one;
  const inner = level + 1;
  const lines = entries.map(
    ([prefix, v]) =>
      `${ind(inner)}${prefix}${block(v, inner, WIDTH - inner * 2 - prefix.length - 1)},\n`,
  );
  return `${array ? "[" : "{"}\n${lines.join("")}${ind(level)}${array ? "]" : "}"}`;
};

interface Attr {
  inline: string;
  block: (level: number) => string;
}
type Child = El | { text: string } | { render: El } | { code: string };
/** An empty container's child: several of them require children. */
const EMPTY: Child = { code: "{null}" };
interface El {
  tag: string;
  attrs: Attr[];
  children?: Child[];
}

const same = (text: string): Attr => ({ inline: text, block: () => text });
const expr = (name: string, code: string) => same(`${name}={${code}}`);
const value = (name: string, v: unknown): Attr => {
  if (typeof v === "string") {
    return /["\\\r\n]/.test(v)
      ? expr(name, JSON.stringify(v))
      : same(`${name}="${v}"`);
  }
  return {
    inline: `${name}={${inline(v)}}`,
    block: (level) =>
      `${name}={${block(v, level, WIDTH - level * 2 - name.length - 3)}}`,
  };
};
const GROW = value("style", { flexGrow: 1 });

/** A text child as JSX reads it back: raw, or a string expression. */
const textChild = (text: string) =>
  text !== "" && text === text.trim() && !/[{}<>&\r\n]/.test(text)
    ? text
    : `{${JSON.stringify(text)}}`;

const openTag = (el: El, level: number, close: ">" | " />"): string[] => {
  const one = `${ind(level)}<${[el.tag, ...el.attrs.map((a) => a.inline)].join(" ")}${close}`;
  if (one.length <= WIDTH) return [one];
  return [
    `${ind(level)}<${el.tag}`,
    ...el.attrs.map((a) => ind(level + 1) + a.block(level + 1)),
    ind(level) + close.trim(),
  ];
};

const print = (el: El, level: number): string[] => {
  const children = el.children ?? [];
  if (children.length === 0) return openTag(el, level, " />");
  const only = children[0];
  if (children.length === 1 && "text" in only) {
    const text = textChild(only.text);
    const [first, ...rest] = openTag(el, level, ">");
    const one = `${first}${text}</${el.tag}>`;
    if (rest.length === 0 && one.length <= WIDTH) return [one];
    return [first, ...rest, ind(level + 1) + text, `${ind(level)}</${el.tag}>`];
  }
  return [
    ...openTag(el, level, ">"),
    ...children.flatMap((child) => printChild(child, level + 1)),
    `${ind(level)}</${el.tag}>`,
  ];
};

const printChild = (child: Child, level: number): string[] => {
  if ("text" in child) return [ind(level) + textChild(child.text)];
  if ("code" in child) return [ind(level) + child.code];
  if ("render" in child) {
    const flat = print(child.render, 0);
    const one = `${ind(level)}{(field) => ${flat[0]}}`;
    if (flat.length === 1 && one.length <= WIDTH) return [one];
    return [
      `${ind(level)}{(field) => (`,
      ...print(child.render, level + 1),
      `${ind(level)})}`,
    ];
  }
  return print(child, level);
};

/** The component's own default for a prop, when it is a JSON literal. */
const defaultOf = (
  type: string,
  prop: string,
): { known: boolean; value?: unknown } => {
  const text = componentProps(type)?.find((p) => p.name === prop)?.default;
  if (text === undefined) return { known: false };
  try {
    return { known: true, value: JSON.parse(text) };
  } catch {
    return { known: false };
  }
};

/** The node's own props, those equal to the component's default left out. */
const propAttrs = (node: LayoutNode): Attr[] =>
  Object.entries(node.props).flatMap(([name, v]) => {
    const d = defaultOf(node.type, name);
    return d.known && JSON.stringify(d.value) === JSON.stringify(v)
      ? []
      : [value(name, v)];
  });

/** `Pagina di dettaglio` → `PaginaDiDettaglio`. */
export const componentName = (layoutName: string): string => {
  const name = camelName(layoutName);
  return name === "" ? "Layout" : name[0].toUpperCase() + name.slice(1);
};

export const exportCode = (doc: LayoutDocument): string => {
  const library = new Set<string>(["GridLayout"]);
  const constants: string[] = [];
  const states: string[] = [];
  const wire: string[] = [];
  const taken = new Set<string>();
  let usesView = false;

  const declare = (base: string, initial: unknown, type?: string) => {
    let name = base;
    for (let n = 2; RESERVED.has(name) || taken.has(name); n += 1) {
      name = `${base}${n}`;
    }
    taken.add(name);
    const setter = `set${name[0].toUpperCase()}${name.slice(1)}`;
    states.push(
      `${ind(1)}const [${name}, ${setter}] = useState${type ? `<${type}>` : ""}(${inline(initial)});`,
    );
    return { name, setter };
  };

  const what = (node: LayoutNode) => {
    const label = node.text ?? node.props.label;
    return typeof label === "string"
      ? `${node.type} ${JSON.stringify(label)}`
      : `${node.type} ${node.id}`;
  };

  /** A grid's GridLayout, its constant declared before its children's. */
  const grid = (
    constant: string,
    nodes: LayoutNode[],
    columns: number,
    inForm: boolean,
  ): El => {
    const attrs = [expr("layout", nodes.length > 0 ? constant : "[]")];
    if (nodes.length > 0) {
      const index = constants.length;
      constants.push("");
      const items = nodes.map(
        (n) => `${ind(1)}${inline({ id: n.id, ...n.layout })},`,
      );
      constants[index] = `const ${constant} = [\n${items.join("\n")}\n];`;
    }
    const settings = {
      columns,
      rowHeight: doc.grid.rowHeight,
      gap: doc.grid.gap,
    };
    for (const [name, v] of Object.entries(settings)) {
      if (v !== GRID_DEFAULTS[name as keyof typeof GRID_DEFAULTS]) {
        attrs.push(expr(name, String(v)));
      }
    }
    return {
      tag: "GridLayout",
      attrs,
      children: nodes.map((n) => emit(n, inForm)),
    };
  };

  const emit = (node: LayoutNode, inForm: boolean): El => {
    const entry = entryFor(node.type);
    const kind = entry?.kind;
    const id = node.id.toUpperCase();
    const keyAttr = value("key", node.id);
    const onGrid = node.layout !== undefined;
    if (HANDLERS[node.type])
      wire.push(`// - ${what(node)}: ${HANDLERS[node.type]}`);

    if (kind === "tabs") {
      usesView = true;
      library.add("Tabs").add("TabContent");
      const panels = node.tabs ?? [];
      const tab = declare("tab", 0);
      return {
        tag: "View",
        attrs: [keyAttr, ...(onGrid ? [GROW] : [])],
        children: [
          {
            tag: "Tabs",
            attrs: [
              value(
                "tabs",
                panels.map((p) => p.label),
              ),
              expr("activeTab", tab.name),
              expr("onChange", tab.setter),
            ],
          },
          {
            tag: "TabContent",
            attrs: [expr("activeTab", tab.name)],
            children: panels.map((panel, i) =>
              panel.children.length > 0
                ? grid(
                    `${id}_TAB${i + 1}_LAYOUT`,
                    panel.children,
                    panel.columns,
                    inForm,
                  )
                : { tag: "View", attrs: [] },
            ),
          },
        ],
      };
    }

    library.add(node.type);
    const props = propAttrs(node);

    if (kind === "grid") {
      const form = entry?.form === true;
      const children = node.children ?? [];
      const attrs = [keyAttr];
      if (form) {
        const initial: Record<string, unknown> = {};
        const collect = (n: LayoutNode) => {
          if (n.field) initial[n.field.name] = entryFor(n.type)?.field?.initial;
          (n.children ?? []).forEach(collect);
          (n.tabs ?? []).forEach((p) => p.children.forEach(collect));
        };
        children.forEach(collect);
        if (Object.keys(initial).length > 0)
          attrs.push(value("initialValues", initial));
      }
      attrs.push(...props, ...(onGrid ? [GROW] : []));
      return {
        tag: node.type,
        attrs,
        children:
          children.length > 0
            ? [
                grid(
                  `${id}_LAYOUT`,
                  children,
                  node.columns ?? 1,
                  inForm || form,
                ),
              ]
            : [EMPTY],
      };
    }

    if (kind === "flow") {
      const children = node.children ?? [];
      return {
        tag: node.type,
        attrs: [keyAttr, ...props, ...(onGrid ? [GROW] : [])],
        children:
          children.length > 0 ? children.map((n) => emit(n, inForm)) : [EMPTY],
      };
    }

    const text: Child[] =
      kind === "text" && node.text !== undefined ? [{ text: node.text }] : [];
    const binding = entry?.field;
    if (inForm && node.field && binding) {
      library.add("FormField");
      const attrs = [keyAttr, value("name", node.field.name)];
      if (node.field.rules.length > 0)
        attrs.push(value("rules", node.field.rules));
      if (binding.valueProp !== "value")
        attrs.push(value("valuePropName", binding.valueProp));
      if (binding.trigger !== "onChange")
        attrs.push(value("trigger", binding.trigger));
      if (binding.control) attrs.push(same("control"));
      return {
        tag: "FormField",
        attrs,
        children: [
          {
            render: {
              tag: node.type,
              attrs: [same("{...field}"), ...props],
              children: text,
            },
          },
        ],
      };
    }

    const controlled = entry?.controlled;
    const state = controlled
      ? (() => {
          const label = node.props.label;
          const base =
            (typeof label === "string" && camelName(label)) ||
            node.type.toLowerCase();
          const { name, setter } = declare(
            base,
            controlled.initial,
            STATE_TYPES[node.type],
          );
          return [
            expr(controlled.value, name),
            expr(controlled.onChange, setter),
          ];
        })()
      : [];
    return {
      tag: node.type,
      attrs: [keyAttr, ...props, ...state],
      children: text,
    };
  };

  const root = grid("LAYOUT", doc.items, doc.grid.columns, false);

  // One line, whatever the name holds: a line break would end the comment.
  const title = doc.name.replace(/\s+/g, " ");
  const lines = [`// ${title}: exported from the Glowup layout editor.`];
  // Not the name of something it imports.
  let name = componentName(doc.name);
  if (library.has(name) || ["React", "useState", "View"].includes(name)) {
    name += "Layout";
  }
  if (wire.length > 0) lines.push("// Left to wire:", ...wire);
  lines.push(
    states.length > 0
      ? 'import React, { useState } from "react";'
      : 'import React from "react";',
  );
  if (usesView) lines.push('import { View } from "react-native";');
  const names = [...library].sort();
  const one = `import { ${names.join(", ")} } from "@its/glowup-ui";`;
  lines.push(
    one.length <= WIDTH
      ? one
      : `import {\n${names.map((n) => `${ind(1)}${n},`).join("\n")}\n} from "@its/glowup-ui";`,
  );
  lines.push("");
  for (const constant of constants) lines.push(constant, "");
  lines.push(
    `export default function ${name}() {`,
    ...states,
    `${ind(1)}return (`,
    ...print(root, 2),
    `${ind(1)});`,
    "}",
  );
  return `${lines.join("\n")}\n`;
};
