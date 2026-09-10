import {
  Input,
  Select,
  Checkbox,
  Toggle,
  Spinner,
  NumericInput,
  RadioGroup,
  Slider,
  SearchBar,
  Rating,
  DatePickerInput,
  DateRangePicker,
  DateTimePicker,
  Autocomplete,
  Calendar,
  ClockPicker,
  FormControl,
  PinInput,
  HelperText,
  RadioButton,
  ClockDial,
  DatePicker,
  TimePicker,
  TimeSelect,
} from "@its/glowup-ui";
import type { ComponentMetadata } from "../types";

/** Inputs: 24 catalogue entries. */
export const inputs: Record<string, ComponentMetadata> = {
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
  SearchBar: {
    name: "SearchBar",
    Component: SearchBar,
    props: {
      value: { type: "text", default: "", label: "Value" },
      placeholder: { type: "text", default: "Search", label: "Placeholder" },
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
  DatePicker: {
    name: "DatePicker",
    Component: DatePicker,
    props: {
      label: { type: "text", default: "Data intervento", label: "Label" },
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
};
