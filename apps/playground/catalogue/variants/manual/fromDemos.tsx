import { useState, type ComponentType } from "react";
import type { DemoProps } from "../../types";
import type { Variant } from "../types";
import {
  ButtonGroupDemo,
  ChipGroupDemo,
  DrawerDemo,
  NavigationRailDemo,
  SplitButtonDemo,
  ToolbarDemo,
} from "../../demos";

// Galleries for the components whose stage demo already exercises them: each
// variant is that demo with a fixed set of panel values, so the gallery and
// the stage cannot drift apart. A demo that writes back through `updateProp`
// (the rail's active destination) keeps working, against local state.

const Stateful = ({
  Demo,
  initial,
}: {
  Demo: ComponentType<DemoProps>;
  initial: Record<string, any>;
}) => {
  const [props, setProps] = useState(initial);
  return (
    <Demo
      props={props}
      updateProp={(key, value) => setProps((p) => ({ ...p, [key]: value }))}
    />
  );
};

const galleryOf = (
  Demo: ComponentType<DemoProps>,
  entries: [title: string, props: Record<string, any>, description?: string][],
): Variant[] =>
  entries.map(([title, props, description]) => ({
    name: title.replace(/[^A-Za-z0-9]+/g, ""),
    title,
    description,
    render: () => <Stateful Demo={Demo} initial={props} />,
  }));

export const buttonGroupVariants = galleryOf(ButtonGroupDemo, [
  [
    "Standard",
    { type: "standard", mode: "tonal", size: "s" },
    "Separate buttons; the selected one squares its corners.",
  ],
  [
    "Connected",
    { type: "connected", mode: "tonal", size: "s" },
    "One control — the successor of segmented buttons.",
  ],
  [
    "Multi select, outlined",
    { type: "connected", mode: "outlined", size: "m", multiSelect: true },
  ],
]);

export const splitButtonVariants = galleryOf(SplitButtonDemo, [
  ["Filled", { mode: "filled", children: "Save" }],
  ["Tonal", { mode: "tonal", children: "Save" }],
  ["Outlined", { mode: "outlined", children: "Save" }],
]);

export const chipGroupVariants = galleryOf(ChipGroupDemo, [
  ["Single select", { wrap: true, mode: "outlined" }],
  [
    "Required",
    { wrap: true, mode: "outlined", required: true },
    "The selected chip cannot be cleared.",
  ],
  ["Multi select", { wrap: true, mode: "tonal", multiSelect: true }],
  ["Scrolling row", { wrap: false, mode: "outlined", multiSelect: true }],
]);

export const navigationRailVariants = galleryOf(NavigationRailDemo, [
  [
    "With menu and FAB",
    { activeId: "home", showLabels: "always", alignment: "top", withFab: true },
  ],
  [
    "Selected label only, centred",
    {
      activeId: "inbox",
      showLabels: "selected",
      alignment: "center",
      withFab: false,
    },
  ],
]);

export const drawerVariants = galleryOf(DrawerDemo, [
  [
    "Static",
    { variant: "static", title: "Mail" },
    "A permanent panel beside the content, with no scrim.",
  ],
  [
    "Swipeable",
    { variant: "swipeable", title: "Mail" },
    "Over the content on a scrim; a drag toward the edge, the scrim, Escape and Android back close it.",
  ],
  [
    "Side sheet",
    {
      variant: "static",
      position: "right",
      layout: "sheet",
      title: "Filters",
      showCloseButton: true,
      width: 320,
    },
    "Any content, a close button and actions, on the right: a drawer as a side sheet.",
  ],
  [
    "Top",
    { variant: "static", position: "top", title: "Mail", height: 240 },
    "Top and bottom drawers span the width and are as tall as their content, up to height.",
  ],
  [
    "Bottom",
    { variant: "static", position: "bottom", title: "Mail", height: 240 },
  ],
  [
    "Elevation",
    { variant: "static", title: "Mail", elevation: 3, width: 320 },
    "Level 0 to 5 sets the tone of the surface and, on a phone, its shadow.",
  ],
  [
    "Nested items and a collapsible section",
    { variant: "static", layout: "crm", width: 320 },
    "A group opens to its sub-items; the section title opens and closes its items; a header sits above.",
  ],
  [
    "Collapsed",
    { variant: "static", layout: "crm", collapsed: true },
    "Icons only, 72 wide.",
  ],
]);

export const toolbarVariants = galleryOf(ToolbarDemo, [
  ["Docked", { variant: "docked" }],
  ["Floating", { variant: "floating", color: "standard" }],
  [
    "Floating, vibrant, with FAB",
    { variant: "floating", color: "vibrant", withFab: true },
  ],
  ["Floating, vertical", { variant: "floating", orientation: "vertical" }],
]);
