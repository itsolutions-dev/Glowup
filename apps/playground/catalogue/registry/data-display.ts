import {
  Badge,
  Avatar,
  DataGrid,
  Tooltip,
  Carousel,
  Accordion,
  IconBadge,
  StatusBadge,
  ListItem,
  Image,
  Link,
  Stat,
  ListSection,
  ListSubheader,
} from "@its/glowup-ui";
import type { ComponentMetadata } from "../types";

/** Data Display: 14 catalogue entries. */
export const dataDisplay: Record<string, ComponentMetadata> = {
  Avatar: {
    name: "Avatar",
    Component: Avatar,
    props: {
      // Empty: the icon below is the last link of source -> initials -> icon,
      // so a name at rest made it inert whatever you typed into it. Start on
      // the icon and let a typed name take over, which is the chain itself.
      name: { type: "text", default: "", label: "Name" },
      size: { type: "number", default: 48, label: "Size" },
      status: {
        type: "select",
        default: undefined,
        label: "Status",
        options: [
          { label: "None", value: undefined },
          { label: "Online", value: "online" },
          { label: "Offline", value: "offline" },
          { label: "Busy", value: "busy" },
          { label: "Away", value: "away" },
        ],
      },
      icon: {
        type: "text",
        // "" is not the component's own default — it draws a nameless glyph.
        default: "account",
        label: "Fallback icon",
        // Reached only with no image and no name to take initials from.
        appliesWhen: (values) => !values.name,
      },
      variant: {
        type: "select",
        default: "circular",
        label: "Variant",
        options: [
          { label: "Circular", value: "circular" },
          { label: "Rounded", value: "rounded" },
          { label: "Square", value: "square" },
        ],
      },
    },
  },
  Badge: {
    name: "Badge",
    Component: Badge,
    props: {
      count: { type: "number", default: 5, label: "Count" },
      max: { type: "number", default: 99, label: "Max" },
      showZero: { type: "boolean", default: false, label: "Show Zero" },
      size: {
        type: "select",
        default: "large",
        label: "Size",
        options: [
          { label: "Large", value: "large" },
          { label: "Small (dot)", value: "small" },
        ],
      },
    },
  },
  IconBadge: {
    name: "IconBadge",
    Component: IconBadge,
    props: {
      iconName: { type: "text", default: "bell-outline", label: "Icon Name" },
      badgeCount: { type: "number", default: 3, label: "Badge Count" },
      size: { type: "number", default: 40, label: "Size" },
      badgeColor: { type: "text", default: "", label: "Badge Color" },
      color: { type: "text", default: "", label: "Icon Color" },
    },
  },
  StatusBadge: {
    name: "StatusBadge",
    Component: StatusBadge,
    props: {
      label: { type: "text", default: "Active", label: "Label" },
      type: {
        type: "select",
        default: "success",
        label: "Type",
        options: [
          { label: "Success", value: "success" },
          { label: "Error", value: "error" },
          { label: "Warning", value: "warning" },
        ],
      },
      icon: { type: "text", default: "", label: "Icon Override" },
    },
  },
  DataGrid: {
    name: "DataGrid",
    Component: DataGrid,
    props: {
      density: {
        type: "select",
        default: "normal",
        label: "Density",
        options: [
          { label: "Normal", value: "normal" },
          { label: "Dense", value: "dense" },
        ],
      },
      loading: { type: "boolean", default: false, label: "Loading" },
      empty: { type: "boolean", default: false, label: "Empty Data" },
      emptyMessage: {
        type: "text",
        default: "No rows to display",
        label: "Empty Message",
        // Drawn in the body's empty slot, which the spinner takes over.
        appliesWhen: (values) => !!values.empty && !values.loading,
      },
    },
  },
  ListItem: {
    name: "ListItem",
    Component: ListItem,
    props: {
      children: { type: "text", default: "List item label", label: "Label" },
    },
  },
  ListSection: {
    name: "ListSection",
    Component: ListSection,
    props: {
      title: { type: "text", default: "Notifications", label: "Title" },
      divider: { type: "boolean", default: false, label: "Divider below" },
    },
  },
  ListSubheader: {
    name: "ListSubheader",
    Component: ListSubheader,
    props: {
      children: { type: "text", default: "Preferences", label: "Text" },
    },
  },
  Tooltip: {
    name: "Tooltip",
    Component: Tooltip,
    props: {
      content: {
        type: "text",
        default: "Helpful hint",
        label: "Content",
      },
      position: {
        type: "select",
        default: "top",
        label: "Position",
        options: [
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Accordion: {
    name: "Accordion",
    Component: Accordion,
    isContainer: true,
    props: {
      title: { type: "text", default: "Accordion Title", label: "Title" },
      startExpanded: {
        type: "boolean",
        default: false,
        label: "Start Expanded",
      },
      children: {
        type: "text",
        default: "Hidden content revealed when expanded.",
        label: "Content",
      },
    },
  },
  Carousel: {
    name: "Carousel",
    Component: Carousel,
    props: {
      showDots: { type: "boolean", default: true, label: "Show Dots" },
      showArrows: { type: "boolean", default: false, label: "Show Arrows" },
      autoPlayInterval: {
        type: "number",
        default: 0,
        label: "Auto-play (ms, 0 = off)",
      },
    },
  },
  Stat: {
    name: "Stat",
    Component: Stat,
    props: {
      label: { type: "text", default: "Monthly revenue", label: "Label" },
      value: { type: "text", default: "128,400", label: "Value" },
      delta: { type: "text", default: "12.5%", label: "Delta" },
      trend: {
        type: "select",
        default: "up",
        label: "Trend",
        options: [
          { label: "Up", value: "up" },
          { label: "Down", value: "down" },
          { label: "Flat", value: "flat" },
        ],
        // The arrow lives in the delta row, which needs a delta.
        appliesWhen: (values) => !!values.delta,
      },
      invertTrendColors: {
        type: "boolean",
        default: false,
        label: "Invert trend colors",
        // Flat is the neutral role either way round.
        appliesWhen: (values) => !!values.delta && values.trend !== "flat",
      },
      helpText: { type: "text", default: "vs. last month", label: "Help Text" },
      icon: { type: "text", default: "cash-multiple", label: "Icon" },
    },
  },
  Image: {
    name: "Image",
    Component: Image,
    props: {
      alt: { type: "text", default: "A placeholder photo", label: "Alt text" },
      ratio: { type: "number", default: 1.5, label: "Aspect Ratio" },
      radius: {
        type: "select",
        default: "large",
        label: "Radius",
        options: [
          { label: "None", value: 0 },
          { label: "Small", value: "small" },
          { label: "Medium", value: "medium" },
          { label: "Large", value: "large" },
        ],
      },
      resizeMode: {
        type: "select",
        default: "cover",
        label: "Resize Mode",
        options: [
          { label: "Cover", value: "cover" },
          { label: "Contain", value: "contain" },
        ],
      },
      showLoader: { type: "boolean", default: true, label: "Show Loader" },
      broken: { type: "boolean", default: false, label: "Simulate broken URL" },
    },
  },
  Link: {
    name: "Link",
    Component: Link,
    props: {
      children: { type: "text", default: "Material Design 3", label: "Label" },
      href: {
        type: "text",
        default: "https://m3.material.io",
        label: "Href",
      },
      underline: {
        type: "select",
        default: "hover",
        label: "Underline",
        options: [
          { label: "On hover", value: "hover" },
          { label: "Always", value: "always" },
          { label: "Never", value: "none" },
        ],
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
};
