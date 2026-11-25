import React from "react";
import { render, screen } from "@testing-library/react";
import { DayTimeline, ThemeProvider } from "..";

// The grid in the browser: events are buttons a mouse can grab, and the foot
// of each one says it resizes.
const at = (h: number, m = 0) => new Date(2026, 10, 2, h, m);

describe("DayTimeline grid on the web", () => {
  it("draws grabbable event buttons with a resize cursor on their foot", () => {
    render(
      <ThemeProvider>
        <DayTimeline
          layout="grid"
          days={[at(0)]}
          events={[{ id: 1, title: "Mario Rossi", start: at(9), end: at(10) }]}
          onEventPress={() => {}}
          onEventChange={() => {}}
          resizable
          labels={{ resize: "Cambia la fine" }}
        />
      </ThemeProvider>,
    );
    const card = screen.getByRole("button", { name: /Mario Rossi/ });
    expect(getComputedStyle(card).cursor).toBe("grab");
    const foot = screen.getByLabelText("Cambia la fine, Mario Rossi");
    expect(getComputedStyle(foot).cursor).toBe("ns-resize");
  });
});
