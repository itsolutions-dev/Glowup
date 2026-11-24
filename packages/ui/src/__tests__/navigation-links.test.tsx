import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import {
  Drawer,
  DrawerItem,
  DrawerSection,
  LinkProvider,
  NavBar,
  NavigationRail,
  ThemeProvider,
} from "..";
import type { NavBarItem } from "..";

// Navigation items with an `href` (iOS and Android): a press runs the item's
// own handler and then the app's router through LinkProvider. The anchor and
// the browser's modifier clicks are the web's, in __web_tests__/navigation-links.
const draw = (ui: React.ReactElement, navigate?: (href: string) => void) =>
  render(
    <ThemeProvider>
      {navigate ? <LinkProvider navigate={navigate}>{ui}</LinkProvider> : ui}
    </ThemeProvider>,
  );

const items: NavBarItem[] = [
  { id: "home", label: "Home", icon: "home-outline", href: "/" },
  {
    id: "customers",
    label: "Customers",
    icon: "account-outline",
    href: "/customers",
  },
  { id: "agenda", label: "Agenda", icon: "calendar-outline" },
];

describe("DrawerItem with href", () => {
  it("is a link, and a press runs onClick and then the router", async () => {
    const calls: string[] = [];
    const { getByLabelText } = await draw(
      <Drawer>
        <DrawerItem
          label="Customers"
          href="/customers"
          onClick={() => calls.push("click")}
        />
      </Drawer>,
      (href) => calls.push(`navigate ${href}`),
    );
    const item = getByLabelText("Customers");
    expect(item.props.accessibilityRole).toBe("link");
    expect(item.props.href).toBeUndefined();
    await fireEvent.press(item);
    expect(calls).toEqual(["click", "navigate /customers"]);
  });

  it("goes through the router without an onClick of its own", async () => {
    const navigate = jest.fn();
    const { getByLabelText } = await draw(
      <Drawer>
        <DrawerItem label="Customers" href="/customers" />
      </Drawer>,
      navigate,
    );
    await fireEvent.press(getByLabelText("Customers"));
    expect(navigate).toHaveBeenCalledWith("/customers");
  });

  it("without a LinkProvider still calls onClick", async () => {
    const onClick = jest.fn();
    const { getByLabelText } = await draw(
      <Drawer>
        <DrawerItem label="Customers" href="/customers" onClick={onClick} />
      </Drawer>,
    );
    await fireEvent.press(getByLabelText("Customers"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("follows a nested link of a tree, and a group stays a button", async () => {
    const navigate = jest.fn();
    const { getByLabelText } = await draw(
      <Drawer>
        <DrawerSection title="Reports" collapsible>
          <DrawerItem label="Calls" href="/calls">
            <DrawerItem label="Inbound" href="/calls/inbound" />
            <DrawerItem label="Outbound" href="/calls/outbound" />
          </DrawerItem>
        </DrawerSection>
      </Drawer>,
      navigate,
    );
    const group = getByLabelText("Calls");
    expect(group.props.accessibilityRole).toBe("button");
    await fireEvent.press(group);
    // A group opens; it does not navigate.
    expect(navigate).not.toHaveBeenCalled();
    await fireEvent.press(getByLabelText("Outbound"));
    expect(navigate).toHaveBeenCalledWith("/calls/outbound");
  });

  it("collapsed, a group with href is a plain link", async () => {
    const navigate = jest.fn();
    const { getByLabelText } = await draw(
      <Drawer collapsed>
        <DrawerItem label="Calls" icon="phone-outline" href="/calls">
          <DrawerItem label="Inbound" href="/calls/inbound" />
        </DrawerItem>
      </Drawer>,
      navigate,
    );
    const item = getByLabelText("Calls");
    expect(item.props.accessibilityRole).toBe("link");
    await fireEvent.press(item);
    expect(navigate).toHaveBeenCalledWith("/calls");
  });

  it("does nothing when disabled", async () => {
    const navigate = jest.fn();
    const { getByLabelText } = await draw(
      <Drawer>
        <DrawerItem label="Customers" href="/customers" disabled />
      </Drawer>,
      navigate,
    );
    await fireEvent.press(getByLabelText("Customers"));
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe.each([
  [
    "NavBar",
    (onClick?: (id: string) => void, activeId = "customers") => (
      <NavBar items={items} activeId={activeId} onClick={onClick} />
    ),
  ],
  [
    "NavigationRail",
    (onClick?: (id: string) => void, activeId = "customers") => (
      <NavigationRail items={items} activeId={activeId} onItemPress={onClick} />
    ),
  ],
])("%s items with href", (_name, bar) => {
  it("are links, the active one selected", async () => {
    const { getByLabelText } = await draw(bar());
    const customers = getByLabelText("Customers");
    expect(customers.props.accessibilityRole).toBe("link");
    expect(customers.props.accessibilityState.selected).toBe(true);
    expect(getByLabelText("Home").props.accessibilityState.selected).toBe(
      false,
    );
  });

  it("a press reports the id, then follows the href", async () => {
    const calls: string[] = [];
    const { getByLabelText } = await draw(
      bar((id) => calls.push(`click ${id}`)),
      (href) => calls.push(`navigate ${href}`),
    );
    await fireEvent.press(getByLabelText("Customers"));
    expect(calls).toEqual(["click customers", "navigate /customers"]);
  });

  it("an item without href only reports its id", async () => {
    const onClick = jest.fn();
    const navigate = jest.fn();
    const { getByLabelText } = await draw(bar(onClick), navigate);
    await fireEvent.press(getByLabelText("Agenda"));
    expect(onClick).toHaveBeenCalledWith("agenda");
    expect(navigate).not.toHaveBeenCalled();
  });

  it("needs no handler of its own under a LinkProvider", async () => {
    const navigate = jest.fn();
    const { getByLabelText } = await draw(bar(undefined), navigate);
    await fireEvent.press(getByLabelText("Home"));
    expect(navigate).toHaveBeenCalledWith("/");
  });
});
