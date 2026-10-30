import React from "react";
import { render } from "@testing-library/react-native";
import { StatusBadge, ThemeProvider } from "..";

// The badge was read as "error: Non pagato": an English word from the
// colour, in front of the app's own (often not English) label.
it.each([
  ["error", undefined],
  ["success", "#1D5B9D"],
] as const)("a %s badge is read as its label alone", async (type, tone) => {
  const view = await render(
    <ThemeProvider>
      <StatusBadge label="Non pagato" type={type} toneFrom={tone} />
    </ThemeProvider>,
  );
  expect(view.getByLabelText("Non pagato")).toBeTruthy();
});
