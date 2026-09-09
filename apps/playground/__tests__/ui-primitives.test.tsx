import React from "react";
import { Text, View } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import {
  Card,
  ConfirmDialog,
  HelperText,
  Icon,
  ListItem,
  ListSection,
  Modal,
  Portal,
  ThemeProvider,
  ToggleButtonGroup,
  TouchableRipple,
  useTheme,
} from "@glowup/ui";

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
      <TouchableRipple
        onPress={onPress}
        accessibilityLabel="Disabilitato"
        disabled
      >
        <Text>Disabilitato</Text>
      </TouchableRipple>,
    );

    await fireEvent.press(getByLabelText("Disabilitato"));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe("Portal", () => {
  it("renders children inline when no host is mounted", async () => {
    const { getByText } = await wrap(
      <Portal>
        <Text>Senza host</Text>
      </Portal>,
    );
    expect(getByText("Senza host")).toBeTruthy();
  });

  it("renders children through a mounted host", async () => {
    const { getByText } = await wrap(
      <Portal.Host>
        <Text>Contenuto</Text>
        <Portal>
          <Text>In overlay</Text>
        </Portal>
      </Portal.Host>,
    );

    expect(getByText("Contenuto")).toBeTruthy();
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
      return <Text>Contenuto</Text>;
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
        <Text>Contenuto</Text>
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
          <Text>Prossimo intervento</Text>
        </Card.Content>
        <Card.Actions>
          <Text>Conferma</Text>
        </Card.Actions>
      </Card>,
    );

    expect(getByText("Impianto 4")).toBeTruthy();
    expect(getByText("Manutenzione")).toBeTruthy();
    expect(getByText("Prossimo intervento")).toBeTruthy();
    expect(getByText("Conferma")).toBeTruthy();
  });
});

describe("ListSection", () => {
  it("renders its title as a heading above the rows", async () => {
    const { getByText } = await wrap(
      <ListSection title="Notifiche">
        <ListItem>Email</ListItem>
      </ListSection>,
    );

    expect(getByText("Notifiche").props.accessibilityRole).toBe("header");
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

describe("Modal", () => {
  it("dismisses on a scrim press", async () => {
    const onDismiss = jest.fn();
    const { getByTestId } = await wrap(
      <Modal visible title="Titolo" onDismiss={onDismiss}>
        Corpo
      </Modal>,
    );

    await fireEvent.press(
      getByTestId("modal-scrim", {
        includeHiddenElements: true,
      }),
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not dismiss on a scrim press when dismissable is false", async () => {
    const onDismiss = jest.fn();
    const { getByTestId } = await wrap(
      <Modal visible title="Titolo" onDismiss={onDismiss} dismissable={false}>
        Corpo
      </Modal>,
    );

    await fireEvent.press(
      getByTestId("modal-scrim", {
        includeHiddenElements: true,
      }),
    );
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("renders the actions slot instead of the single close button", async () => {
    const { getByText, queryByText } = await wrap(
      <Modal
        visible
        title="Titolo"
        onClose={() => {}}
        closeText="Chiudi"
        actions={<Text>Salva</Text>}
      >
        Corpo
      </Modal>,
    );

    expect(getByText("Salva")).toBeTruthy();
    expect(queryByText("Chiudi")).toBeNull();
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
        message="L'operazione non e' reversibile."
        confirmText="Elimina"
        cancelText="Annulla"
        destructive
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await fireEvent.press(getByText("Elimina"));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await fireEvent.press(getByText("Annulla"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
