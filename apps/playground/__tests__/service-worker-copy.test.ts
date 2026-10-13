/// <reference types="node" />
import { readFileSync } from "fs";
import { join } from "path";

// The site serves the Web Push service worker from public/, but the file is
// the package's: the copy must match it byte for byte or /notifications would
// demo a worker the package does not ship. After editing the package's worker:
//   cp packages/notifications/service-worker/glowup-push-sw.js apps/playground/public/
it("serves the package's Web Push service worker unchanged", () => {
  const read = (path: string) => readFileSync(join(__dirname, path), "utf8");
  expect(read("../public/glowup-push-sw.js")).toBe(
    read("../../../packages/notifications/service-worker/glowup-push-sw.js"),
  );
});
