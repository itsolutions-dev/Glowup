import { useState, type ComponentType } from "react";
import type { DemoProps } from "../../types";
import type { Variant } from "../types";
import {
  ButtonGroupDemo,
  ChipGroupDemo,
  NavigationDrawerDemo,
  NavigationRailDemo,
  SideSheetDemo,
  SplitButtonDemo,
  TableDemo,
  ToolbarDemo,
  TopAppBarDemo,
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

export const topAppBarVariants = galleryOf(TopAppBarDemo, [
  ["Small", { variant: "small", title: "Orders" }],
  ["Center-aligned", { variant: "center", title: "Orders" }],
  ["Medium", { variant: "medium", title: "Orders", subtitle: "12 open" }],
  ["Large, scrolled", { variant: "large", title: "Orders", elevated: true }],
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

export const navigationDrawerVariants = galleryOf(NavigationDrawerDemo, [
  [
    "Standard",
    { variant: "standard", title: "Mail" },
    "Inline, beside the content on expanded windows.",
  ],
  [
    "Modal",
    { variant: "modal", title: "Mail" },
    "Over the content with a scrim; Escape and Android back close it.",
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

export const sideSheetVariants = galleryOf(SideSheetDemo, [
  ["Modal", { modal: true, side: "end", title: "Filters" }],
  ["Standard", { modal: false, side: "end", title: "Details" }],
]);

export const tableVariants = galleryOf(TableDemo, [["Basic", {}]]);
