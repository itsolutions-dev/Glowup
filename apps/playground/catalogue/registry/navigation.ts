import {
  NavBar,
  Breadcrumbs,
  Pagination,
  Stepper,
  Tabs,
  TabContent,
  NavigationRail,
  Drawer,
  AppBar,
  Toolbar,
} from "@its/glowup-ui";
import type { ComponentMetadata } from "../types";
import {
  NavigationRailDemo,
  DrawerDemo,
  AppBarDemo,
  ToolbarDemo,
} from "../demos";

/** The library's `ColorRole`s, for every `color` control of this module. */
const COLOR_OPTIONS = [
  { label: "Primary", value: "primary" },
  { label: "Secondary", value: "secondary" },
  { label: "Tertiary", value: "tertiary" },
  { label: "Error", value: "error" },
  { label: "Success", value: "success" },
  { label: "Warning", value: "warning" },
  { label: "Info", value: "info" },
  { label: "Neutral", value: "neutral" },
];

/** Navigation: 10 catalogue entries. */
export const navigation: Record<string, ComponentMetadata> = {
  NavBar: {
    name: "NavBar",
    Component: NavBar,
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
      variant: {
        type: "select",
        default: "standard",
        label: "Variant",
        options: [
          { label: "Standard", value: "standard" },
          { label: "Rounded", value: "rounded" },
        ],
      },
      showBorders: { type: "boolean", default: false, label: "Show Borders" },
      size: {
        type: "select",
        default: "md",
        label: "Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
      },
      fullWidth: { type: "boolean", default: true, label: "Full Width" },
      height: { type: "number", default: 0, label: "Height (0 = auto)" },
      width: { type: "number", default: 0, label: "Width (0 = auto)" },
      color: {
        type: "select",
        default: "primary",
        label: "Color",
        options: COLOR_OPTIONS,
      },
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
      activePage: { type: "number", default: 1, label: "Active Page" },
      totalPages: { type: "number", default: 12, label: "Total Pages" },
      siblingCount: { type: "number", default: 1, label: "Sibling Count" },
      showFirstLast: {
        type: "boolean",
        default: false,
        label: "First/Last Arrows",
      },
      pageSelect: { type: "boolean", default: false, label: "Page Select" },
      color: {
        type: "select",
        default: "primary",
        label: "Color",
        options: COLOR_OPTIONS,
      },
      variant: {
        type: "select",
        default: "rounded",
        label: "Variant",
        options: [
          { label: "Rounded", value: "rounded" },
          { label: "Circular", value: "circular" },
        ],
      },
      size: {
        type: "select",
        default: "md",
        label: "Size",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Stepper: {
    name: "Stepper",
    Component: Stepper,
    props: {
      activeStep: { type: "number", default: 1, label: "Active Step" },
      direction: {
        type: "select",
        default: "row",
        label: "Direction",
        options: [
          { label: "Row", value: "row" },
          { label: "Column", value: "column" },
        ],
      },
    },
  },
  AppBar: {
    name: "AppBar",
    Component: AppBar,
    Demo: AppBarDemo,
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
      divider: { type: "boolean", default: false, label: "Divider" },
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
  Drawer: {
    name: "Drawer",
    Component: Drawer,
    Demo: DrawerDemo,
    props: {
      variant: {
        type: "select",
        default: "static",
        label: "Variant",
        options: [
          { label: "Static", value: "static" },
          { label: "Swipeable", value: "swipeable" },
        ],
      },
      position: {
        type: "select",
        default: "left",
        label: "Position",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
        ],
      },
      visible: {
        type: "boolean",
        default: false,
        label: "Visible",
        appliesWhen: (values) => values.variant === "swipeable",
      },
      elevation: {
        type: "select",
        default: "",
        label: "Elevation",
        options: [
          { label: "Default (0 static, 1 swipeable)", value: "" },
          { label: "0", value: 0 },
          { label: "1", value: 1 },
          { label: "2", value: 2 },
          { label: "3", value: 3 },
          { label: "4", value: 4 },
          { label: "5", value: 5 },
        ],
      },
      title: { type: "text", default: "Mail", label: "Title" },
      collapsed: { type: "boolean", default: false, label: "Collapsed" },
      showCloseButton: {
        type: "boolean",
        default: false,
        label: "Close Button",
      },
      width: {
        type: "number",
        default: 360,
        label: "Width",
        appliesWhen: (values) =>
          values.position === "left" || values.position === "right",
      },
      height: {
        type: "number",
        default: 360,
        label: "Height",
        appliesWhen: (values) =>
          values.position === "top" || values.position === "bottom",
      },
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
