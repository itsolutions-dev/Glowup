import React from "react";
import { Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  AppBar,
  ButtonGroup,
  ChipGroup,
  CircularProgress,
  DataGrid,
  DrawerItem,
  DrawerSection,
  IconButton,
  Modal,
  NavigationDrawer,
  NavigationRail,
  SideSheet,
  SplitButton,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  ThemeProvider,
  Toolbar,
  TopAppBar,
  Typography,
} from "../index";

const wrap = (ui: React.ReactElement) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 1024, height: 768 },
        insets: { top: 20, left: 0, right: 0, bottom: 10 },
      }}
    >
      <ThemeProvider>{ui}</ThemeProvider>
    </SafeAreaProvider>,
  );

const railItems = [
  { id: "home", label: "Home", icon: "home-outline" as const },
  {
    id: "inbox",
    label: "Inbox",
    icon: "inbox-outline" as const,
    badgeCount: 3,
  },
  {
    id: "off",
    label: "Archive",
    icon: "archive-outline" as const,
    disabled: true,
  },
];

describe("NavigationRail", () => {
  it("marks the active destination and reports presses", async () => {
    const onItemPress = jest.fn();
    const { getAllByRole, getByRole } = await wrap(
      <NavigationRail
        items={railItems}
        activeId="home"
        onItemPress={onItemPress}
      />,
    );
    expect(getAllByRole("tab")).toHaveLength(3);
    expect(
      getByRole("tab", { name: "Home" }).props.accessibilityState,
    ).toMatchObject({
      selected: true,
    });
    await fireEvent.press(getByRole("tab", { name: "Inbox" }));
    expect(onItemPress).toHaveBeenCalledWith("inbox");
  });

  it("does not fire a disabled destination", async () => {
    const onItemPress = jest.fn();
    const { getByRole } = await wrap(
      <NavigationRail
        items={railItems}
        activeId="home"
        onItemPress={onItemPress}
      />,
    );
    await fireEvent.press(getByRole("tab", { name: "Archive" }));
    expect(onItemPress).not.toHaveBeenCalled();
  });

  it("drops the labels with showLabels=none but keeps accessible names", async () => {
    const { queryByText, getByRole } = await wrap(
      <NavigationRail
        items={railItems}
        activeId="home"
        onItemPress={() => {}}
        showLabels="none"
      />,
    );
    expect(queryByText("Home")).toBeNull();
    expect(getByRole("tab", { name: "Home" })).toBeTruthy();
  });
});

describe("NavigationDrawer", () => {
  it("renders sections and items inline", async () => {
    const onPress = jest.fn();
    const { getByText, getByRole } = await wrap(
      <NavigationDrawer title="Mail">
        <DrawerSection title="Folders">
          <DrawerItem
            label="Inbox"
            icon="inbox-outline"
            selected
            badge={24}
            onPress={() => {}}
          />
          <DrawerItem label="Sent" icon="send-outline" onPress={onPress} />
        </DrawerSection>
      </NavigationDrawer>,
    );
    expect(getByText("Folders")).toBeTruthy();
    expect(getByText("24")).toBeTruthy();
    expect(
      getByRole("link", { name: "Inbox" }).props.accessibilityState,
    ).toMatchObject({
      selected: true,
    });
    await fireEvent.press(getByRole("link", { name: "Sent" }));
    expect(onPress).toHaveBeenCalled();
  });

  it("modal: renders nothing closed, dismisses from the scrim open", async () => {
    const onDismiss = jest.fn();
    const drawer = (visible: boolean) => (
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 1024, height: 768 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <ThemeProvider>
          <NavigationDrawer
            variant="modal"
            visible={visible}
            onDismiss={onDismiss}
            testID="nav"
          >
            <DrawerItem label="Inbox" onPress={() => {}} />
          </NavigationDrawer>
        </ThemeProvider>
      </SafeAreaProvider>
    );
    const { queryByText, getByTestId, rerender } = await render(drawer(false));
    expect(queryByText("Inbox")).toBeNull();

    await rerender(drawer(true));
    // The scrim sits beside the modal panel, so it is hidden from assistive
    // tech; the query has to include hidden elements to reach it.
    await fireEvent.press(
      getByTestId("nav-scrim", { includeHiddenElements: true }),
    );
    expect(onDismiss).toHaveBeenCalled();
  });
});

describe("TopAppBar and AppBar", () => {
  it.each(["small", "center", "medium", "large"] as const)(
    "renders the %s variant with a header title",
    async (variant) => {
      const { getByRole } = await wrap(
        <TopAppBar
          title="Orders"
          variant={variant}
          leading={
            <IconButton
              icon="menu"
              accessibilityLabel="Menu"
              onPress={() => {}}
            />
          }
        />,
      );
      expect(getByRole("header", { name: "Orders" })).toBeTruthy();
    },
  );

  it("AppBar reads the title from options and shows back", async () => {
    const goBack = jest.fn();
    const { getByText, getByRole } = await wrap(
      <AppBar
        navigation={{ goBack }}
        route={{ name: "Detail" }}
        options={{ title: "Order 42" }}
        back
      />,
    );
    expect(getByText("Order 42")).toBeTruthy();
    await fireEvent.press(getByRole("button", { name: "Go back" }));
    expect(goBack).toHaveBeenCalled();
  });

  it("AppBar falls back to the route name", async () => {
    const { getByText } = await wrap(
      <AppBar navigation={{}} route={{ name: "Dashboard" }} options={{}} />,
    );
    expect(getByText("Dashboard")).toBeTruthy();
  });
});

describe("ButtonGroup", () => {
  const options = [
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month", disabled: true },
  ];

  it("single select: radio semantics, reports the pressed value", async () => {
    const onValueChange = jest.fn();
    const { getByRole } = await wrap(
      <ButtonGroup
        options={options}
        value="day"
        onValueChange={onValueChange}
        type="connected"
      />,
    );
    expect(
      getByRole("radio", { name: "Day" }).props.accessibilityState,
    ).toMatchObject({
      checked: true,
    });
    await fireEvent.press(getByRole("radio", { name: "Week" }));
    expect(onValueChange).toHaveBeenCalledWith("week");
    await fireEvent.press(getByRole("radio", { name: "Month" }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("multi select toggles values in and out", async () => {
    const onValueChange = jest.fn();
    const { getByRole } = await wrap(
      <ButtonGroup
        options={options}
        value={["day"]}
        multiSelect
        onValueChange={onValueChange}
      />,
    );
    await fireEvent.press(getByRole("checkbox", { name: "Week" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["day", "week"]);
    await fireEvent.press(getByRole("checkbox", { name: "Day" }));
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });
});

describe("SplitButton", () => {
  it("runs the primary action and opens the menu from the trailing half", async () => {
    const onPress = jest.fn();
    const onDuplicate = jest.fn();
    const { getByRole, getByText } = await wrap(
      <SplitButton
        onPress={onPress}
        items={[{ id: "dup", label: "Duplicate", onPress: onDuplicate }]}
      >
        Save
      </SplitButton>,
    );
    await fireEvent.press(getByRole("button", { name: "Save" }));
    expect(onPress).toHaveBeenCalled();

    const trailing = getByRole("button", { name: "More options" });
    expect(trailing.props.accessibilityState).toMatchObject({
      expanded: false,
    });
    await fireEvent.press(trailing);
    expect(
      getByRole("button", { name: "More options" }).props.accessibilityState,
    ).toMatchObject({ expanded: true });
    await fireEvent.press(getByText("Duplicate"));
    expect(onDuplicate).toHaveBeenCalled();
  });
});

describe("Toolbar", () => {
  it.each(["docked", "floating"] as const)(
    "renders the %s variant as a toolbar",
    async (variant) => {
      const { getByRole, getByLabelText } = await wrap(
        <Toolbar variant={variant} color="vibrant" accessibilityLabel="Edit">
          <IconButton
            icon="undo"
            accessibilityLabel="Undo"
            onPress={() => {}}
          />
        </Toolbar>,
      );
      // A toolbar is a container, not one accessible element (on iOS that would
      // merge its buttons into one), so find it by label and check its role.
      expect(getByLabelText("Edit").props.role).toBe("toolbar");
      expect(getByRole("button", { name: "Undo" })).toBeTruthy();
    },
  );
});

describe("SideSheet", () => {
  it("modal: hidden when closed; close and back buttons work when open", async () => {
    const onDismiss = jest.fn();
    const onBack = jest.fn();
    const sheet = (visible: boolean) => (
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 1024, height: 768 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <ThemeProvider>
          <SideSheet
            visible={visible}
            onDismiss={onDismiss}
            onBack={onBack}
            title="Filters"
          >
            <Text>Body</Text>
          </SideSheet>
        </ThemeProvider>
      </SafeAreaProvider>
    );
    const { queryByText, getByRole, rerender } = await render(sheet(false));
    expect(queryByText("Filters")).toBeNull();

    await rerender(sheet(true));
    expect(getByRole("header", { name: "Filters" })).toBeTruthy();
    await fireEvent.press(getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalled();
    await fireEvent.press(getByRole("button", { name: "Close" }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("standard: renders inline without visible", async () => {
    const { getByText } = await wrap(
      <SideSheet modal={false} onDismiss={() => {}} title="Details">
        <Text>Body</Text>
      </SideSheet>,
    );
    expect(getByText("Body")).toBeTruthy();
  });
});

describe("Modal fullScreen", () => {
  it("puts close, title and actions in a header", async () => {
    const onDismiss = jest.fn();
    const { getByRole, getByText } = await wrap(
      <Modal
        visible
        fullScreen
        title="New event"
        onDismiss={onDismiss}
        actions={<Text>Save</Text>}
      >
        <Text>Form</Text>
      </Modal>,
    );
    expect(getByRole("header", { name: "New event" })).toBeTruthy();
    expect(getByText("Save")).toBeTruthy();
    await fireEvent.press(getByRole("button", { name: "Close" }));
    expect(onDismiss).toHaveBeenCalled();
  });
});

describe("CircularProgress", () => {
  it("determinate: reports its value", async () => {
    const { getByRole } = await wrap(<CircularProgress progress={0.42} />);
    expect(getByRole("progressbar").props.accessibilityValue).toMatchObject({
      min: 0,
      max: 100,
      now: 42,
    });
  });

  it("indeterminate: still a labelled progressbar", async () => {
    const { getByRole } = await wrap(<CircularProgress />);
    expect(getByRole("progressbar", { name: "Loading" })).toBeTruthy();
  });
});

describe("ChipGroup", () => {
  const options = [
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
    { value: "draft", label: "Draft", disabled: true },
  ];

  it("single select deselects on a second press", async () => {
    const onValueChange = jest.fn();
    const { getByRole } = await wrap(
      <ChipGroup
        options={options}
        value="open"
        onValueChange={onValueChange}
      />,
    );
    await fireEvent.press(getByRole("radio", { name: "Open" }));
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it("required single select keeps its choice", async () => {
    const onValueChange = jest.fn();
    const { getByRole } = await wrap(
      <ChipGroup
        options={options}
        value="open"
        required
        onValueChange={onValueChange}
      />,
    );
    await fireEvent.press(getByRole("radio", { name: "Open" }));
    expect(onValueChange).not.toHaveBeenCalled();
    await fireEvent.press(getByRole("radio", { name: "Closed" }));
    expect(onValueChange).toHaveBeenCalledWith("closed");
  });

  it("multi select reports checkbox states", async () => {
    const onValueChange = jest.fn();
    const { getByRole } = await wrap(
      <ChipGroup
        options={options}
        value={["open"]}
        multiSelect
        onValueChange={onValueChange}
      />,
    );
    expect(
      getByRole("checkbox", { name: "Open" }).props.accessibilityState,
    ).toMatchObject({
      checked: true,
    });
    await fireEvent.press(getByRole("checkbox", { name: "Closed" }));
    expect(onValueChange).toHaveBeenCalledWith(["open", "closed"]);
  });
});

describe("Table primitives", () => {
  it("compose a table", async () => {
    const { getByText } = await wrap(
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableRow>
          <TableCell>Ada</TableCell>
        </TableRow>
      </Table>,
    );
    expect(getByText("Name")).toBeTruthy();
    expect(getByText("Ada")).toBeTruthy();
  });

  it("DataGrid still renders its rows on them", async () => {
    const { getByText } = await wrap(
      <DataGrid
        columns={[{ id: "name", label: "Name" }]}
        data={[{ id: 1, name: "Grace" }]}
      />,
    );
    expect(getByText("Grace")).toBeTruthy();
  });
});

describe("Typography", () => {
  it("forwards Text props", async () => {
    const { getByTestId } = await wrap(
      <Typography variant="bodyMedium" numberOfLines={2} testID="t">
        Long text
      </Typography>,
    );
    expect(getByTestId("t").props.numberOfLines).toBe(2);
  });
});
