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
    Component: NavigationBar,
    sample: {
      items: [
        { id: "home", label: "Home", icon: "home-outline", badgeCount: 0 },
        { id: "search", label: "Search", icon: "magnify" },
        { id: "inbox", label: "Inbox", icon: "email-outline", badgeCount: 3 },
        { id: "profile", label: "Profile", icon: "account-outline" },
      ],
    },
    controlled: { onItemPress: "activeId" },
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
    Component: Tabs,
    sample: { tabs: ["Overview", "Specs", "Reviews"] },
    controlled: { onChange: "activeTab" },
    stage: { width: "100%", maxWidth: 420 },
    props: {
      activeTab: { type: "number", default: 0, label: "Active Tab" },
    },
  },
  TabContent: {
    Component: TabContent,
    props: {
      activeTab: { type: "number", default: 0, label: "Active tab" },
    },
  },
  Breadcrumbs: {
    Component: Breadcrumbs,
    sample: {
      items: [
        { id: "1", label: "Home", icon: "home-outline", onPress: () => {} },
        { id: "2", label: "Projects", onPress: () => {} },
        { id: "3", label: "Glowup", onPress: () => {} },
        { id: "4", label: "Components", onPress: () => {} },
        { id: "5", label: "Breadcrumbs" },
      ],
    },
    dropWhenFalsy: ["maxItems"],
    props: {
      maxItems: { type: "number", default: 0, label: "Max Items (0 = all)" },
    },
  },
  Pagination: {
    Component: Pagination,
    controlled: { onPageChange: "page" },
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
    Component: Stepper,
    sample: { steps: ["Cart", "Shipping", "Payment", "Review"] },
    controlled: { onStepPress: "activeStep" },
    stage: { width: "100%", maxWidth: 420 },
    props: {
      activeStep: { type: "number", default: 1, label: "Active Step" },
    },
  },
  TopAppBar: {
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
