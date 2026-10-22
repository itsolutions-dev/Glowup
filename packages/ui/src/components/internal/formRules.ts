// Rule checking for `FormField`: pure, no React. A rule is checked in the order
// required, type, min, max, minLength, maxLength, pattern, validator, and the
// first failure wins. `validator` may be async: then the result is a promise.

export type FormValues = Record<string, any>;

/** Passed to a `validator`: aborted when a newer validation of the field starts. */
export interface FormValidatorContext {
  signal: AbortSignal;
}

export interface FormRule {
  /** The value must not be empty: `""`, whitespace, `null`, `undefined`, `false` and `[]` are. */
  required?: boolean;
  /** Smallest number (the value is read as a number, so `"12"` is 12). */
  min?: number;
  /** Largest number. */
  max?: number;
  /** Fewest characters (or array items). */
  minLength?: number;
  /** Most characters (or array items). */
  maxLength?: number;
  /** The text must match. */
  pattern?: RegExp;
  /** Built-in format: an email address, an http(s) URL, or a number. */
  type?: "email" | "url" | "number";
  /**
   * Custom check, sync or async. Return the error message to fail; anything
   * else passes, so `value !== other && "Must match"` reads as it should. A
   * thrown error or a rejected promise fails with its message. `signal` is aborted when the
   * field is validated again before this run settles: pass it to `fetch` to
   * cancel the request. Runs on empty values too (the other checks skip them
   * unless `required`).
   */
  validator?: (
    value: any,
    values: FormValues,
    context: FormValidatorContext,
  ) =>
    | string
    | boolean
    | void
    | undefined
    | Promise<string | boolean | void | undefined>;
  /** Replaces the default message of this rule's built-in checks (not what a `validator` returns). */
  message?: string;
}

export type RuleResult = string | undefined;

export const isThenable = (v: unknown): v is PromiseLike<any> =>
  !!v && typeof (v as PromiseLike<unknown>).then === "function";

/** What `required` treats as "no answer". */
export const isEmpty = (v: unknown) =>
  v === undefined ||
  v === null ||
  v === false ||
  (typeof v === "string" && v.trim() === "") ||
  (Array.isArray(v) && v.length === 0);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/[^\s/$.?#][^\s]*$/i;

const lengthOf = (v: unknown) =>
  Array.isArray(v) ? v.length : String(v).length;

const builtin = (rule: FormRule, value: unknown): RuleResult => {
  const m = (text: string) => rule.message ?? text;
  if (rule.required && isEmpty(value)) return m("This field is required");
  // The other checks are about the shape of an answer: nothing to check yet.
  if (isEmpty(value)) return undefined;

  const text = String(value);
  const n = Number(value);
  const numeric = text.trim() !== "" && Number.isFinite(n);
  if (rule.type === "email" && !EMAIL.test(text))
    return m("Enter a valid email address");
  if (rule.type === "url" && !URL_RE.test(text)) return m("Enter a valid URL");
  if (rule.type === "number" && !numeric) return m("Enter a number");
  if (rule.min !== undefined || rule.max !== undefined) {
    if (!numeric) return m("Enter a number");
    if (rule.min !== undefined && n < rule.min)
      return m(`Must be at least ${rule.min}`);
    if (rule.max !== undefined && n > rule.max)
      return m(`Must be at most ${rule.max}`);
  }
  const unit = Array.isArray(value) ? "items" : "characters";
  if (rule.minLength !== undefined && lengthOf(value) < rule.minLength)
    return m(`Must be at least ${rule.minLength} ${unit}`);
  if (rule.maxLength !== undefined && lengthOf(value) > rule.maxLength)
    return m(`Must be at most ${rule.maxLength} ${unit}`);
  if (rule.pattern) {
    rule.pattern.lastIndex = 0; // a /g or /y pattern is stateful
    if (!rule.pattern.test(text)) return m("Invalid format");
  }
  return undefined;
};

// Only a message fails, so `value !== other && "Differ"` reads as it should.
const verdict = (out: unknown): RuleResult =>
  typeof out === "string" && out !== "" ? out : undefined;

const failure = (error: unknown, rule: FormRule): RuleResult =>
  (error instanceof Error && error.message) ||
  (typeof error === "string" && error) ||
  rule.message ||
  "Invalid value";

/**
 * Checks `value` against `rules`, in order, stopping at the first failure.
 * Returns the message (or `undefined`) synchronously, unless a `validator`
 * returned a promise: then a promise of it. A form with no async validator is
 * therefore validated synchronously.
 */
export const validateRules = (
  rules: readonly FormRule[],
  value: unknown,
  values: FormValues,
  signal: AbortSignal,
): RuleResult | Promise<RuleResult> => {
  const run = (from: number): RuleResult | Promise<RuleResult> => {
    for (let i = from; i < rules.length; i++) {
      const rule = rules[i];
      const message = builtin(rule, value);
      if (message) return message;
      if (!rule.validator) continue;
      let out: ReturnType<NonNullable<FormRule["validator"]>>;
      try {
        out = rule.validator(value, values, { signal });
      } catch (error) {
        return failure(error, rule);
      }
      if (isThenable(out)) {
        const next = i + 1;
        return Promise.resolve(out).then(
          (v) => verdict(v) ?? run(next),
          (error) => failure(error, rule),
        );
      }
      const failed = verdict(out);
      if (failed) return failed;
    }
    return undefined;
  };
  return run(0);
};
