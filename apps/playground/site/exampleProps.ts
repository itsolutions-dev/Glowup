/**
 * The `props` object of an example, as text.
 *
 * An example's code starts with one object literal, `const props = { ... };`,
 * that the example spreads onto the component the page is about. The
 * Properties panel edits that literal and the editor can be typed into, so the
 * controls and the code are one thing: this file reads the literal into values
 * and writes values back as a literal, nothing else.
 *
 * The literal is found by shape, not parsed as code: it starts at a line that
 * begins `const props = {` (a type annotation is allowed, which is how an
 * example keeps its strings typed: `const props: Partial<ButtonProps> = {`)
 * and ends at the first line that is exactly `};` (nested objects close with
 * indentation, so they do not end it). The text between is evaluated as an
 * expression, which is what lets a reader write
 * `anchorPosition: { vertical: "top", horizontal: "left" }` or a number
 * expression by hand.
 */

/** 1: the statement up to the brace, 2: the literal itself. */
const REGION = /^(const props(?:: [^\n=]+)? = )(\{[\s\S]*?\n\});$/m;

/** The line width the writer breaks a value at, as Prettier does. */
const WIDTH = 80;

/** What the compiled text gets in place of the literal: the values live outside it. */
export const PROPS_REFERENCE = "const props = __props;";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;

/** The values of the `props` literal, or `null` when there is none or it cannot be read. */
export const readProps = (code: string): Record<string, unknown> | null => {
  const match = REGION.exec(code);
  if (!match) return null;
  const literal = match[2];
  try {
    const value = new Function(`return (${literal});`)();
    return isPlainObject(value) ? value : null;
  } catch {
    return null;
  }
};

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

const key = (name: string) =>
  IDENTIFIER.test(name) ? name : JSON.stringify(name);

/**
 * One value as source. Short objects and arrays stay on a line; one that would
 * pass the width is broken one entry per line, indented under its key.
 */
const format = (
  value: unknown,
  indent: number,
  prefixWidth: number,
): string => {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value !== "object") return String(value);

  const entries = Array.isArray(value)
    ? value.map((item) => [null, item] as const)
    : Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([name, item]) => [name, item] as const);
  if (entries.length === 0) return Array.isArray(value) ? "[]" : "{}";

  const open = Array.isArray(value) ? "[" : "{";
  const close = Array.isArray(value) ? "]" : "}";
  const inline = entries.map(([name, item]) =>
    name === null
      ? format(item, indent, 0)
      : `${key(name)}: ${format(item, indent, 0)}`,
  );
  const oneLine =
    open === "{" ? `{ ${inline.join(", ")} }` : `[${inline.join(", ")}]`;
  if (prefixWidth + oneLine.length <= WIDTH && !oneLine.includes("\n")) {
    return oneLine;
  }

  const pad = " ".repeat(indent + 2);
  const lines = entries.map(([name, item]) => {
    const head = name === null ? "" : `${key(name)}: `;
    return `${pad}${head}${format(item, indent + 2, pad.length + head.length)},`;
  });
  return `${open}\n${lines.join("\n")}\n${" ".repeat(indent)}${close}`;
};

/** The literal for these values, in the order given. */
const serializeLiteral = (values: Record<string, unknown>): string => {
  const lines = Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .map(
      ([name, value]) =>
        `  ${key(name)}: ${format(value, 2, 2 + key(name).length + 2)},`,
    );
  return `{\n${lines.join("\n")}\n}`;
};

/** The whole statement for these values, in the order given. */
export const serializeProps = (values: Record<string, unknown>): string =>
  `const props = ${serializeLiteral(values)};`;

/** The code with its `props` literal replaced by these values. */
export const writeProps = (
  code: string,
  values: Record<string, unknown>,
): string =>
  REGION.test(code)
    ? code.replace(
        REGION,
        (_, head: string) => `${head}${serializeLiteral(values)};`,
      )
    : code;

/** The code with the literal replaced by a reference to values held outside. */
export const withoutProps = (code: string): string =>
  code.replace(REGION, PROPS_REFERENCE);

/** Whether the code has a literal at all. */
export const hasProps = (code: string): boolean => REGION.test(code);

/** Structural equality of two prop values (select options are objects). */
export const sameValue = (a: unknown, b: unknown): boolean =>
  a === b || JSON.stringify(a) === JSON.stringify(b);
