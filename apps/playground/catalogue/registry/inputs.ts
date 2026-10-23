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
  PasswordField,
  Editable,
  Upload,
} from "@its/glowup-ui";
import type { ComponentMetadata } from "../types";

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

/**
 * The field of every picker, whatever it is locked to. The library keeps the
 * defaults of the picker's props in a hook, not in the component's
 * destructuring, so the prop table shows none: these start empty or off.
 * `value`, `onChange` and `selectionMode` (the shape of the value) are the
 * example's state, not controls.
 */
const PICKER_FIELD = {
  label: {
    type: "text" as const,
    default: "",
    label: "Label",
    appliesWhen: HAS_FIELD,
  },
  placeholder: {
    type: "text" as const,
    default: "",
    label: "Placeholder",
    appliesWhen: HAS_FIELD,
  },
  helperText: {
    type: "text" as const,
    default: "",
    label: "Helper Text",
    // Every field in the kit hides its helper text while an error shows.
    appliesWhen: (values: Record<string, any>) =>
      !values.error && HAS_FIELD(values),
  },
  error: {
    type: "text" as const,
    default: "",
    label: "Error Message",
    appliesWhen: HAS_FIELD,
  },
  required: {
    type: "boolean" as const,
    default: false,
    label: "Required",
    appliesWhen: HAS_FIELD,
  },
  clearable: {
    type: "boolean" as const,
    default: false,
    label: "Clearable",
    appliesWhen: HAS_FIELD,
  },
};

/**
 * Whether the popup draws OK. Off, a time finishes after its minute and a range
 * after its second end (a set of days and typed entry keep theirs). The
 * component reads its default from the picker's own wrapper, so it is `true`.
 */
const SHOW_OK_BUTTON = {
  type: "boolean" as const,
  default: true,
  label: "Show OK button",
  appliesWhen: HAS_FIELD,
};

const LOCALE = {
  type: "select" as const,
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
};

const SCROLL_MODE = {
  type: "select" as const,
  default: "endless",
  label: "Month scrolling",
  options: [
    { label: "Endless", value: "endless" },
    { label: "Paged", value: "paged" },
  ],
};

const MINUTE_INTERVAL = {
  type: "select" as const,
  default: 1,
  label: "Minute interval",
  options: [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30].map((minutes) => ({
    label: String(minutes),
    value: minutes,
  })),
};

const USE_24_HOUR_CLOCK = {
  type: "boolean" as const,
  default: false,
  label: "Force 24h clock",
};

/** Which surface the dialog opens on. A static picker has no dialog. */
const DEFAULT_INPUT_TYPE = {
  type: "select" as const,
  default: "picker",
  label: "Opens on",
  options: [
    { label: "Calendar / clock", value: "picker" },
    { label: "Typed entry", value: "keyboard" },
  ],
  appliesWhen: HAS_FIELD,
};

/**
 * The controls of `Input`'s props. `PasswordField` is an Input with a few
 * props taken away and a few added, so it offers the same controls for the ones
 * it keeps.
 */
const INPUT_PROPS: ComponentMetadata["props"] = {
  label: { type: "text", default: "", label: "Label" },
  placeholder: { type: "text", default: "", label: "Placeholder" },
  helperText: {
    type: "text",
    default: "",
    label: "Helper Text",
    // Every field in the kit hides its helper text while an error shows.
    appliesWhen: (values) => !values.error,
  },
  error: { type: "text", default: "", label: "Error Message" },
  leadingIcon: { type: "icon", default: "", label: "Leading icon" },
  trailingIcon: { type: "icon", default: "", label: "Trailing icon" },
  prefix: { type: "text", default: "", label: "Prefix" },
  suffix: { type: "text", default: "", label: "Suffix" },
  type: {
    type: "select",
    default: "text",
    label: "Type",
    options: [
      { label: "Text", value: "text" },
      { label: "Number", value: "number" },
    ],
  },
  decimalSeparator: {
    type: "select",
    default: ".",
    label: "Decimal separator",
    options: [
      { label: "Point (12.50)", value: "." },
      { label: "Comma (12,50)", value: "," },
    ],
    // Only a number field has a decimal mark.
    appliesWhen: (values) => values.type === "number",
  },
  precision: {
    type: "number",
    // Unset, like the component's own default: any number of decimals.
    default: undefined,
    label: "Precision (decimals)",
    appliesWhen: (values) => values.type === "number",
  },
  maxLength: {
    type: "number",
    default: undefined,
    label: "Max length",
  },
  variant: FIELD_VARIANT,
  labelPlacement: LABEL_PLACEMENT,
  density: {
    type: "select",
    default: "normal",
    label: "Density",
    options: [
      { label: "Normal", value: "normal" },
      { label: "Dense", value: "dense" },
    ],
  },
  fullWidth: { type: "boolean", default: true, label: "Full width" },
  multiline: { type: "boolean", default: false, label: "Multiline" },
  rows: {
    type: "number",
    default: 4,
    label: "Rows",
    // Only a multiline field has lines to count.
    appliesWhen: (values) => !!values.multiline,
  },
  required: { type: "boolean", default: false, label: "Required" },
  disabled: { type: "boolean", default: false, label: "Disabled" },
  readonly: { type: "boolean", default: false, label: "Read only" },
  secureTextEntry: {
    type: "boolean",
    default: false,
    label: "Secure text entry",
  },
  allUpperCase: { type: "boolean", default: false, label: "Upper case" },
  reserveHelperText: {
    type: "boolean",
    default: false,
    label: "Reserve helper line",
  },
};

/** The controls of `source` named by `keys`. */
const pick = (source: ComponentMetadata["props"], keys: string[]) =>
  Object.fromEntries(keys.map((key) => [key, source[key]]));

/** Inputs: 22 catalogue entries. */
export const inputs: Record<string, ComponentMetadata> = {
  Input: {
    name: "Input",
    Component: Input,
    props: {
      ...INPUT_PROPS,
    },
  },
  PasswordField: {
    name: "PasswordField",
    Component: PasswordField,
    props: {
      ...pick(INPUT_PROPS, [
        "label",
        "placeholder",
        "helperText",
        "error",
        "leadingIcon",
        "prefix",
        "suffix",
        "maxLength",
        "variant",
        "labelPlacement",
        "density",
        "fullWidth",
        "required",
        "disabled",
        "readonly",
        "reserveHelperText",
      ]),
      showToggle: { type: "boolean", default: true, label: "Show toggle" },
      showStrength: {
        type: "boolean",
        default: false,
        label: "Strength meter",
      },
      autoComplete: {
        type: "select",
        default: "current-password",
        label: "Autofill",
        options: [
          { label: "Current password", value: "current-password" },
          { label: "New password", value: "new-password" },
        ],
      },
    },
  },
  Select: {
    name: "Select",
    Component: Select,
    props: {
      label: { type: "text", default: "", label: "Label" },
      placeholder: {
        type: "text",
        default: "Select an option",
        label: "Placeholder",
      },
      variant: FIELD_VARIANT,
      labelPlacement: LABEL_PLACEMENT,
      density: {
        type: "select",
        default: "normal",
        label: "Density",
        options: [
          { label: "Normal", value: "normal" },
          { label: "Dense", value: "dense" },
        ],
      },
      fullWidth: { type: "boolean", default: true, label: "Full width" },
      multiple: { type: "boolean", default: false, label: "Multiple" },
      showAsChips: {
        type: "boolean",
        default: false,
        label: "Show as chips",
        // The chips are the selection of a multiple select.
        appliesWhen: (values) => !!values.multiple,
      },
      nullable: {
        type: "boolean",
        default: false,
        label: "Nullable",
        // A multiple select can already uncheck every option.
        appliesWhen: (values) => !values.multiple,
      },
      error: { type: "text", default: "", label: "Error Message" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Checkbox: {
    name: "Checkbox",
    Component: Checkbox,
    props: {
      label: { type: "text", default: "", label: "Label" },
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
    props: {
      label: { type: "text", default: "", label: "Label" },
      direction: {
        type: "select",
        default: "column",
        label: "Direction",
        options: [
          { label: "Column", value: "column" },
          { label: "Row", value: "row" },
        ],
      },
      helperText: {
        type: "text",
        default: "",
        label: "Helper Text",
        // Every field in the kit hides its helper text while an error shows.
        appliesWhen: (values) => !values.error,
      },
      error: { type: "text", default: "", label: "Error Message" },
      required: { type: "boolean", default: false, label: "Required" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  RadioButton: {
    name: "RadioButton",
    Component: RadioButton,
    props: {
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
      label: { type: "text", default: "", label: "Label" },
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
      label: { type: "text", default: "", label: "Label" },
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
      min: { type: "number", default: 0, label: "Min" },
      max: { type: "number", default: 100, label: "Max" },
      step: {
        type: "number",
        // Unset, like the component's own default: a continuous track.
        default: undefined,
        label: "Step (empty = continuous)",
      },
      label: { type: "text", default: "", label: "Label" },
      showValueLabel: {
        type: "boolean",
        default: false,
        label: "Show Value",
      },
      marks: {
        type: "boolean",
        default: false,
        label: "Marks",
        // A tick per step, so there is nothing to draw on a continuous track.
        appliesWhen: (values) => Number(values.step) > 0,
      },
      interaction: {
        type: "select",
        default: "both",
        label: "Interaction",
        options: [
          { label: "Both", value: "both" },
          { label: "Drag", value: "drag" },
          { label: "Click", value: "click" },
        ],
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  NumberField: {
    name: "NumberField",
    Component: NumberField,
    props: {
      label: { type: "text", default: "", label: "Label" },
      min: { type: "number", default: 0, label: "Min" },
      max: { type: "number", default: 100, label: "Max" },
      step: { type: "number", default: 1, label: "Step" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  SearchBar: {
    name: "SearchBar",
    Component: SearchBar,
    props: {
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
      label: { type: "text", default: "", label: "Label" },
      placeholder: { type: "text", default: "", label: "Placeholder" },
      variant: FIELD_VARIANT,
      labelPlacement: LABEL_PLACEMENT,
      fullWidth: { type: "boolean", default: true, label: "Full width" },
      multiple: { type: "boolean", default: false, label: "Multiple" },
      leadingIcon: { type: "icon", default: "", label: "Leading icon" },
      minChars: { type: "number", default: 1, label: "Min Chars" },
      loading: { type: "boolean", default: false, label: "Loading" },
      allowCustomValue: {
        type: "boolean",
        default: true,
        label: "Allow custom value",
      },
      clearable: { type: "boolean", default: true, label: "Clearable" },
      emptyMessage: { type: "text", default: "", label: "Empty Message" },
      helperText: {
        type: "text",
        default: "",
        label: "Helper Text",
        // Every field in the kit hides its helper text while an error shows.
        appliesWhen: (values) => !values.error,
      },
      error: { type: "text", default: "", label: "Error Message" },
      required: { type: "boolean", default: false, label: "Required" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  PinInput: {
    name: "PinInput",
    Component: PinInput,
    props: {
      label: { type: "text", default: "", label: "Label" },
      length: { type: "number", default: 6, label: "Length" },
      cellSize: { type: "number", default: 48, label: "Cell size" },
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
        default: "",
        label: "Helper Text",
        // Every field in the kit hides its helper text while an error shows.
        appliesWhen: (values) => !values.error,
      },
      error: { type: "text", default: "", label: "Error Message" },
      required: { type: "boolean", default: false, label: "Required" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Editable: {
    name: "Editable",
    Component: Editable,
    props: {
      type: {
        type: "select",
        default: "text",
        label: "Type",
        options: [
          { label: "Text", value: "text" },
          { label: "Textarea", value: "textarea" },
          { label: "Number", value: "number" },
          { label: "Select", value: "select" },
        ],
      },
      placeholder: { type: "text", default: "Edit", label: "Placeholder" },
      submitMode: {
        type: "select",
        default: "both",
        label: "Submit mode",
        options: [
          { label: "Enter or blur", value: "both" },
          { label: "Blur", value: "blur" },
          { label: "Enter", value: "enter" },
          { label: "Buttons only", value: "none" },
        ],
      },
      showControls: { type: "boolean", default: false, label: "Show buttons" },
      fullWidth: { type: "boolean", default: false, label: "Full width" },
      selectAllOnFocus: {
        type: "boolean",
        default: false,
        label: "Select all on focus",
        // A dropdown has no text to select.
        appliesWhen: (values) => values.type !== "select",
      },
      precision: {
        type: "number",
        // Unset, like the component's own default: any number of decimals.
        default: undefined,
        label: "Precision (decimals)",
        appliesWhen: (values) => values.type === "number",
      },
      variant: FIELD_VARIANT,
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
      readOnly: { type: "boolean", default: false, label: "Read only" },
    },
  },
  FormControl: {
    name: "FormControl",
    Component: FormControl,
    props: {
      label: { type: "text", default: "", label: "Label" },
      helperText: {
        type: "text",
        default: "",
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
      ...PICKER_FIELD,
      locale: LOCALE,
      scrollMode: { ...SCROLL_MODE, appliesWhen: HAS_CALENDAR },
      minuteInterval: { ...MINUTE_INTERVAL, appliesWhen: HAS_CLOCK },
      use24HourClock: { ...USE_24_HOUR_CLOCK, appliesWhen: HAS_CLOCK },
      defaultInputType: DEFAULT_INPUT_TYPE,
      showOkButton: SHOW_OK_BUTTON,
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
      ...PICKER_FIELD,
      locale: LOCALE,
      scrollMode: SCROLL_MODE,
      defaultInputType: DEFAULT_INPUT_TYPE,
      showOkButton: SHOW_OK_BUTTON,
      disabled: { type: "boolean", default: false, label: "Disabled" },
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
      ...PICKER_FIELD,
      locale: LOCALE,
      minuteInterval: MINUTE_INTERVAL,
      use24HourClock: USE_24_HOUR_CLOCK,
      defaultInputType: DEFAULT_INPUT_TYPE,
      showOkButton: SHOW_OK_BUTTON,
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Rating: {
    name: "Rating",
    Component: Rating,
    props: {
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
  Upload: {
    name: "Upload",
    Component: Upload,
    props: {
      label: { type: "text", default: "", label: "Label" },
      prompt: { type: "text", default: "", label: "Prompt" },
      accept: {
        type: "text",
        default: "",
        label: "Accept (image/*,.pdf)",
      },
      multiple: { type: "boolean", default: false, label: "Multiple" },
      // Unset: no size limit.
      maxSize: {
        type: "number",
        default: undefined,
        label: "Max Size (bytes)",
      },
      // Only a list that takes several files has a limit to reach.
      maxFiles: {
        type: "number",
        default: undefined,
        label: "Max Files (with Multiple)",
      },
      variant: {
        type: "select",
        default: "dropzone",
        label: "Variant",
        options: [
          { label: "Dropzone", value: "dropzone" },
          { label: "Button", value: "button" },
        ],
      },
      helperText: { type: "text", default: "", label: "Helper Text" },
      error: { type: "text", default: "", label: "Error" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  HelperText: {
    name: "HelperText",
    Component: HelperText,
    props: {
      children: { type: "text", default: "", label: "Text" },
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
