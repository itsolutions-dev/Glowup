export type ValueFormat = {
  /** BCP 47 tag. Explicit on purpose: the phone's language is not read behind the app's back. Default "en-US". */
  locale?: string;
  options?: Intl.NumberFormatOptions;
};

const cache = new Map<string, Intl.NumberFormat>();

const formatterFor = (locale: string, options?: Intl.NumberFormatOptions) => {
  const key = locale + JSON.stringify(options ?? {});
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, options);
    cache.set(key, f);
  }
  return f;
};

/** A number to text with `Intl`. A missing or non-finite value is an en dash, never "NaN". */
export const makeValueFormatter =
  ({ locale = "en-US", options }: ValueFormat = {}) =>
  (value: number | null | undefined): string =>
    typeof value === "number" && Number.isFinite(value)
      ? formatterFor(locale, options).format(value)
      : "–";
