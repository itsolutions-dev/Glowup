import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  Drawer,
  DrawerItem,
  LinkProvider,
  NavBar,
  NavigationRail,
  ThemeProvider,
} from "..";
import type { NavBarItem } from "..";

// What a browser does with a navigation item that has an `href`: it is an
// anchor (the URL shows on hover, the context menu offers "open in new tab"),
// a plain click is routed inside the app instead of loading the page, and a
// click with a modifier key or the middle button is left to the browser.
const draw = (ui: React.ReactElement, navigate?: (href: string) => void) =>
  render(
    <ThemeProvider>
      {navigate ? <LinkProvider navigate={navigate}>{ui}</LinkProvider> : ui}
    </ThemeProvider>,
  );

// fireEvent returns false when a handler called preventDefault.
const click = (el: HTMLElement, init: MouseEventInit = {}) =>
  !fireEvent.click(el, { button: 0, ...init });

const drawer = (
  props: Partial<React.ComponentProps<typeof DrawerItem>> = {},
) => (
  <Drawer>
    <DrawerItem label="Customers" href="/customers" {...props} />
  </Drawer>
);

describe("DrawerItem with href on the web", () => {
  it("is an anchor with the URL, current when selected", () => {
    draw(drawer({ selected: true }));
    const link = screen.getByRole("link", { name: "Customers" });
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/customers");
    expect(link.getAttribute("aria-current")).toBe("page");
  });

  it("routes a plain click through the app without loading the page", () => {
    const navigate = jest.fn();
    const onClick = jest.fn();
    draw(drawer({ onClick }), navigate);
    const prevented = click(screen.getByRole("link", { name: "Customers" }));
    expect(prevented).toBe(true);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/customers");
  });

  it.each([["ctrlKey"], ["metaKey"], ["shiftKey"]])(
    "leaves a click with %s to the browser",
    (key) => {
      const navigate = jest.fn();
      const onClick = jest.fn();
      draw(drawer({ onClick }), navigate);
      const prevented = click(screen.getByRole("link", { name: "Customers" }), {
        [key]: true,
      });
      expect(prevented).toBe(false);
      expect(onClick).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
    },
  );

  it("leaves a middle click to the browser", () => {
    const navigate = jest.fn();
    draw(drawer(), navigate);
    const link = screen.getByRole("link", { name: "Customers" });
    expect(
      fireEvent(
        link,
        new MouseEvent("auxclick", {
          button: 1,
          bubbles: true,
          cancelable: true,
        }),
      ),
    ).toBe(true);
    expect(click(link, { button: 1 })).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("with nothing to route it, lets the browser follow the href", () => {
    draw(drawer());
    expect(click(screen.getByRole("link", { name: "Customers" }))).toBe(false);
  });

  it("can be reached with Tab", () => {
    draw(drawer());
    const link = screen.getByRole("link", { name: "Customers" });
    act(() => link.focus());
    expect(document.activeElement).toBe(link);
  });
});

const items: NavBarItem[] = [
  { id: "home", label: "Home", icon: "home-outline", href: "/" },
  {
    id: "customers",
    label: "Customers",
    icon: "account-outline",
    href: "/customers",
  },
];

describe.each([
  ["NavBar", <NavBar key="bar" items={items} activeId="customers" />],
  [
    "NavigationRail",
    <NavigationRail key="rail" items={items} activeId="customers" />,
  ],
])("%s with href on the web", (_name, bar) => {
  it("is a navigation landmark of anchors, the active one current", () => {
    draw(bar);
    expect(screen.getByRole("navigation")).toBeTruthy();
    expect(screen.queryByRole("tablist")).toBeNull();
    const customers = screen.getByRole("link", { name: "Customers" });
    expect(customers.tagName).toBe("A");
    expect(customers.getAttribute("href")).toBe("/customers");
    expect(customers.getAttribute("aria-current")).toBe("page");
    expect(
      screen.getByRole("link", { name: "Home" }).getAttribute("aria-current"),
    ).toBeNull();
  });

  it("routes a plain click and leaves a Ctrl-click", () => {
    const navigate = jest.fn();
    draw(bar, navigate);
    const home = screen.getByRole("link", { name: "Home" });
    expect(click(home, { ctrlKey: true })).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(click(home)).toBe(true);
    expect(navigate).toHaveBeenCalledWith("/");
  });
});
