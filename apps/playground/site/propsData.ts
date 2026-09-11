import generated from "../docgen/props.generated.json";

/** One row of a component's prop table, as `docgen/extract-props.mjs` emits it. */
export interface PropDoc {
  name: string;
  /** The annotation as written in the library source, not as resolved. */
  type: string;
  required: boolean;
  /** The initialiser from the component's destructuring pattern, verbatim. */
  default?: string;
  description?: string;
  /** Present for short string/number literal unions; drives generated controls. */
  values?: (string | number)[];
  deprecated?: boolean;
}

export interface ComponentDoc {
  name: string;
  /** Repo-relative path, used to link the reader at the implementation. */
  source: string;
  propsTypeName?: string;
  /** Named types the props type builds on; their props are not listed. */
  extends: string[];
  description?: string;
  props: PropDoc[];
}

/**
 * Generated from the library's TypeScript by `npm run docgen`. Imported as data
 * rather than read at runtime because Metro bundles the app for three platforms
 * and there is no filesystem to read from on two of them.
 */
export const COMPONENT_DOCS = generated.components as unknown as Record<
  string,
  ComponentDoc
>;

/** The published package and the version these docs were generated from. */
export const LIBRARY_NAME = generated.libraryName;
export const LIBRARY_VERSION = generated.libraryVersion;

export const docFor = (name: string): ComponentDoc | undefined =>
  COMPONENT_DOCS[name];

export const DOCUMENTED_COMPONENT_COUNT = Object.keys(COMPONENT_DOCS).length;

export const TOTAL_PROP_COUNT = Object.values(COMPONENT_DOCS).reduce(
  (total, component) => total + component.props.length,
  0,
);
