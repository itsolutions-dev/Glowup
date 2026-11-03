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

// The CRM's status chips also say "to do" and "closed": an information and a neutral state.
it.each([
  ["info", "infoContainer", "onInfoContainer"],
  ["neutral", "neutralContainer", "onNeutralContainer"],
] as const)(
  "an %s badge takes the theme's %s colours",
  async (type, container, on) => {
    const view = await render(
      <ThemeProvider>
        <StatusBadge label="Da fare" type={type} />
      </ThemeProvider>,
    );
    const badge = view.getByLabelText("Da fare");
    const theme = require("../providers/theme.json");
    const light = theme.colors.light;
    expect(JSON.stringify(badge.props.style)).toContain(light[container]);
    expect(JSON.stringify(view.toJSON())).toContain(light[on]);
  },
);
