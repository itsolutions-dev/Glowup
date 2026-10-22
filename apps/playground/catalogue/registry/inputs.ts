import {
  Input,
  Select,
  Checkbox,
  CheckboxGroup,
  Switch,
  NumberField,
  RadioGroup,
  Slider,
  SearchBar,
  Rating,
  DateTimePicker,
  Autocomplete,
  FormControl,
  PinInput,
  HelperText,
  RadioButton,
  DatePicker,
  TimePicker,
} from "@its/glowup-ui";
import type { ComponentMetadata } from "../types";
import { CheckboxGroupDemo, RatingDemo } from "../demos";

/**
 * Which surface a DateTimePicker's `mode` puts up. A prop the other surface
 * owns is not merely ignored — the picker never renders the control that reads
 * it — so the panel should not offer it either.
 */
const HAS_CALENDAR = (values: Record<string, any>) => values.mode !== "time";
const HAS_CLOCK = (values: Record<string, any>) => values.mode !== "date";
const FIELD_VARIANT = {
  type: "select" as const,
  default: "outlined",
  label: "Variant",
  options: [
    { label: "Outlined", value: "outlined" },
    { label: "Filled", value: "filled" },
  ],
};

/** Where the label goes has nothing to do with the variant, which is the look of the box. */
const LABEL_PLACEMENT = {
  type: "select" as const,
  default: "outside",
  label: "Label placement",
  options: [
    { label: "Outside", value: "outside" },
    { label: "Inside", value: "inside" },
  ],
};

/** Web only: how the default variant opens. Static pickers open nothing. */
const PRESENTATION = {
  type: "select" as const,
  default: "auto",
  label: "Presentation (web)",
  options: [
    { label: "Auto (dialog on touch / narrow)", value: "auto" },
    { label: "Popover", value: "popover" },
    { label: "Dialog", value: "dialog" },
  ],
  appliesWhen: (values: Record<string, any>) => values.variant !== "static",
};

/** A static picker is just the surface: no field, so none of the field's props. */
const HAS_FIELD = (values: Record<string, any>) => values.variant !== "static";

/** The look of a picker's field, as `variant` on `Input`: `variant` on a picker is default or static. */
const FIELD_VARIANT_PICKER = {
  ...FIELD_VARIANT,
  label: "Field variant",
  appliesWhen: HAS_FIELD,
};

const VARIANT = {
  type: "select" as const,
  default: "default",
  label: "Variant",
  options: [
    { label: "Default (field and dialog)", value: "default" },
    { label: "Static (inline)", value: "static" },
  ],
};

/** Inputs: 22 catalogue entries. */
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
      variant: FIELD_VARIANT,
      labelPlacement: LABEL_PLACEMENT,
      fullWidth: { type: "boolean", default: true, label: "Full width" },
      multiline: { type: "boolean", default: false, label: "Multiline" },
      rows: {
        type: "number",
        default: 4,
        label: "Rows",
        // Only a multiline field has lines to count.
        appliesWhen: (values) => !!values.multiline,
      },
      error: { type: "text", default: "", label: "Error Message" },
      helperText: {
        type: "text",
        default: "",
        label: "Helper Text",
        // Every field in the kit hides its helper text while an error shows.
        appliesWhen: (values) => !values.error,
      },
      required: { type: "boolean", default: false, label: "Required" },
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
      labelPlacement: LABEL_PLACEMENT,
      fullWidth: { type: "boolean", default: true, label: "Full width" },
      nullable: { type: "boolean", default: false, label: "Nullable" },
      empty: { type: "boolean", default: false, label: "Empty options" },
      emptyMessage: {
        type: "text",
        default: "No options",
        label: "Empty message",
        // Shown in place of the list, so only an empty list uses it.
        appliesWhen: (values) => !!values.empty,
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
  CheckboxGroup: {
    name: "CheckboxGroup",
    Component: CheckboxGroup,
    Demo: CheckboxGroupDemo,
    props: {
      label: { type: "text", default: "Notify me about", label: "Label" },
      direction: {
        type: "select",
        default: "column",
        label: "Direction",
        options: [
          { label: "Column", value: "column" },
          { label: "Row", value: "row" },
        ],
      },
      required: { type: "boolean", default: false, label: "Required" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
      error: { type: "text", default: "", label: "Error Message" },
    },
  },
  RadioButton: {
    name: "RadioButton",
    Component: RadioButton,
    props: {
      selected: { type: "boolean", default: true, label: "Selected" },
      label: { type: "text", default: "Single option", label: "Label" },
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
  Switch: {
    name: "Switch",
    Component: Switch,
    props: {
      value: { type: "boolean", default: true, label: "Value" },
      label: { type: "text", default: "Email notifications", label: "Label" },
      labelPlacement: {
        type: "select",
        default: "end",
        label: "Label placement",
        options: [
          { label: "End", value: "end" },
          { label: "Start", value: "start" },
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
        ],
        // Without a label there is nothing to place.
        appliesWhen: (values) => !!values.label,
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
      // Not 0: a continuous slider is the duller half of this component and
      // it left both this control and Marks doing nothing until you found the
      // connection between them. 10 divides the default 0-100 range evenly and
      // the default value of 40 sits on a step.
      step: { type: "number", default: 10, label: "Step (0 = off)" },
      label: { type: "text", default: "Volume", label: "Label" },
      showValueLabel: {
        type: "boolean",
        default: true,
        label: "Show Value",
      },
      marks: {
        type: "boolean",
        default: false,
        label: "Marks",
        // A tick per step, so there is nothing to draw on a continuous track.
        appliesWhen: (values) => Number(values.step) > 0,
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  NumberField: {
    name: "NumberField",
    Component: NumberField,
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
      icon: { type: "icon", default: "magnify", label: "Icon" },
      debounceTime: { type: "number", default: 0, label: "Debounce (ms)" },
      showLoading: { type: "boolean", default: false, label: "Show loading" },
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
      variant: FIELD_VARIANT,
      labelPlacement: LABEL_PLACEMENT,
      fullWidth: { type: "boolean", default: true, label: "Full width" },
      multiple: { type: "boolean", default: false, label: "Multiple" },
      defaultOptions: {
        type: "boolean",
        default: false,
        label: "Default options",
      },
      minChars: { type: "number", default: 1, label: "Min Chars" },
      loading: { type: "boolean", default: false, label: "Loading" },
      emptyMessage: {
        type: "text",
        default: "No match",
        label: "Empty Message",
      },
      helperText: {
        type: "text",
        default: "",
        label: "Helper Text",
        // Every field in the kit hides its helper text while an error shows.
        appliesWhen: (values) => !values.error,
      },
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
      variant: {
        type: "select",
        default: "outlined",
        label: "Variant",
        options: [
          { label: "Outlined", value: "outlined" },
          { label: "Filled", value: "filled" },
        ],
      },
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
        // Every field in the kit hides its helper text while an error shows.
        appliesWhen: (values) => !values.error,
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
        // Every field in the kit hides its helper text while an error shows.
        appliesWhen: (values) => !values.error,
      },
      error: { type: "text", default: "", label: "Error Message" },
      required: { type: "boolean", default: false, label: "Required" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  DateTimePicker: {
    name: "DateTimePicker",
    Component: DateTimePicker,
    clientOnly: true,
    props: {
      variant: VARIANT,
      presentation: PRESENTATION,
      fieldVariant: FIELD_VARIANT_PICKER,
      label: {
        type: "text",
        default: "Pick a date",
        label: "Label",
        appliesWhen: HAS_FIELD,
      },
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
        // A time picker always collects one instant; the library forces
        // "single" behind your back rather than honouring this.
        appliesWhen: (values) => values.mode !== "time",
      },
      scrollMode: {
        type: "select",
        default: "endless",
        label: "Month scrolling",
        options: [
          { label: "Endless", value: "endless" },
          { label: "Paged", value: "paged" },
        ],
        appliesWhen: HAS_CALENDAR,
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
        appliesWhen: HAS_CLOCK,
      },
      placeholder: {
        type: "text",
        default: "No date selected",
        label: "Placeholder",
        appliesWhen: HAS_FIELD,
      },
      helperText: {
        type: "text",
        default: "",
        label: "Helper Text",
        // Every field in the kit hides its helper text while an error shows.
        appliesWhen: (values) => !values.error && HAS_FIELD(values),
      },
      error: {
        type: "text",
        default: "",
        label: "Error Message",
        appliesWhen: HAS_FIELD,
      },
      required: {
        type: "boolean",
        default: false,
        label: "Required",
        appliesWhen: HAS_FIELD,
      },
      clearable: {
        type: "boolean",
        default: true,
        label: "Clearable",
        appliesWhen: HAS_FIELD,
      },
      inputEnabled: {
        type: "boolean",
        default: true,
        label: "Typed entry",
        // The keyboard surface is only offered for one plain date.
        appliesWhen: (values) =>
          HAS_FIELD(values) &&
          values.mode === "date" &&
          values.selectionMode === "single",
      },
      use24HourClock: {
        type: "boolean",
        default: false,
        label: "Force 24h clock",
        appliesWhen: HAS_CLOCK,
      },
      limitToThisMonth: {
        type: "boolean",
        default: false,
        label: "Min/max = this month",
        appliesWhen: HAS_CALENDAR,
      },
      noWeekends: {
        type: "boolean",
        default: false,
        label: "Disable weekends",
        appliesWhen: HAS_CALENDAR,
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  DatePicker: {
    name: "DatePicker",
    Component: DatePicker,
    clientOnly: true,
    props: {
      variant: VARIANT,
      presentation: PRESENTATION,
      fieldVariant: FIELD_VARIANT_PICKER,
      label: {
        type: "text",
        default: "Service date",
        label: "Label",
        appliesWhen: HAS_FIELD,
      },
    },
  },
  TimePicker: {
    name: "TimePicker",
    Component: TimePicker,
    clientOnly: true,
    props: {
      variant: VARIANT,
      presentation: PRESENTATION,
      fieldVariant: FIELD_VARIANT_PICKER,
      label: {
        type: "text",
        default: "Service time",
        label: "Label",
        appliesWhen: HAS_FIELD,
      },
    },
  },
  Rating: {
    name: "Rating",
    Component: Rating,
    Demo: RatingDemo,
    props: {
      value: { type: "number", default: 3.5, label: "Value" },
      max: { type: "number", default: 5, label: "Max" },
      size: { type: "number", default: 24, label: "Size" },
      interval: {
        type: "select",
        default: 1,
        label: "Interval",
        options: [
          { label: "1", value: 1 },
          { label: "0.5", value: 0.5 },
        ],
      },
      icon: {
        type: "icon",
        default: "star",
        label: "Icon",
        // The empty icons are the `-outline` glyph of the same name.
        withOutline: true,
      },
      required: { type: "boolean", default: false, label: "Required" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  HelperText: {
    name: "HelperText",
    Component: HelperText,
    props: {
      children: {
        type: "text",
        default: "Maximum 8 characters",
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
