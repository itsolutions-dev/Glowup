import {
  Badge,
  Avatar,
  DataGrid,
  Tooltip,
  Carousel,
  Accordion,
  StatusBadge,
  ListItem,
  Image,
  Link,
  Stat,
  CaptionValue,
  ListSection,
  ListSubheader,
  Table,
  IFrame,
  Blink,
} from "@its/glowup-ui";
import type { ComponentMetadata } from "../types";
import {
  AccordionDemo,
  CaptionValueDemo,
  DataGridDemo,
  IFrameDemo,
  ListItemDemo,
  ListSectionDemo,
  ListSubheaderDemo,
  StatDemo,
  TableDemo,
} from "../demos";

/** The theme colours the `color`-like props take, for the select controls. */
const COLOR_OPTIONS = [
  { label: "Primary", value: "primary" },
  { label: "Secondary", value: "secondary" },
  { label: "Tertiary", value: "tertiary" },
  { label: "Error", value: "error" },
  { label: "Success", value: "success" },
  { label: "Warning", value: "warning" },
  { label: "Info", value: "info" },
];

/**
 * A page of its own, so `IFrame` has something to show offline and with no
 * server behind it. Single quotes inside: the snippet writes this as a JSX
 * attribute, which has no escape for a double one.
 */
const IFRAME_SRC =
  "data:text/html,<body style='margin:0;padding:24px;font:16px/1.5 system-ui;background:white;color:black'><h2 style='margin:0 0 8px'>An embedded page</h2><p style='margin:0'>A separate document, drawn inside the screen.</p></body>";

/** Data Display: 16 catalogue entries. */
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
        type: "icon",
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
      color: {
        type: "select",
        default: "error",
        label: "Color",
        options: [
          { label: "Primary", value: "primary" },
          { label: "Secondary", value: "secondary" },
          { label: "Tertiary", value: "tertiary" },
          { label: "Error", value: "error" },
          { label: "Success", value: "success" },
          { label: "Warning", value: "warning" },
          { label: "Info", value: "info" },
          { label: "Neutral", value: "neutral" },
        ],
      },
      position: {
        type: "select",
        default: "",
        label: "Position",
        options: [
          { label: "None", value: "" },
          { label: "Top right", value: "top-right" },
          { label: "Bottom right", value: "bottom-right" },
          { label: "Top left", value: "top-left" },
          { label: "Bottom left", value: "bottom-left" },
        ],
      },
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
      icon: { type: "icon", default: "", label: "Icon Override" },
    },
  },
  DataGrid: {
    name: "DataGrid",
    Component: DataGrid,
    Demo: DataGridDemo,
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
    Demo: ListItemDemo,
    props: {
      primaryText: {
        type: "text",
        default: "Workspace members",
        label: "Primary Text",
      },
      secondaryText: {
        type: "text",
        default: "",
        label: "Secondary Text",
      },
      // A glyph name; the library also takes a node (an Avatar), which the
      // gallery shows.
      icon: { type: "icon", default: "", label: "Icon (glyph name)" },
      // A node in the library: the demo draws the one picked here.
      action: {
        type: "select",
        default: "",
        label: "Action",
        options: [
          { label: "None", value: "" },
          { label: "Chevron", value: "chevron" },
          { label: "Text", value: "text" },
          { label: "Switch", value: "switch" },
          { label: "Icon button", value: "iconButton" },
          { label: "Status badge", value: "badge" },
        ],
      },
      trailingWidth: {
        type: "number",
        default: 0,
        label: "Trailing Width (px, 0 = auto)",
        // Sizes the action slot, which is empty without an action.
        appliesWhen: (values) => !!values.action,
      },
      onClick: {
        type: "boolean",
        default: false,
        label: "Pressable (onClick)",
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
      dimmed: { type: "boolean", default: false, label: "Dimmed" },
      indicatorColor: {
        type: "text",
        default: "",
        label: "Indicator Color",
      },
    },
  },
  ListSection: {
    name: "ListSection",
    Component: ListSection,
    Demo: ListSectionDemo,
    props: {
      title: { type: "text", default: "Notifications", label: "Title" },
      divider: { type: "boolean", default: false, label: "Divider below" },
    },
  },
  ListSubheader: {
    name: "ListSubheader",
    Component: ListSubheader,
    Demo: ListSubheaderDemo,
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
    Demo: AccordionDemo,
    props: {
      title: { type: "text", default: "Accordion Title", label: "Title" },
      // The stage keeps it in step with the header: a press writes it back.
      expanded: { type: "boolean", default: false, label: "Expanded" },
      icon: { type: "icon", default: "", label: "Icon (empty = chevron)" },
      variant: {
        type: "select",
        default: "outlined",
        label: "Variant",
        options: [
          { label: "Outlined", value: "outlined" },
          { label: "Contained", value: "contained" },
        ],
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
    Demo: StatDemo,
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
      trendColor: {
        type: "select",
        default: undefined,
        label: "Trend Color",
        options: [
          { label: "Default (by trend)", value: undefined },
          ...COLOR_OPTIONS,
          { label: "Neutral", value: "onSurfaceVariant" },
        ],
        // Paints the arrow and the delta, which need a delta.
        appliesWhen: (values) => !!values.delta,
      },
      direction: {
        type: "select",
        default: "column",
        label: "Direction",
        options: [
          { label: "Column", value: "column" },
          { label: "Row", value: "row" },
        ],
      },
      helpText: { type: "text", default: "vs. last month", label: "Help Text" },
      icon: { type: "icon", default: "cash-multiple", label: "Icon" },
    },
  },
  CaptionValue: {
    name: "CaptionValue",
    Component: CaptionValue,
    Demo: CaptionValueDemo,
    props: {
      caption: { type: "text", default: "Phone", label: "Caption" },
      value: { type: "text", default: "+39 06 1234 5678", label: "Value" },
      fallback: {
        type: "text",
        default: "N/A",
        label: "Fallback",
        // Drawn instead of an empty value.
        appliesWhen: (values) => !values.value,
      },
      direction: {
        type: "select",
        default: "column",
        label: "Direction",
        options: [
          { label: "Column", value: "column" },
          { label: "Row", value: "row" },
        ],
      },
      reverse: { type: "boolean", default: false, label: "Reverse" },
      omitCaption: { type: "boolean", default: false, label: "Omit caption" },
      captionColor: {
        type: "select",
        default: undefined,
        label: "Caption Color",
        options: [{ label: "Default", value: undefined }, ...COLOR_OPTIONS],
        appliesWhen: (values) => !values.omitCaption,
      },
      valueColor: {
        type: "select",
        default: undefined,
        label: "Value Color",
        options: [{ label: "Default", value: undefined }, ...COLOR_OPTIONS],
      },
      textAlign: {
        type: "select",
        default: undefined,
        label: "Text Align",
        options: [
          { label: "Auto", value: undefined },
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ],
      },
      gap: {
        type: "number",
        default: 4,
        label: "Gap (px)",
        appliesWhen: (values) => !values.omitCaption,
      },
      numberOfLines: {
        type: "number",
        default: 1,
        label: "Lines (0 = no limit)",
      },
      width: { type: "number", default: 0, label: "Width (px, 0 = auto)" },
      height: { type: "number", default: 0, label: "Height (px, 0 = auto)" },
      flex: { type: "number", default: 0, label: "Flex (0 = none)" },
      padding: { type: "number", default: 0, label: "Padding (px)" },
      enableCopy: { type: "boolean", default: false, label: "Enable Copy" },
      showTooltip: { type: "boolean", default: false, label: "Show Tooltip" },
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
  Table: {
    name: "Table",
    Component: Table,
    Demo: TableDemo,
    props: {
      tableTitle: { type: "text", default: "", label: "Title" },
      width: { type: "number", default: 0, label: "Width (px, 0 = fill)" },
      height: {
        type: "number",
        default: 0,
        label: "Height (px, 0 = as tall as the rows)",
      },
      rowsPerPage: {
        type: "number",
        default: 0,
        label: "Rows per page (0 = all)",
      },
      hover: { type: "boolean", default: false, label: "Hover" },
      // Indexes in `data`, not in the page shown: row 6 is on page 2 at 5 rows.
      selected: {
        type: "select",
        default: undefined,
        label: "Selected",
        options: [
          { label: "None", value: undefined },
          { label: "Row 1", value: 0 },
          { label: "Row 6", value: 5 },
          { label: "Rows 1 and 3", value: [0, 2] },
        ],
      },
      onClick: {
        type: "boolean",
        default: false,
        label: "Pressable rows (onClick)",
      },
      // The demo passes no rows: `data` is a list, not a control.
      empty: { type: "boolean", default: false, label: "Empty Data" },
      emptyMessage: {
        type: "text",
        default: "No data",
        label: "Empty Message",
        // Drawn in the body's empty slot.
        appliesWhen: (values) => !!values.empty,
      },
    },
  },
  IFrame: {
    name: "IFrame",
    Component: IFrame,
    Demo: IFrameDemo,
    // The stage reports `onLoad`, which only a mounted frame can: render it
    // after hydration, so the load is never missed in the exported HTML.
    clientOnly: true,
    props: {
      src: { type: "text", default: IFRAME_SRC, label: "Src" },
      title: { type: "text", default: "Embedded page", label: "Title" },
      width: { type: "number", default: 0, label: "Width (px, 0 = fill)" },
      height: { type: "number", default: 300, label: "Height (px)" },
      allow: { type: "text", default: "", label: "Allow" },
      sandbox: {
        type: "select",
        default: undefined,
        label: "Sandbox",
        options: [
          { label: "None", value: undefined },
          { label: "All restrictions", value: "" },
          { label: "Allow scripts", value: "allow-scripts" },
          {
            label: "Scripts and same origin",
            value: "allow-scripts allow-same-origin",
          },
        ],
      },
      referrerPolicy: {
        type: "select",
        default: undefined,
        label: "Referrer Policy",
        options: [
          { label: "Default", value: undefined },
          { label: "No referrer", value: "no-referrer" },
          { label: "Origin", value: "origin" },
          { label: "Same origin", value: "same-origin" },
          {
            label: "Strict origin when cross-origin",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      loading: {
        type: "select",
        default: "lazy",
        label: "Loading",
        options: [
          { label: "Lazy", value: "lazy" },
          { label: "Eager", value: "eager" },
        ],
      },
    },
  },
  Blink: {
    name: "Blink",
    Component: Blink,
    props: {
      interval: { type: "number", default: 600, label: "Interval (ms)" },
      minOpacity: {
        type: "number",
        default: 0.2,
        label: "Min Opacity (0 to 1)",
      },
      active: { type: "boolean", default: true, label: "Active" },
    },
  },
};
