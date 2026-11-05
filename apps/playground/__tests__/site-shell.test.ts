import { editorArrangement } from "../site/breakpoints";
import { wideNav } from "../site/SiteShell";

describe("the site's navigation", () => {
  it("shows the rail on the layout editor", () => {
    expect(wideNav("/templates/editor", true)).toBe(false);
    expect(wideNav("/components/Button", true)).toBe(true);
    expect(wideNav("/", false)).toBe(false);
  });
});

describe("the layout editor's arrangement", () => {
  it("is three columns, sheets or the phone's, by the window's width", () => {
    expect(editorArrangement(1440)).toBe("columns");
    expect(editorArrangement(1400)).toBe("columns");
    expect(editorArrangement(1399)).toBe("sheets");
    expect(editorArrangement(600)).toBe("sheets");
    expect(editorArrangement(599)).toBe("compact");
  });
});
