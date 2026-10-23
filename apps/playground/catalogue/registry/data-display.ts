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
  QrCode,
  Tree,
  CodeBlock,
} from "@its/glowup-ui";
import type { ComponentMetadata } from "../types";

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

/** Data Display: 16 catalogue entries. */
export const dataDisplay: Record<string, ComponentMetadata> = {
  Avatar: {
    name: "Avatar",
    Component: Avatar,
    props: {
      // The component has no name: the icon below is the last link of
      // source -> initials -> icon, so a typed name takes over from it.
      name: { type: "text", default: "", label: "Name" },
      size: {
        type: "select",
        default: "medium",
        label: "Size",
        options: [
          { label: "Small (32)", value: "small" },
          { label: "Medium (40)", value: "medium" },
          { label: "Large (56)", value: "large" },
        ],
      },
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
      backgroundColor: { type: "text", default: "", label: "Background" },
      textColor: { type: "text", default: "", label: "Text colour" },
    },
  },
  Badge: {
    name: "Badge",
    Component: Badge,
    props: {
      // Left out, the badge is a dot with no number.
      count: { type: "number", default: undefined, label: "Count" },
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
        default: undefined,
        label: "Position",
        options: [
          { label: "None", value: undefined },
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
      label: { type: "text", default: "", label: "Label" },
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
      toneFrom: { type: "text", default: "", label: "Tone from" },
    },
  },
  DataGrid: {
    name: "DataGrid",
    Component: DataGrid,
    props: {
      density: {
        type: "select",
        // Left out, the grid follows ThemeProvider's density.
        default: undefined,
        label: "Density",
        options: [
          { label: "Follow the theme", value: undefined },
          { label: "Normal", value: "normal" },
          { label: "Dense", value: "dense" },
        ],
      },
      loading: { type: "boolean", default: false, label: "Loading" },
      emptyMessage: {
        type: "text",
        default: "",
        label: "Empty Message",
        // Drawn in the body's empty slot, which the spinner takes over.
        appliesWhen: (values) => !values.loading,
      },
    },
  },
  ListItem: {
    name: "ListItem",
    Component: ListItem,
    props: {
      primaryText: { type: "text", default: "", label: "Primary Text" },
      secondaryText: { type: "text", default: "", label: "Secondary Text" },
      // A glyph name; the library also takes a node (an Avatar), which the
      // gallery shows.
      icon: { type: "icon", default: "", label: "Icon (glyph name)" },
      trailingWidth: {
        type: "number",
        default: undefined,
        label: "Trailing Width (px)",
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
    props: {
      title: { type: "text", default: "", label: "Title" },
      divider: { type: "boolean", default: false, label: "Divider below" },
    },
  },
  ListSubheader: {
    name: "ListSubheader",
    Component: ListSubheader,
    props: {
      children: { type: "text", default: "", label: "Text" },
    },
  },
  Tooltip: {
    name: "Tooltip",
    Component: Tooltip,
    props: {
      content: { type: "text", default: "", label: "Content" },
      variant: {
        type: "select",
        default: "plain",
        label: "Variant",
        options: [
          { label: "Plain", value: "plain" },
          { label: "Rich", value: "rich" },
        ],
      },
      title: {
        type: "text",
        default: "",
        label: "Title (rich)",
        // Only a rich tooltip has a subhead.
        appliesWhen: (values) => values.variant === "rich",
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
      anchorAccessible: {
        type: "boolean",
        default: true,
        label: "Anchor accessible (native)",
      },
      enterDelay: {
        type: "number",
        default: 500,
        label: "Enter delay (ms, web)",
      },
      leaveDelay: {
        type: "number",
        default: 100,
        label: "Leave delay (ms, web)",
      },
      hideDelay: {
        type: "number",
        default: 1500,
        label: "Hide delay (ms, native)",
      },
    },
  },
  Accordion: {
    name: "Accordion",
    Component: Accordion,
    props: {
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
      height: {
        type: "number",
        default: undefined,
        label: "Height (px, empty = tallest page)",
      },
    },
  },
  Stat: {
    name: "Stat",
    Component: Stat,
    props: {
      label: { type: "text", default: "", label: "Label" },
      value: { type: "text", default: "", label: "Value" },
      delta: { type: "text", default: "", label: "Delta" },
      trend: {
        type: "select",
        default: undefined,
        label: "Trend",
        options: [
          { label: "None", value: undefined },
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
      helpText: { type: "text", default: "", label: "Help Text" },
      icon: { type: "icon", default: "", label: "Icon" },
    },
  },
  CaptionValue: {
    name: "CaptionValue",
    Component: CaptionValue,
    props: {
      caption: { type: "text", default: "", label: "Caption" },
      value: { type: "text", default: "", label: "Value" },
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
          { label: "Default", value: undefined },
          { label: "Auto", value: "auto" },
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
          { label: "Justify", value: "justify" },
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
      // Left out, the pair is as wide and as tall as its text.
      width: { type: "number", default: undefined, label: "Width (px)" },
      height: { type: "number", default: undefined, label: "Height (px)" },
      flex: { type: "number", default: undefined, label: "Flex" },
      padding: { type: "number", default: undefined, label: "Padding (px)" },
      enableCopy: { type: "boolean", default: false, label: "Enable Copy" },
      showTooltip: { type: "boolean", default: false, label: "Show Tooltip" },
    },
  },
  Image: {
    name: "Image",
    Component: Image,
    props: {
      alt: { type: "text", default: "", label: "Alt text" },
      // Left out, the frame is as wide as its container.
      width: { type: "number", default: undefined, label: "Width (px)" },
      height: { type: "number", default: undefined, label: "Height (px)" },
      ratio: {
        type: "number",
        default: undefined,
        label: "Aspect Ratio (width / height)",
      },
      radius: {
        type: "select",
        default: undefined,
        label: "Radius",
        options: [
          { label: "None", value: undefined },
          { label: "Small", value: "small" },
          { label: "Medium", value: "medium" },
          { label: "Large", value: "large" },
          { label: "Extra large", value: "extraLarge" },
        ],
      },
      resizeMode: {
        type: "select",
        default: "cover",
        label: "Resize Mode",
        options: [
          { label: "Cover", value: "cover" },
          { label: "Contain", value: "contain" },
          { label: "Stretch", value: "stretch" },
          { label: "Repeat", value: "repeat" },
          { label: "Center", value: "center" },
          { label: "None", value: "none" },
        ],
      },
      showLoader: { type: "boolean", default: true, label: "Show Loader" },
      fallbackIcon: {
        type: "icon",
        default: "image-broken-variant",
        label: "Fallback icon",
      },
    },
  },
  Link: {
    name: "Link",
    Component: Link,
    props: {
      children: { type: "text", default: "", label: "Label" },
      href: { type: "text", default: "", label: "Href" },
      variant: {
        type: "select",
        default: "bodyMedium",
        label: "Variant",
        options: [
          { label: "Display large", value: "displayLarge" },
          { label: "Display medium", value: "displayMedium" },
          { label: "Display small", value: "displaySmall" },
          { label: "Headline large", value: "headlineLarge" },
          { label: "Headline medium", value: "headlineMedium" },
          { label: "Headline small", value: "headlineSmall" },
          { label: "Title large", value: "titleLarge" },
          { label: "Title medium", value: "titleMedium" },
          { label: "Title small", value: "titleSmall" },
          { label: "Label large", value: "labelLarge" },
          { label: "Label medium", value: "labelMedium" },
          { label: "Label small", value: "labelSmall" },
          { label: "Body large", value: "bodyLarge" },
          { label: "Body medium", value: "bodyMedium" },
          { label: "Body small", value: "bodySmall" },
        ],
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
      showExternalIcon: {
        type: "select",
        // Left out, the icon follows the href: drawn for an address with a scheme.
        default: undefined,
        label: "External icon",
        options: [
          { label: "By href", value: undefined },
          { label: "Show", value: true },
          { label: "Hide", value: false },
        ],
      },
      externalIcon: {
        type: "icon",
        default: "open-in-new",
        label: "External icon glyph",
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Table: {
    name: "Table",
    Component: Table,
    props: {
      tableTitle: { type: "text", default: "", label: "Title" },
      // Left out, the table fills its container and is as tall as its rows.
      width: { type: "number", default: undefined, label: "Width (px)" },
      height: { type: "number", default: undefined, label: "Height (px)" },
      rowsPerPage: {
        type: "number",
        default: undefined,
        label: "Rows per page",
      },
      hover: { type: "boolean", default: false, label: "Hover" },
      // The component's own is "No data".
      emptyMessage: { type: "text", default: "", label: "Empty Message" },
    },
  },
  IFrame: {
    name: "IFrame",
    Component: IFrame,
    // The example reports `onLoad`, which only a mounted frame can: render it
    // after hydration, so the load is never missed in the exported HTML.
    clientOnly: true,
    props: {
      src: { type: "text", default: "", label: "Src" },
      title: { type: "text", default: "", label: "Title" },
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
          {
            label: "No referrer when downgrade",
            value: "no-referrer-when-downgrade",
          },
          { label: "Origin", value: "origin" },
          {
            label: "Origin when cross-origin",
            value: "origin-when-cross-origin",
          },
          { label: "Same origin", value: "same-origin" },
          { label: "Strict origin", value: "strict-origin" },
          {
            label: "Strict origin when cross-origin",
            value: "strict-origin-when-cross-origin",
          },
          { label: "Unsafe URL", value: "unsafe-url" },
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
  CodeBlock: {
    name: "CodeBlock",
    Component: CodeBlock,
    props: {
      title: { type: "text", default: "", label: "Title" },
      language: {
        type: "select",
        default: "tsx",
        label: "Language",
        options: [
          { label: "TSX", value: "tsx" },
          { label: "JSX", value: "jsx" },
          { label: "TypeScript", value: "ts" },
          { label: "JavaScript", value: "js" },
          { label: "JSON", value: "json" },
          { label: "Bash", value: "bash" },
          { label: "Plain text", value: "text" },
        ],
      },
      showLineNumbers: {
        type: "boolean",
        default: false,
        label: "Show Line Numbers",
      },
      copyable: { type: "boolean", default: true, label: "Copyable" },
      wrap: { type: "boolean", default: false, label: "Wrap" },
      // Unset: the block grows with its code.
      maxHeight: {
        type: "number",
        default: undefined,
        label: "Max Height (px)",
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
  QrCode: {
    name: "QrCode",
    Component: QrCode,
    props: {
      value: { type: "text", default: "", label: "Value" },
      size: { type: "number", default: 160, label: "Size (px)" },
      level: {
        type: "select",
        default: "M",
        label: "Error Correction",
        options: [
          { label: "Low (7%)", value: "L" },
          { label: "Medium (15%)", value: "M" },
          { label: "Quartile (25%)", value: "Q" },
          { label: "High (30%)", value: "H" },
        ],
        // A logo raises the level to High, whatever this says.
        appliesWhen: (values) => !values.logo,
      },
      quietZone: {
        type: "number",
        default: 4,
        label: "Quiet Zone (modules)",
      },
      // Fixed colours, not theme tokens: scanners read dark modules on a light
      // background, and a token flips with the theme's mode.
      color: {
        type: "select",
        default: undefined,
        label: "Modules (keep it dark)",
        options: [
          { label: "Default (by theme)", value: undefined },
          { label: "Black", value: "#000000" },
          { label: "Deep green", value: "#1B5E20" },
          { label: "Deep blue", value: "#0D47A1" },
        ],
      },
      backgroundColor: {
        type: "select",
        default: undefined,
        label: "Background (keep it light)",
        options: [
          { label: "Default (by theme)", value: undefined },
          { label: "White", value: "#FFFFFF" },
          { label: "Cream", value: "#FFF8E1" },
          { label: "Mint", value: "#E8F5E9" },
        ],
      },
      logo: { type: "icon", default: "", label: "Logo" },
      accessibilityLabel: {
        type: "text",
        default: "QR code",
        label: "Accessibility Label",
      },
    },
  },
  Tree: {
    name: "Tree",
    Component: Tree,
    props: {
      selectionMode: {
        type: "select",
        default: "none",
        label: "Selection Mode",
        options: [
          { label: "None (rows open and close)", value: "none" },
          { label: "Single", value: "single" },
          { label: "Multiple", value: "multiple" },
        ],
      },
      checkboxes: {
        type: "boolean",
        default: false,
        label: "Checkboxes",
        // Only the multiple mode draws them.
        appliesWhen: (values) => values.selectionMode === "multiple",
      },
      size: {
        type: "select",
        default: "medium",
        label: "Size",
        options: [
          { label: "Small (32)", value: "small" },
          { label: "Medium (40)", value: "medium" },
          { label: "Large (48)", value: "large" },
        ],
      },
      indent: { type: "number", default: 24, label: "Indent (px)" },
      showLines: { type: "boolean", default: false, label: "Show Lines" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
      loadingText: {
        type: "text",
        default: "Loading…",
        label: "Loading Text",
      },
      accessibilityLabel: {
        type: "text",
        default: "",
        label: "Accessibility Label",
      },
    },
  },
};
