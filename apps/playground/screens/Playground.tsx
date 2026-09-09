import React, { useState, useMemo } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Animated,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  useTheme,
  useToast,
  Typography,
  Button,
  Input,
  Select,
  Checkbox,
  Toggle,
  Chip,
  Badge,
  Avatar,
  Card,
  Divider,
  Spinner,
  NumericInput,
  DataGrid,
  RadioGroup,
  Slider,
  Tooltip,
  Menu,
  BottomSheet,
  NavigationBar,
  Skeleton,
  SearchBar,
  Banner,
  Breadcrumbs,
  Pagination,
  Rating,
  EmptyState,
  Carousel,
  Accordion,
  DatePickerInput,
  DateRangePicker,
  DateTimePicker,
  FAB,
  IconBadge,
  Paper,
  Stepper,
  StatusBadge,
  Snackbar,
  SpeedDial,
  CircularProgress,
  LinearProgress,
  Tabs,
  ToggleButtonGroup,
  ListItem,
  Modal,
  ConfirmDialog,
  Popover,
  Autocomplete,
  Box,
  Calendar,
  ClockPicker,
  Collapse,
  FormControl,
  Grid,
  IconButton,
  Image,
  Link,
  PinInput,
  Stack,
  Stat,
  AnimatedFAB,
  CardActions,
  CardContent,
  CardCover,
  CardTitle,
  HelperText,
  Icon,
  ListSection,
  ListSubheader,
  Portal,
  RadioButton,
  TouchableRipple,
  ToggleButton,
  AspectRatio,
  Center,
  Spacer,
  TabContent,
  ClockDial,
  DatePicker,
  TimePicker,
  TimeSelect,
  LanguageSelector,
  DrawerPreferenceItem,
  EMPTY_RANGE,
} from "@glowup/ui";
import type { DateRange } from "@glowup/ui";

// Components

// Types for Registry
type PropType = "text" | "number" | "boolean" | "select" | "node";

interface PropDefinition {
  type: PropType;
  default: any;
  options?: { label: string; value: any }[];
  label: string;
}

interface ComponentMetadata {
  name: string;
  Component: any;
  props: Record<string, PropDefinition>;
  isContainer?: boolean;
}

const ComponentRegistry: Record<string, ComponentMetadata> = {
  Button: {
    name: "Button",
    Component: Button,
    props: {
      children: { type: "text", default: "Click Me", label: "Label" },
      mode: {
        type: "select",
        default: "filled",
        label: "Mode",
        options: [
          { label: "Filled", value: "filled" },
          { label: "Tonal", value: "tonal" },
          { label: "Outlined", value: "outlined" },
          { label: "Text", value: "text" },
        ],
      },
      iconName: { type: "text", default: "plus", label: "Icon Name" },
      iconPosition: {
        type: "select",
        default: "left",
        label: "Icon Position",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
      },
      fullWidth: { type: "boolean", default: false, label: "Full Width" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
      loading: { type: "boolean", default: false, label: "Loading" },
    },
  },
  Input: {
    name: "Input",
    Component: Input,
    props: {
      label: { type: "text", default: "User Name", label: "Label" },
      placeholder: {
        type: "text",
        default: "Enter name...",
        label: "Placeholder",
      },
      value: { type: "text", default: "", label: "Value" },
      error: { type: "text", default: "", label: "Error Message" },
      helperText: { type: "text", default: "", label: "Helper Text" },
      required: { type: "boolean", default: false, label: "Required" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Chip: {
    name: "Chip",
    Component: Chip,
    props: {
      label: { type: "text", default: "React Native", label: "Label" },
      selected: { type: "boolean", default: false, label: "Selected" },
      mode: {
        type: "select",
        default: "filled",
        label: "Mode",
        options: [
          { label: "Filled", value: "filled" },
          { label: "Tonal", value: "tonal" },
          { label: "Outlined", value: "outlined" },
        ],
      },
      size: {
        type: "select",
        default: "medium",
        label: "Size",
        options: [
          { label: "Medium", value: "medium" },
          { label: "Small", value: "small" },
        ],
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Avatar: {
    name: "Avatar",
    Component: Avatar,
    props: {
      name: { type: "text", default: "Glowup User", label: "Name" },
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
      icon: { type: "text", default: "", label: "Icon Override" },
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
  Card: {
    name: "Card",
    Component: Card,
    isContainer: true,
    props: {
      variant: {
        type: "select",
        default: "filled",
        label: "Variant",
        options: [
          { label: "Filled", value: "filled" },
          { label: "Elevated", value: "elevated" },
          { label: "Outlined", value: "outlined" },
          { label: "Glow", value: "glow" },
        ],
      },
      children: {
        type: "text",
        default: "This is a card content",
        label: "Content",
      },
    },
  },
  Spinner: {
    name: "Spinner",
    Component: Spinner,
    props: {
      label: { type: "text", default: "Loading...", label: "Label" },
      value: { type: "number", default: 10, label: "Value" },
      min: { type: "number", default: 0, label: "Min" },
      max: { type: "number", default: 100, label: "Max" },
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
      },
    },
  },
  Checkbox: {
    name: "Checkbox",
    Component: Checkbox,
    props: {
      label: { type: "text", default: "Accept terms", label: "Label" },
      checked: { type: "boolean", default: false, label: "Checked" },
      indeterminate: {
        type: "boolean",
        default: false,
        label: "Indeterminate",
      },
      labelPosition: {
        type: "select",
        default: "right",
        label: "Label Position",
        options: [
          { label: "Right", value: "right" },
          { label: "Left", value: "left" },
        ],
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
      error: { type: "boolean", default: false, label: "Error" },
    },
  },
  RadioGroup: {
    name: "RadioGroup",
    Component: RadioGroup,
    props: {
      label: { type: "text", default: "Choose one", label: "Label" },
      value: { type: "text", default: "a", label: "Value" },
      direction: {
        type: "select",
        default: "column",
        label: "Direction",
        options: [
          { label: "Column", value: "column" },
          { label: "Row", value: "row" },
        ],
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
      error: { type: "text", default: "", label: "Error Message" },
    },
  },
  Slider: {
    name: "Slider",
    Component: Slider,
    props: {
      value: { type: "number", default: 40, label: "Value" },
      min: { type: "number", default: 0, label: "Min" },
      max: { type: "number", default: 100, label: "Max" },
      step: { type: "number", default: 0, label: "Step (0 = off)" },
      label: { type: "text", default: "Volume", label: "Label" },
      showValueLabel: {
        type: "boolean",
        default: true,
        label: "Show Value",
      },
      marks: { type: "boolean", default: false, label: "Marks" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
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
  Menu: {
    name: "Menu",
    Component: Menu,
    props: {
      visible: { type: "boolean", default: false, label: "Visible" },
      closeOnSelect: {
        type: "boolean",
        default: true,
        label: "Close On Select",
      },
    },
  },
  BottomSheet: {
    name: "BottomSheet",
    Component: BottomSheet,
    props: {
      visible: { type: "boolean", default: false, label: "Visible" },
      title: { type: "text", default: "Sheet Title", label: "Title" },
      showHandle: { type: "boolean", default: true, label: "Show Handle" },
      dismissOnScrimTap: {
        type: "boolean",
        default: true,
        label: "Dismiss On Scrim Tap",
      },
    },
  },
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
  Skeleton: {
    name: "Skeleton",
    Component: Skeleton,
    props: {
      variant: {
        type: "select",
        default: "rect",
        label: "Variant",
        options: [
          { label: "Rect", value: "rect" },
          { label: "Circle", value: "circle" },
          { label: "Text", value: "text" },
        ],
      },
      width: { type: "number", default: 200, label: "Width" },
      height: { type: "number", default: 48, label: "Height" },
      duration: { type: "number", default: 1200, label: "Duration (ms)" },
      animate: { type: "boolean", default: true, label: "Animate" },
    },
  },
  SearchBar: {
    name: "SearchBar",
    Component: SearchBar,
    props: {
      value: { type: "text", default: "", label: "Value" },
      placeholder: { type: "text", default: "Search", label: "Placeholder" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Banner: {
    name: "Banner",
    Component: Banner,
    props: {
      visible: { type: "boolean", default: true, label: "Visible" },
      message: {
        type: "text",
        default: "Your subscription is about to expire.",
        label: "Message",
      },
      type: {
        type: "select",
        default: "default",
        label: "Type",
        options: [
          { label: "Default", value: "default" },
          { label: "Info", value: "info" },
          { label: "Warning", value: "warning" },
          { label: "Error", value: "error" },
        ],
      },
      dismissable: { type: "boolean", default: false, label: "Dismissable" },
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
  Rating: {
    name: "Rating",
    Component: Rating,
    props: {
      value: { type: "number", default: 3.5, label: "Value" },
      max: { type: "number", default: 5, label: "Max" },
      size: { type: "number", default: 24, label: "Size" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  EmptyState: {
    name: "EmptyState",
    Component: EmptyState,
    props: {
      icon: { type: "text", default: "inbox-outline", label: "Icon" },
      title: { type: "text", default: "No items yet", label: "Title" },
      description: {
        type: "text",
        default: "Items you add will show up here.",
        label: "Description",
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
  DateTimePicker: {
    name: "DateTimePicker",
    Component: DateTimePicker,
    props: {
      label: { type: "text", default: "Pick a date", label: "Label" },
      mode: {
        type: "select",
        default: "date",
        label: "Mode",
        options: [
          { label: "Date", value: "date" },
          { label: "Date & Time", value: "datetime" },
          { label: "Time", value: "time" },
        ],
      },
      selectionMode: {
        type: "select",
        default: "single",
        label: "Selection",
        options: [
          { label: "Single", value: "single" },
          { label: "Range", value: "range" },
          { label: "Multiple", value: "multiple" },
        ],
      },
      scrollMode: {
        type: "select",
        default: "endless",
        label: "Month scrolling",
        options: [
          { label: "Endless", value: "endless" },
          { label: "Paged", value: "paged" },
        ],
      },
      locale: {
        type: "select",
        default: "",
        label: "Locale override",
        options: [
          { label: "Device", value: "" },
          { label: "it-IT", value: "it-IT" },
          { label: "en-US", value: "en-US" },
          { label: "de-DE", value: "de-DE" },
          { label: "ja-JP", value: "ja-JP" },
          { label: "ar-EG", value: "ar-EG" },
        ],
      },
      minuteInterval: {
        type: "select",
        default: 1,
        label: "Minute interval",
        options: [
          { label: "1", value: 1 },
          { label: "5", value: 5 },
          { label: "15", value: 15 },
          { label: "30", value: 30 },
        ],
      },
      placeholder: {
        type: "text",
        default: "No date selected",
        label: "Placeholder",
      },
      helperText: { type: "text", default: "", label: "Helper Text" },
      error: { type: "text", default: "", label: "Error Message" },
      required: { type: "boolean", default: false, label: "Required" },
      clearable: { type: "boolean", default: true, label: "Clearable" },
      inputEnabled: {
        type: "boolean",
        default: true,
        label: "Typed entry",
      },
      use24HourClock: {
        type: "boolean",
        default: false,
        label: "Force 24h clock",
      },
      limitToThisMonth: {
        type: "boolean",
        default: false,
        label: "Min/max = this month",
      },
      noWeekends: {
        type: "boolean",
        default: false,
        label: "Disable weekends",
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  DatePickerInput: {
    name: "DatePickerInput",
    Component: DatePickerInput,
    props: {
      label: { type: "text", default: "Date of birth", label: "Label" },
      placeholder: { type: "text", default: "Not set", label: "Placeholder" },
      helperText: {
        type: "text",
        default: "Type it, or pick it from the calendar",
        label: "Helper Text",
      },
      locale: {
        type: "select",
        default: "",
        label: "Locale override",
        options: [
          { label: "Device", value: "" },
          { label: "it-IT", value: "it-IT" },
          { label: "en-US", value: "en-US" },
          { label: "ja-JP", value: "ja-JP" },
        ],
      },
      error: { type: "text", default: "", label: "Error Message" },
      required: { type: "boolean", default: false, label: "Required" },
      clearable: { type: "boolean", default: true, label: "Clearable" },
      limitToThisMonth: {
        type: "boolean",
        default: false,
        label: "Valid range = this month",
      },
      noWeekends: {
        type: "boolean",
        default: false,
        label: "Disable weekends",
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  DateRangePicker: {
    name: "DateRangePicker",
    Component: DateRangePicker,
    props: {
      label: { type: "text", default: "Reporting period", label: "Label" },
      placeholder: { type: "text", default: "No period", label: "Placeholder" },
      scrollMode: {
        type: "select",
        default: "endless",
        label: "Month scrolling",
        options: [
          { label: "Endless", value: "endless" },
          { label: "Paged", value: "paged" },
        ],
      },
      locale: {
        type: "select",
        default: "",
        label: "Locale override",
        options: [
          { label: "Device", value: "" },
          { label: "it-IT", value: "it-IT" },
          { label: "en-US", value: "en-US" },
          { label: "ja-JP", value: "ja-JP" },
        ],
      },
      helperText: { type: "text", default: "", label: "Helper Text" },
      clearable: { type: "boolean", default: true, label: "Clearable" },
      limitToThisMonth: {
        type: "boolean",
        default: false,
        label: "Valid range = this month",
      },
      noWeekends: {
        type: "boolean",
        default: false,
        label: "Disable weekends",
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  ClockPicker: {
    name: "ClockPicker",
    Component: ClockPicker,
    props: {
      inputType: {
        type: "select",
        default: "picker",
        label: "Surface",
        options: [
          { label: "Clock dial", value: "picker" },
          { label: "Text fields", value: "keyboard" },
        ],
      },
      use24HourClock: {
        type: "boolean",
        default: false,
        label: "Force 24h face",
      },
      minuteInterval: {
        type: "select",
        default: 1,
        label: "Minute interval",
        options: [
          { label: "1", value: 1 },
          { label: "5", value: 5 },
          { label: "15", value: 15 },
          { label: "30", value: 30 },
        ],
      },
      locale: {
        type: "select",
        default: "",
        label: "Locale override",
        options: [
          { label: "Device", value: "" },
          { label: "it-IT", value: "it-IT" },
          { label: "en-US", value: "en-US" },
          { label: "ja-JP", value: "ja-JP" },
        ],
      },
    },
  },
  Calendar: {
    name: "Calendar",
    Component: Calendar,
    props: {
      selectionMode: {
        type: "select",
        default: "single",
        label: "Selection",
        options: [
          { label: "Single", value: "single" },
          { label: "Range", value: "range" },
          { label: "Multiple", value: "multiple" },
        ],
      },
      scrollMode: {
        type: "select",
        default: "endless",
        label: "Month scrolling",
        options: [
          { label: "Endless", value: "endless" },
          { label: "Paged", value: "paged" },
        ],
      },
      showToday: { type: "boolean", default: true, label: "Show 'Today'" },
      keyboardNavigation: {
        type: "boolean",
        default: true,
        label: "Keyboard nav (web)",
      },
      locale: {
        type: "select",
        default: "",
        label: "Locale override",
        options: [
          { label: "Device", value: "" },
          { label: "it-IT", value: "it-IT" },
          { label: "en-US", value: "en-US" },
          { label: "ja-JP", value: "ja-JP" },
        ],
      },
      noWeekends: {
        type: "boolean",
        default: false,
        label: "Disable weekends",
      },
    },
  },
  IconButton: {
    name: "IconButton",
    Component: IconButton,
    props: {
      icon: { type: "text", default: "heart-outline", label: "Icon" },
      mode: {
        type: "select",
        default: "standard",
        label: "Mode",
        options: [
          { label: "Standard", value: "standard" },
          { label: "Filled", value: "filled" },
          { label: "Tonal", value: "tonal" },
          { label: "Outlined", value: "outlined" },
        ],
      },
      size: {
        type: "select",
        default: "medium",
        label: "Size",
        options: [
          { label: "Small", value: "small" },
          { label: "Medium", value: "medium" },
          { label: "Large", value: "large" },
        ],
      },
      selected: { type: "boolean", default: false, label: "Selected" },
      loading: { type: "boolean", default: false, label: "Loading" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
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
      },
      invertTrendColors: {
        type: "boolean",
        default: false,
        label: "Invert trend colors",
      },
      helpText: { type: "text", default: "vs. last month", label: "Help Text" },
      icon: { type: "text", default: "cash-multiple", label: "Icon" },
    },
  },
  PinInput: {
    name: "PinInput",
    Component: PinInput,
    props: {
      label: { type: "text", default: "Verification code", label: "Label" },
      length: { type: "number", default: 6, label: "Length" },
      type: {
        type: "select",
        default: "numeric",
        label: "Type",
        options: [
          { label: "Numeric", value: "numeric" },
          { label: "Alphanumeric", value: "alphanumeric" },
        ],
      },
      mask: { type: "boolean", default: false, label: "Mask" },
      helperText: {
        type: "text",
        default: "Paste the whole code into any cell",
        label: "Helper Text",
      },
      error: { type: "text", default: "", label: "Error Message" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Autocomplete: {
    name: "Autocomplete",
    Component: Autocomplete,
    props: {
      label: { type: "text", default: "Country", label: "Label" },
      placeholder: {
        type: "text",
        default: "Start typing…",
        label: "Placeholder",
      },
      minChars: { type: "number", default: 1, label: "Min Chars" },
      loading: { type: "boolean", default: false, label: "Loading" },
      emptyMessage: {
        type: "text",
        default: "No match",
        label: "Empty Message",
      },
      helperText: { type: "text", default: "", label: "Helper Text" },
      error: { type: "text", default: "", label: "Error Message" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  FormControl: {
    name: "FormControl",
    Component: FormControl,
    props: {
      label: { type: "text", default: "Notifications", label: "Label" },
      helperText: {
        type: "text",
        default: "We only email about incidents.",
        label: "Helper Text",
      },
      error: { type: "text", default: "", label: "Error Message" },
      required: { type: "boolean", default: false, label: "Required" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Collapse: {
    name: "Collapse",
    Component: Collapse,
    props: {
      collapsedHeight: {
        type: "number",
        default: 0,
        label: "Collapsed Height",
      },
      duration: { type: "number", default: 200, label: "Duration (ms)" },
      animateOpacity: { type: "boolean", default: true, label: "Fade" },
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
  Box: {
    name: "Box",
    Component: Box,
    props: {
      p: {
        type: "select",
        default: "m",
        label: "Padding",
        options: [
          { label: "xs", value: "xs" },
          { label: "s", value: "s" },
          { label: "m", value: "m" },
          { label: "l", value: "l" },
          { label: "xl", value: "xl" },
        ],
      },
      bg: {
        type: "select",
        default: "primaryContainer",
        label: "Background",
        options: [
          { label: "primaryContainer", value: "primaryContainer" },
          { label: "secondaryContainer", value: "secondaryContainer" },
          { label: "tertiaryContainer", value: "tertiaryContainer" },
          {
            label: "surfaceContainerHighest",
            value: "surfaceContainerHighest",
          },
        ],
      },
      radius: {
        type: "select",
        default: "large",
        label: "Radius",
        options: [
          { label: "Small", value: "small" },
          { label: "Medium", value: "medium" },
          { label: "Large", value: "large" },
          { label: "Extra large", value: "extraLarge" },
        ],
      },
      row: { type: "boolean", default: false, label: "Horizontal" },
    },
  },
  Stack: {
    name: "Stack",
    Component: Stack,
    props: {
      direction: {
        type: "select",
        default: "vertical",
        label: "Direction",
        options: [
          { label: "Vertical", value: "vertical" },
          { label: "Horizontal", value: "horizontal" },
        ],
      },
      spacing: {
        type: "select",
        default: "s",
        label: "Spacing",
        options: [
          { label: "xs", value: "xs" },
          { label: "s", value: "s" },
          { label: "m", value: "m" },
          { label: "l", value: "l" },
        ],
      },
      reverse: { type: "boolean", default: false, label: "Reverse" },
    },
  },
  Grid: {
    name: "Grid",
    Component: Grid,
    props: {
      columns: { type: "number", default: 3, label: "Columns" },
      minChildWidth: {
        type: "number",
        default: 0,
        label: "Min Child Width (0 = off)",
      },
      spacing: {
        type: "select",
        default: "s",
        label: "Spacing",
        options: [
          { label: "xs", value: "xs" },
          { label: "s", value: "s" },
          { label: "m", value: "m" },
          { label: "l", value: "l" },
        ],
      },
    },
  },
  Toast: {
    name: "Toast",
    Component: Button,
    props: {
      message: { type: "text", default: "Changes saved", label: "Message" },
      duration: { type: "number", default: 4000, label: "Duration (ms)" },
      withAction: { type: "boolean", default: false, label: "With action" },
    },
  },
  FAB: {
    name: "FAB",
    Component: FAB,
    props: {
      icon: { type: "text", default: "plus", label: "Icon" },
      label: { type: "text", default: "Create", label: "Label (extended)" },
      size: {
        type: "select",
        default: "regular",
        label: "Size",
        options: [
          { label: "Small", value: "small" },
          { label: "Regular", value: "regular" },
          { label: "Large", value: "large" },
          { label: "Extended", value: "extended" },
        ],
      },
      position: {
        type: "select",
        default: "bottom-right",
        label: "Position",
        options: [
          { label: "Bottom Right", value: "bottom-right" },
          { label: "Bottom Left", value: "bottom-left" },
          { label: "Top Right", value: "top-right" },
          { label: "Top Left", value: "top-left" },
        ],
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
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
  NumericInput: {
    name: "NumericInput",
    Component: NumericInput,
    props: {
      label: { type: "text", default: "Amount", label: "Label" },
      placeholder: { type: "text", default: "0.00", label: "Placeholder" },
      value: { type: "text", default: "42", label: "Value" },
      prefix: { type: "text", default: "$", label: "Prefix" },
      suffix: { type: "text", default: "", label: "Suffix" },
      precision: { type: "number", default: 2, label: "Precision" },
      variant: {
        type: "select",
        default: "outlined",
        label: "Variant",
        options: [
          { label: "Outlined", value: "outlined" },
          { label: "Filled", value: "filled" },
        ],
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Toggle: {
    name: "Toggle",
    Component: Toggle,
    props: {
      value: { type: "boolean", default: true, label: "Value" },
      width: { type: "number", default: 48, label: "Width" },
      height: { type: "number", default: 28, label: "Height" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Select: {
    name: "Select",
    Component: Select,
    props: {
      label: { type: "text", default: "Country", label: "Label" },
      value: { type: "text", default: "it", label: "Value" },
      placeholder: { type: "text", default: "Select…", label: "Placeholder" },
      variant: {
        type: "select",
        default: "outlined",
        label: "Variant",
        options: [
          { label: "Outlined", value: "outlined" },
          { label: "Filled", value: "filled" },
        ],
      },
      error: { type: "text", default: "", label: "Error Message" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Divider: {
    name: "Divider",
    Component: Divider,
    isContainer: true,
    props: {
      orientation: {
        type: "select",
        default: "horizontal",
        label: "Orientation",
        options: [
          { label: "Horizontal", value: "horizontal" },
          { label: "Vertical", value: "vertical" },
        ],
      },
      thickness: { type: "number", default: 1, label: "Thickness" },
      inset: { type: "number", default: 0, label: "Inset" },
      children: { type: "text", default: "OR", label: "Label" },
    },
  },
  Typography: {
    name: "Typography",
    Component: Typography,
    props: {
      children: {
        type: "text",
        default: "The quick brown fox",
        label: "Text",
      },
      variant: {
        type: "select",
        default: "bodyLarge",
        label: "Variant",
        options: [
          { label: "Display Large", value: "displayLarge" },
          { label: "Display Medium", value: "displayMedium" },
          { label: "Display Small", value: "displaySmall" },
          { label: "Headline Large", value: "headlineLarge" },
          { label: "Headline Medium", value: "headlineMedium" },
          { label: "Headline Small", value: "headlineSmall" },
          { label: "Title Large", value: "titleLarge" },
          { label: "Title Medium", value: "titleMedium" },
          { label: "Title Small", value: "titleSmall" },
          { label: "Body Large", value: "bodyLarge" },
          { label: "Body Medium", value: "bodyMedium" },
          { label: "Body Small", value: "bodySmall" },
          { label: "Label Large", value: "labelLarge" },
          { label: "Label Medium", value: "labelMedium" },
          { label: "Label Small", value: "labelSmall" },
        ],
      },
    },
  },
  Paper: {
    name: "Paper",
    Component: Paper,
    isContainer: true,
    props: {
      elevation: { type: "number", default: 1, label: "Elevation (0-5)" },
      outline: { type: "boolean", default: false, label: "Outline" },
      glow: { type: "boolean", default: false, label: "Glow" },
      children: {
        type: "text",
        default: "Elevated surface content",
        label: "Content",
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
  Stepper: {
    name: "Stepper",
    Component: Stepper,
    props: {
      activeStep: { type: "number", default: 1, label: "Active Step" },
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
  Tabs: {
    name: "Tabs",
    Component: Tabs,
    props: {
      activeTab: { type: "number", default: 0, label: "Active Tab" },
    },
  },
  ToggleButtonGroup: {
    name: "ToggleButtonGroup",
    Component: ToggleButtonGroup,
    props: {
      value: { type: "text", default: "list", label: "Value" },
    },
  },
  CircularProgress: {
    name: "CircularProgress",
    Component: CircularProgress,
    props: {
      size: { type: "number", default: 48, label: "Size" },
      strokeWidth: { type: "number", default: 4, label: "Stroke Width" },
      duration: { type: "number", default: 1000, label: "Duration (ms)" },
      color: { type: "text", default: "", label: "Color" },
    },
  },
  LinearProgress: {
    name: "LinearProgress",
    Component: LinearProgress,
    props: {
      progress: { type: "number", default: 0.6, label: "Progress (0-1)" },
      indeterminate: {
        type: "boolean",
        default: false,
        label: "Indeterminate",
      },
      height: { type: "number", default: 4, label: "Height" },
      color: { type: "text", default: "", label: "Color" },
    },
  },
  Snackbar: {
    name: "Snackbar",
    Component: Snackbar,
    props: {
      visible: { type: "boolean", default: false, label: "Visible" },
      message: {
        type: "text",
        default: "Changes saved.",
        label: "Message",
      },
      type: {
        type: "select",
        default: "default",
        label: "Type",
        options: [
          { label: "Default", value: "default" },
          { label: "Success", value: "success" },
          { label: "Error", value: "error" },
        ],
      },
      duration: { type: "number", default: 4000, label: "Duration (ms)" },
      icon: { type: "text", default: "", label: "Icon Override" },
    },
  },
  SpeedDial: {
    name: "SpeedDial",
    Component: SpeedDial,
    props: {
      mainIcon: { type: "text", default: "plus", label: "Main Icon" },
      position: {
        type: "select",
        default: "bottom-right",
        label: "Position",
        options: [
          { label: "Bottom Right", value: "bottom-right" },
          { label: "Bottom Left", value: "bottom-left" },
          { label: "Top Right", value: "top-right" },
          { label: "Top Left", value: "top-left" },
        ],
      },
    },
  },
  Modal: {
    name: "Modal",
    Component: Modal,
    props: {
      visible: { type: "boolean", default: false, label: "Visible" },
      title: { type: "text", default: "Dialog Title", label: "Title" },
      children: {
        type: "text",
        default: "This is the modal body content.",
        label: "Content",
      },
      closeText: { type: "text", default: "Close", label: "Close Text" },
      icon: { type: "text", default: "", label: "Hero icon" },
      dismissable: { type: "boolean", default: true, label: "Dismissable" },
      scrollable: { type: "boolean", default: false, label: "Scrollable body" },
    },
  },
  ConfirmDialog: {
    name: "ConfirmDialog",
    Component: ConfirmDialog,
    props: {
      visible: { type: "boolean", default: false, label: "Visible" },
      title: { type: "text", default: "Delete item?", label: "Title" },
      message: {
        type: "text",
        default: "This action cannot be undone.",
        label: "Message",
      },
      confirmText: { type: "text", default: "Delete", label: "Confirm Text" },
      cancelText: { type: "text", default: "Cancel", label: "Cancel Text" },
    },
  },
  Popover: {
    name: "Popover",
    Component: Popover,
    props: {
      visible: { type: "boolean", default: false, label: "Visible" },
    },
  },
  Icon: {
    name: "Icon",
    Component: Icon,
    props: {
      source: { type: "text", default: "camera", label: "Source (glyph)" },
      size: { type: "number", default: 32, label: "Size" },
      flipForRTL: { type: "boolean", default: false, label: "Flip for RTL" },
    },
  },
  TouchableRipple: {
    name: "TouchableRipple",
    Component: TouchableRipple,
    props: {
      borderless: { type: "boolean", default: false, label: "Borderless" },
      borderRadius: { type: "number", default: 12, label: "Border radius" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  HelperText: {
    name: "HelperText",
    Component: HelperText,
    props: {
      children: {
        type: "text",
        default: "Massimo 8 caratteri",
        label: "Text",
      },
      type: {
        type: "select",
        default: "info",
        label: "Type",
        options: [
          { label: "Info", value: "info" },
          { label: "Error", value: "error" },
        ],
      },
      visible: { type: "boolean", default: true, label: "Visible" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
      padding: {
        type: "select",
        default: "normal",
        label: "Padding",
        options: [
          { label: "Normal", value: "normal" },
          { label: "None", value: "none" },
        ],
      },
    },
  },
  ListSection: {
    name: "ListSection",
    Component: ListSection,
    props: {
      title: { type: "text", default: "Notifiche", label: "Title" },
      divider: { type: "boolean", default: false, label: "Divider below" },
    },
  },
  ListSubheader: {
    name: "ListSubheader",
    Component: ListSubheader,
    props: {
      children: { type: "text", default: "Preferenze", label: "Text" },
    },
  },
  AnimatedFAB: {
    name: "AnimatedFAB",
    Component: AnimatedFAB,
    props: {
      icon: { type: "text", default: "plus", label: "Icon" },
      label: { type: "text", default: "Nuovo intervento", label: "Label" },
      extended: { type: "boolean", default: true, label: "Extended" },
      animateFrom: {
        type: "select",
        default: "right",
        label: "Animate from",
        options: [
          { label: "Right", value: "right" },
          { label: "Left", value: "left" },
        ],
      },
      iconMode: {
        type: "select",
        default: "static",
        label: "Icon mode",
        options: [
          { label: "Static", value: "static" },
          { label: "Dynamic", value: "dynamic" },
        ],
      },
      placement: {
        type: "select",
        default: "inline",
        label: "Placement",
        options: [
          { label: "Inline", value: "inline" },
          { label: "Floating", value: "floating" },
        ],
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  CardTitle: {
    name: "CardTitle",
    Component: CardTitle,
    props: {
      title: { type: "text", default: "Impianto 4", label: "Title" },
      subtitle: {
        type: "text",
        default: "Manutenzione programmata",
        label: "Subtitle",
      },
    },
  },
  CardContent: {
    name: "CardContent",
    Component: CardContent,
    isContainer: true,
    props: {
      children: {
        type: "text",
        default: "Prossimo intervento: 12 marzo",
        label: "Content",
      },
    },
  },
  CardCover: {
    name: "CardCover",
    Component: CardCover,
    props: {
      ratio: { type: "number", default: 1.78, label: "Ratio (w / h)" },
      alt: { type: "text", default: "Impianto 4", label: "Alt text" },
    },
  },
  CardActions: {
    name: "CardActions",
    Component: CardActions,
    props: {
      align: {
        type: "select",
        default: "end",
        label: "Align",
        options: [
          { label: "End", value: "end" },
          { label: "Start", value: "start" },
          { label: "Space between", value: "space-between" },
        ],
      },
    },
  },
  RadioButton: {
    name: "RadioButton",
    Component: RadioButton,
    props: {
      selected: { type: "boolean", default: true, label: "Selected" },
      label: { type: "text", default: "Opzione singola", label: "Label" },
      labelPosition: {
        type: "select",
        default: "right",
        label: "Label position",
        options: [
          { label: "Right", value: "right" },
          { label: "Left", value: "left" },
        ],
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
      error: { type: "boolean", default: false, label: "Error" },
    },
  },
  ToggleButton: {
    name: "ToggleButton",
    Component: ToggleButton,
    props: {
      active: { type: "boolean", default: true, label: "Active" },
      label: { type: "text", default: "Griglia", label: "Label" },
      icon: { type: "text", default: "view-grid-outline", label: "Icon" },
      showSelectedCheck: {
        type: "boolean",
        default: false,
        label: "Selected check",
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  AspectRatio: {
    name: "AspectRatio",
    Component: AspectRatio,
    props: {
      ratio: { type: "number", default: 1.78, label: "Ratio (w / h)" },
    },
  },
  Center: {
    name: "Center",
    Component: Center,
    props: {},
  },
  Spacer: {
    name: "Spacer",
    Component: Spacer,
    props: {
      size: { type: "number", default: 24, label: "Size" },
      axis: {
        type: "select",
        default: "vertical",
        label: "Axis",
        options: [
          { label: "Vertical", value: "vertical" },
          { label: "Horizontal", value: "horizontal" },
        ],
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
  Portal: {
    name: "Portal",
    Component: Portal,
    props: {},
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
  ClockDial: {
    name: "ClockDial",
    Component: ClockDial,
    props: {
      unit: {
        type: "select",
        default: "hours",
        label: "Unit",
        options: [
          { label: "Hours", value: "hours" },
          { label: "Minutes", value: "minutes" },
        ],
      },
      use24HourClock: {
        type: "boolean",
        default: true,
        label: "24-hour clock",
      },
      minuteInterval: {
        type: "number",
        default: 5,
        label: "Minute interval",
      },
    },
  },
  DatePicker: {
    name: "DatePicker",
    Component: DatePicker,
    props: {
      label: { type: "text", default: "Data intervento", label: "Label" },
    },
  },
  TimePicker: {
    name: "TimePicker",
    Component: TimePicker,
    props: {
      label: { type: "text", default: "Ora intervento", label: "Label" },
    },
  },
  TimeSelect: {
    name: "TimeSelect",
    Component: TimeSelect,
    props: {
      use12Hour: { type: "boolean", default: false, label: "12-hour clock" },
      minuteInterval: {
        type: "number",
        default: 5,
        label: "Minute interval",
      },
    },
  },
};

// Grouped catalog for the navigator. Every registry key lives in exactly one group.
interface Category {
  label: string;
  icon: string;
  items: string[];
}

const CATEGORIES: Category[] = [
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
const FLAT_ORDER: string[] = CATEGORIES.flatMap((c) => c.items);
const TOTAL_COUNT = FLAT_ORDER.length;
const CATEGORY_OF: Record<string, string> = {};
CATEGORIES.forEach((c) => c.items.forEach((i) => (CATEGORY_OF[i] = c.label)));

const Playground = () => {
  const { theme, toggleTheme } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const [query, setQuery] = useState("");
  const [enterAnim] = useState(() => new Animated.Value(1));
  const [selectedComponentName, setSelectedComponentName] =
    useState<string>("Button");
  const [dateValue, setDateValue] = useState<Date | null>(() => new Date());
  const [dateRange, setDateRange] = useState<DateRange>(() => EMPTY_RANGE);
  const [dateList, setDateList] = useState<Date[]>([]);
  const [pinValue, setPinValue] = useState("");
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [collapseOpen, setCollapseOpen] = useState(false);
  const [languageDemo, setLanguageDemo] = useState("it");
  const [preferenceDemo, setPreferenceDemo] = useState(true);
  const toast = useToast();

  // Dynamically initialize state for the selected component's props
  const [componentProps, setComponentProps] = useState<Record<string, any>>(
    () => {
      const meta = ComponentRegistry["Button"];
      const initial: Record<string, any> = {};
      Object.keys(meta.props).forEach((key) => {
        initial[key] = meta.props[key].default;
      });
      return initial;
    },
  );

  const activeMeta = ComponentRegistry[selectedComponentName];

  const handleComponentChange = (name: any) => {
    if (name === selectedComponentName) return;
    setSelectedComponentName(name);
    const meta = ComponentRegistry[name];
    const initial: Record<string, any> = {};
    Object.keys(meta.props).forEach((key) => {
      initial[key] = meta.props[key].default;
    });
    setComponentProps(initial);

    // Re-play the stage entrance on every switch.
    enterAnim.setValue(0);
    Animated.spring(enterAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 11,
    }).start();
  };

  const updateProp = (key: string, value: any) => {
    setComponentProps((prev) => ({ ...prev, [key]: value }));
  };

  const renderPropEditor = (key: string, def: PropDefinition) => {
    const val = componentProps[key];

    switch (def.type) {
      case "text":
        return (
          <Input
            key={key}
            label={def.label}
            value={val?.toString() || ""}
            onChangeText={(t) => updateProp(key, t)}
            style={styles.propInput}
          />
        );
      case "number":
        return (
          <NumericInput
            key={key}
            label={def.label}
            value={val?.toString() || "0"}
            onChangeText={(t) => updateProp(key, t)}
            style={styles.propInput}
          />
        );
      case "boolean":
        return (
          <View key={key} style={styles.propRow}>
            <Typography variant="bodyMedium">{def.label}</Typography>
            <Toggle value={!!val} onValueChange={(v) => updateProp(key, v)} />
          </View>
        );
      case "select":
        return (
          <Select
            key={key}
            label={def.label}
            options={
              def.options?.map((o, i) => ({ id: i.toString(), ...o })) || []
            }
            value={val}
            onSelect={(v) => updateProp(key, v)}
            style={styles.propInput}
          />
        );
      default:
        return null;
    }
  };

  // Mock data for DataGrid if needed
  const gridData = useMemo(
    () => [
      { id: 1, name: "Item 1", value: "Val 1" },
      { id: 2, name: "Item 2", value: "Val 2" },
    ],
    [],
  );
  const gridCols = useMemo(
    () => [
      { id: "name", label: "Name", width: 150 },
      { id: "value", label: "Value", width: 150 },
    ],
    [],
  );

  const renderPreview = () => {
    const { Component, isContainer } = activeMeta;
    let props = { ...componentProps };

    // Special handling for some components
    if (selectedComponentName === "DataGrid") {
      props.data = props.empty ? [] : gridData;
      props.columns = gridCols;
      delete props.empty;
    }

    if (selectedComponentName === "Badge") {
      props.count = Number(props.count) || 0;
      props.max = Number(props.max) || 99;
    }

    if (selectedComponentName === "Checkbox") {
      props.onValueChange = (v: boolean) => updateProp("checked", v);
    }

    if (selectedComponentName === "RadioGroup") {
      props.options = [
        { id: "a", label: "Option A", value: "a" },
        { id: "b", label: "Option B (disabled)", value: "b", disabled: true },
        { id: "c", label: "Option C", value: "c" },
      ];
      props.onValueChange = (v: any) => updateProp("value", v);
    }

    if (selectedComponentName === "Slider") {
      props.value = Number(props.value) || 0;
      props.min = Number(props.min) || 0;
      props.max = Number(props.max) || 100;
      props.step = Number(props.step) || undefined;
      props.onValueChange = (v: number) => updateProp("value", v);
    }

    if (selectedComponentName === "Tooltip") {
      return (
        <Component {...props}>
          <Button mode="tonal" onPress={() => {}}>
            Hover / long-press me
          </Button>
        </Component>
      );
    }

    if (selectedComponentName === "Menu") {
      props.items = [
        { id: "1", label: "Edit", icon: "pencil-outline", onPress: () => {} },
        {
          id: "2",
          label: "Duplicate",
          icon: "content-copy",
          trailing: "Ctrl+D",
          onPress: () => {},
        },
        {
          id: "3",
          label: "Delete",
          icon: "delete-outline",
          destructive: true,
          dividerAbove: true,
          onPress: () => {},
        },
      ];
      props.onDismiss = () => updateProp("visible", false);
      props.anchor = (
        <Button mode="tonal" onPress={() => updateProp("visible", true)}>
          Open Menu
        </Button>
      );
      return <Component {...props} />;
    }

    if (selectedComponentName === "BottomSheet") {
      props.onDismiss = () => updateProp("visible", false);
      return (
        <>
          <Button mode="tonal" onPress={() => updateProp("visible", true)}>
            Open Bottom Sheet
          </Button>
          <Component {...props}>
            <Typography variant="bodyMedium">
              Bottom sheet content goes here. Drag the handle down or tap the
              scrim to dismiss.
            </Typography>
          </Component>
        </>
      );
    }

    if (selectedComponentName === "NavigationBar") {
      props.items = [
        { id: "home", label: "Home", icon: "home-outline", badgeCount: 0 },
        {
          id: "search",
          label: "Search",
          icon: "magnify",
        },
        {
          id: "inbox",
          label: "Inbox",
          icon: "email-outline",
          badgeCount: 3,
        },
        {
          id: "profile",
          label: "Profile",
          icon: "account-outline",
        },
      ];
      props.onItemPress = (id: string) => updateProp("activeId", id);
    }

    if (selectedComponentName === "Skeleton") {
      props.width = Number(props.width) || 200;
      props.height = Number(props.height) || 48;
      props.duration = Number(props.duration) || 1200;
    }

    if (selectedComponentName === "SearchBar") {
      props.onChangeText = (t: string) => updateProp("value", t);
    }

    if (selectedComponentName === "Banner") {
      props.actions = [
        { label: "Dismiss", onPress: () => updateProp("visible", false) },
        { label: "Renew", onPress: () => {} },
      ];
      props.onDismiss = () => updateProp("visible", false);
    }

    if (selectedComponentName === "Breadcrumbs") {
      const maxItems = Number(props.maxItems) || 0;
      props.maxItems = maxItems > 0 ? maxItems : undefined;
      props.items = [
        { id: "1", label: "Home", icon: "home-outline", onPress: () => {} },
        { id: "2", label: "Projects", onPress: () => {} },
        { id: "3", label: "Glowup", onPress: () => {} },
        { id: "4", label: "Components", onPress: () => {} },
        { id: "5", label: "Breadcrumbs" },
      ];
    }

    if (selectedComponentName === "Pagination") {
      props.page = Number(props.page) || 1;
      props.totalPages = Number(props.totalPages) || 1;
      props.siblingCount = Number(props.siblingCount) || 1;
      props.onPageChange = (p: number) => updateProp("page", p);
    }

    if (selectedComponentName === "Rating") {
      props.value = Number(props.value) || 0;
      props.max = Number(props.max) || 5;
      props.size = Number(props.size) || 24;
      props.onChange = (v: number) => updateProp("value", v);
    }

    if (selectedComponentName === "EmptyState") {
      props.action = {
        label: "Add item",
        iconName: "plus",
        onPress: () => {},
      };
    }

    if (selectedComponentName === "Carousel") {
      props.autoPlayInterval = Number(props.autoPlayInterval) || 0;
      return (
        <View style={{ width: "100%", maxWidth: 480 }}>
          <Component {...props}>
            {[
              "primaryContainer",
              "secondaryContainer",
              "tertiaryContainer",
            ].map((colorKey, i) => (
              <View
                key={colorKey}
                style={{
                  height: 160,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: (theme.colors as any)[colorKey],
                }}
              >
                <Typography variant="titleMedium">{`Slide ${i + 1}`}</Typography>
              </View>
            ))}
          </Component>
        </View>
      );
    }

    if (selectedComponentName === "ClockPicker") {
      if (!props.locale) delete props.locale;
      props.minuteInterval = Number(props.minuteInterval) || 1;
      // The surface edits an instant, so it needs a non-null value.
      props.value = dateValue ?? new Date();
      props.onChange = (d: Date) => setDateValue(d);
      // The M3 time surface has an intrinsic ~278px width (it is sized for a
      // 328dp dialog); the stage is narrower than that below ~1400px, so let it
      // scroll rather than clipping the AM/PM switch off the edge.
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 4,
            flexGrow: 1,
            justifyContent: "center",
          }}
        >
          <Component {...props} />
        </ScrollView>
      );
    }

    if (
      selectedComponentName === "DateTimePicker" ||
      selectedComponentName === "DatePicker" ||
      selectedComponentName === "TimePicker" ||
      selectedComponentName === "DatePickerInput" ||
      selectedComponentName === "DateRangePicker" ||
      selectedComponentName === "Calendar"
    ) {
      // limitToThisMonth / noWeekends are playground switches, not component
      // props — they stand in for a real validRange / isDateDisabled.
      const { limitToThisMonth, noWeekends, ...rest } = props;
      props = rest;
      if (!props.locale) delete props.locale;
      if (!props.error) delete props.error;
      if (!props.helperText) delete props.helperText;
      if (limitToThisMonth) {
        const now = new Date();
        props.validRange = {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        };
      }
      if (noWeekends) {
        props.isDateDisabled = (date: Date) =>
          date.getDay() === 0 || date.getDay() === 6;
      }

      // Each selection mode reports through its own callback and reads from
      // its own state, so the three are wired separately. `DateRangePicker`
      // locks the mode away as a prop, hence the name check.
      const selection =
        selectedComponentName === "DateRangePicker"
          ? "range"
          : (props.selectionMode ?? "single");

      if (selection === "range") {
        if (selectedComponentName === "Calendar") {
          props.range = dateRange;
          props.onRangeChange = setDateRange;
        } else {
          props.value = dateRange;
          props.onChange = setDateRange;
          props.onClear = () => setDateRange(EMPTY_RANGE);
        }
      } else if (selection === "multiple") {
        if (selectedComponentName === "Calendar") {
          props.dates = dateList;
          props.onDatesChange = setDateList;
        } else {
          props.value = dateList;
          props.onChange = setDateList;
          props.onClear = () => setDateList([]);
        }
      } else {
        props.value = dateValue;
        props.onChange = (d: Date) => setDateValue(d);
        props.onClear = () => setDateValue(null);
      }

      if (selectedComponentName === "Calendar") {
        return <Component {...props} />;
      }
      props.minuteInterval = Number(props.minuteInterval) || 1;
      return (
        <View style={{ width: "100%", maxWidth: 360 }}>
          <Component {...props} />
        </View>
      );
    }

    if (selectedComponentName === "IconButton") {
      return (
        <Component
          {...props}
          accessibilityLabel={props.icon || "Icon button"}
          onPress={() => {}}
        />
      );
    }

    if (selectedComponentName === "Link") {
      const { children, ...linkProps } = props;
      if (!linkProps.href) delete linkProps.href;
      return <Component {...linkProps}>{children}</Component>;
    }

    if (selectedComponentName === "Stat") {
      if (!props.icon) delete props.icon;
      if (!props.delta) delete props.delta;
      if (!props.helpText) delete props.helpText;
      return (
        <View style={{ minWidth: 240 }}>
          <Component {...props} />
        </View>
      );
    }

    if (selectedComponentName === "PinInput") {
      props.length = Math.max(2, Math.min(10, Number(props.length) || 6));
      props.value = pinValue;
      props.onChangeText = setPinValue;
      if (!props.error) delete props.error;
      if (!props.helperText) delete props.helperText;
      return (
        <View style={{ alignItems: "center" }}>
          <Component {...props} />
        </View>
      );
    }

    if (selectedComponentName === "Autocomplete") {
      props.minChars = Math.max(0, Number(props.minChars) || 0);
      props.value = autocompleteQuery;
      props.onChangeText = setAutocompleteQuery;
      props.onSelect = () => {};
      props.options = [
        {
          id: "it",
          label: "Italy",
          value: "IT",
          description: "Europe",
          icon: "map-marker-outline",
        },
        { id: "is", label: "Iceland", value: "IS", description: "Europe" },
        { id: "in", label: "India", value: "IN", description: "Asia" },
        { id: "id", label: "Indonesia", value: "ID", description: "Asia" },
        { id: "ie", label: "Ireland", value: "IE", description: "Europe" },
        { id: "jp", label: "Japan", value: "JP", description: "Asia" },
      ];
      if (!props.error) delete props.error;
      if (!props.helperText) delete props.helperText;
      if (!props.emptyMessage) delete props.emptyMessage;
      return (
        <View style={{ width: "100%", maxWidth: 360, minHeight: 300 }}>
          <Component {...props} />
        </View>
      );
    }

    if (selectedComponentName === "FormControl") {
      if (!props.error) delete props.error;
      if (!props.helperText) delete props.helperText;
      return (
        <View style={{ width: "100%", maxWidth: 360 }}>
          <Component {...props}>
            <Checkbox
              label="Email me about incidents"
              checked
              onValueChange={() => {}}
            />
            <Checkbox
              label="Email me a weekly digest"
              checked={false}
              onValueChange={() => {}}
            />
          </Component>
        </View>
      );
    }

    if (selectedComponentName === "Collapse") {
      props.collapsedHeight = Number(props.collapsedHeight) || 0;
      props.duration = Number(props.duration) || 200;
      return (
        <View style={{ width: "100%", maxWidth: 420, gap: 12 }}>
          <Button mode="tonal" onPress={() => setCollapseOpen((o) => !o)}>
            {collapseOpen ? "Collapse" : "Expand"}
          </Button>
          <Component {...props} open={collapseOpen}>
            <View
              style={{
                padding: 16,
                borderRadius: 16,
                backgroundColor: theme.colors.secondaryContainer,
              }}
            >
              <Typography variant="bodyMedium">
                The height is measured from the content, so this animates
                correctly however much text it holds — no fixed height needed.
              </Typography>
            </View>
          </Component>
        </View>
      );
    }

    if (selectedComponentName === "Image") {
      const { broken, ...imageProps } = props;
      imageProps.ratio = Number(imageProps.ratio) || 1.5;
      imageProps.source = {
        uri: broken
          ? "https://example.invalid/missing.png"
          : "https://picsum.photos/seed/glowup/640/420",
      };
      return (
        <View style={{ width: "100%", maxWidth: 420 }}>
          <Component {...imageProps} />
        </View>
      );
    }

    if (
      selectedComponentName === "Box" ||
      selectedComponentName === "Stack" ||
      selectedComponentName === "Grid"
    ) {
      if (selectedComponentName === "Grid") {
        props.columns = Math.max(1, Number(props.columns) || 1);
        const minChildWidth = Number(props.minChildWidth) || 0;
        props.minChildWidth = minChildWidth > 0 ? minChildWidth : undefined;
      }
      const swatches = ["primary", "secondary", "tertiary", "error"];
      return (
        <View style={{ width: "100%", maxWidth: 420 }}>
          <Component {...props}>
            {swatches.map((colorKey) => (
              <View
                key={colorKey}
                style={{
                  minWidth: 72,
                  paddingVertical: 18,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: (theme.colors as any)[colorKey],
                }}
              >
                <Typography
                  variant="labelMedium"
                  style={{
                    color: (theme.colors as any)[
                      `on${colorKey[0].toUpperCase()}${colorKey.slice(1)}`
                    ],
                  }}
                >
                  {colorKey}
                </Typography>
              </View>
            ))}
          </Component>
        </View>
      );
    }

    if (selectedComponentName === "Toast") {
      const duration = Number(props.duration) || 4000;
      const action = props.withAction
        ? { label: "Undo", onPress: () => {} }
        : undefined;
      const message = props.message || "Changes saved";
      return (
        <View style={{ gap: 12, alignItems: "center" }}>
          <Typography
            variant="bodyMedium"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
            }}
          >
            useToast() queues toasts from anywhere in the tree — no `visible`
            state to thread through the screen.
          </Typography>
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Button
              mode="tonal"
              onPress={() => toast.show({ message, duration, action })}
            >
              Show
            </Button>
            <Button
              mode="tonal"
              onPress={() => toast.success(message, { duration, action })}
            >
              Success
            </Button>
            <Button
              mode="tonal"
              onPress={() => toast.error(message, { duration, action })}
            >
              Error
            </Button>
            <Button mode="outlined" onPress={() => toast.hide()}>
              Clear queue
            </Button>
          </View>
        </View>
      );
    }

    if (selectedComponentName === "FAB") {
      if (!props.label) delete props.label;
      return (
        <View style={{ width: "100%", height: 200 }}>
          <Component {...props} onPress={() => {}} />
        </View>
      );
    }

    if (selectedComponentName === "IconBadge") {
      props.badgeCount = Number(props.badgeCount) || 0;
      props.size = Number(props.size) || 32;
      if (!props.badgeColor) delete props.badgeColor;
      if (!props.color) delete props.color;
      return <Component {...props} onPress={() => {}} />;
    }

    if (selectedComponentName === "NumericInput") {
      props.precision = props.precision ? Number(props.precision) : undefined;
      props.onChangeText = (t: string) => updateProp("value", t);
      if (!props.prefix) delete props.prefix;
      if (!props.suffix) delete props.suffix;
      return (
        <View style={{ width: "100%", maxWidth: 360 }}>
          <Component {...props} />
        </View>
      );
    }

    if (selectedComponentName === "Toggle") {
      props.width = Number(props.width) || 48;
      props.height = Number(props.height) || 28;
      props.onValueChange = (v: boolean) => updateProp("value", v);
      return <Component {...props} />;
    }

    if (selectedComponentName === "Select") {
      props.options = [
        { id: "it", label: "Italy", value: "it", icon: "flag-outline" },
        { id: "fr", label: "France", value: "fr", icon: "flag-outline" },
        { id: "de", label: "Germany", value: "de", icon: "flag-outline" },
        { id: "es", label: "Spain", value: "es", icon: "flag-outline" },
      ];
      props.onSelect = (v: any) => updateProp("value", v);
      return (
        <View style={{ width: "100%", maxWidth: 360 }}>
          <Component {...props} />
        </View>
      );
    }

    if (selectedComponentName === "Stepper") {
      props.activeStep = Number(props.activeStep) || 0;
      props.steps = ["Cart", "Shipping", "Payment", "Review"];
      props.onStepPress = (i: number) => updateProp("activeStep", i);
      return (
        <View style={{ width: "100%", maxWidth: 420 }}>
          <Component {...props} />
        </View>
      );
    }

    if (selectedComponentName === "StatusBadge") {
      if (!props.icon) delete props.icon;
      return <Component {...props} />;
    }

    if (selectedComponentName === "Tabs") {
      props.activeTab = Number(props.activeTab) || 0;
      props.tabs = ["Overview", "Specs", "Reviews"];
      props.onChange = (i: number) => updateProp("activeTab", i);
      return (
        <View style={{ width: "100%", maxWidth: 420 }}>
          <Component {...props} />
        </View>
      );
    }

    if (selectedComponentName === "ToggleButtonGroup") {
      props.options = [
        { label: "List", icon: "format-list-bulleted", value: "list" },
        { label: "Grid", icon: "view-grid-outline", value: "grid" },
        { label: "Cards", icon: "card-outline", value: "cards" },
      ];
      props.onValueChange = (v: any) => updateProp("value", v);
      return <Component {...props} />;
    }

    if (selectedComponentName === "CircularProgress") {
      props.size = Number(props.size) || 48;
      props.strokeWidth = Number(props.strokeWidth) || 4;
      props.duration = Number(props.duration) || 1000;
      if (!props.color) delete props.color;
      return <Component {...props} />;
    }

    if (selectedComponentName === "LinearProgress") {
      props.progress = Number(props.progress) || 0;
      props.height = Number(props.height) || 4;
      if (!props.color) delete props.color;
      return (
        <View style={{ width: "100%", maxWidth: 400 }}>
          <Component {...props} />
        </View>
      );
    }

    if (selectedComponentName === "Snackbar") {
      props.duration = Number(props.duration) || 0;
      props.onDismiss = () => updateProp("visible", false);
      props.action = { label: "Undo", onPress: () => {} };
      if (!props.icon) delete props.icon;
      return (
        <View style={{ width: "100%", height: 160 }}>
          <Button mode="tonal" onPress={() => updateProp("visible", true)}>
            Show Snackbar
          </Button>
          <Component {...props} />
        </View>
      );
    }

    if (selectedComponentName === "SpeedDial") {
      props.actions = [
        { id: "1", label: "New Doc", icon: "file-outline", onPress: () => {} },
        { id: "2", label: "Upload", icon: "upload-outline", onPress: () => {} },
        { id: "3", label: "Folder", icon: "folder-outline", onPress: () => {} },
      ];
      return (
        <View style={{ width: "100%", height: 260 }}>
          <Component {...props} />
        </View>
      );
    }

    if (selectedComponentName === "Modal") {
      props.onClose = () => updateProp("visible", false);
      const { children, ...modalProps } = props;
      return (
        <>
          <Button mode="tonal" onPress={() => updateProp("visible", true)}>
            Open Modal
          </Button>
          <Component {...modalProps}>{children}</Component>
        </>
      );
    }

    if (selectedComponentName === "ConfirmDialog") {
      props.onConfirm = () => updateProp("visible", false);
      props.onCancel = () => updateProp("visible", false);
      return (
        <>
          <Button mode="tonal" onPress={() => updateProp("visible", true)}>
            Open Confirm Dialog
          </Button>
          <Component {...props} />
        </>
      );
    }

    if (selectedComponentName === "Popover") {
      props.onDismiss = () => updateProp("visible", false);
      props.anchor = (
        <Button mode="tonal" onPress={() => updateProp("visible", true)}>
          Open Popover
        </Button>
      );
      return (
        <Component {...props}>
          <View style={{ padding: 16, maxWidth: 240 }}>
            <Typography variant="bodyMedium">
              Popover content anchored to the button above.
            </Typography>
          </View>
        </Component>
      );
    }

    if (selectedComponentName === "Divider") {
      props.thickness = Number(props.thickness) || 1;
      props.inset = Number(props.inset) || 0;
      const { children, ...dividerProps } = props;
      return (
        <View style={{ width: "100%", maxWidth: 420 }}>
          <Component {...dividerProps}>{children}</Component>
        </View>
      );
    }

    if (selectedComponentName === "Paper") {
      props.elevation = Number(props.elevation) || 0;
    }

    if (selectedComponentName === "Icon") {
      props.size = Number(props.size) || 24;
      return <Component {...props} />;
    }

    if (selectedComponentName === "TouchableRipple") {
      props.borderRadius = Number(props.borderRadius) || 0;
      return (
        <Component
          {...props}
          onPress={() => {}}
          accessibilityLabel="Superficie premibile"
        >
          <View style={{ padding: 16 }}>
            <Typography variant="bodyMedium">
              Passa il mouse o premi questa superficie
            </Typography>
          </View>
        </Component>
      );
    }

    // The Card parts only read correctly inside the surface they belong to.
    if (selectedComponentName === "CardTitle") {
      return (
        <Card variant="elevated" style={{ width: "100%", maxWidth: 420 }}>
          <Component
            {...props}
            left={<Avatar name="Impianto 4" size={40} />}
            right={
              <IconButton
                icon="dots-vertical"
                accessibilityLabel="Altre azioni"
                onPress={() => {}}
              />
            }
          />
        </Card>
      );
    }

    if (selectedComponentName === "CardContent") {
      const { children, ...rest } = props;
      return (
        <Card variant="elevated" style={{ width: "100%", maxWidth: 420 }}>
          <CardTitle title="Impianto 4" subtitle="Manutenzione programmata" />
          <Component {...rest}>
            <Typography variant="bodyMedium">{children}</Typography>
          </Component>
        </Card>
      );
    }

    if (selectedComponentName === "CardCover") {
      props.ratio = Number(props.ratio) || 16 / 9;
      return (
        <Card variant="elevated" style={{ width: "100%", maxWidth: 420 }}>
          <Component
            {...props}
            source={{ uri: "https://picsum.photos/seed/glowup/800/450" }}
          />
          <CardTitle title="Impianto 4" subtitle="Manutenzione programmata" />
        </Card>
      );
    }

    if (selectedComponentName === "CardActions") {
      return (
        <Card variant="elevated" style={{ width: "100%", maxWidth: 420 }}>
          <CardTitle title="Impianto 4" subtitle="Conferma l'intervento" />
          <Component {...props}>
            <Button mode="text" onPress={() => {}}>
              Rinvia
            </Button>
            <Button onPress={() => {}}>Conferma</Button>
          </Component>
        </Card>
      );
    }

    if (selectedComponentName === "RadioButton") {
      props.onPress = () => updateProp("selected", !props.selected);
      return <Component {...props} />;
    }

    if (selectedComponentName === "ToggleButton") {
      props.onPress = () => updateProp("active", !props.active);
      return <Component {...props} />;
    }

    if (selectedComponentName === "AnimatedFAB") {
      props.onPress = () => {};
      // Floating pins it to the screen corner, so give it room to sit in.
      return (
        <View style={{ width: "100%", height: 160, justifyContent: "center" }}>
          <Component {...props} />
        </View>
      );
    }

    if (selectedComponentName === "AspectRatio") {
      props.ratio = Number(props.ratio) || 1;
      return (
        <View style={{ width: "100%", maxWidth: 420 }}>
          <Component {...props} radius="medium" bg="surfaceContainerHigh">
            <Center style={{ flex: 1 }}>
              <Typography variant="labelLarge">
                {`ratio ${props.ratio.toFixed(2)}`}
              </Typography>
            </Center>
          </Component>
        </View>
      );
    }

    if (selectedComponentName === "Center") {
      return (
        <View style={{ width: "100%", maxWidth: 420, height: 140 }}>
          <Component {...props} style={{ flex: 1 }} bg="surfaceContainerHigh">
            <Typography variant="labelLarge">Centrato su due assi</Typography>
          </Component>
        </View>
      );
    }

    if (selectedComponentName === "Spacer") {
      props.size = Number(props.size) || 0;
      const horizontal = props.axis === "horizontal";
      return (
        <View
          style={{
            width: "100%",
            maxWidth: 420,
            flexDirection: horizontal ? "row" : "column",
            alignItems: horizontal ? "center" : "stretch",
          }}
        >
          <Chip label="Prima" />
          <Component {...props} />
          <Chip label="Dopo" />
        </View>
      );
    }

    if (selectedComponentName === "TabContent") {
      props.activeTab = Number(props.activeTab) || 0;
      return (
        <View style={{ width: "100%", maxWidth: 420 }}>
          <Component {...props}>
            <Typography variant="bodyMedium">Contenuto del tab 0</Typography>
            <Typography variant="bodyMedium">Contenuto del tab 1</Typography>
            <Typography variant="bodyMedium">Contenuto del tab 2</Typography>
          </Component>
        </View>
      );
    }

    if (selectedComponentName === "ListSection") {
      return (
        <View style={{ width: "100%", maxWidth: 420 }}>
          <Component {...props}>
            <ListItem
              trailing={
                <Typography variant="bodySmall">Settimanale</Typography>
              }
            >
              Riepilogo email
            </ListItem>
            <ListItem
              trailing={<Typography variant="bodySmall">Immediato</Typography>}
            >
              Menzioni
            </ListItem>
          </Component>
        </View>
      );
    }

    if (selectedComponentName === "Portal") {
      // The whole point is escaping a clipping parent, so show one.
      return (
        <Portal.Host>
          <View style={{ width: "100%", maxWidth: 420, gap: 12 }}>
            <Typography variant="bodySmall">
              Il riquadro sotto ha overflow: hidden e 64px di altezza. Il
              contenuto nel Portal viene disegnato sopra, fuori dal ritaglio.
            </Typography>
            <View
              style={{
                height: 64,
                overflow: "hidden",
                borderRadius: 12,
                backgroundColor: theme.colors.surfaceContainerHigh,
                padding: 12,
              }}
            >
              <Typography variant="labelLarge">
                Genitore che ritaglia
              </Typography>
              <Portal>
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: 96,
                    left: 24,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: theme.colors.inverseSurface,
                  }}
                >
                  <Typography
                    variant="labelLarge"
                    style={{ color: theme.colors.inverseOnSurface }}
                  >
                    Disegnato all&apos;host
                  </Typography>
                </View>
              </Portal>
            </View>
          </View>
        </Portal.Host>
      );
    }

    if (selectedComponentName === "LanguageSelector") {
      props.currentLang = languageDemo;
      props.onChange = setLanguageDemo;
      return <Component {...props} />;
    }

    if (selectedComponentName === "DrawerPreferenceItem") {
      return (
        <View style={{ width: "100%", maxWidth: 420 }}>
          <Component {...props}>
            <Toggle value={preferenceDemo} onValueChange={setPreferenceDemo} />
          </Component>
        </View>
      );
    }

    if (selectedComponentName === "ClockDial") {
      const current = dateValue ?? new Date();
      props.minuteInterval = Number(props.minuteInterval) || 1;
      props.hours = current.getHours();
      props.minutes = current.getMinutes();
      props.onChangeHours = (hours: number) => {
        const next = new Date(current);
        next.setHours(hours);
        setDateValue(next);
      };
      props.onChangeMinutes = (minutes: number) => {
        const next = new Date(current);
        next.setMinutes(minutes);
        setDateValue(next);
      };
      return <Component {...props} />;
    }

    if (selectedComponentName === "TimeSelect") {
      props.minuteInterval = Number(props.minuteInterval) || 1;
      props.value = dateValue ?? new Date();
      props.onChange = setDateValue;
      return <Component {...props} />;
    }

    if (isContainer) {
      const { children, ...otherProps } = props;
      return (
        <Component {...otherProps}>
          {typeof children === "string" ? (
            <Typography variant="bodyMedium">{children}</Typography>
          ) : (
            children
          )}
        </Component>
      );
    }

    return <Component {...props} onPress={() => console.log("Pressed")} />;
  };

  // --- Derived navigation state ---
  const [navCat, setNavCat] = useState<string>("All");
  const q = query.trim().toLowerCase();
  const matches = (n: string) => n.toLowerCase().includes(q);
  const activeCategory = CATEGORY_OF[selectedComponentName];
  const activeIndex = FLAT_ORDER.indexOf(selectedComponentName) + 1;
  const propKeys = Object.keys(activeMeta.props);
  const navPillItems = FLAT_ORDER.filter(matches).filter(
    (n) => navCat === "All" || CATEGORY_OF[n] === navCat,
  );

  const stageAnimStyle = {
    opacity: enterAnim,
    transform: [
      {
        translateY: enterAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
      {
        scale: enterAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.985, 1],
        }),
      },
    ],
  };

  // --- Small render helpers ---
  const renderNavRow = (name: string) => {
    const active = name === selectedComponentName;
    return (
      <Pressable
        key={name}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={() => handleComponentChange(name)}
        style={({ hovered }: any) => [
          styles.navItem,
          hovered && { backgroundColor: theme.colors.surfaceContainerHigh },
          active && { backgroundColor: theme.colors.secondaryContainer },
        ]}
      >
        <View
          style={[
            styles.navAccent,
            {
              backgroundColor: active ? theme.colors.primary : "transparent",
            },
          ]}
        />
        <Typography
          variant="bodyMedium"
          style={{
            color: active
              ? theme.colors.onSecondaryContainer
              : theme.colors.onSurfaceVariant,
            fontWeight: active ? "700" : "400",
          }}
        >
          {name}
        </Typography>
      </Pressable>
    );
  };

  const renderPill = (name: string) => {
    const active = name === selectedComponentName;
    return (
      <Pressable
        key={name}
        onPress={() => handleComponentChange(name)}
        style={({ hovered }: any) => [
          styles.pill,
          {
            borderColor: active
              ? theme.colors.primary
              : theme.colors.outlineVariant,
            backgroundColor: active
              ? theme.colors.secondaryContainer
              : hovered
                ? theme.colors.surfaceContainerHigh
                : "transparent",
          },
        ]}
      >
        <Typography
          variant="labelLarge"
          style={{
            color: active
              ? theme.colors.onSecondaryContainer
              : theme.colors.onSurface,
          }}
        >
          {name}
        </Typography>
      </Pressable>
    );
  };

  const renderCatChip = (label: string, icon?: string) => {
    const active = navCat === label;
    return (
      <Pressable
        key={label}
        onPress={() => setNavCat(label)}
        style={({ hovered }: any) => [
          styles.catChip,
          {
            backgroundColor: active
              ? theme.colors.primary
              : hovered
                ? theme.colors.surfaceContainerHigh
                : theme.colors.surfaceContainer,
          },
        ]}
      >
        {icon && (
          <Icons
            name={icon as any}
            size={14}
            color={
              active ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
            }
          />
        )}
        <Typography
          variant="labelMedium"
          style={{
            color: active
              ? theme.colors.onPrimary
              : theme.colors.onSurfaceVariant,
            marginLeft: icon ? 6 : 0,
          }}
        >
          {label}
        </Typography>
      </Pressable>
    );
  };

  const eyebrow = (text: string, color: string) => (
    <Typography variant="labelSmall" style={[styles.eyebrow, { color }]}>
      {text}
    </Typography>
  );

  const stage = (
    <View style={styles.stageCol}>
      <View style={styles.stageHeader}>
        {eyebrow(
          `${(activeCategory || "").toUpperCase()} · ${String(activeIndex).padStart(2, "0")} / ${TOTAL_COUNT}`,
          theme.colors.primary,
        )}
        <Typography
          variant="headlineMedium"
          style={{ color: theme.colors.onSurface }}
        >
          {selectedComponentName}
        </Typography>
      </View>
      <View
        style={[
          styles.stage,
          {
            backgroundColor: theme.colors.surfaceContainerLow,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View
          style={[
            styles.corner,
            styles.cornerTL,
            { borderColor: theme.colors.outline },
          ]}
        />
        <View
          style={[
            styles.corner,
            styles.cornerTR,
            { borderColor: theme.colors.outline },
          ]}
        />
        <View
          style={[
            styles.corner,
            styles.cornerBL,
            { borderColor: theme.colors.outline },
          ]}
        />
        <View
          style={[
            styles.corner,
            styles.cornerBR,
            { borderColor: theme.colors.outline },
          ]}
        />
        <Animated.View style={[styles.stageInner, stageAnimStyle]}>
          {renderPreview()}
        </Animated.View>
      </View>
    </View>
  );

  const propsPanel = (
    <>
      <View
        style={[
          styles.propsHeader,
          { borderBottomColor: theme.colors.outlineVariant },
        ]}
      >
        {eyebrow("PROPERTIES", theme.colors.onSurfaceVariant)}
        <Typography
          variant="labelSmall"
          style={{ color: theme.colors.outline }}
        >
          {propKeys.length} {propKeys.length === 1 ? "prop" : "props"}
        </Typography>
      </View>
      {propKeys.length === 0 ? (
        <Typography
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          No configurable props.
        </Typography>
      ) : (
        propKeys.map((key) => renderPropEditor(key, activeMeta.props[key]))
      )}
    </>
  );

  const header = (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <View>
        {eyebrow("MATERIAL YOU", theme.colors.primary)}
        <Typography
          variant="titleLarge"
          style={{ color: theme.colors.onSurface, letterSpacing: 0.5 }}
        >
          Component Gallery
        </Typography>
      </View>
      <View style={styles.headerRight}>
        <View
          style={[
            styles.countChip,
            { borderColor: theme.colors.outlineVariant },
          ]}
        >
          <Typography
            variant="labelMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {TOTAL_COUNT} components
          </Typography>
        </View>
        <Pressable
          onPress={toggleTheme}
          accessibilityRole="button"
          accessibilityLabel="Toggle theme"
          style={({ hovered }: any) => [
            styles.themeBtn,
            { backgroundColor: theme.colors.secondaryContainer },
            hovered && { opacity: 0.85 },
          ]}
        >
          <Icons
            name={theme.isDark ? "weather-sunny" : "weather-night"}
            size={20}
            color={theme.colors.onSecondaryContainer}
          />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      {header}

      {isWide ? (
        <View style={styles.wideBody}>
          {/* Sidebar navigator */}
          <View
            style={[
              styles.sidebar,
              {
                backgroundColor: theme.colors.surface,
                borderRightColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.sidebarHeader}>
              {eyebrow("CATALOG", theme.colors.onSurfaceVariant)}
            </View>
            <View style={styles.searchWrap}>
              <SearchBar
                value={query}
                onChangeText={setQuery}
                placeholder="Filter components…"
              />
            </View>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {CATEGORIES.map((cat) => {
                const items = cat.items.filter(matches);
                if (!items.length) return null;
                return (
                  <View key={cat.label} style={styles.navGroup}>
                    <View style={styles.navGroupHeader}>
                      <Icons
                        name={cat.icon as any}
                        size={14}
                        color={theme.colors.primary}
                      />
                      <Typography
                        variant="labelSmall"
                        style={[
                          styles.navGroupLabel,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        {cat.label.toUpperCase()}
                      </Typography>
                      <Typography
                        variant="labelSmall"
                        style={{ color: theme.colors.outline }}
                      >
                        {items.length}
                      </Typography>
                    </View>
                    {items.map(renderNavRow)}
                  </View>
                );
              })}
              {navPillItems.length === 0 && (
                <Typography
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant, padding: 16 }}
                >
                  No matches for “{query}”.
                </Typography>
              )}
            </ScrollView>
          </View>

          {/* Stage */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.stageScroll}
            showsVerticalScrollIndicator={false}
          >
            {stage}
          </ScrollView>

          {/* Properties */}
          <View
            style={[
              styles.propsColWide,
              { borderLeftColor: theme.colors.outlineVariant },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
            >
              {propsPanel}
            </ScrollView>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.narrowBody}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Filter components…"
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catRow}
          >
            {renderCatChip("All")}
            {CATEGORIES.map((c) => renderCatChip(c.label, c.icon))}
          </ScrollView>
          <View style={styles.pillWrap}>{navPillItems.map(renderPill)}</View>
          {stage}
          <View style={{ marginTop: 8 }}>{propsPanel}</View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  // Header band
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  countChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: 1.6,
    fontWeight: "700",
  },

  // Wide 3-pane body
  wideBody: { flex: 1, flexDirection: "row" },

  // Sidebar
  sidebar: { width: 264, borderRightWidth: 1, paddingTop: 12 },
  sidebarHeader: { paddingHorizontal: 20, paddingBottom: 8 },
  searchWrap: { paddingHorizontal: 12 },
  navGroup: { marginTop: 10, paddingHorizontal: 8 },
  navGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  navGroupLabel: { flex: 1, letterSpacing: 1.2, fontWeight: "700" },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginBottom: 2,
    overflow: "hidden",
  },
  navAccent: { width: 3, height: 16, borderRadius: 2, marginRight: 10 },

  // Stage
  stageScroll: { flexGrow: 1, padding: 28 },
  stageCol: { width: "100%", maxWidth: 760, alignSelf: "center" },
  stageHeader: { marginBottom: 18, gap: 2 },
  stage: {
    borderWidth: 1,
    borderRadius: 20,
    minHeight: 340,
    padding: 36,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  stageInner: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  corner: { position: "absolute", width: 14, height: 14, opacity: 0.5 },
  cornerTL: { top: 12, left: 12, borderTopWidth: 1, borderLeftWidth: 1 },
  cornerTR: { top: 12, right: 12, borderTopWidth: 1, borderRightWidth: 1 },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 1, borderLeftWidth: 1 },
  cornerBR: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },

  // Properties
  propsColWide: {
    width: 328,
    borderLeftWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  propsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  propInput: { marginBottom: 16 },
  propRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  // Narrow (stacked) body
  narrowBody: { padding: 16, paddingBottom: 140, gap: 14 },
  catRow: { gap: 8, paddingVertical: 2, paddingRight: 16 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});

export default Playground;
