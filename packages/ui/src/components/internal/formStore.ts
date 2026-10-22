// The store behind `Form`, `FormField`, `useForm`, `useFormField` and
// `useWatch`: plain TypeScript, outside React state. Components subscribe to
// the slice they read (one field, a few values, the form flags) through
// `useSyncExternalStore`, so a keystroke re-renders only what shows that value.
import {
  isThenable,
  validateRules,
  type FormRule,
  type FormValues,
  type RuleResult,
} from "./formRules";

export type { FormRule, FormValidatorContext, FormValues } from "./formRules";

/** Error messages by field name, as `"items[0].qty"` (dots and brackets both parse; brackets are what is stored). */
export type FormErrors = Record<string, string>;

export type FormValidateOn = "change" | "blur" | "submit";

export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/** What one field is right now. */
export interface FormFieldState {
  value: any;
  /** The first failed rule's message, or `undefined`. */
  error: string | undefined;
  /** The field has been left (blurred) or the form was submitted. */
  touched: boolean;
  /** The value differs from its initial one (`""`, `null` and `undefined` count as the same). */
  dirty: boolean;
  /** An async validator is running. */
  validating: boolean;
}

/** The flags of the whole form. */
export interface FormState {
  isDirty: boolean;
  /** `onSubmit` (or an async validator) is still running. */
  isSubmitting: boolean;
  isValidating: boolean;
  /** How many times the form was submitted since the last `reset`. */
  submitCount: number;
  errors: FormErrors;
}

export interface FormInstance<V extends FormValues = FormValues> {
  /** All values. The same object until a value changes. */
  getValues(): V;
  /** One value by name: `"email"`, `"address.city"`, `"items[0].qty"`. */
  getValue(name: string): any;
  /**
   * Merges `values` over the current ones (nested objects merge, arrays and
   * other values replace). Fields update, `onValuesChange` runs once.
   */
  setValues(values: DeepPartial<V>): void;
  /** Sets one value. Validates it by the same rule as a user edit. */
  setValue(name: string, value: unknown): void;
  /**
   * Back to the initial values (or to `values`, which then become the initial
   * ones), with no errors, nothing touched and the submit count at 0.
   */
  reset(values?: DeepPartial<V>): void;
  /**
   * Runs the rules of the registered fields (all, or those named: a name
   * also covers the fields under it) and resolves to whether every one passed.
   * Errors land on the fields and in `getErrors()`. Waits for async validators.
   */
  validate(names?: string | string[]): Promise<boolean>;
  /**
   * Marks every field touched, validates all of them and, when they pass,
   * calls the `Form`'s `onSubmit(values)`; otherwise `onSubmitFailed(errors,
   * values)`. Resolves to whether it submitted. Ignored (`false`) while a
   * submission is still running.
   */
  submit(): Promise<boolean>;
  isDirty(name?: string): boolean;
  isTouched(name?: string): boolean;
  isSubmitting(): boolean;
  getFieldState(name: string): FormFieldState;
  getError(name: string): string | undefined;
  getErrors(): FormErrors;
  /** Sets (or, with `undefined`, clears) a field's error: a server-side one, say. */
  setError(name: string, message: string | undefined): void;
  /** Calls `listener` after any change, or after a change to `name` (and the names above and under it). */
  subscribe(listener: () => void): () => void;
  subscribe(name: string, listener: () => void): () => void;
}

/** What a mounted field tells the store (read at validation time, so it may change between renders). */
export interface FieldConfig {
  rules?: readonly FormRule[];
  /** Names of other fields: this one is validated again when one changes (once it was touched or edited, or when it has an error). */
  dependencies?: readonly string[];
  /** Overrides the form's `validateOn` for this field. */
  validateOn?: FormValidateOn;
}

/** What `Form` keeps current on the store. */
export interface FormOptions<V extends FormValues = FormValues> {
  validateOn: FormValidateOn;
  onSubmit?: (values: V) => void;
  onSubmitFailed?: (errors: FormErrors, values: V) => void;
  onValuesChange?: (changed: DeepPartial<V>, all: V) => void;
}

/** The instance plus what the components need and a caller of `useForm()` does not. */
export interface FormStore<
  V extends FormValues = FormValues,
> extends FormInstance<V> {
  options: FormOptions<V>;
  getFormState(): FormState;
  /** Silently sets the initial values (before anything subscribed). */
  init(values: DeepPartial<V>): void;
  /** Silently gives a field its initial value, unless it already has one. */
  initField(name: string, value: unknown): void;
  register(name: string, config: FieldConfig): () => void;
  /** The field was left. */
  blur(name: string): void;
}

// ---- names ---------------------------------------------------------------

type Path = readonly (string | number)[];

const paths = new Map<string, Path>();
// ponytail: paths are cached by name and never evicted; names are the app's own,
// so this only grows with data-driven names (a row id per field), a few bytes each.

/** `"items[0].qty"` and `"items.0.qty"` both read as `["items", 0, "qty"]`. */
export const toPath = (name: string): Path => {
  let path = paths.get(name);
  if (!path) {
    path = name
      .split(/[.[\]]+/)
      .filter(Boolean)
      .map((s) => (/^\d+$/.test(s) ? Number(s) : s));
    paths.set(name, path);
  }
  return path;
};

const pathKey = (path: Path) =>
  path.reduce<string>(
    (key, seg) =>
      typeof seg === "number" ? `${key}[${seg}]` : key ? `${key}.${seg}` : seg,
    "",
  );

/** The one spelling a name is stored under: `"items.0.qty"` becomes `"items[0].qty"`. */
export const toKey = (name: string) => pathKey(toPath(name));

export const getIn = (obj: any, path: Path): any =>
  path.reduce((o, k) => (o == null ? undefined : o[k]), obj);

/** Copy of `obj` with `value` at `path`; shares everything else, and is `obj` itself when nothing changes. */
export const setIn = (obj: any, path: Path, value: unknown): any => {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  const isContainer = obj !== null && typeof obj === "object";
  const base = isContainer ? obj : typeof head === "number" ? [] : {};
  const child = setIn(base[head], rest, value);
  if (isContainer && Object.is(child, base[head])) return obj;
  const copy = Array.isArray(base) ? [...base] : { ...base };
  copy[head] = child;
  return copy;
};

const isPlain = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;

const join = (base: string, key: string) => (base ? `${base}.${key}` : key);

/** `{ a: { b: 1 }, c: [2] }` as `[["a.b", 1], ["c", [2]]]`: objects are walked, everything else is a value. */
const leaves = (obj: unknown, base = ""): [string, unknown][] =>
  isPlain(obj)
    ? Object.entries(obj).flatMap(([k, v]) => leaves(v, join(base, k)))
    : [[base, obj]];

const blank = (v: unknown) => v === undefined || v === null || v === "";

/** Deep equality where `""`, `null` and `undefined` are the same: a field typed into and cleared is not dirty. */
export const same = (a: any, b: any): boolean => {
  if (Object.is(a, b) || (blank(a) && blank(b))) return true;
  if (a instanceof Date && b instanceof Date)
    return a.getTime() === b.getTime();
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) if (!same(a[k], b[k])) return false;
  return true;
};

const within = (parent: string, child: string) =>
  child === parent ||
  (child.startsWith(parent) &&
    (child[parent.length] === "." || child[parent.length] === "["));

/** Does a change to `a` concern a reader of `b`? Same name, one inside the other, or either is the whole form (`""`). */
export const related = (a: string, b: string) =>
  a === "" || b === "" || within(a, b) || within(b, a);

// ---- store ---------------------------------------------------------------

interface Run {
  abort: AbortController;
  promise?: Promise<RuleResult>;
}

export function createFormStore<V extends FormValues = FormValues>(
  initialValues?: DeepPartial<V>,
): FormStore<V> {
  let initial: any = initialValues ?? {};
  let values: any = initial;
  let errors: FormErrors = {};
  let submitting = false;
  let submitCount = 0;
  const touched = new Set<string>();
  const validating = new Set<string>();
  const fields = new Map<string, Set<FieldConfig>>();
  const runs = new Map<string, Run>();
  const listeners = new Set<{ key: string; fn: () => void }>();
  const options: FormOptions<V> = { validateOn: "change" };

  // ponytail: a change walks every subscription to find the related ones
  // (a string compare each); an index by name would make it O(depth) if forms
  // ever reach many thousands of mounted fields.
  const notify = (key = "") => {
    for (const l of [...listeners]) if (related(key, l.key)) l.fn();
  };

  const modeOf = (key: string): FormValidateOn =>
    [...(fields.get(key) ?? [])].find((c) => c.validateOn)?.validateOn ??
    options.validateOn;

  // -- snapshots: the same object until something in them changed --
  const fieldCache = new Map<string, FormFieldState>();
  const getFieldState = (name: string): FormFieldState => {
    const key = toKey(name);
    const path = toPath(key);
    const value = getIn(values, path);
    const next: FormFieldState = {
      value,
      error: errors[key],
      touched: touched.has(key),
      dirty: !same(value, getIn(initial, path)),
      validating: validating.has(key),
    };
    const prev = fieldCache.get(key);
    if (
      prev &&
      prev.value === next.value &&
      prev.error === next.error &&
      prev.touched === next.touched &&
      prev.dirty === next.dirty &&
      prev.validating === next.validating
    ) {
      return prev;
    }
    fieldCache.set(key, next);
    return next;
  };

  let dirtyCache: { values: any; initial: any; dirty: boolean } | undefined;
  const formDirty = () => {
    const c = dirtyCache;
    if (c && c.values === values && c.initial === initial) return c.dirty;
    const dirty = !same(values, initial);
    dirtyCache = { values, initial, dirty };
    return dirty;
  };

  let formCache: FormState | undefined;
  const getFormState = (): FormState => {
    const next: FormState = {
      isDirty: formDirty(),
      isSubmitting: submitting,
      isValidating: validating.size > 0,
      submitCount,
      errors,
    };
    const p = formCache;
    if (
      p &&
      p.isDirty === next.isDirty &&
      p.isSubmitting === next.isSubmitting &&
      p.isValidating === next.isValidating &&
      p.submitCount === next.submitCount &&
      p.errors === next.errors
    ) {
      return p;
    }
    return (formCache = next);
  };

  // -- validation --
  /** Stores a message without telling anyone; `true` when it changed. */
  const putError = (key: string, message: RuleResult) => {
    if (errors[key] === message) return false;
    if (message === undefined) {
      const { [key]: _gone, ...rest } = errors;
      errors = rest;
    } else {
      errors = { ...errors, [key]: message };
    }
    return true;
  };

  const check = (key: string, signal: AbortSignal) => {
    const rules = [...(fields.get(key) ?? [])].flatMap((c) => c.rules ?? []);
    return rules.length
      ? validateRules(rules, getIn(values, toPath(key)), values, signal)
      : undefined;
  };

  /**
   * Validates one field now. A newer run of the same field aborts the one
   * before it: that one's result is dropped, and anyone waiting on it gets the
   * newer run's.
   */
  const runField = (key: string): RuleResult | Promise<RuleResult> => {
    runs.get(key)?.abort.abort();
    const run: Run = { abort: new AbortController() };
    runs.set(key, run);
    const out = check(key, run.abort.signal);
    if (!isThenable(out)) {
      runs.delete(key);
      const wasValidating = validating.delete(key);
      if (putError(key, out) || wasValidating) notify(key);
      return out;
    }
    if (!validating.has(key)) {
      validating.add(key);
      notify(key);
    }
    const settle = (message: RuleResult) => {
      if (runs.get(key) !== run) return runs.get(key)?.promise;
      runs.delete(key);
      validating.delete(key);
      putError(key, message);
      notify(key);
      return message;
    };
    run.promise = Promise.resolve(out).then(settle, (error) =>
      settle(error instanceof Error ? error.message : "Invalid value"),
    );
    return run.promise;
  };

  const keysFor = (names?: string | string[]) => {
    const all = [...fields.keys()];
    if (names === undefined) return all;
    const roots = ([] as string[]).concat(names).map(toKey);
    return all.filter((k) => roots.some((r) => within(r, k)));
  };

  /** Whether the fields pass: a boolean when every rule was sync, else a promise of one. */
  const validateKeys = (keys: string[]): boolean | Promise<boolean> => {
    const results = keys.map(runField);
    const done = () => keys.every((k) => !errors[k]);
    return results.some(isThenable) ? Promise.all(results).then(done) : done();
  };

  /** The user has been at this field (or submitted): its state is worth keeping current. */
  const engaged = (key: string) =>
    touched.has(key) ||
    !!errors[key] ||
    submitCount > 0 ||
    getFieldState(key).dirty;

  /** After `key` changed: validate it (by the form's mode), and the fields that depend on it. */
  const revalidate = (key: string) => {
    if (
      fields.has(key) &&
      (modeOf(key) === "change" || errors[key] || submitCount)
    ) {
      runField(key);
    }
    fields.forEach((set, other) => {
      if (other === key || !engaged(other)) return;
      for (const c of set) {
        if (c.dependencies?.some((d) => related(toKey(d), key))) {
          runField(other);
          return;
        }
      }
    });
  };

  // -- writes --
  const setValue = (name: string, value: unknown) => {
    const key = toKey(name);
    const path = toPath(key);
    const next = setIn(values, path, value);
    if (next === values) return;
    values = next;
    notify(key);
    revalidate(key);
    options.onValuesChange?.(setIn({}, path, value), values);
  };

  const setValues = (partial: DeepPartial<V>) => {
    const changed: string[] = [];
    for (const [name, value] of leaves(partial)) {
      const key = toKey(name);
      const next = setIn(values, toPath(key), value);
      if (next !== values) {
        values = next;
        changed.push(key);
      }
    }
    if (!changed.length) return;
    notify();
    changed.forEach(revalidate);
    options.onValuesChange?.(partial, values);
  };

  const reset = (next?: DeepPartial<V>) => {
    runs.forEach((r) => r.abort.abort());
    runs.clear();
    validating.clear();
    errors = {};
    touched.clear();
    submitCount = 0;
    if (next) initial = next;
    values = initial;
    notify();
  };

  const submit = (): Promise<boolean> => {
    if (submitting) return Promise.resolve(false);
    const keys = [...fields.keys()];
    keys.forEach((k) => touched.add(k));
    submitCount++;
    notify();
    let result: boolean | Promise<boolean>;
    try {
      const finish = (ok: boolean): boolean | Promise<boolean> => {
        if (!ok) {
          options.onSubmitFailed?.(errors, values);
          return false;
        }
        const out = options.onSubmit?.(values);
        return isThenable(out) ? Promise.resolve(out).then(() => true) : true;
      };
      const valid = validateKeys(keys);
      result = isThenable(valid) ? valid.then(finish) : finish(valid);
    } catch (error) {
      return Promise.reject(error);
    }
    // Everything was sync: done, and `onSubmit` has already run, so a handler
    // that needs the user's click (a popup, a download) still has it.
    if (!isThenable(result)) return Promise.resolve(result);
    submitting = true;
    notify();
    const end = () => {
      submitting = false;
      notify();
    };
    return Promise.resolve(result).then(
      (ok) => {
        end();
        return ok;
      },
      (error) => {
        end();
        throw error;
      },
    );
  };

  const register = (name: string, config: FieldConfig) => {
    const key = toKey(name);
    let set = fields.get(key);
    if (!set) fields.set(key, (set = new Set()));
    set.add(config);
    notify(key); // catches up whoever read this name before it had its initial value
    return () => {
      set.delete(config);
      if (set.size) return;
      fields.delete(key);
      runs.get(key)?.abort.abort();
      runs.delete(key);
      validating.delete(key);
      touched.delete(key);
      putError(key, undefined);
      notify(key);
    };
  };

  const initField = (name: string, value: unknown) => {
    const path = toPath(name);
    if (getIn(initial, path) !== undefined) return;
    initial = setIn(initial, path, value);
    if (getIn(values, path) === undefined) values = setIn(values, path, value);
  };

  return {
    options,
    getValues: () => values,
    getValue: (name) => getIn(values, toPath(name)),
    setValues,
    setValue,
    reset,
    validate: (names) => {
      const out = validateKeys(keysFor(names));
      return Promise.resolve(out);
    },
    submit,
    isDirty: (name) => (name ? getFieldState(name).dirty : formDirty()),
    isTouched: (name) => (name ? touched.has(toKey(name)) : touched.size > 0),
    isSubmitting: () => submitting,
    getFieldState,
    getFormState,
    getError: (name) => errors[toKey(name)],
    getErrors: () => errors,
    setError: (name, message) => {
      const key = toKey(name);
      if (putError(key, message)) notify(key);
    },
    subscribe: ((a: string | (() => void), b?: () => void) => {
      const entry =
        typeof a === "function"
          ? { key: "", fn: a }
          : { key: toKey(a), fn: b as () => void };
      listeners.add(entry);
      return () => {
        listeners.delete(entry);
      };
    }) as FormStore<V>["subscribe"],
    init: (next) => {
      initial = next;
      values = next;
    },
    initField,
    register,
    blur: (name) => {
      const key = toKey(name);
      if (!touched.has(key)) {
        touched.add(key);
        notify(key);
      }
      if (fields.has(key) && modeOf(key) === "blur") runField(key);
    },
  };
}
