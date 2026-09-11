// Shape of the playground catalogue: what a component entry declares and how
// the entries are grouped in the navigator.

export type PropType = "text" | "number" | "boolean" | "select" | "node";

export interface PropDefinition {
  type: PropType;
  default: any;
  options?: { label: string; value: any }[];
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
  isContainer?: boolean;
}

export interface Category {
  label: string;
  icon: string;
  items: string[];
}
