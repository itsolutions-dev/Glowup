import React from "react";
import { render } from "@testing-library/react-native";
import { Select, ThemeProvider } from "..";

// Select drew its error as a bare red Text: no alert glyph, and not a live
// region, so TalkBack never announced it, unlike every other field's error.
it("a Select's error is announced, like the other fields'", async () => {
  const view = await render(
    <ThemeProvider>
      <Select
        label="Fascia oraria"
        options={[{ label: "09:00-09:30", value: "09:00" }]}
        error="Scegli una fascia oraria"
      />
    </ThemeProvider>,
  );
  let node = view.getByText("Scegli una fascia oraria").parent;
  while (node && node.props.accessibilityLiveRegion === undefined) {
    node = node.parent;
  }
  expect(node?.props.accessibilityLiveRegion).toBe("polite");
});
