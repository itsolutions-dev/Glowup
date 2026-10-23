// Shape of the playground catalogue: what a component entry declares and how
// the entries are grouped in the navigator.

/**
 * `icon` is a text control for a glyph name that opens a search of the whole
 * icon font; its value is the name, like `text`.
 */
export type PropType = "text" | "number" | "boolean" | "select" | "icon";

export interface PropDefinition {
  type: PropType;
  default: any;
  options?: { label: string; value: any }[];
  /** For an `icon` control: only the icons that also have an `-outline` glyph. */
  withOutline?: boolean;
  label: string;
  /**
   * Whether this prop applies at all given the rest of the panel's state.
   * A prop the component ignores in the current configuration — Divider's
   * label once the rule is vertical — should neither offer a control nor show
   * up in the snippet, which would otherwise promise something the demo above
   * it visibly does not do. Omitted means "always".
   */
  appliesWhen?: (values: Record<string, any>) => boolean;
}

export interface ComponentMetadata {
  name: string;
  Component: any;
  props: Record<string, PropDefinition>;
  /**
   * Render the example and the variants only after hydration. For components
   * that read the reader's clock or locale (today, the current time, weekday
   * names, 12- or 24-hour): the exported HTML would carry the build's date and
   * Node's locale, and hydrating over it throws #418.
   */
  clientOnly?: boolean;
}

export interface Category {
  label: string;
  icon: string;
  items: string[];
}
