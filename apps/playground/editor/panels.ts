// What the Properties and Layers panels compute (spec §13), pure: which props
// are data and which are set in code, the document as layers, and where a node
// can be moved without dragging.

import { addTarget } from "./canvasMath";
import { componentProps } from "./docgen";
import {
  ancestors,
  findNode,
  walk,
  type LayoutDocument,
  type LayoutNode,
  type NodeId,
  type Slot,
} from "./document";
import { entryFor, MANIFEST } from "./manifest";
import { canPlace, moveNode } from "./operations";

const isData = (value: unknown) =>
  Array.isArray(value) || (typeof value === "object" && value !== null);

/** Array and object props the registry has no control for: edited as JSON. */
export const dataProps = (
  node: LayoutNode,
  registryProps: string[],
): string[] =>
  Object.entries({
    ...MANIFEST[node.type]?.defaultProps,
    ...node.props,
  })
    .filter(([name, value]) => isData(value) && !registryProps.includes(name))
    .map(([name]) => name);

const CODE = /=>|ReactNode|ReactElement|JSX\.Element|ComponentType/;

/** Props that take functions or nodes: set in code, never in the panel. */
export const codeProps = (type: string): string[] =>
  (componentProps(type) ?? [])
    // `children` is the editor's own: a text component's text, a container's layout.
    .filter((prop) => prop.name !== "children" && CODE.test(prop.type ?? ""))
    .map((prop) => prop.name)
    .sort();

export interface Layer {
  id: NodeId;
  label: string;
  children?: Layer[];
}

/** `Typography · Codice fiscale`: the type and the first words it shows. */
const labelOf = (node: LayoutNode) => {
  const said = [node.text, node.props.label, node.props.title].find(
    (value): value is string => typeof value === "string" && value !== "",
  );
  const words = said?.split(/\s+/).slice(0, 4).join(" ");
  return words ? `${node.type} · ${words}` : node.type;
};

const layer = (node: LayoutNode): Layer => {
  if (node.tabs) {
    return {
      id: node.id,
      label: labelOf(node),
      children: node.tabs.map((tab, i) => ({
        id: `${node.id}:tab${i}`,
        label: tab.label,
        children: tab.children.map(layer),
      })),
    };
  }
  return node.children
    ? { id: node.id, label: labelOf(node), children: node.children.map(layer) }
    : { id: node.id, label: labelOf(node) };
};

/** The document as the Layers panel's tree, a TabbedPanel's tabs as rows of their own. */
export const layerTree = (doc: LayoutDocument): Layer[] => doc.items.map(layer);

/** The slot a node moved into a container lands in (a TabbedPanel's first panel). */
const slotFor = (container: LayoutNode): Slot | null => {
  const kind = entryFor(container.type)?.kind;
  if (kind === "grid" || kind === "flow") {
    return { kind: "children", parent: container.id };
  }
  return kind === "tabs" ? { kind: "tab", parent: container.id, tab: 0 } : null;
};

/** Where "Move into…" can take the node: the page, then every container that takes it. */
export const moveTargets = (
  doc: LayoutDocument,
  id: NodeId,
): { id: NodeId | null; label: string }[] => {
  const node = findNode(doc, id);
  if (!node) return [];
  return [
    { id: null, label: "Page" },
    ...walk(doc).flatMap((container) => {
      const slot = slotFor(container);
      const inside =
        container.id === id || ancestors(doc, container.id).includes(id);
      return slot && !inside && canPlace(doc, node.type, slot, id)
        ? [{ id: container.id, label: labelOf(container) }]
        : [];
    }),
  ];
};

/** The node moved into `target` (null: the page): its first free cell, or the end of a flow. */
export const moveInto = (
  doc: LayoutDocument,
  id: NodeId,
  target: NodeId | null,
  tabs: Record<NodeId, number>,
): LayoutDocument => {
  const node = findNode(doc, id);
  return node
    ? moveNode(doc, id, addTarget(doc, node.type, target, tabs))
    : doc;
};
