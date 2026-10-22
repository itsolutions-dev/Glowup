import { getStateColor } from "../providers/ThemeProvider";

describe("getStateColor", () => {
  it("draws the state layer over a transparent base at its own opacity", () => {
    // A standard IconButton has no background: its hover used to come back as
    // the icon colour at full strength, a solid disc hiding the glyph.
    expect(getStateColor("transparent", "#49454f", "hover")).toBe(
      "rgba(73,69,79,0.08)",
    );
    expect(getStateColor("transparent", "#49454f", "press")).toBe(
      "rgba(73,69,79,0.12)",
    );
  });

  it("still mixes the state colour into an opaque base", () => {
    expect(getStateColor("#fef7ff", "#49454f", "hover")).toBe("#efe8f0");
  });
});
