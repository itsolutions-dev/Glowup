import React, { useEffect } from "react";
import { Platform, StyleSheet, Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  AppBar,
  IconButton,
  NavBar,
  ThemeProvider,
  useTheme,
  type NavBarItem,
  type Theme,
} from "..";

let theme: Theme;
const Probe = () => {
  const current = useTheme().theme;
  useEffect(() => {
    theme = current;
  }, [current]);
  return null;
};

const wrap = (ui: React.ReactElement) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 1024, height: 768 },
        insets: { top: 20, left: 0, right: 0, bottom: 10 },
      }}
    >
      <ThemeProvider>
        <Probe />
        {ui}
      </ThemeProvider>
    </SafeAreaProvider>,
  );

const style = (element: { props: { style?: unknown } }) =>
  StyleSheet.flatten(element.props.style as never) as Record<string, unknown>;

describe("AppBar paper", () => {
  // The bar is a View with the test id around the Paper's own View.
  const paperOf = (node: { children: unknown[] }) =>
    node.children[0] as { props: { style?: unknown } };

  it("is drawn on a flat, square, unpadded surface by default", async () => {
    const { getByTestId } = await wrap(<AppBar title="Orders" testID="bar" />);
    const paper = style(paperOf(getByTestId("bar")));
    expect(paper.backgroundColor).toBe(theme.colors.surface);
    expect(paper.borderRadius).toBe(0);
    expect(paper.padding).toBe(0);
    expect(paper.borderWidth).toBeUndefined();
    // The top safe-area inset pads the bar.
    expect(paper.paddingTop).toBe(20);
  });

  it("`elevated` lifts the surface to the Paper's level 2", async () => {
    const { getByTestId } = await wrap(
      <AppBar title="Orders" elevated testID="bar" />,
    );
    expect(style(paperOf(getByTestId("bar"))).backgroundColor).toBe(
      theme.colors.surfaceContainer,
    );
  });

  it("merges `paper` over the defaults", async () => {
    const { getByTestId } = await wrap(
      <AppBar
        title="Orders"
        elevated
        paper={{ elevation: 4, outline: true }}
        testID="bar"
      />,
    );
    const paper = style(paperOf(getByTestId("bar")));
    // elevation 4 beats the level `elevated` would have picked
    expect(paper.backgroundColor).toBe(theme.colors.surfaceContainerHighest);
    expect(paper.borderWidth).toBe(1);
    expect(paper.borderColor).toBe(theme.colors.outlineVariant);
  });

  it("<AppBar paper={{ elevation: 2 }} /> works", async () => {
    const { getByTestId } = await wrap(
      <AppBar title="Orders" paper={{ elevation: 2 }} testID="bar" />,
    );
    expect(style(paperOf(getByTestId("bar"))).backgroundColor).toBe(
      theme.colors.surfaceContainer,
    );
  });

  it("takes the style of `paper`, and `style` wins over it", async () => {
    const { getByTestId } = await wrap(
      <AppBar
        title="Orders"
        paper={{ style: { backgroundColor: "#112233", opacity: 0.5 } }}
        style={{ opacity: 0.9 }}
        testID="bar"
      />,
    );
    const paper = style(paperOf(getByTestId("bar")));
    expect(paper.backgroundColor).toBe("#112233");
    expect(paper.opacity).toBe(0.9);
  });

  it("keeps the hairline under the bar", async () => {
    const { getByTestId } = await wrap(
      <AppBar title="Orders" divider testID="bar" />,
    );
    expect(style(paperOf(getByTestId("bar"))).borderBottomWidth).toBe(
      StyleSheet.hairlineWidth,
    );
  });
});

describe("AppBar as a navigator header", () => {
  it("prefers headerTitle, then title, then the route name", async () => {
    const { getByText, rerender } = await wrap(
      <AppBar
        navigation={{}}
        route={{ name: "Detail" }}
        options={{ headerTitle: "Header", title: "Title" }}
      />,
    );
    expect(getByText("Header")).toBeTruthy();
    await rerender(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 1024, height: 768 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <ThemeProvider>
          <AppBar
            navigation={{}}
            route={{ name: "Detail" }}
            options={{ title: "Title" }}
          />
        </ThemeProvider>
      </SafeAreaProvider>,
    );
    expect(getByText("Title")).toBeTruthy();
  });

  it("an explicit title wins over the navigator's", async () => {
    const { getByText, queryByText } = await wrap(
      <AppBar
        title="Mine"
        navigation={{}}
        route={{ name: "Detail" }}
        options={{ title: "Theirs" }}
      />,
    );
    expect(getByText("Mine")).toBeTruthy();
    expect(queryByText("Theirs")).toBeNull();
  });

  it("shows the menu button of a drawer navigator and opens it", async () => {
    const openDrawer = jest.fn();
    const { getByRole } = await wrap(
      <AppBar
        navigation={{ openDrawer }}
        route={{ name: "Home" }}
        options={{}}
      />,
    );
    await fireEvent.press(
      getByRole("button", { name: "Open navigation menu" }),
    );
    expect(openDrawer).toHaveBeenCalled();
  });

  it.each([
    ["headerLeft: null", { options: { headerLeft: null } }],
    ["hideMenuIcon", { options: { hideMenuIcon: true } }],
    ["isPinned", { options: {}, isPinned: true }],
  ])("hides the menu button with %s", async (_, props) => {
    const { queryByRole } = await wrap(
      <AppBar
        navigation={{ openDrawer: () => {} }}
        route={{ name: "Home" }}
        {...props}
      />,
    );
    expect(queryByRole("button", { name: "Open navigation menu" })).toBeNull();
  });

  it("a back destination wins over the menu button", async () => {
    const { queryByRole, getByRole } = await wrap(
      <AppBar
        navigation={{ goBack: () => {}, openDrawer: () => {} }}
        route={{ name: "Detail" }}
        options={{}}
        back={{ title: "Home" }}
      />,
    );
    expect(getByRole("button", { name: "Go back" })).toBeTruthy();
    expect(queryByRole("button", { name: "Open navigation menu" })).toBeNull();
  });

  it("an explicit leading replaces the derived button, and actions the headerRight", async () => {
    const { getByRole, queryByRole, getByText, queryByText } = await wrap(
      <AppBar
        navigation={{ goBack: () => {} }}
        route={{ name: "Detail" }}
        options={{ headerRight: () => <Text>From options</Text> }}
        back
        leading={
          <IconButton
            icon="close"
            accessibilityLabel="Close"
            onClick={() => {}}
          />
        }
        actions={<Text>Mine</Text>}
      />,
    );
    expect(getByRole("button", { name: "Close" })).toBeTruthy();
    expect(queryByRole("button", { name: "Go back" })).toBeNull();
    expect(getByText("Mine")).toBeTruthy();
    expect(queryByText("From options")).toBeNull();
  });

  it("renders the actions of options.headerRight", async () => {
    const { getByText } = await wrap(
      <AppBar
        navigation={{}}
        route={{ name: "Detail" }}
        options={{ headerRight: () => <Text>Share</Text> }}
      />,
    );
    expect(getByText("Share")).toBeTruthy();
  });

  it("works with no navigator at all, and draws no divider unless asked (native)", async () => {
    const { getByText, getByTestId } = await wrap(
      <AppBar title="Standalone" testID="bar" />,
    );
    expect(getByText("Standalone")).toBeTruthy();
    const paper = getByTestId("bar").children[0] as {
      props: { style?: unknown };
    };
    expect(style(paper).borderBottomWidth).toBeUndefined();
  });
});

describe("AppBar divider on the web", () => {
  afterEach(() => jest.restoreAllMocks());
  const paperOf = (node: { children: unknown[] }) =>
    node.children[0] as { props: { style?: unknown } };

  it("a navigator header draws the hairline, a standalone bar does not, and `divider` decides", async () => {
    jest.replaceProperty(Platform, "OS", "web");
    const header = await wrap(
      <AppBar navigation={{}} route={{ name: "Home" }} testID="bar" />,
    );
    expect(style(paperOf(header.getByTestId("bar"))).borderBottomWidth).toBe(
      StyleSheet.hairlineWidth,
    );
    await header.unmount();

    const alone = await wrap(<AppBar title="Alone" testID="bar" />);
    expect(
      style(paperOf(alone.getByTestId("bar"))).borderBottomWidth,
    ).toBeUndefined();
    await alone.unmount();

    const off = await wrap(
      <AppBar
        navigation={{}}
        route={{ name: "Home" }}
        divider={false}
        testID="bar"
      />,
    );
    expect(
      style(paperOf(off.getByTestId("bar"))).borderBottomWidth,
    ).toBeUndefined();
  });
});

const items: NavBarItem[] = [
  { id: "home", label: "Home", icon: "home-outline" },
  { id: "inbox", label: "Inbox", icon: "inbox-outline", badgeCount: 3 },
  { id: "off", label: "Archive", icon: "archive-outline", disabled: true },
];

describe("NavBar", () => {
  it("reports the id of the pressed destination through onClick", async () => {
    const onClick = jest.fn();
    const { getAllByRole, getByRole } = await wrap(
      <NavBar items={items} activeId="home" onClick={onClick} />,
    );
    expect(getAllByRole("tab")).toHaveLength(3);
    expect(
      getByRole("tab", { name: "Home" }).props.accessibilityState,
    ).toMatchObject({ selected: true });
    await fireEvent.press(getByRole("tab", { name: "Inbox" }));
    expect(onClick).toHaveBeenCalledWith("inbox");
  });

  it("does not fire a disabled destination", async () => {
    const onClick = jest.fn();
    const { getByRole } = await wrap(
      <NavBar items={items} activeId="home" onClick={onClick} />,
    );
    await fireEvent.press(getByRole("tab", { name: "Archive" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("labels every destination, or only the active one", async () => {
    const { queryByText, rerender } = await wrap(
      <NavBar items={items} activeId="home" onClick={() => {}} />,
    );
    expect(queryByText("Inbox")).toBeTruthy();
    await rerender(
      <ThemeProvider>
        <NavBar
          items={items}
          activeId="home"
          onClick={() => {}}
          showLabels="selected"
        />
      </ThemeProvider>,
    );
    expect(queryByText("Home")).toBeTruthy();
    expect(queryByText("Inbox")).toBeNull();
  });
});
