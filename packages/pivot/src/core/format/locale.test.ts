import { formatNumberWithFormat } from "./CellFormatter";
import { formatDateValue } from "./DateFormatter";

const withNavigatorLanguage = (language: string, run: () => void) => {
  const original = Object.getOwnPropertyDescriptor(
    globalThis.navigator,
    "language",
  );
  Object.defineProperty(globalThis.navigator, "language", {
    value: language,
    configurable: true,
  });
  try {
    run();
  } finally {
    if (original)
      Object.defineProperty(globalThis.navigator, "language", original);
    else delete (globalThis.navigator as { language?: string }).language;
  }
};

describe("the locale is passed in, never read from the runtime", () => {
  test("system separators follow the locale argument", () => {
    expect(formatNumberWithFormat(1234.56, {}, "it-IT")).toBe("1.234,56");
    expect(formatNumberWithFormat(1234.56, {}, "en-US")).toBe("1,234.56");
  });

  test("a missing locale means en-US", () => {
    expect(formatNumberWithFormat(1234.56, {})).toBe("1,234.56");
  });

  test("navigator.language is ignored by numbers and by dates", () => {
    const day = new Date(2024, 0, 15);
    withNavigatorLanguage("it-IT", () => {
      expect(formatNumberWithFormat(1234.56, {})).toBe("1,234.56");
      expect(formatDateValue(day, "locale-date")).toBe(
        new Intl.DateTimeFormat("en-US").format(day),
      );
    });
  });

  test("the system currency follows the locale argument", () => {
    expect(
      formatNumberWithFormat(1234.5, { currencySymbol: "System" }, "it-IT"),
    ).toBe("€ 1.234,5");
    expect(
      formatNumberWithFormat(1234.5, { currencySymbol: "System" }, "en-GB"),
    ).toBe("£ 1,234.5");
  });

  test("separators do not need Intl.NumberFormat.formatToParts (missing on iOS)", () => {
    const proto = Intl.NumberFormat.prototype as { formatToParts?: unknown };
    const original = proto.formatToParts;
    proto.formatToParts = undefined;
    try {
      // A fresh module: the separators of a locale are cached once resolved.
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fresh = require("./CellFormatter") as {
          formatNumberWithFormat: typeof formatNumberWithFormat;
        };
        expect(fresh.formatNumberWithFormat(1234.56, {}, "it-IT")).toBe(
          "1.234,56",
        );
      });
    } finally {
      proto.formatToParts = original;
    }
  });

  test("an invalid locale does not throw", () => {
    expect(formatNumberWithFormat(1234.56, {}, "xx_YY")).toBe("1,234.56");
  });
});
