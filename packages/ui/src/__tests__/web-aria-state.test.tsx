import React from "react";
import { Platform } from "react-native";
import { render } from "@testing-library/react-native";
import { Breadcrumbs, Checkbox, IconButton, Rating, ThemeProvider } from "..";
import { a11yState } from "../components/internal/a11yState";

// react-native-web reads aria-* props, never the accessibilityState and
// accessibilityValue objects: a web screen reader heard no checked, selected,
// expanded or value state. Which aria attribute depends on the role. (Under
// jest, react-native's own Pressable folds aria-checked, -selected, -expanded
// and -disabled back into accessibilityState, so the components are checked
// for those in a real browser; the helper's mapping is checked here.)
describe("a11yState on the web", () => {
  beforeEach(() => jest.replaceProperty(Platform, "OS", "web"));

  it.each([
    ["checkbox", { checked: true }, { "aria-checked": true }],
    ["checkbox", { checked: "mixed" }, { "aria-checked": "mixed" }],
    ["switch", { checked: false }, { "aria-checked": false }],
    ["radio", { selected: true }, { "aria-checked": true }],
    ["menuitemradio", { selected: false }, { "aria-checked": false }],
    ["tab", { selected: true }, { "aria-selected": true }],
    ["option", { selected: false }, { "aria-selected": false }],
    ["row", { selected: true }, { "aria-selected": true }],
    ["button", { selected: true }, { "aria-pressed": true }],
    ["button", { checked: false }, { "aria-pressed": false }],
    ["link", { selected: true }, { "aria-current": "page" }],
    ["link", { selected: false }, {}],
    ["menuitem", { selected: true }, {}],
    ["button", { disabled: true }, { "aria-disabled": true }],
    ["combobox", { expanded: false }, { "aria-expanded": false }],
    ["button", { busy: true }, { "aria-busy": true }],
  ] as const)("%s %j", (role, state, aria) => {
    const out = a11yState(role, state as never);
    const set = Object.fromEntries(
      Object.entries(out).filter(([k]) => k.startsWith("aria-")),
    );
    expect(set).toEqual(aria);
    expect(out.accessibilityState).toBe(state);
  });

  it("puts a value on a range only", () => {
    const value = { min: 0, max: 5, now: 3, text: "3 stars" };
    expect(a11yState("adjustable", undefined, value)).toMatchObject({
      "aria-valuemin": 0,
      "aria-valuemax": 5,
      "aria-valuenow": 3,
      "aria-valuetext": "3 stars",
    });
    // A badge count on a button is not a value the web knows.
    expect(
      a11yState("button", undefined, { text: "3" })["aria-valuetext"],
    ).toBeUndefined();
  });

  it("reaches the element where react-native passes aria through", async () => {
    const view = await render(
      <ThemeProvider>
        <IconButton
          icon="star"
          accessibilityLabel="Favourite"
          selected
          onClick={() => {}}
        />
        <Rating value={3} max={5} />
      </ThemeProvider>,
    );
    expect(view.getByLabelText("Favourite").props["aria-pressed"]).toBe(true);
    expect(view.getByLabelText("Rating: 3 of 5").props["aria-valuenow"]).toBe(
      3,
    );
  });
});

describe("Breadcrumbs on the web", () => {
  it("is a navigation landmark whose last item is the current page", async () => {
    jest.replaceProperty(Platform, "OS", "web");
    const view = await render(
      <ThemeProvider>
        <Breadcrumbs
          items={[
            { id: "1", label: "Home", onPress: () => {} },
            { id: "2", label: "Contacts", onPress: () => {} },
          ]}
        />
      </ThemeProvider>,
    );
    expect(view.getByLabelText("Breadcrumbs").props.role).toBe("navigation");
    // Not pressable, so not a link, but still where the user is.
    expect(view.getByLabelText("Contacts").props["aria-current"]).toBe("page");
    expect(view.getByLabelText("Home").props["aria-current"]).toBeUndefined();
  });
});

describe("a11yState on iOS and Android", () => {
  it("adds no aria props: accessibilityState carries it", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    expect(a11yState("checkbox", { checked: true })).toEqual({
      accessibilityState: { checked: true },
      accessibilityValue: undefined,
    });
    const view = await render(
      <ThemeProvider>
        <Checkbox label="Terms" checked onValueChange={() => {}} />
      </ThemeProvider>,
    );
    expect(view.getByLabelText("Terms").props.accessibilityState).toMatchObject(
      { checked: true },
    );
  });
});
