import type { ComponentType } from "react";

import { EXAMPLES } from "./examples.generated";

export interface LiveExampleDef {
  /** The catalogue page it belongs to: the file is named after the component. */
  id: string;
  /** The real component the file exports: what the stage shows until it is edited. */
  Component: ComponentType;
  /** The file name and its text, embedded by the generator. */
  file: string;
  source: string;
}

/**
 * The example of a catalogue page: one per component, a real file in this
 * folder named after it, importing only React, React Native, the library and the
 * icon font. After adding or editing one, run
 * `npm run examples -w @its/glowup-playground`.
 *
 * Its first statement is `const props = { ... };`, an object literal that the
 * example spreads onto the component the page is about and that the Properties
 * panel edits (see `site/exampleProps.ts`).
 */
export const exampleFor = (
  name: string | undefined,
): LiveExampleDef | undefined =>
  name && Object.hasOwn(EXAMPLES, name) ? EXAMPLES[name] : undefined;

export { EXAMPLES };
