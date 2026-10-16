import React from "react";
import { Text } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { DrawerItem, DrawerSection, NavigationDrawer, ThemeProvider } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("DrawerItem groups", () => {
  const group = (props = {}) => (
    <NavigationDrawer>
      <DrawerItem label="Settings" icon="cog-outline" {...props}>
        <DrawerItem label="Profile" onPress={() => {}} />
        <DrawerItem label="Billing" onPress={() => {}} />
      </DrawerItem>
    </NavigationDrawer>
  );

  it("starts closed, opens on press and reports the new state", async () => {
    const onToggle = jest.fn();
    const { getByLabelText, queryByText } = await draw(group({ onToggle }));
    expect(queryByText("Profile")).toBeNull();
    expect(getByLabelText("Settings").props.accessibilityState.expanded).toBe(
      false,
    );

    await fireEvent.press(getByLabelText("Settings"));
    expect(queryByText("Profile")).toBeTruthy();
    expect(queryByText("Billing")).toBeTruthy();
    expect(onToggle).toHaveBeenLastCalledWith(true);
    expect(getByLabelText("Settings").props.accessibilityState.expanded).toBe(
      true,
    );
  });

  it("can start open, is a button rather than a link, and still calls onPress", async () => {
    const onPress = jest.fn();
    const { getByLabelText, queryByText } = await draw(
      group({ defaultExpanded: true, onPress }),
    );
    expect(queryByText("Profile")).toBeTruthy();
    expect(getByLabelText("Settings").props.accessibilityRole).toBe("button");
    await fireEvent.press(getByLabelText("Settings"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("indents sub-items one level deeper than their group", async () => {
    const { getByLabelText } = await draw(group({ defaultExpanded: true }));
    const style = (label: string) =>
      JSON.stringify(
        [getByLabelText(label).props.style].flat(Infinity).filter(Boolean),
      );
    expect(style("Profile")).toContain('"paddingStart":32');
    expect(style("Settings")).not.toContain('"paddingStart":32');
  });

  it("stays a plain link without children", async () => {
    const { getByLabelText } = await draw(
      <NavigationDrawer>
        <DrawerItem label="Inbox" onPress={() => {}} />
      </NavigationDrawer>,
    );
    expect(getByLabelText("Inbox").props.accessibilityRole).toBe("link");
  });
});

describe("DrawerSection collapsible", () => {
  const section = (props = {}) => (
    <NavigationDrawer>
      <DrawerSection title="Admin" collapsible {...props}>
        <DrawerItem label="Users" onPress={() => {}} />
      </DrawerSection>
    </NavigationDrawer>
  );

  it("is open by default, closes on a title press and reports it", async () => {
    const onToggle = jest.fn();
    const { getByLabelText, queryByText } = await draw(section({ onToggle }));
    expect(queryByText("Users")).toBeTruthy();
    await fireEvent.press(getByLabelText("Admin"));
    expect(onToggle).toHaveBeenLastCalledWith(false);
    expect(getByLabelText("Admin").props.accessibilityState.expanded).toBe(
      false,
    );
  });

  it("can start closed", async () => {
    const { queryByText } = await draw(section({ defaultExpanded: false }));
    expect(queryByText("Users")).toBeNull();
  });

  it("is a plain heading when not collapsible", async () => {
    const { queryByLabelText, getByText } = await draw(
      <NavigationDrawer>
        <DrawerSection title="Admin">
          <DrawerItem label="Users" onPress={() => {}} />
        </DrawerSection>
      </NavigationDrawer>,
    );
    expect(getByText("Admin")).toBeTruthy();
    expect(queryByLabelText("Admin")).toBeNull();
  });
});

describe("NavigationDrawer header and collapsed", () => {
  it("pins a header above the items", async () => {
    const { getByText } = await draw(
      <NavigationDrawer header={<Text>Acme CRM</Text>}>
        <DrawerItem label="Inbox" onPress={() => {}} />
      </NavigationDrawer>,
    );
    expect(getByText("Acme CRM")).toBeTruthy();
  });

  it("shows icons only when collapsed: no labels, titles or sub-items, 72 wide", async () => {
    const { toJSON, queryByText, getByLabelText } = await draw(
      <NavigationDrawer collapsed title="Mail">
        <DrawerSection title="Admin">
          <DrawerItem
            label="Inbox"
            icon="inbox-outline"
            badge={3}
            onPress={() => {}}
          />
          <DrawerItem label="Settings" defaultExpanded onPress={() => {}}>
            <DrawerItem label="Profile" onPress={() => {}} />
          </DrawerItem>
        </DrawerSection>
      </NavigationDrawer>,
    );
    expect(queryByText("Inbox")).toBeNull();
    expect(queryByText("Mail")).toBeNull();
    expect(queryByText("Admin")).toBeNull();
    expect(queryByText("Profile")).toBeNull();
    expect(queryByText("3")).toBeNull();
    // Still reachable and named for assistive tech; an item with no icon shows its letter.
    expect(getByLabelText("Inbox")).toBeTruthy();
    expect(queryByText("S")).toBeTruthy();
    expect(JSON.stringify(toJSON())).toContain('"width":72');
  });
});
