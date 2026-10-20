import React from "react";
import { Text } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { Drawer, DrawerItem, DrawerSection, ThemeProvider } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("DrawerItem groups", () => {
  const group = (props = {}) => (
    <Drawer>
      <DrawerItem label="Settings" icon="cog-outline" {...props}>
        <DrawerItem label="Profile" onClick={() => {}} />
        <DrawerItem label="Billing" onClick={() => {}} />
      </DrawerItem>
    </Drawer>
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

  it("can start open, is a button rather than a link, and still calls onClick", async () => {
    const onClick = jest.fn();
    const { getByLabelText, queryByText } = await draw(
      group({ defaultExpanded: true, onClick }),
    );
    expect(queryByText("Profile")).toBeTruthy();
    expect(getByLabelText("Settings").props.accessibilityRole).toBe("button");
    await fireEvent.press(getByLabelText("Settings"));
    expect(onClick).toHaveBeenCalledTimes(1);
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
      <Drawer>
        <DrawerItem label="Inbox" onClick={() => {}} />
      </Drawer>,
    );
    expect(getByLabelText("Inbox").props.accessibilityRole).toBe("link");
  });
});

describe("DrawerSection collapsible", () => {
  const section = (props = {}) => (
    <Drawer>
      <DrawerSection title="Admin" collapsible {...props}>
        <DrawerItem label="Users" onClick={() => {}} />
      </DrawerSection>
    </Drawer>
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
      <Drawer>
        <DrawerSection title="Admin">
          <DrawerItem label="Users" onClick={() => {}} />
        </DrawerSection>
      </Drawer>,
    );
    expect(getByText("Admin")).toBeTruthy();
    expect(queryByLabelText("Admin")).toBeNull();
  });
});

describe("Drawer header and collapsed", () => {
  it("pins a header above the items", async () => {
    const { getByText } = await draw(
      <Drawer header={<Text>Acme CRM</Text>}>
        <DrawerItem label="Inbox" onClick={() => {}} />
      </Drawer>,
    );
    expect(getByText("Acme CRM")).toBeTruthy();
  });

  it("shows icons only when collapsed: no labels, titles or sub-items, 72 wide", async () => {
    const { toJSON, queryByText, getByLabelText } = await draw(
      <Drawer collapsed title="Mail">
        <DrawerSection title="Admin">
          <DrawerItem
            label="Inbox"
            icon="inbox-outline"
            badge={3}
            onClick={() => {}}
          />
          <DrawerItem label="Settings" defaultExpanded onClick={() => {}}>
            <DrawerItem label="Profile" onClick={() => {}} />
          </DrawerItem>
        </DrawerSection>
      </Drawer>,
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
