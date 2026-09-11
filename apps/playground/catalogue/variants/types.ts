import type { ComponentType } from "react";

export interface Variant {
  /** Export name in the source preview module — unique within a component. */
  name: string;
  /** Sentence-case heading shown above the demo. */
  title: string;
  description?: string;
  render: ComponentType;
}
