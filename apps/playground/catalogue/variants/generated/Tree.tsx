// GENERATED — do not edit.
// Source: .design-sync/previews/Tree.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Tree, Typography } from "@its/glowup-ui";
import type { TreeNode } from "@its/glowup-ui";

const panel: ViewStyle = {
  flexDirection: "column",
  width: 340,
};

const files: TreeNode[] = [
  {
    id: "src",
    label: "src",
    icon: "folder-outline",
    children: [
      {
        id: "components",
        label: "components",
        icon: "folder-outline",
        children: [
          { id: "button", label: "Button.tsx", icon: "file-outline" },
          { id: "tree", label: "Tree.tsx", icon: "file-outline" },
        ],
      },
      { id: "index", label: "index.ts", icon: "file-outline" },
    ],
  },
  {
    id: "docs",
    label: "docs",
    icon: "folder-outline",
    children: [{ id: "readme", label: "README.md", icon: "file-outline" }],
  },
  { id: "package", label: "package.json", icon: "file-outline" },
];

const produce: TreeNode[] = [
  {
    id: "fruits",
    label: "Fruits",
    children: [
      { id: "apple", label: "Apple" },
      { id: "pear", label: "Pear" },
      { id: "plum", label: "Plum" },
    ],
  },
  {
    id: "veg",
    label: "Vegetables",
    children: [
      { id: "leek", label: "Leek" },
      { id: "kale", label: "Kale", disabled: true },
      { id: "beet", label: "Beetroot" },
    ],
  },
  { id: "salt", label: "Salt" },
];

const mailboxes: TreeNode[] = [
  {
    id: "inbox",
    label: "Inbox",
    icon: "inbox-outline",
    badge: 12,
    children: [
      { id: "work", label: "Work", icon: "briefcase-outline", badge: 8 },
      { id: "family", label: "Family", icon: "home-outline", badge: 4 },
    ],
  },
  { id: "sent", label: "Sent", icon: "send-outline" },
  { id: "drafts", label: "Drafts", icon: "file-outline", badge: 2 },
  { id: "trash", label: "Trash", icon: "delete-outline" },
];

export const Basic = () => (
  <View style={panel}>
    <Tree data={files} defaultExpanded={["src", "components"]} />
  </View>
);

/** `selectionMode="single"` highlights the pressed row; the chevron still opens and closes. */
export const SingleSelection = () => (
  <View style={panel}>
    <Tree
      data={files}
      defaultExpanded={["src", "components"]}
      selectionMode="single"
      defaultSelected={["tree"]}
    />
  </View>
);

/** `selectionMode="multiple"` toggles each row on its own. */
export const MultipleSelection = () => (
  <View style={panel}>
    <Tree
      data={produce}
      defaultExpanded={["fruits", "veg"]}
      selectionMode="multiple"
      defaultSelected={["apple", "leek"]}
    />
  </View>
);

/** With `checkboxes`, a parent checks everything under it and shows the mixed state when only some are checked. A disabled row keeps its state. */
export const Checkboxes = () => (
  <View style={panel}>
    <Tree
      data={produce}
      defaultExpanded={["fruits", "veg"]}
      selectionMode="multiple"
      checkboxes
      defaultSelected={["apple", "pear", "plum", "leek"]}
    />
  </View>
);

/** `selected` and `onSelectedChange` hold the checked ids (parents included), here shown under the tree. */
export const ControlledCheckboxes = () => {
  const [selected, setSelected] = React.useState<string[]>(["pear"]);
  return (
    <View style={panel}>
      <Tree
        data={produce}
        defaultExpanded={["fruits"]}
        selectionMode="multiple"
        checkboxes
        selected={selected}
        onSelectedChange={setSelected}
      />
      <Typography variant="bodySmall">
        {selected.join(", ") || "none"}
      </Typography>
    </View>
  );
};

/** `icon` before the label, and `badge` after it: a count, or any node. */
export const IconsAndBadges = () => (
  <View style={panel}>
    <Tree
      data={mailboxes}
      defaultExpanded={["inbox"]}
      selectionMode="single"
      defaultSelected={["work"]}
    />
  </View>
);

/** `size` sets the row height and the text: 32, 40 or 48 px. */
export const Sizes = () => (
  <View style={{ flexDirection: "row", gap: 24, flexWrap: "wrap" }}>
    {(["small", "medium", "large"] as const).map((size) => (
      <View key={size} style={{ ...panel, width: 220 }}>
        <Tree data={produce} defaultExpanded={["fruits"]} size={size} />
      </View>
    ))}
  </View>
);

/** `showLines` draws a guide down each open node's children; `indent` sets how far each level moves in. */
export const GuideLines = () => (
  <View style={panel}>
    <Tree
      data={files}
      defaultExpanded={["src", "components"]}
      showLines
      indent={20}
    />
  </View>
);

/** `expanded` and `onExpandedChange` make the open ids the parent's to hold. */
export const ControlledExpanded = () => {
  const [expanded, setExpanded] = React.useState<string[]>(["fruits"]);
  return (
    <View style={panel}>
      <Tree
        data={produce}
        expanded={expanded}
        onExpandedChange={setExpanded}
        selectionMode="single"
      />
      <Typography variant="bodySmall">
        open: {expanded.join(", ") || "none"}
      </Typography>
    </View>
  );
};

/** `renderLabel` draws the label of a row, and is told its state. */
export const CustomLabel = () => (
  <View style={panel}>
    <Tree
      data={produce}
      defaultExpanded={["fruits"]}
      selectionMode="single"
      defaultSelected={["pear"]}
      renderLabel={renderLabel}
    />
  </View>
);

function renderLabel(
  node: TreeNode,
  state: { level: number; selected: boolean },
) {
  return (
    <Typography
      variant="bodyLarge"
      color={state.selected ? "primary" : undefined}
    >
      {state.level === 1 ? String(node.label).toUpperCase() : node.label}
    </Typography>
  );
}

/** A disabled node cannot be selected (it can still be opened); `disabled` on the tree makes it all inert. */
export const DisabledNodes = () => (
  <View style={{ flexDirection: "row", gap: 24, flexWrap: "wrap" }}>
    <View style={panel}>
      <Tree
        data={produce}
        defaultExpanded={["veg"]}
        selectionMode="single"
        defaultSelected={["leek"]}
      />
    </View>
    <View style={panel}>
      <Tree
        data={produce}
        defaultExpanded={["fruits"]}
        selectionMode="single"
        defaultSelected={["apple"]}
        disabled
      />
    </View>
  </View>
);

const remote: TreeNode[] = [
  {
    id: "cloud",
    label: "Cloud storage",
    icon: "cloud-outline",
    hasChildren: true,
  },
  { id: "local", label: "This device", icon: "folder-outline" },
];

const later = (kids: TreeNode[], ms: number) =>
  new Promise<TreeNode[]>((resolve) => setTimeout(() => resolve(kids), ms));

/** `loadChildren` fills in a node marked `hasChildren` the first time it opens, behind a loading row; the result is kept. */
export const LazyChildren = () => (
  <View style={panel}>
    <Tree
      data={remote}
      loadChildren={() =>
        later(
          [
            { id: "photos", label: "Photos", icon: "folder-outline" },
            { id: "backups", label: "Backups", icon: "folder-outline" },
          ],
          800,
        )
      }
    />
  </View>
);

/** The loading row, while the promise is pending. */
export const Loading = () => (
  <View style={panel}>
    <Tree
      data={remote}
      defaultExpanded={["cloud"]}
      loadChildren={() => new Promise<TreeNode[]>(() => {})}
    />
  </View>
);

/** A rejected load shows a row that tries again when pressed. */
export const LoadFailed = () => (
  <View style={panel}>
    <Tree
      data={remote}
      defaultExpanded={["cloud"]}
      loadChildren={() => Promise.reject(new Error("offline"))}
      onLoadError={() => {}}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Basic",
    title: "Basic",
    render: Basic,
  },
  {
    name: "SingleSelection",
    title: "Single selection",
    description:
      '`selectionMode="single"` highlights the pressed row; the chevron still opens and closes.',
    render: SingleSelection,
  },
  {
    name: "MultipleSelection",
    title: "Multiple selection",
    description: '`selectionMode="multiple"` toggles each row on its own.',
    render: MultipleSelection,
  },
  {
    name: "Checkboxes",
    title: "Checkboxes",
    description:
      "With `checkboxes`, a parent checks everything under it and shows the mixed state when only some are checked. A disabled row keeps its state.",
    render: Checkboxes,
  },
  {
    name: "ControlledCheckboxes",
    title: "Controlled checkboxes",
    description:
      "`selected` and `onSelectedChange` hold the checked ids (parents included), here shown under the tree.",
    render: ControlledCheckboxes,
  },
  {
    name: "IconsAndBadges",
    title: "Icons and badges",
    description:
      "`icon` before the label, and `badge` after it: a count, or any node.",
    render: IconsAndBadges,
  },
  {
    name: "Sizes",
    title: "Sizes",
    description: "`size` sets the row height and the text: 32, 40 or 48 px.",
    render: Sizes,
  },
  {
    name: "GuideLines",
    title: "Guide lines",
    description:
      "`showLines` draws a guide down each open node's children; `indent` sets how far each level moves in.",
    render: GuideLines,
  },
  {
    name: "ControlledExpanded",
    title: "Controlled expanded",
    description:
      "`expanded` and `onExpandedChange` make the open ids the parent's to hold.",
    render: ControlledExpanded,
  },
  {
    name: "CustomLabel",
    title: "Custom label",
    description:
      "`renderLabel` draws the label of a row, and is told its state.",
    render: CustomLabel,
  },
  {
    name: "DisabledNodes",
    title: "Disabled nodes",
    description:
      "A disabled node cannot be selected (it can still be opened); `disabled` on the tree makes it all inert.",
    render: DisabledNodes,
  },
  {
    name: "LazyChildren",
    title: "Lazy children",
    description:
      "`loadChildren` fills in a node marked `hasChildren` the first time it opens, behind a loading row; the result is kept.",
    render: LazyChildren,
  },
  {
    name: "Loading",
    title: "Loading",
    description: "The loading row, while the promise is pending.",
    render: Loading,
  },
  {
    name: "LoadFailed",
    title: "Load failed",
    description: "A rejected load shows a row that tries again when pressed.",
    render: LoadFailed,
  },
];
