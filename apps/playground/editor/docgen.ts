// The library's prop tables (`docgen/props.generated.json`), as the export and
// the import read them: which props a component has, and their defaults.

import docgen from "../docgen/props.generated.json";

export interface PropDoc {
  name: string;
  /** The default as source text (`"\"filled\""`, `"1"`), when there is one. */
  default?: string;
}

const COMPONENTS = (
  docgen as unknown as { components: Record<string, { props: PropDoc[] }> }
).components;

/** The component's props, or undefined for a type the library does not export (TabbedPanel). */
export const componentProps = (type: string): PropDoc[] | undefined =>
  COMPONENTS[type]?.props;
