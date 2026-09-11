import type { ComponentMetadata } from "./types";

const CHILDREN_KEYS = ["children", "label", "title"];

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
 * Only props that differ from the component's own defaults are written out:
 * echoing every default back produces a twenty-attribute tag that teaches the
 * reader nothing about which of them mattered. `true` booleans are written bare
 * (`fullWidth`, not `fullWidth={true}`), the way the same code would be written
 * by hand.
 */
export const buildSnippet = (
  name: string,
  meta: ComponentMetadata,
  props: Record<string, any>,
): string => {
  const attributes: string[] = [];
  let children: string | undefined;

  for (const [key, definition] of Object.entries(meta.props)) {
    if (definition.appliesWhen && !definition.appliesWhen(props)) continue;
    const value = props[key];
    if (value === definition.default) continue;

    if (CHILDREN_KEYS.includes(key) && typeof value === "string") {
      children = value;
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

  // The default for a children-ish prop still has to appear inside the tag, or
  // the snippet renders an empty component.
  if (children === undefined) {
    for (const key of CHILDREN_KEYS) {
      const definition = meta.props[key];
      if (definition?.appliesWhen && !definition.appliesWhen(props)) continue;
      const value = props[key];
      if (typeof value === "string" && value.length) {
        children = value;
        break;
      }
    }
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
