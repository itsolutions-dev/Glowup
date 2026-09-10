// bob's typescript target passes `--declarationMap` unconditionally (see
// react-native-builder-bob/lib/src/targets/typescript.js), so tsc always writes
// a .d.ts.map next to every .d.ts plus a `//# sourceMappingURL=` comment inside
// it. The maps are deliberately not published (the "!**/*.map" entry in the
// package's "files"), which would leave every shipped .d.ts pointing at a file
// consumers never receive. This removes both, so lib/ matches the tarball.
import { readdir, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("../lib/typescript/", import.meta.url).pathname;
const MAP_COMMENT = /\n?\/\/# sourceMappingURL=.*\.d\.ts\.map\s*$/;

let stripped = 0;
let removed = 0;

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
    } else if (entry.name.endsWith(".d.ts.map")) {
      await rm(path);
      removed++;
    } else if (entry.name.endsWith(".d.ts")) {
      const source = await readFile(path, "utf8");
      const next = source.replace(MAP_COMMENT, "\n");
      if (next !== source) {
        await writeFile(path, next);
        stripped++;
      }
    }
  }
}

await walk(ROOT);
console.log(
  `declaration maps: removed ${removed} file(s), stripped ${stripped} comment(s)`,
);
