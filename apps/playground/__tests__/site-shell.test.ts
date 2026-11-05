import { wideNav } from "../site/SiteShell";

describe("the site's navigation", () => {
  it("shows the rail on the layout editor", () => {
    expect(wideNav("/templates/editor", true)).toBe(false);
    expect(wideNav("/components/Button", true)).toBe(true);
    expect(wideNav("/", false)).toBe(false);
  });
});
