// What the layout editor knows about each component beyond its props
// (spec §8): what it is (a grid or flow container, a text, a leaf, the tabbed
// panel), what it holds, its starting props and size, and how a Form binds it
// (§11.7). `editor-manifest.test.ts` holds every name here to the generated
// prop tables, and every catalogued component to an entry or a reason.

export type NodeKind = "grid" | "flow" | "text" | "leaf" | "tabs";

export interface ManifestEntry {
  type: string;
  kind: NodeKind;
  /** The Form container (§11.7). */
  form?: true;
  /** A container's accepted child types; left out, every palette type. */
  accepts?: string[];
  /** A flow container's axis. */
  direction?: "column" | "row";
  defaultProps: Record<string, unknown>;
  /** A text component's starting label. */
  defaultText?: string;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  /** Outside a Form, the value/change pair the export turns into state. */
  controlled?: { value: string; onChange: string; initial: unknown };
  /** Inside a Form, how FormField connects it. */
  field?: { valueProp: string; trigger: string; initial: unknown };
  palette: { group: string; icon: string };
}

type Size = [w: number, h: number];

const entry = (
  type: string,
  kind: NodeKind,
  [group, icon]: [string, string],
  [w, h]: Size,
  [minW, minH]: Size,
  more: Partial<ManifestEntry> = {},
): ManifestEntry => ({
  type,
  kind,
  defaultProps: {},
  defaultSize: { w, h },
  minSize: { w: minW, h: minH },
  palette: { group, icon },
  ...more,
});

/** A field: bound by a Form inside one, held in state outside. */
const field = (valueProp: string, trigger: string, initial: unknown) => ({
  field: { valueProp, trigger, initial },
  controlled: { value: valueProp, onChange: trigger, initial },
});

/**
 * One grey pixel (the outline tone), stretched by the image: renders without a
 * network fetch, and as a PNG on every platform (Image on iOS and Android
 * does not decode SVG).
 */
const PLACEHOLDER = {
  uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGM4deQCAAS6Al/EENGiAAAAAElFTkSuQmCC",
};

const CHOICES = [
  { id: "1", label: "Option 1", value: "1" },
  { id: "2", label: "Option 2", value: "2" },
];
const PAIRS = [
  { label: "One", value: "one" },
  { label: "Two", value: "two" },
];

const F = "Foundations";
const A = "Actions";
const I = "Inputs";
const D = "Data Display";
const B = "Feedback";
const N = "Navigation";
const L = "Layout";

const ENTRIES: ManifestEntry[] = [
  // Foundations
  entry("Typography", "text", [F, "format-text"], [6, 1], [1, 1], {
    defaultProps: { variant: "bodyMedium" },
    defaultText: "Text",
  }),
  entry("Divider", "leaf", [F, "minus"], [6, 1], [1, 1]),
  entry("Paper", "grid", [F, "card-outline"], [6, 4], [2, 2]),
  entry("Card", "grid", [F, "card-text-outline"], [6, 4], [2, 2], {
    defaultProps: { variant: "outlined" },
  }),
  entry("CardTitle", "leaf", [F, "format-title"], [6, 1], [2, 1], {
    defaultProps: { title: "Title" },
  }),
  entry("CardContent", "grid", [F, "card-text"], [6, 3], [2, 1]),
  entry("CardCover", "leaf", [F, "image-area"], [6, 3], [2, 2], {
    defaultProps: { source: PLACEHOLDER, alt: "Cover" },
  }),
  entry("CardActions", "flow", [F, "gesture-tap-button"], [6, 1], [2, 1], {
    direction: "row",
    accepts: ["Button", "IconButton", "ProgressButton"],
  }),
  entry("Icon", "leaf", [F, "star-outline"], [1, 1], [1, 1], {
    defaultProps: { source: "star-outline" },
  }),

  // Actions
  entry("Button", "text", [A, "gesture-tap-button"], [3, 1], [1, 1], {
    defaultProps: { variant: "filled" },
    defaultText: "Button",
  }),
  entry("ProgressButton", "text", [A, "progress-check"], [3, 1], [1, 1], {
    defaultText: "Save",
  }),
  entry("IconButton", "leaf", [A, "heart-outline"], [1, 1], [1, 1], {
    defaultProps: { icon: "heart-outline", accessibilityLabel: "Like" },
  }),
  entry("Chip", "leaf", [A, "label-outline"], [2, 1], [1, 1], {
    defaultProps: { label: "Chip" },
  }),
  entry("ChipGroup", "leaf", [A, "label-multiple-outline"], [4, 1], [2, 1], {
    defaultProps: { options: PAIRS },
    controlled: { value: "value", onChange: "onChange", initial: null },
  }),
  entry(
    "ToggleButtonGroup",
    "leaf",
    [A, "toggle-switch-outline"],
    [4, 1],
    [2, 1],
    {
      defaultProps: { options: PAIRS },
      controlled: { value: "value", onChange: "onValueChange", initial: "one" },
    },
  ),
  entry("ButtonGroup", "leaf", [A, "view-week-outline"], [4, 1], [2, 1], {
    defaultProps: { options: PAIRS },
    controlled: { value: "value", onChange: "onValueChange", initial: "one" },
  }),
  entry("Clipboard", "leaf", [A, "content-copy"], [2, 1], [1, 1], {
    defaultProps: { value: "Text to copy" },
  }),

  // Inputs
  entry("Input", "leaf", [I, "form-textbox"], [4, 2], [2, 2], {
    defaultProps: { label: "Text" },
    ...field("value", "onChange", ""),
  }),
  entry("InputArea", "leaf", [I, "form-textarea"], [6, 3], [2, 2], {
    defaultProps: { label: "Message" },
    ...field("value", "onChange", ""),
  }),
  entry("PasswordField", "leaf", [I, "form-textbox-password"], [4, 2], [2, 2], {
    defaultProps: { label: "Password" },
    ...field("value", "onChange", ""),
  }),
  entry("NumberField", "leaf", [I, "numeric"], [3, 2], [2, 2], {
    defaultProps: { label: "Quantity" },
    ...field("value", "onChange", 0),
  }),
  entry("Select", "leaf", [I, "form-dropdown"], [4, 2], [2, 2], {
    defaultProps: { label: "Choice", options: CHOICES },
    ...field("value", "onChange", null),
  }),
  entry("Autocomplete", "leaf", [I, "magnify-expand"], [4, 2], [2, 2], {
    defaultProps: { label: "Search", options: CHOICES },
    ...field("value", "onChange", ""),
  }),
  entry("Checkbox", "leaf", [I, "checkbox-marked-outline"], [3, 1], [1, 1], {
    defaultProps: { label: "I agree" },
    ...field("checked", "onValueChange", false),
  }),
  entry(
    "CheckboxGroup",
    "leaf",
    [I, "checkbox-multiple-outline"],
    [4, 2],
    [2, 1],
    {
      defaultProps: { label: "Options", options: PAIRS },
      ...field("value", "onChange", []),
    },
  ),
  entry("RadioGroup", "leaf", [I, "radiobox-marked"], [4, 2], [2, 1], {
    defaultProps: { label: "Choice", options: CHOICES },
    ...field("value", "onValueChange", null),
  }),
  entry("Switch", "leaf", [I, "toggle-switch-outline"], [3, 1], [1, 1], {
    defaultProps: { label: "Enabled" },
    ...field("value", "onChange", false),
  }),
  entry("Slider", "leaf", [I, "tune-variant"], [4, 1], [2, 1], {
    defaultProps: { label: "Amount" },
    ...field("value", "onValueChange", 0),
  }),
  entry("SearchBar", "leaf", [I, "magnify"], [4, 1], [2, 1], {
    controlled: { value: "value", onChange: "onChange", initial: "" },
  }),
  entry("PinInput", "leaf", [I, "dialpad"], [4, 1], [2, 1], {
    defaultProps: { label: "Code" },
    ...field("value", "onChange", ""),
  }),
  entry("FormControl", "flow", [I, "form-select"], [4, 2], [1, 1], {
    direction: "column",
  }),
  entry("DateTimePicker", "leaf", [I, "calendar-clock"], [4, 2], [2, 2], {
    defaultProps: { label: "Date and time" },
    ...field("value", "onChange", null),
  }),
  entry("DatePicker", "leaf", [I, "calendar"], [4, 2], [2, 2], {
    defaultProps: { label: "Date" },
    ...field("value", "onChange", null),
  }),
  entry("TimePicker", "leaf", [I, "clock-outline"], [4, 2], [2, 2], {
    defaultProps: { label: "Time" },
    ...field("value", "onChange", null),
  }),
  entry("Rating", "leaf", [I, "star-half-full"], [3, 1], [2, 1], {
    ...field("value", "onChange", 0),
  }),
  entry("HelperText", "text", [I, "help-circle-outline"], [4, 1], [1, 1], {
    defaultText: "Helper text",
  }),
  entry("Form", "grid", [I, "form-select"], [6, 4], [2, 2], { form: true }),

  // Data display
  entry("Avatar", "leaf", [D, "account-circle-outline"], [1, 1], [1, 1], {
    defaultProps: { name: "Ada Lovelace" },
  }),
  entry("Badge", "leaf", [D, "numeric-1-circle-outline"], [1, 1], [1, 1]),
  entry("StatusBadge", "leaf", [D, "circle-medium"], [2, 1], [1, 1], {
    defaultProps: { label: "Active" },
  }),
  entry("DataGrid", "leaf", [D, "table"], [12, 6], [4, 3], {
    defaultProps: {
      columns: [
        { id: "name", label: "Name" },
        { id: "role", label: "Role" },
      ],
      data: [
        { id: "1", name: "Ada Lovelace", role: "Engineer" },
        { id: "2", name: "Grace Hopper", role: "Admiral" },
      ],
    },
  }),
  entry("ListItem", "leaf", [D, "format-list-bulleted"], [4, 1], [2, 1], {
    defaultProps: { primaryText: "List item" },
  }),
  entry("ListSection", "flow", [D, "format-list-group"], [4, 3], [2, 1], {
    direction: "column",
    accepts: ["ListItem", "ListSubheader"],
  }),
  entry("ListSubheader", "text", [D, "format-header-pound"], [4, 1], [1, 1], {
    defaultText: "Section",
  }),
  entry("Stat", "leaf", [D, "chart-line"], [3, 2], [2, 1], {
    defaultProps: { label: "Revenue", value: "€12,400" },
  }),
  entry("CaptionValue", "leaf", [D, "text-short"], [3, 1], [1, 1], {
    defaultProps: { caption: "Caption", value: "Value" },
  }),
  entry("Image", "leaf", [D, "image-outline"], [4, 3], [1, 1], {
    defaultProps: { source: PLACEHOLDER, alt: "Image" },
  }),
  entry("Link", "text", [D, "link-variant"], [2, 1], [1, 1], {
    defaultText: "Link",
  }),
  entry("CodeBlock", "leaf", [D, "code-braces"], [6, 2], [2, 1], {
    defaultProps: { code: 'const greeting = "hello";' },
  }),
  entry("QrCode", "leaf", [D, "qrcode"], [2, 3], [2, 2], {
    defaultProps: { value: "https://example.com" },
  }),
  entry("Tree", "leaf", [D, "file-tree-outline"], [4, 3], [2, 2], {
    defaultProps: {
      data: [
        {
          id: "1",
          label: "Documents",
          children: [{ id: "2", label: "Report.pdf" }],
        },
      ],
    },
  }),

  // Feedback
  entry("Banner", "leaf", [B, "information-outline"], [8, 2], [2, 1], {
    defaultProps: { message: "Something to know.", visible: true },
  }),
  entry("Skeleton", "leaf", [B, "card-bulleted-off-outline"], [4, 1], [1, 1]),
  entry("CircularProgress", "leaf", [B, "loading"], [1, 1], [1, 1]),
  entry("LinearProgress", "leaf", [B, "progress-helper"], [4, 1], [1, 1]),
  entry("EmptyState", "leaf", [B, "inbox-outline"], [6, 3], [2, 2], {
    defaultProps: { title: "Nothing here yet" },
  }),

  // Navigation
  entry("AppBar", "leaf", [N, "page-layout-header"], [12, 1], [4, 1], {
    defaultProps: { title: "Title" },
  }),
  entry("Toolbar", "flow", [N, "dots-horizontal"], [6, 1], [1, 1], {
    direction: "row",
  }),
  entry("Breadcrumbs", "leaf", [N, "chevron-double-right"], [6, 1], [2, 1], {
    defaultProps: {
      items: [
        { id: "home", label: "Home" },
        { id: "page", label: "Page" },
      ],
    },
  }),
  entry("Pagination", "leaf", [N, "page-next-outline"], [4, 1], [2, 1], {
    defaultProps: { totalPages: 5 },
    controlled: { value: "activePage", onChange: "onChange", initial: 1 },
  }),
  entry("Stepper", "leaf", [N, "debug-step-over"], [8, 1], [3, 1], {
    defaultProps: { activeStep: 0, steps: ["Details", "Payment", "Done"] },
  }),
  entry("TabbedPanel", "tabs", [N, "tab"], [6, 4], [2, 2]),

  // Layout
  entry("Box", "grid", [L, "square-outline"], [6, 4], [1, 1]),
  entry("Stack", "flow", [L, "view-sequential-outline"], [4, 3], [1, 1], {
    direction: "column",
  }),
  entry("VStack", "flow", [L, "view-sequential-outline"], [4, 3], [1, 1], {
    direction: "column",
  }),
  entry("HStack", "flow", [L, "view-column-outline"], [6, 1], [1, 1], {
    direction: "row",
  }),
  entry("Spacer", "leaf", [L, "arrow-expand-vertical"], [1, 1], [1, 1]),
  entry("ScrollArea", "grid", [L, "gesture-swipe-vertical"], [6, 4], [2, 2]),
];

export const MANIFEST: Record<string, ManifestEntry> = Object.fromEntries(
  ENTRIES.map((e) => [e.type, e]),
);

/** Catalogued components the palette leaves out, each with its reason. */
export const LEFT_OUT: Record<string, string> = {
  TouchableRipple: "A press wrapper with nothing to show on its own.",
  FAB: "Floats over the screen: it has no cell.",
  SpeedDial: "Floats over the screen: it has no cell.",
  ToggleButton: "Used inside a ToggleButtonGroup, which is in the palette.",
  SplitButton: "A menu of actions, wired in code.",
  Download: "Needs a file and a save adapter, set in code.",
  RadioButton: "Used inside a RadioGroup, which is in the palette.",
  Editable: "Edits a value already on screen; a layout uses Input.",
  Upload: "Needs a picker adapter, set in code.",
  Table: "Built from row and cell parts; a layout uses DataGrid.",
  Tooltip: "An overlay around another component.",
  Accordion:
    "Shows its content by state; comes with the tabbed panel's treatment later (§16 Q5).",
  Carousel: "Slides with their own state; later.",
  IFrame: "An external page, on the web only.",
  Blink: "An attention effect around another component.",
  Snackbar: "An overlay: it opens over the page.",
  Dialog: "An overlay: it opens over the page.",
  AlertDialog: "An overlay: it opens over the page.",
  Popover: "An overlay: it opens over the page.",
  HoverCard: "An overlay: it opens over the page.",
  BottomSheet: "An overlay: it opens over the page.",
  Menu: "An overlay: it opens over the page.",
  Toast: "An imperative API, not a component on a page.",
  Collapse: "Shows its content by state; later (§16 Q5).",
  Portal: "Draws elsewhere in the tree: nothing to place.",
  NavBar: "Part of the app's frame, not of a screen's content.",
  NavigationRail: "Part of the app's frame, not of a screen's content.",
  Drawer: "Part of the app's frame, and an overlay on phones.",
  Tabs: "The palette's TabbedPanel brings Tabs and their panels together (§16 Q5).",
  TabContent:
    "The palette's TabbedPanel brings Tabs and their panels together (§16 Q5).",
  Center: "Centres one child: meaningless on a grid.",
  AbsoluteCenter: "Centres one child out of the flow: meaningless on a grid.",
  Break: "Cancels a container's padding: a detail for code.",
  Grid: "The responsive grid; GridLayout does this job in the editor.",
  GridLayout: "Every grid in the editor is a GridLayout already.",
  AspectRatio: "Keeps a ratio, and a grid item has both sides fixed.",
  Visible: "Shows content by window size; a layout stacks on phones by itself.",
};

export const entryFor = (type: string): ManifestEntry | undefined =>
  MANIFEST[type];

/** A grid, flow or tabs container. */
export const isContainer = (type: string): boolean => {
  const kind = MANIFEST[type]?.kind;
  return kind === "grid" || kind === "flow" || kind === "tabs";
};

/** Whether `container` takes a child of type `child`. A Form never takes a Form. */
export const acceptsChild = (container: string, child: string): boolean => {
  const entry = MANIFEST[container];
  if (!entry || !isContainer(container) || !MANIFEST[child]) return false;
  if (entry.form && MANIFEST[child].form) return false;
  return entry.accepts ? entry.accepts.includes(child) : true;
};
