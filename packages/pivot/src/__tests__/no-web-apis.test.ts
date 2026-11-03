import fs from "fs";
import path from "path";

const sources = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sources(file);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [file]
      : [];
  });

describe("the copied engine uses no web API", () => {
  test.each(["exceljs", "document.", "navigator"])(
    "no source under src/core mentions %s",
    (word) => {
      const hits = sources(path.join(__dirname, "..", "core")).filter((file) =>
        fs.readFileSync(file, "utf8").includes(word),
      );
      expect(hits).toEqual([]);
    },
  );
});

describe("no call that builds an Intl object each time", () => {
  // On Hermes for Android each one costs milliseconds (10 ms for a localeCompare with a locale), so a
  // sort or a loop of them took seconds: use the cached formatters and collator of core/format/intlCache.
  test.each([".localeCompare(", ".toLocaleString("])(
    "no source of the package calls %s",
    (call) => {
      const hits = sources(path.join(__dirname, "..")).filter((file) =>
        fs.readFileSync(file, "utf8").includes(call),
      );
      expect(hits).toEqual([]);
    },
  );
});
