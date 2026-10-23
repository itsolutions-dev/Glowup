import React from "react";
import { Tree, Typography } from "@its/glowup-ui";
import type { TreeNode } from "@its/glowup-ui";

const panel: React.CSSProperties = {
  display: "flex",
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
  <div style={panel}>
    <Tree data={files} defaultExpanded={["src", "components"]} />
  </div>
);

/** `selectionMode="single"` highlights the pressed row; the chevron still opens and closes. */
export const SingleSelection = () => (
  <div style={panel}>
    <Tree
      data={files}
      defaultExpanded={["src", "components"]}
      selectionMode="single"
      defaultSelected={["tree"]}
    />
  </div>
);

/** `selectionMode="multiple"` toggles each row on its own. */
export const MultipleSelection = () => (
  <div style={panel}>
    <Tree
      data={produce}
      defaultExpanded={["fruits", "veg"]}
      selectionMode="multiple"
      defaultSelected={["apple", "leek"]}
    />
  </div>
);

/** With `checkboxes`, a parent checks everything under it and shows the mixed state when only some are checked. A disabled row keeps its state. */
export const Checkboxes = () => (
  <div style={panel}>
    <Tree
      data={produce}
      defaultExpanded={["fruits", "veg"]}
      selectionMode="multiple"
      checkboxes
      defaultSelected={["apple", "pear", "plum", "leek"]}
    />
  </div>
);

/** `selected` and `onSelectedChange` hold the checked ids (parents included), here shown under the tree. */
export const ControlledCheckboxes = () => {
  const [selected, setSelected] = React.useState<string[]>(["pear"]);
  return (
    <div style={panel}>
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
    </div>
  );
};

/** `icon` before the label, and `badge` after it: a count, or any node. */
export const IconsAndBadges = () => (
  <div style={panel}>
    <Tree
      data={mailboxes}
      defaultExpanded={["inbox"]}
      selectionMode="single"
      defaultSelected={["work"]}
    />
  </div>
);

/** `size` sets the row height and the text: 32, 40 or 48 px. */
export const Sizes = () => (
  <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
    {(["small", "medium", "large"] as const).map((size) => (
      <div key={size} style={{ ...panel, width: 220 }}>
        <Tree data={produce} defaultExpanded={["fruits"]} size={size} />
      </div>
    ))}
  </div>
);

/** `showLines` draws a guide down each open node's children; `indent` sets how far each level moves in. */
export const GuideLines = () => (
  <div style={panel}>
    <Tree
      data={files}
      defaultExpanded={["src", "components"]}
      showLines
      indent={20}
    />
  </div>
);

/** `expanded` and `onExpandedChange` make the open ids the parent's to hold. */
export const ControlledExpanded = () => {
  const [expanded, setExpanded] = React.useState<string[]>(["fruits"]);
  return (
    <div style={panel}>
      <Tree
        data={produce}
        expanded={expanded}
        onExpandedChange={setExpanded}
        selectionMode="single"
      />
      <Typography variant="bodySmall">
        open: {expanded.join(", ") || "none"}
      </Typography>
    </div>
  );
};

/** `renderLabel` draws the label of a row, and is told its state. */
export const CustomLabel = () => (
  <div style={panel}>
    <Tree
      data={produce}
      defaultExpanded={["fruits"]}
      selectionMode="single"
      defaultSelected={["pear"]}
      renderLabel={renderLabel}
    />
  </div>
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
  <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
    <div style={panel}>
      <Tree
        data={produce}
        defaultExpanded={["veg"]}
        selectionMode="single"
        defaultSelected={["leek"]}
      />
    </div>
    <div style={panel}>
      <Tree
        data={produce}
        defaultExpanded={["fruits"]}
        selectionMode="single"
        defaultSelected={["apple"]}
        disabled
      />
    </div>
  </div>
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
  <div style={panel}>
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
  </div>
);

/** The loading row, while the promise is pending. */
export const Loading = () => (
  <div style={panel}>
    <Tree
      data={remote}
      defaultExpanded={["cloud"]}
      loadChildren={() => new Promise<TreeNode[]>(() => {})}
    />
  </div>
);

/** A rejected load shows a row that tries again when pressed. */
export const LoadFailed = () => (
  <div style={panel}>
    <Tree
      data={remote}
      defaultExpanded={["cloud"]}
      loadChildren={() => Promise.reject(new Error("offline"))}
      onLoadError={() => {}}
    />
  </div>
);
