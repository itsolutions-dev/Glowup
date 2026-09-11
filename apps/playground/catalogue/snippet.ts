import type { ComponentMetadata } from "./types";

/**
 * The prop written between the tags. `label` and `title` used to count too,
 * which produced `<Slider>Volume</Slider>` and `<CardTitle>Line 4</CardTitle>`
 * — neither component takes children, and a reader who pasted either got
 * nothing where the text should be. Whether a component takes children is not
 * something the panel can infer from a prop's contents; it is whether the
 * entry declares the prop by that name.
 */
const CHILDREN_KEY = "children";

/**
 * Props that carry the component's content, written out even when they are
 * still at their default. Every other prop is omitted at its default, which is
 * what keeps a snippet down to the handful of attributes that matter — but
 * apply that to these and you get `<Chip />`, a tag whose whole subject is
 * missing.
 */
const CONTENT_KEYS = [CHILDREN_KEY, "label", "title"];

const formatValue = (value: any): string | null => {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") {
    return `{${String(value)}}`;
  }
  return `{${JSON.stringify(value)}}`;
};

/**
 * Turns the properties panel's current state into the JSX a reader would paste.
 *
 * Only props that differ from the component's own defaults are written out —
 * bar the content ones above and the required ones below — because echoing
 * every default back produces a twenty-attribute tag that teaches the reader
 * nothing about which of them mattered. `true` booleans are written bare
 * (`fullWidth`, not `fullWidth={true}`), the way the same code would be
 * written by hand.
 *
 * `requiredProps` are the ones the library's own types mark required, from the
 * generated docs rather than a second list kept by hand here. Omitting one
 * because it happened to equal its default is how `<Modal>` came out without
 * `visible`, the prop that decides whether it is on screen at all: a snippet
 * that does not type-check is not usage.
 */
export const buildSnippet = (
  name: string,
  meta: ComponentMetadata,
  props: Record<string, any>,
  requiredProps: readonly string[],
): string => {
  const attributes: string[] = [];
  let children: string | undefined;

  for (const [key, definition] of Object.entries(meta.props)) {
    if (definition.appliesWhen && !definition.appliesWhen(props)) continue;
    const value = props[key];
    const required = requiredProps.includes(key);
    const carriesContent = CONTENT_KEYS.includes(key);
    if (value === definition.default && !carriesContent && !required) continue;

    if (key === CHILDREN_KEY) {
      // Only a string can be written out. Anything else — a demo that supplies
      // real elements — has no source form here, and `children={…}` would be
      // worse than leaving the tag empty. Nor can an emptied one be written:
      // there is no `children=""`, only a tag that closes itself.
      if (typeof value === "string" && value !== "") children = value;
      continue;
    }
    // An emptied content prop is a deliberate "no label" — unless the type
    // demands one, in which case `label=""` is what the demo really passes.
    if (carriesContent && !required && (value === "" || value === undefined)) {
      continue;
    }
    if (definition.type === "boolean") {
      if (value) attributes.push(key);
      else attributes.push(`${key}={false}`);
      continue;
    }
    const formatted = formatValue(value);
    if (formatted !== null) attributes.push(`${key}=${formatted}`);
  }

  const attributeText = attributes.length ? " " + attributes.join(" ") : "";
  const oneLine = `<${name}${attributeText}`;

  // Break the attributes onto their own lines once the tag stops fitting a
  // narrow code column.
  const openTag =
    oneLine.length > 64 && attributes.length > 1
      ? `<${name}\n  ${attributes.join("\n  ")}\n`
      : oneLine;

  if (children === undefined) {
    return openTag.endsWith("\n") ? `${openTag}/>` : `${openTag} />`;
  }
  return openTag.endsWith("\n")
    ? `${openTag}>\n  ${children}\n</${name}>`
    : `${openTag}>\n  ${children}\n</${name}>`;
};

export default buildSnippet;
