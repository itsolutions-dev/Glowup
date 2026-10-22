import * as library from "..";

describe("the layout and utility components are public", () => {
  it.each([
    "AbsoluteCenter",
    "Break",
    "Center",
    "Visible",
    "ScrollArea",
    "useBreakpointValue",
  ])("exports %s", (name) => {
    expect(Object.keys(library)).toContain(name);
  });
});
