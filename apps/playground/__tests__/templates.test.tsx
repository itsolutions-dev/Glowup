import React, { type ReactNode } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@its/glowup-ui";

import { TEMPLATES } from "../templates";

const Providers = ({ children }: { children: ReactNode }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 1280, height: 900 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }}
  >
    <ThemeProvider>{children}</ThemeProvider>
  </SafeAreaProvider>
);

describe("templates", () => {
  it.each(TEMPLATES.map((t) => [t.title, t] as const))(
    "%s renders",
    async (_, template) => {
      const { toJSON } = await render(
        <Providers>
          <template.Component />
        </Providers>,
      );
      expect(toJSON()).toBeTruthy();
    },
  );

  // The page shows `source` as the code that builds the screen above it; it
  // must be the file as it is now, not as it was at the last regeneration.
  it.each(TEMPLATES.map((t) => [t.file, t] as const))(
    "%s embeds its current source (npm run templates -w @its/glowup-playground)",
    (file, template) => {
      const onDisk = readFileSync(
        join(__dirname, "../templates", file),
        "utf8",
      ).replace(/\r\n/g, "\n");
      expect(template.source).toBe(onDisk);
    },
  );

  it("has unique slugs", () => {
    const slugs = TEMPLATES.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
