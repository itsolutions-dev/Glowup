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
