import {
  NavigationBar,
  Breadcrumbs,
  Pagination,
  Stepper,
  Tabs,
  TabContent,
  LanguageSelector,
  DrawerPreferenceItem,
} from "@glowup/ui";
import type { ComponentMetadata } from "../types";

/** Navigation: 8 catalogue entries. */
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
  LanguageSelector: {
    name: "LanguageSelector",
    Component: LanguageSelector,
    props: {},
  },
  DrawerPreferenceItem: {
    name: "DrawerPreferenceItem",
    Component: DrawerPreferenceItem,
    props: {
      icon: { type: "text", default: "theme-light-dark", label: "Icon" },
      label: { type: "text", default: "Tema", label: "Label" },
    },
  },
};
