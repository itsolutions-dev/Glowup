import React from "react";
import { Platform } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { ThemeProvider, WeekStrip } from "..";

// Tuesday 3 November 2026.
const TUESDAY = new Date(2026, 10, 3);

const draw = (props: Partial<React.ComponentProps<typeof WeekStrip>> = {}) =>
  render(
    <ThemeProvider>
      <WeekStrip
        value={TUESDAY}
        onChange={() => {}}
        locale="it-IT"
        {...props}
      />
    </ThemeProvider>,
  );

// A mouse cannot swipe: on a computer the strip shows arrows to move a week.
describe("WeekStrip arrows", () => {
  afterEach(() => jest.restoreAllMocks());

  it("moves a week from the arrows, keeping the weekday", async () => {
    const onChange = jest.fn();
    const view = await draw({ arrows: true, onChange });
    await fireEvent.press(view.getByRole("button", { name: "Next week" }));
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 10, 10));
    await fireEvent.press(view.getByRole("button", { name: "Previous week" }));
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 9, 27));
  });

  it("names the arrows in the app's language", async () => {
    const view = await draw({
      arrows: true,
      labels: { nextWeek: "Settimana dopo", previousWeek: "Settimana prima" },
    });
    expect(view.getByRole("button", { name: "Settimana dopo" })).toBeTruthy();
    expect(view.getByRole("button", { name: "Settimana prima" })).toBeTruthy();
  });

  it("shows them by default on the web only", async () => {
    const phone = await draw();
    expect(phone.queryByRole("button", { name: "Next week" })).toBeNull();
    jest.replaceProperty(Platform, "OS", "web");
    const web = await draw();
    expect(web.getByRole("button", { name: "Next week" })).toBeTruthy();
    const off = await draw({ arrows: false });
    expect(off.queryByRole("button", { name: "Next week" })).toBeNull();
  });
});
