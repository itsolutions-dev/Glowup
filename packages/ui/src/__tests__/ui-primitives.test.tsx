import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { fireEvent, render, within } from "@testing-library/react-native";
import {
  Card,
  ConfirmDialog,
  HelperText,
  Icon,
  IconButton,
  ListItem,
  ListSection,
  Dialog,
  Portal,
  Switch,
  ThemeProvider,
  ToggleButtonGroup,
  TouchableRipple,
  useTheme,
} from "../index";

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("Icon", () => {
  it("renders a MaterialCommunityIcons glyph name", async () => {
    const { toJSON } = await wrap(<Icon source="camera" size={20} />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders a render-function source with the resolved size and colour", async () => {
    const spy = jest.fn(() => <View testID="custom-glyph" />);
    const { getByTestId } = await wrap(
      <Icon source={spy} size={32} color="#123456" />,
    );

    expect(getByTestId("custom-glyph")).toBeTruthy();
    expect(spy).toHaveBeenCalledWith({ size: 32, color: "#123456" });
  });

  it("renders a bitmap source as an image", async () => {
    const { getByTestId } = await wrap(
      <Icon source={{ uri: "https://example.test/a.png" }} testID="bitmap" />,
    );
    expect(getByTestId("bitmap")).toBeTruthy();
  });
});

describe("HelperText", () => {
  it("shows the message", async () => {
    const { getByText } = await wrap(
      <HelperText>Massimo 8 caratteri</HelperText>,
    );
    expect(getByText("Massimo 8 caratteri")).toBeTruthy();
  });

  it("keeps a hidden message mounted but out of the accessibility tree", async () => {
    const { getByText, queryByText, root } = await wrap(
      <HelperText visible={false}>Nascosto</HelperText>,
    );

    // It fades rather than unmounting, so the field height doesn't jump —
    // hence `includeHiddenElements`, which is also the proof it is hidden.
    expect(getByText("Nascosto", { includeHiddenElements: true })).toBeTruthy();
    expect(queryByText("Nascosto")).toBeNull();
    expect(root?.props.importantForAccessibility).toBe("no-hide-descendants");
  });
});

describe("TouchableRipple", () => {
  it("fires onPress", async () => {
    const onPress = jest.fn();
    const { getByLabelText } = await wrap(
      <TouchableRipple onPress={onPress} accessibilityLabel="Tocca">
        <Text>Tocca</Text>
      </TouchableRipple>,
    );

    await fireEvent.press(getByLabelText("Tocca"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress while disabled", async () => {
    const onPress = jest.fn();
    const { getByLabelText } = await wrap(
      <TouchableRipple onPress={onPress} accessibilityLabel="Disabled" disabled>
        <Text>Disabled</Text>
      </TouchableRipple>,
    );

    await fireEvent.press(getByLabelText("Disabled"));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe("Portal", () => {
  it("renders children inline when no host is mounted", async () => {
    const { getByText } = await wrap(
      <Portal>
        <Text>No host</Text>
      </Portal>,
    );
    expect(getByText("No host")).toBeTruthy();
  });

  it("renders children through a mounted host", async () => {
    const { getByText } = await wrap(
      <Portal.Host>
        <Text>Content</Text>
        <Portal>
          <Text>In overlay</Text>
        </Portal>
      </Portal.Host>,
    );

    expect(getByText("Content")).toBeTruthy();
    expect(getByText("In overlay")).toBeTruthy();
  });

  it("does not re-render the host subtree when a portal mounts", async () => {
    // The host holds the portal list in state, so mounting a portal re-renders
    // it. Its `children` prop keeps the same element identity across those
    // re-renders, so React bails out of the subtree — otherwise the portal's
    // mount effect would see new children and loop.
    let renders = 0;
    const Child = () => {
      renders++;
      return <Text>Content</Text>;
    };

    await wrap(
      <Portal.Host>
        <Child />
        <Portal>
          <Text>In overlay</Text>
        </Portal>
      </Portal.Host>,
    );

    expect(renders).toBe(1);
  });

  it("removes the portal content when the portal unmounts", async () => {
    const Host = ({ open }: { open: boolean }) => (
      <Portal.Host>
        <Text>Content</Text>
        {open && (
          <Portal>
            <Text>In overlay</Text>
          </Portal>
        )}
      </Portal.Host>
    );

    const { queryByText, rerender } = await wrap(<Host open />);
    expect(queryByText("In overlay")).toBeTruthy();

    await rerender(
      <ThemeProvider>
        <Host open={false} />
      </ThemeProvider>,
    );
    expect(queryByText("In overlay")).toBeNull();
  });
});

describe("Card compound parts", () => {
  it("renders title, subtitle, body and actions", async () => {
    const { getByText } = await wrap(
      <Card variant="elevated">
        <Card.Title title="Impianto 4" subtitle="Manutenzione" />
        <Card.Content>
          <Text>Next service</Text>
        </Card.Content>
        <Card.Actions>
          <Text>Confirm</Text>
        </Card.Actions>
      </Card>,
    );

    expect(getByText("Impianto 4")).toBeTruthy();
    expect(getByText("Manutenzione")).toBeTruthy();
    expect(getByText("Next service")).toBeTruthy();
    expect(getByText("Confirm")).toBeTruthy();
  });
});

type HostNode = {
  props: Record<string, unknown>;
  children: (HostNode | string)[] | null;
};

/** Every host node marked disabled, the way a screen reader reads it. */
function disabledNodes(node: HostNode | HostNode[] | null): HostNode[] {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(disabledNodes);
  const state = node.props.accessibilityState as
    { disabled?: boolean } | undefined;
  const own =
    state?.disabled === true || node.props["aria-disabled"] === true
      ? [node]
      : [];
  const children = (node.children ?? []).filter(
    (child): child is HostNode => typeof child !== "string",
  );
  return [...own, ...children.flatMap(disabledNodes)];
}

describe("ListItem", () => {
  it("does not mark a row without onClick, or its controls, as disabled", async () => {
    const { toJSON, getByRole } = await wrap(
      <ListItem
        primaryText="Keep awake"
        secondaryText="Keeps the screen on"
        action={<Switch value onChange={() => {}} />}
      />,
    );
    expect(getByRole("switch")).toBeTruthy();
    expect(disabledNodes(toJSON() as HostNode)).toEqual([]);
    // Not a button either: the row itself does nothing.
    expect(() => getByRole("button", { name: /Keep awake/ })).toThrow();
  });

  it("is a button that presses when it has onClick", async () => {
    const onClick = jest.fn();
    const { getByRole } = await wrap(
      <ListItem
        onClick={onClick}
        primaryText="Account"
        secondaryText="Settings"
      />,
    );
    const row = getByRole("button");
    expect(row.props.accessibilityState?.disabled).not.toBe(true);
    await fireEvent.press(row);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("draws a node as given and wraps only text in the theme's type", async () => {
    const { getByText, getByTestId, toJSON } = await wrap(
      <ListItem
        primaryText={<Text testID="first">first node</Text>}
        secondaryText={<Text testID="second">second node</Text>}
        action={<Text>t</Text>}
      />,
    );
    // A node is not nested inside another Text, which would force its lines
    // to one line and its styles to inherit.
    expect(getByTestId("first").parent?.type).not.toBe("Text");
    expect(getByTestId("second")).toBeTruthy();
    expect(getByText("first node")).toBeTruthy();
    expect(JSON.stringify(toJSON())).not.toContain('"numberOfLines":1');
  });

  it("shows an indicator bar, dims, and fixes the action width", async () => {
    const out = async (props: object) =>
      JSON.stringify(
        (
          await wrap(
            <ListItem primaryText="Row" action={<Text>x</Text>} {...props} />,
          )
        ).toJSON(),
      );
    expect(await out({ indicatorColor: "#B00020" })).toContain(
      '"borderLeftColor":"#B00020"',
    );
    expect(await out({})).not.toContain("borderLeftColor");
    expect(await out({ dimmed: true })).toContain('"opacity":0.55');
    expect(await out({})).not.toContain('"opacity":0.55');
    expect(await out({ trailingWidth: 112 })).toContain('"width":112');
  });

  it("draws icon as a glyph name or as a node", async () => {
    const glyph = await wrap(<ListItem primaryText="Mail" icon="email" />);
    expect(glyph.toJSON()).toBeTruthy();
    const node = await wrap(
      <ListItem primaryText="Mail" icon={<Text testID="lead">L</Text>} />,
    );
    expect(node.getByTestId("lead")).toBeTruthy();
    // A named glyph is drawn as an icon, not as the text of its name.
    expect(glyph.queryByText("email")).toBeNull();
  });

  it("merges primaryTextStyle and secondaryTextStyle after the defaults, for text only", async () => {
    const { getByText } = await wrap(
      <ListItem
        primaryText="Title"
        secondaryText="Subtitle"
        primaryTextStyle={{ color: "#112233" }}
        secondaryTextStyle={{ fontSize: 9 }}
      />,
    );
    expect(StyleSheet.flatten(getByText("Title").props.style).color).toBe(
      "#112233",
    );
    expect(StyleSheet.flatten(getByText("Subtitle").props.style).fontSize).toBe(
      9,
    );
    // A node styles itself: the style props do not reach it.
    const node = await wrap(
      <ListItem
        primaryText={<Text testID="n">Node</Text>}
        primaryTextStyle={{ color: "#112233" }}
      />,
    );
    expect(
      StyleSheet.flatten(node.getByTestId("n").props.style)?.color,
    ).not.toBe("#112233");
  });

  it("keeps an action beside the button, never inside it", async () => {
    const onClick = jest.fn();
    const onAction = jest.fn();
    const { getByRole } = await wrap(
      <ListItem
        primaryText="Invoice 12"
        onClick={onClick}
        action={
          <IconButton
            icon="delete"
            accessibilityLabel="Remove"
            onClick={onAction}
          />
        }
      />,
    );
    const row = getByRole("button", { name: /Invoice 12/ });
    // The row's own button holds the texts, not the action's button.
    expect(within(row).queryByRole("button", { name: "Remove" })).toBeNull();
    await fireEvent.press(getByRole("button", { name: "Remove" }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
    await fireEvent.press(row);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not press when disabled", async () => {
    const onClick = jest.fn();
    const { getByRole } = await wrap(
      <ListItem primaryText="Locked" onClick={onClick} disabled />,
    );
    const row = getByRole("button");
    expect(row.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(row);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("ListSection", () => {
  it("renders its title as a heading above the rows", async () => {
    const { getByText } = await wrap(
      <ListSection title="Notifications">
        <ListItem primaryText="Email" />
      </ListSection>,
    );

    expect(getByText("Notifications").props.accessibilityRole).toBe("header");
    expect(getByText("Email")).toBeTruthy();
  });
});

describe("ToggleButtonGroup", () => {
  const options = [
    { label: "Giorno", value: "day" },
    { label: "Settimana", value: "week" },
    { label: "Mese", value: "month", disabled: true },
  ];

  it("announces a single-select group as a radio group", async () => {
    const { getByLabelText } = await wrap(
      <ToggleButtonGroup
        options={options}
        value="day"
        onValueChange={() => {}}
        accessibilityLabel="Periodo"
      />,
    );

    expect(getByLabelText("Periodo").props.accessibilityRole).toBe(
      "radiogroup",
    );
  });

  it("marks the selected segment and the disabled option", async () => {
    const { getByLabelText } = await wrap(
      <ToggleButtonGroup
        options={options}
        value="week"
        onValueChange={() => {}}
      />,
    );

    expect(getByLabelText("Settimana").props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(getByLabelText("Mese").props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it("does not report a press on a disabled segment", async () => {
    const onValueChange = jest.fn();
    const { getByLabelText } = await wrap(
      <ToggleButtonGroup
        options={options}
        value="day"
        onValueChange={onValueChange}
      />,
    );

    await fireEvent.press(getByLabelText("Mese"));
    expect(onValueChange).not.toHaveBeenCalled();

    await fireEvent.press(getByLabelText("Settimana"));
    expect(onValueChange).toHaveBeenCalledWith("week");
  });
});

describe("theme roles", () => {
  it("exposes the M3 inverse and scrim roles", async () => {
    const seen: string[] = [];
    const Probe = () => {
      const { theme } = useTheme();
      seen.push(
        theme.colors.inverseSurface,
        theme.colors.inverseOnSurface,
        theme.colors.inversePrimary,
        theme.colors.surfaceTint,
        theme.colors.scrim,
      );
      return null;
    };

    await wrap(<Probe />);
    expect(seen).toHaveLength(5);
    seen.forEach((value) => expect(value).toMatch(/^#[0-9A-Fa-f]{6}$/));
  });
});

describe("Dialog", () => {
  it("closes on a backdrop press", async () => {
    const onClose = jest.fn();
    const { getByTestId } = await wrap(
      <Dialog visible title="Title" onClose={onClose}>
        Corpo
      </Dialog>,
    );

    await fireEvent.press(
      getByTestId("dialog-scrim", {
        includeHiddenElements: true,
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close on a backdrop press when disableBackdropClick is set", async () => {
    const onClose = jest.fn();
    const { getByTestId } = await wrap(
      <Dialog visible title="Title" onClose={onClose} disableBackdropClick>
        Corpo
      </Dialog>,
    );

    await fireEvent.press(
      getByTestId("dialog-scrim", {
        includeHiddenElements: true,
      }),
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders the actions slot instead of the single close button", async () => {
    const { getByText, queryByText } = await wrap(
      <Dialog
        visible
        title="Title"
        onClose={() => {}}
        closeText="Close"
        actions={<Text>Save</Text>}
      >
        Corpo
      </Dialog>,
    );

    expect(getByText("Save")).toBeTruthy();
    expect(queryByText("Close")).toBeNull();
  });
});

describe("ConfirmDialog", () => {
  it("wires confirm and cancel", async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByText } = await wrap(
      <ConfirmDialog
        visible
        title="Eliminare l'intervento?"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await fireEvent.press(getByText("Delete"));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await fireEvent.press(getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
