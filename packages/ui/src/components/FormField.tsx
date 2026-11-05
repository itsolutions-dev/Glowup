import React from "react";
import FormControl from "./FormControl";
import { useFormDisabled, useFormField } from "./Form";
import type { FormRule, FormValidateOn, FormValues } from "./Form";

export interface FormFieldProps<
  V extends string = "value",
  T extends string = "onChange",
  C extends boolean = false,
> {
  /**
   * The field's name in the form's values: `"email"`, `"address.city"`,
   * `"items[0].qty"` (dots and brackets both nest).
   */
  name: string;
  /** What the value must satisfy, checked in order; the first failure is the field's `error`. */
  rules?: FormRule[];
  /**
   * Label, passed to the child as its `label` (`Input`, `Select`... draw it).
   * With `control`, drawn above the child by `FormControl` instead.
   */
  label?: string;
  /** Supporting text, passed to the child as `helperText` (or drawn by `FormControl` with `control`). Hidden while there is an error. */
  helperText?: string;
  /**
   * The child's prop that takes the value. `"checked"` for a `Checkbox`.
   * Defaults to `"value"`.
   */
  valuePropName?: V;
  /**
   * The child's callback that reports a new value. `"onValueChange"` for a
   * `Checkbox` or a `Slider`. Defaults to `"onChange"`.
   */
  trigger?: T;
  /**
   * Turns what the trigger is called with into the value to store. By default
   * the first argument, or, when that is a DOM event, its `target.value`
   * (`target.checked` for `valuePropName="checked"`).
   */
  getValueFromEvent?: (...args: any[]) => unknown;
  /** Turns the reported value into the stored one: `(value, previous, allValues) => stored`. Trim, uppercase, format. */
  normalize?: (value: any, previous: any, values: FormValues) => unknown;
  /**
   * Names of other fields this one's rules read (`"password"` for a
   * "confirm password"): it is validated again when one changes, once it
   * has been touched or edited, or shows an error.
   */
  dependencies?: string[];
  /** The value the field starts with when the form's `initialValues` has none for it. */
  initialValue?: unknown;
  /** Overrides the form's `validateOn` for this field: a `Checkbox` has no blur, so `"change"` suits it. */
  validateOn?: FormValidateOn;
  /** Disables this field (the child's `disabled`); the form's `disabled` does it for all. */
  disabled?: boolean;
  /**
   * For a child that draws no label, helper or error text of its own
   * (`Checkbox`, `Switch`, `Slider`, `RadioGroup`): wraps it in a
   * `FormControl` that does, and passes it `error` as a boolean (and no
   * `required`, `label` or `helperText`: `FormControl` draws those). Defaults
   * to `false`.
   */
  control?: C;
  /**
   * The one control to connect, which receives the value, the trigger,
   * `onBlur`, `error`, `required` and `disabled` as props. Or a function
   * that gets those props and returns the control, for a control whose
   * required props (`Input` needs `value` and `onChange`) you would otherwise
   * have to write out: `{(field) => <Input label="Email" {...field} />}`.
   */
  children:
    | React.ReactElement
    | ((field: FormFieldChildProps<V, T, C>) => React.ReactNode);
}

/**
 * What a `FormField` hands its child: the value under `valuePropName`, the
 * callback under `trigger`, `onBlur` and `disabled`; then `error` as a
 * boolean with `control`, or `error`, `required`, `label` and `helperText`
 * without. The value is `any`: the form does not know each field's type.
 */
export type FormFieldChildProps<
  V extends string = "value",
  T extends string = "onChange",
  C extends boolean = false,
> = { [K in V]: any } & { [K in T]: (...args: any[]) => void } & {
  onBlur: (...args: any[]) => void;
  disabled?: boolean;
} & (C extends true
    ? { error: boolean }
    : {
        error?: string;
        required?: boolean;
        label?: string;
        helperText?: string;
      });

// A DOM event carries the value on its target; anything else is the value.
const valueOf = (arg: any, prop: string) =>
  arg &&
  typeof arg === "object" &&
  arg.target &&
  typeof arg.target === "object" &&
  prop in arg.target
    ? arg.target[prop]
    : arg;

/**
 * Connects the single control inside it to a field of the surrounding `Form`:
 * it hands the control the field's `value`, the callback that reports a new
 * one, `onBlur`, `error`, `required` and `disabled`, and nothing else
 * re-renders when it changes. The control's own props stay, and its own
 * handlers still run.
 *
 * ```tsx
 * <FormField name="email" label="Email" rules={[{ required: true }, { type: "email" }]}>
 *   {(field) => <Input {...field} />}
 * </FormField>
 * <FormField name="terms" label="Terms" control valuePropName="checked" trigger="onValueChange"
 *   rules={[{ required: true, message: "Accept to continue" }]}>
 *   {(field) => <Checkbox {...field} label="I accept" />}
 * </FormField>
 * ```
 *
 * A plain element child (`<Input label="Email" />`) works the same at
 * runtime, but TypeScript asks for the `value` and `onChange` the control
 * requires; the function child does not.
 */
const FormField = <
  V extends string = "value",
  T extends string = "onChange",
  C extends boolean = false,
>({
  name,
  rules,
  label,
  helperText,
  valuePropName = "value" as V,
  trigger = "onChange" as T,
  getValueFromEvent,
  normalize,
  dependencies,
  initialValue,
  validateOn,
  disabled = false,
  control = false as C,
  children,
}: FormFieldProps<V, T, C>) => {
  const field = useFormField(name, {
    rules,
    dependencies,
    normalize,
    initialValue,
    validateOn,
  });
  const formDisabled = useFormDisabled();

  const child =
    typeof children === "function" ? undefined : React.Children.only(children);
  const own = (child?.props ?? {}) as Record<string, any>;
  const required = !!rules?.some((r) => r.required);
  const off = disabled || formDisabled;
  const fromArgs =
    getValueFromEvent ?? ((...args: any[]) => valueOf(args[0], valuePropName));

  const injected: Record<string, unknown> = {
    [valuePropName]: field.value,
    [trigger]: (...args: unknown[]) => {
      field.setValue(fromArgs(...args));
      own[trigger]?.(...args);
    },
    onBlur: (...args: unknown[]) => {
      field.onBlur();
      own.onBlur?.(...args);
    },
  };
  if (off) injected.disabled = true;
  if (control) {
    injected.error = !!field.error;
  } else {
    if (required) injected.required = true;
    if (field.error) injected.error = field.error;
    if (label !== undefined) injected.label = label;
    if (helperText !== undefined) injected.helperText = helperText;
  }
  const element = child
    ? React.cloneElement(child, injected)
    : (children as (field: any) => React.ReactNode)(injected);

  return control ? (
    <FormControl
      label={label}
      helperText={helperText}
      error={field.error}
      required={required}
      disabled={off}
    >
      {element}
    </FormControl>
  ) : (
    element
  );
};

export default FormField;
