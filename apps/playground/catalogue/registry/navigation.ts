import {
  NavigationBar,
  Breadcrumbs,
  Pagination,
  Stepper,
  Tabs,
  TabContent,
  NavigationRail,
  NavigationDrawer,
  TopAppBar,
  Toolbar,
} from "@its/glowup-ui";
import type { ComponentMetadata } from "../types";
import {
  NavigationRailDemo,
  NavigationDrawerDemo,
  TopAppBarDemo,
  ToolbarDemo,
} from "../demos";

/** Navigation: 10 catalogue entries. */
export const navigation: Record<string, ComponentMetadata> = {
  NavigationBar: {
    name: "NavigationBar",
    Component: NavigationBar,
    props: {
      activeId: { type: "text", default: "home", label: "Active Id" },
      showLabels: {
        type: "select",
        default: "always",
        label: "Show Labels",
        options: [
          { label: "Always", value: "always" },
          { label: "Selected", value: "selected" },
        ],
      },
    },
  },
  Tabs: {
    name: "Tabs",
    Component: Tabs,
    props: {
      activeTab: { type: "number", default: 0, label: "Active Tab" },
    },
  },
  TabContent: {
    name: "TabContent",
    Component: TabContent,
    props: {
      activeTab: { type: "number", default: 0, label: "Active tab" },
    },
  },
  Breadcrumbs: {
    name: "Breadcrumbs",
    Component: Breadcrumbs,
    props: {
      maxItems: { type: "number", default: 0, label: "Max Items (0 = all)" },
    },
  },
  Pagination: {
    name: "Pagination",
    Component: Pagination,
    props: {
      page: { type: "number", default: 1, label: "Page" },
      totalPages: { type: "number", default: 12, label: "Total Pages" },
      siblingCount: { type: "number", default: 1, label: "Sibling Count" },
      showFirstLast: {
        type: "boolean",
        default: false,
        label: "First/Last Arrows",
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Stepper: {
    name: "Stepper",
    Component: Stepper,
    props: {
      activeStep: { type: "number", default: 1, label: "Active Step" },
    },
  },
  TopAppBar: {
    name: "TopAppBar",
    Component: TopAppBar,
    Demo: TopAppBarDemo,
    props: {
      title: { type: "text", default: "Orders", label: "Title" },
      subtitle: { type: "text", default: "", label: "Subtitle" },
      variant: {
        type: "select",
        default: "small",
        label: "Variant",
        options: [
          { label: "Small", value: "small" },
          { label: "Center-aligned", value: "center" },
          { label: "Medium", value: "medium" },
          { label: "Large", value: "large" },
        ],
      },
      elevated: {
        type: "boolean",
        default: false,
        label: "Elevated (scrolled)",
      },
    },
  },
  NavigationRail: {
    name: "NavigationRail",
    Component: NavigationRail,
    Demo: NavigationRailDemo,
    props: {
      activeId: { type: "text", default: "home", label: "Active Id" },
      showLabels: {
        type: "select",
        default: "always",
        label: "Show Labels",
        options: [
          { label: "Always", value: "always" },
          { label: "Selected", value: "selected" },
          { label: "None", value: "none" },
        ],
      },
      alignment: {
        type: "select",
        default: "top",
        label: "Alignment",
        options: [
          { label: "Top", value: "top" },
          { label: "Center", value: "center" },
        ],
      },
      withFab: { type: "boolean", default: true, label: "Menu + FAB header" },
    },
  },
  NavigationDrawer: {
    name: "NavigationDrawer",
    Component: NavigationDrawer,
    Demo: NavigationDrawerDemo,
    props: {
      variant: {
        type: "select",
        default: "standard",
        label: "Variant",
        options: [
          { label: "Standard", value: "standard" },
          { label: "Modal", value: "modal" },
        ],
      },
      title: { type: "text", default: "Mail", label: "Title" },
    },
  },
  Toolbar: {
    name: "Toolbar",
    Component: Toolbar,
    Demo: ToolbarDemo,
    props: {
      variant: {
        type: "select",
        default: "floating",
        label: "Variant",
        options: [
          { label: "Floating", value: "floating" },
          { label: "Docked", value: "docked" },
        ],
      },
      color: {
        ...{
          type: "select",
          default: "standard",
          label: "Color",
          options: [
            { label: "Standard", value: "standard" },
            { label: "Vibrant", value: "vibrant" },
          ],
        },
        appliesWhen: (values) => values.variant === "floating",
      },
      orientation: {
        ...{
          type: "select",
          default: "horizontal",
          label: "Orientation",
          options: [
            { label: "Horizontal", value: "horizontal" },
            { label: "Vertical", value: "vertical" },
          ],
        },
        appliesWhen: (values) => values.variant === "floating",
      },
      withFab: {
        type: "boolean",
        default: false,
        label: "With FAB",
        appliesWhen: (values) => values.variant === "floating",
      },
    },
  },
};
