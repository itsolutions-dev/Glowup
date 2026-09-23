// Grouped catalogue for the navigator. Every registry key lives in exactly
// one group, and the flat order drives the "NN / total" counter.
import type { Category } from "./types";

export const CATEGORIES: Category[] = [
  {
    label: "Foundations",
    icon: "cube-outline",
    items: [
      "Typography",
      "Divider",
      "Paper",
      "Card",
      "CardTitle",
      "CardContent",
      "CardCover",
      "CardActions",
      "Icon",
      "TouchableRipple",
    ],
  },
  {
    label: "Actions",
    icon: "cursor-default-click-outline",
    items: [
      "Button",
      "ProgressButton",
      "IconButton",
      "Chip",
      "FAB",
      "AnimatedFAB",
      "SpeedDial",
      "ToggleButton",
      "ToggleButtonGroup",
    ],
  },
  {
    label: "Inputs",
    icon: "form-textbox",
    items: [
      "Input",
      "NumericInput",
      "Select",
      "Checkbox",
      "RadioButton",
      "RadioGroup",
      "Toggle",
      "Slider",
      "Spinner",
      "SearchBar",
      "Autocomplete",
      "PinInput",
      "FormControl",
      "DateTimePicker",
      "DatePicker",
      "DatePickerInput",
      "DateRangePicker",
      "TimePicker",
      "TimeSelect",
      "Calendar",
      "ClockPicker",
      "ClockDial",
      "Rating",
      "HelperText",
    ],
  },
  {
    label: "Data Display",
    icon: "view-grid-outline",
    items: [
      "Avatar",
      "Badge",
      "IconBadge",
      "StatusBadge",
      "DataGrid",
      "ListItem",
      "ListSection",
      "ListSubheader",
      "Tooltip",
      "Accordion",
      "Carousel",
      "Stat",
      "Image",
      "Link",
    ],
  },
  {
    label: "Feedback",
    icon: "message-alert-outline",
    items: [
      "Snackbar",
      "Banner",
      "Modal",
      "ConfirmDialog",
      "Popover",
      "BottomSheet",
      "Menu",
      "Skeleton",
      "CircularProgress",
      "LinearProgress",
      "EmptyState",
      "Toast",
      "Collapse",
      "Portal",
    ],
  },
  {
    label: "Navigation",
    icon: "compass-outline",
    items: [
      "NavigationBar",
      "Tabs",
      "TabContent",
      "Breadcrumbs",
      "Pagination",
      "Stepper",
      "LanguageSelector",
      "DrawerPreferenceItem",
    ],
  },
  {
    label: "Layout",
    icon: "view-dashboard-outline",
    items: ["Box", "Stack", "Grid", "AspectRatio", "Center", "Spacer"],
  },
];

// Not catalogued, and deliberately so: `AppBar` takes a navigator's
// `navigation`/`route`/`options`, `DrawerNavigation` and `StackNavigation` need a
// NavigationContainer plus a route array, and `StatusBar` wraps expo-status-bar
// and paints nothing of its own. Faking a navigator to fill the grid would
// preview a stub, not the component.

// Flat ordered list + reverse lookup, derived once.
export const FLAT_ORDER: string[] = CATEGORIES.flatMap((c) => c.items);
export const TOTAL_COUNT = FLAT_ORDER.length;
export const CATEGORY_OF: Record<string, string> = {};
CATEGORIES.forEach((c) => c.items.forEach((i) => (CATEGORY_OF[i] = c.label)));
