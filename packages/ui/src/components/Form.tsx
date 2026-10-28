import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Platform, View, type StyleProp, type ViewStyle } from "react-native";
import {
  createFormStore,
  toKey,
  type DeepPartial,
  type FieldConfig,
  type FormErrors,
  type FormFieldState,
  type FormInstance,
  type FormState,
  type FormStore,
  type FormValidateOn,
  type FormValues,
} from "./internal/formStore";

export type {
  DeepPartial,
  FormErrors,
  FormFieldState,
  FormInstance,
  FormState,
  FormValidateOn,
  FormValues,
} from "./internal/formStore";
export type { FormRule, FormValidatorContext } from "./internal/formRules";

export interface FormProps {
  /**
   * Called with the values when the form is submitted and every field passes
   * its rules: a `Button type="submit"` inside it is pressed, or (on the web)
   * Enter is pressed in one of its fields. It may be async: the form's
   * `isSubmitting` (and a submit `Button`'s `loading`) stay true until it
   * settles, and a second submission is ignored meanwhile. A form of
   * parent-held state, with no `FormField`, calls it too (with `{}`).
   */
  onSubmit?: (values: FormValues) => void;
  /** Called instead of `onSubmit` when a field fails its rules, with the messages by field name and the values. */
  onSubmitFailed?: (errors: FormErrors, values: FormValues) => void;
  /**
   * Values the fields start from, as `{ email: "", address: { city: "" } }`.
   * Read when the form mounts; `form.reset(values)` starts over with new ones.
   * Give every field one (or its own `initialValue`): a field with none has
   * the value `undefined`.
   */
  initialValues?: FormValues;
  /**
   * Called after a field's value changes (a user edit, `setValue`,
   * `setValues`; not `reset`) with just what changed, nested like the values
   * (`{ address: { city: "Rome" } }`), and with all of them.
   */
  onValuesChange?: (changed: FormValues, all: FormValues) => void;
  /**
   * When a field is validated: `"change"` after every edit, `"blur"` when it
   * is left, `"submit"` only on submit. After a submit, or once a field shows
   * an error, an edit validates it again whatever the mode, so a fixed field
   * clears at once. A `FormField` can override it. Defaults to `"change"`.
   */
  validateOn?: FormValidateOn;
  /** Disables every `FormField` and the form's submit buttons. */
  disabled?: boolean;
  /**
   * The instance from `useForm()`, to read and drive the form from outside it
   * (`form.setValue`, `form.reset()`, `useWatch("name", form)`). Without it
   * the form keeps its own, reachable from inside through the hooks.
   */
  form?: FormInstance;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface FormContextValue {
  submit: () => void;
  store: FormStore;
  disabled: boolean;
  /** Each `Button type="submit"` inside, and whether it is disabled. */
  submitButtons: Map<object, boolean>;
}

const FormContext = createContext<FormContextValue | null>(null);

/**
 * Internal: the `submit` of the `Form` around the caller, `undefined` outside
 * one. `Button` reads it for `type="submit"`.
 */
export const useFormSubmit = () => useContext(FormContext)?.submit;

/** Internal: the `disabled` of the `Form` around the caller. `Button` reads it for `type="submit"`. */
export const useFormDisabled = () => useContext(FormContext)?.disabled ?? false;

/**
 * Internal: a `Button type="submit"` tells its `Form` whether it is disabled,
 * so Enter on the web (which goes through the hidden native button) does not
 * submit while every submit button is disabled.
 */
export const useRegisterSubmitButton = (active: boolean, disabled: boolean) => {
  const buttons = useContext(FormContext)?.submitButtons;
  const [key] = useState(() => ({}));
  useEffect(() => {
    if (!active || !buttons) return;
    buttons.set(key, disabled);
    return () => {
      buttons.delete(key);
    };
  }, [active, buttons, key, disabled]);
};

/**
 * Re-renders when `read(store)` returns something else, and only then: the
 * store notifies by name and every subscriber compares its own snapshot.
 */
const useSlice = <T,>(
  store: FormStore | undefined,
  key: string,
  read: (store: FormStore) => T,
  fallback: T,
): T => {
  const subscribe = useCallback(
    (onChange: () => void) =>
      store ? store.subscribe(key, onChange) : () => {},
    [store, key],
  );
  const snapshot = () => (store ? read(store) : fallback);
  return useSyncExternalStore(subscribe, snapshot, snapshot);
};

/** Internal: whether the `Form` around the caller is submitting. `Button type="submit"` shows `loading` meanwhile. */
export const useFormSubmitting = () =>
  useSlice(useContext(FormContext)?.store, "", (s) => s.isSubmitting(), false);

const useStore = (form?: FormInstance): FormStore => {
  const inherited = useContext(FormContext)?.store;
  const store = (form ?? inherited) as FormStore | undefined;
  if (!store) {
    throw new Error(
      "Form hooks and FormField need a <Form> around them, or the `form` from useForm().",
    );
  }
  return store;
};

/**
 * Creates a form instance that lives as long as the component. It never
 * re-renders it: read values with `useWatch`, state with `useFormState`.
 * Pass it to `<Form form={form}>` to drive the form from outside.
 *
 * ```tsx
 * const form = useForm({ email: "" });
 * <Form form={form} onSubmit={save}>...</Form>
 * <Button onClick={() => form.reset()}>Reset</Button>
 * ```
 */
export const useForm = <V extends FormValues = FormValues>(
  initialValues?: DeepPartial<V>,
): FormInstance<V> => useState(() => createFormStore<V>(initialValues))[0];

/**
 * Subscribes to values. A name gives that value (`"address.city"`), a list of
 * names gives an array of values, none gives all of them. The component
 * re-renders only when what it watches changes. Outside a `Form`, pass
 * `form`.
 */
export function useWatch<T = any>(name: string, form?: FormInstance): T;
export function useWatch(names: readonly string[], form?: FormInstance): any[];
export function useWatch<V extends FormValues = FormValues>(
  name?: undefined,
  form?: FormInstance<V>,
): V;
export function useWatch(
  name?: string | readonly string[],
  form?: FormInstance,
): unknown {
  const store = useStore(form);
  const keys = (name === undefined ? [""] : ([] as string[]).concat(name)).map(
    toKey,
  );
  const dependency = keys.join("\0");
  const subscribe = useCallback(
    (onChange: () => void) => {
      const stops = dependency
        .split("\0")
        .map((key) => store.subscribe(key, onChange));
      return () => stops.forEach((stop) => stop());
    },
    [store, dependency],
  );
  const last = useRef<unknown[]>(undefined);
  const snapshot = () => {
    if (!Array.isArray(name)) return store.getValue(keys[0]);
    const next = keys.map((k) => store.getValue(k));
    // The same array while no watched value changed, or it re-renders forever.
    return last.current && last.current.every((v, i) => v === next[i])
      ? last.current
      : (last.current = next);
  };
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/**
 * The form's flags: `isDirty`, `isSubmitting`, `isValidating`, `submitCount`
 * and all `errors`. For a reset button, a summary, a custom submit button.
 */
export const useFormState = (form?: FormInstance): FormState => {
  const store = useStore(form);
  return useSlice(store, "", (s) => s.getFormState(), store.getFormState());
};

export interface UseFormFieldOptions extends FieldConfig {
  /** Outside a `Form`: the instance from `useForm()`. */
  form?: FormInstance;
  /** The value the field starts with when `initialValues` has none for it. */
  initialValue?: unknown;
  /** Turns what the control reports into what is stored: `(value, previous, allValues) => stored`. */
  normalize?: (value: any, previous: any, values: FormValues) => unknown;
}

export interface FormFieldApi extends FormFieldState {
  /** Stores a value (after `normalize`) and validates by the form's mode. */
  setValue: (value: unknown) => void;
  /** Call when the control loses focus: marks it touched, validates in `"blur"` mode. */
  onBlur: () => void;
  /** Sets or clears the error: a server-side one, say. */
  setError: (message: string | undefined) => void;
  /** Validates this field now; resolves to whether it passed. */
  validate: () => Promise<boolean>;
}

/**
 * One field of the form: its `value`, `error`, `touched`, `dirty` and
 * `validating`, with the functions to drive it, re-rendering only when one of
 * them changes. The hook behind `FormField`, for a control `FormField` cannot
 * wrap. Pass `options` (`rules`, `dependencies`, `initialValue`...) to
 * register the field: only registered fields are validated and submitted
 * through; without them it just reads.
 */
export const useFormField = (
  name: string,
  options?: UseFormFieldOptions,
): FormFieldApi => {
  const store = useStore(options?.form);
  const key = toKey(name);

  // Before the first read, so the first render already shows it.
  useState(() => {
    if (options?.initialValue !== undefined) {
      store.initField(key, options.initialValue);
    }
  });

  const state = useSlice(store, key, (s) => s.getFieldState(key), {
    value: undefined,
    error: undefined,
    touched: false,
    dirty: false,
    validating: false,
  });

  // Rules, dependencies and `normalize` change between renders (an inline
  // array is a new one each time): the store reads this one object.
  const config = useRef<FieldConfig>({});
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
    config.current.rules = options?.rules;
    config.current.dependencies = options?.dependencies;
    config.current.validateOn = options?.validateOn;
  });
  const registered = options !== undefined;
  useEffect(
    () => (registered ? store.register(key, config.current) : undefined),
    [store, key, registered],
  );

  const setValue = useCallback(
    (value: unknown) => {
      const normalize = latest.current?.normalize;
      store.setValue(
        key,
        normalize
          ? normalize(value, store.getValue(key), store.getValues())
          : value,
      );
    },
    [store, key],
  );
  const onBlur = useCallback(() => store.blur(key), [store, key]);
  const setError = useCallback(
    (message: string | undefined) => store.setError(key, message),
    [store, key],
  );
  const validate = useCallback(() => store.validate(key), [store, key]);

  return { ...state, setValue, onBlur, setError, validate };
};

// Visually hidden but still a rendered, focus-free submit button: it is what
// makes a browser submit a form with several fields when Enter is pressed in
// one of them (implicit submission needs a submit button to click).
const HIDDEN_SUBMIT = {
  type: "submit",
  tabIndex: -1,
  "aria-hidden": true,
  style: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    border: 0,
    opacity: 0,
    overflow: "hidden",
    pointerEvents: "none",
  },
} as const;

/**
 * Groups fields and a submit button so that one action submits them, and
 * keeps their values, errors and flags in a store outside React state: typing
 * in one `FormField` re-renders that field alone, not the form or its
 * siblings. On the web it is a real `<form>`: Enter in a field submits, and a
 * `Button type="submit"` inside it submits too. On iOS and Android it is a
 * plain `View` and the submit button calls `onSubmit` directly. Either way
 * `onSubmit` runs once per submission, and the page is never navigated.
 *
 * With no `FormField` it is the plain wrapper it always was, for fields whose
 * state the parent holds:
 *
 * ```tsx
 * <Form onSubmit={save}>
 *   <Input label="Name" value={name} onChange={setName} />
 *   <Button type="submit">Save</Button>
 * </Form>
 * ```
 *
 * With `FormField` the form holds the state and validates it:
 *
 * ```tsx
 * <Form initialValues={{ email: "" }} onSubmit={(values) => save(values)}>
 *   <FormField name="email" rules={[{ required: true }, { type: "email" }]}>
 *     {(field) => <Input label="Email" {...field} />}
 *   </FormField>
 *   <Button type="submit">Save</Button>
 * </Form>
 * ```
 */
const Form = ({
  onSubmit,
  onSubmitFailed,
  onValuesChange,
  initialValues,
  validateOn = "change",
  disabled = false,
  form,
  children,
  style,
  testID,
}: FormProps) => {
  const ref = useRef<View>(null);
  const [submitButtons] = useState(() => new Map<object, boolean>());
  const disabledRef = useRef(disabled);
  useEffect(() => {
    disabledRef.current = disabled;
  });
  const own = useForm(initialValues);
  const store = (form ?? own) as FormStore;

  // An instance from useForm() already has its values; the form's own
  // `initialValues` still win when both are given.
  useState(() => {
    if (form && initialValues) store.init(initialValues);
  });

  // Read through the store so an inline handler neither re-subscribes the DOM
  // listener nor changes the context's value on every render.
  useEffect(() => {
    Object.assign(store.options, {
      onSubmit,
      onSubmitFailed,
      onValuesChange,
      validateOn,
    });
  });

  const submit = useCallback(() => {
    const node = ref.current as unknown as Partial<HTMLFormElement> | null;
    if (Platform.OS === "web" && typeof node?.requestSubmit === "function") {
      // Through the form's own `submit` event (below), so a press and Enter
      // share one path and run the handler exactly once.
      node.requestSubmit();
    } else {
      void store.submit();
    }
  }, [store]);

  useEffect(() => {
    const node = ref.current as unknown as HTMLFormElement | null;
    if (Platform.OS !== "web" || typeof node?.addEventListener !== "function") {
      return;
    }
    const onDomSubmit = (event: Event) => {
      event.preventDefault();
      const buttons = [...submitButtons.values()];
      if (disabledRef.current) return;
      if (buttons.length > 0 && buttons.every((off) => off)) return;
      void store.submit();
    };
    node.addEventListener("submit", onDomSubmit);
    return () => node.removeEventListener("submit", onDomSubmit);
  }, [store, submitButtons]);

  const context = useMemo(
    () => ({ submit, store, disabled, submitButtons }),
    [submit, store, disabled, submitButtons],
  );

  return (
    <FormContext.Provider value={context}>
      <View
        ref={ref}
        testID={testID}
        style={style}
        {...(Platform.OS === "web" && { role: "form" })}
      >
        {children}
        {Platform.OS === "web" && React.createElement("button", HIDDEN_SUBMIT)}
      </View>
    </FormContext.Provider>
  );
};

export default Form;
