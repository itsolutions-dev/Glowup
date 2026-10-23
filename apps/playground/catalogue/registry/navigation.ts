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

/**
 * Navigation: 10 catalogue entries. Where the user is (`activeId`, `activeTab`,
 * `activePage`, `activeStep`) is the example's own state, not a control.
 */
export const navigation: Record<string, ComponentMetadata> = {
  NavBar: {
    name: "NavBar",
    Component: NavBar,
    props: {
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
      height: { type: "number", default: undefined, label: "Height" },
      width: { type: "number", default: undefined, label: "Width" },
      color: {
        type: "select",
        default: "primary",
        label: "Color",
        options: COLOR_OPTIONS,
      },
    },
  },
  // Its one real prop that is not a node or a style is `activeTab`, which the
  // example's state owns: nothing to drive from a panel.
  TabContent: {
    name: "TabContent",
    Component: TabContent,
    props: {},
  },
  Breadcrumbs: {
    name: "Breadcrumbs",
    Component: Breadcrumbs,
    props: {
      maxItems: { type: "number", default: undefined, label: "Max Items" },
      separator: {
        type: "icon",
        default: "chevron-right",
        label: "Separator",
      },
    },
  },
  Pagination: {
    name: "Pagination",
    Component: Pagination,
    props: {
      totalPages: { type: "number", default: undefined, label: "Total Pages" },
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
    props: {
      title: { type: "text", default: "", label: "Title" },
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
      elevated: { type: "boolean", default: false, label: "Elevated" },
      divider: { type: "boolean", default: false, label: "Divider" },
    },
  },
  NavigationRail: {
    name: "NavigationRail",
    Component: NavigationRail,
    props: {
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
    },
  },
  Drawer: {
    name: "Drawer",
    Component: Drawer,
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
      title: { type: "text", default: "", label: "Title" },
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
    props: {
      variant: {
        type: "select",
        default: "docked",
        label: "Variant",
        options: [
          { label: "Docked", value: "docked" },
          { label: "Floating", value: "floating" },
        ],
      },
      color: {
        type: "select",
        default: "standard",
        label: "Color",
        options: [
          { label: "Standard", value: "standard" },
          { label: "Vibrant", value: "vibrant" },
        ],
        appliesWhen: (values) => values.variant === "floating",
      },
      orientation: {
        type: "select",
        default: "horizontal",
        label: "Orientation",
        options: [
          { label: "Horizontal", value: "horizontal" },
          { label: "Vertical", value: "vertical" },
        ],
        appliesWhen: (values) => values.variant === "floating",
      },
      accessibilityLabel: {
        type: "text",
        default: "",
        label: "Accessibility Label",
      },
    },
  },
};
