// Shape of the playground catalogue: what a component entry declares and how
// the entries are grouped in the navigator.

export type PropType = "text" | "number" | "boolean" | "select" | "node";

export interface PropDefinition {
  type: PropType;
  default: any;
  options?: { label: string; value: any }[];
  label: string;
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
