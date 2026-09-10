import React from "react";
import { Text, View } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  AnimatedFAB,
  Autocomplete,
  Portal,
  ThemeProvider,
  Tooltip,
} from "../index";

// SafeAreaProvider is part of the kit's provider contract — FAB, AnimatedFAB,
// AppBar and SpeedDial all read insets and throw without it, same as in App.tsx.
const Providers = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 47, left: 0, right: 0, bottom: 34 },
    }}
  >
    <ThemeProvider>{children}</ThemeProvider>
  </SafeAreaProvider>
);

const HostedProviders = ({ children }: { children: React.ReactNode }) => (
  <Providers>
    <Portal.Host>{children}</Portal.Host>
  </Providers>
);

const wrap = (ui: React.ReactElement) => render(<Providers>{ui}</Providers>);

const wrapHosted = (ui: React.ReactElement) =>
  render(<HostedProviders>{ui}</HostedProviders>);

describe("AnimatedFAB", () => {
  it("renders the label and fires onPress", async () => {
    const onPress = jest.fn();
    const { getByLabelText } = await wrap(
      <AnimatedFAB icon="plus" label="Nuovo intervento" onPress={onPress} />,
    );

    const fab = getByLabelText("Nuovo intervento");
    await fireEvent.press(fab);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("reports its expanded state for assistive tech", async () => {
    const { getByLabelText, rerender } = await wrapHosted(
      // duration={0} lets the collapse settle inside the test instead of
      // updating Animated after teardown.
      <AnimatedFAB
        icon="plus"
        label="Aggiungi"
        onPress={() => {}}
        extended
        duration={0}
      />,
    );
    expect(getByLabelText("Aggiungi").props.accessibilityState).toMatchObject({
      expanded: true,
    });

    await rerender(
      <HostedProviders>
        <AnimatedFAB
          icon="plus"
          label="Aggiungi"
          onPress={() => {}}
          extended={false}
          duration={0}
        />
      </HostedProviders>,
    );
    // waitFor runs inside act, which lets the collapse animation the rerender
    // kicked off settle instead of updating after the test body.
    await waitFor(() =>
      expect(getByLabelText("Aggiungi").props.accessibilityState).toMatchObject(
        { expanded: false },
      ),
    );
  });

  it("does not fire onPress while disabled", async () => {
    const onPress = jest.fn();
    const { getByLabelText } = await wrap(
      <AnimatedFAB
        icon="plus"
        label="Disabilitato"
        onPress={onPress}
        disabled
      />,
    );

    await fireEvent.press(getByLabelText("Disabilitato"));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe("Tooltip", () => {
  const showTooltip = async (getByLabelText: any) => {
    // enterDelay={0} keeps the test off fake timers.
    await fireEvent(getByLabelText("Dettagli"), "longPress");
  };

  it("shows its content inline when no portal host is mounted", async () => {
    const { getByLabelText, getByText } = await wrap(
      <Tooltip content="Dettagli" enterDelay={0}>
        <Text>Anchor</Text>
      </Tooltip>,
    );

    await showTooltip(getByLabelText);
    expect(getByText("Dettagli")).toBeTruthy();
  });

  it("shows its content through a mounted portal host", async () => {
    const { getByLabelText, getByText } = await wrapHosted(
      <Tooltip content="Dettagli" enterDelay={0}>
        <Text>Anchor</Text>
      </Tooltip>,
    );

    await showTooltip(getByLabelText);
    expect(getByText("Dettagli")).toBeTruthy();
  });

  it("stays hidden while disabled", async () => {
    const { getByLabelText, queryByText } = await wrapHosted(
      <Tooltip content="Dettagli" enterDelay={0} disabled>
        <Text>Anchor</Text>
      </Tooltip>,
    );

    await showTooltip(getByLabelText);
    expect(queryByText("Dettagli")).toBeNull();
  });
});

describe("Autocomplete", () => {
  const options = [
    { id: "1", label: "Milano", value: "MI" },
    { id: "2", label: "Modena", value: "MO" },
  ];

  const renderWith = (
    renderer: typeof wrap,
    value: string,
    onChangeText = () => {},
  ) =>
    renderer(
      <Autocomplete
        label="Città"
        value={value}
        options={options}
        onChangeText={onChangeText}
        onSelect={() => {}}
      />,
    );

  it("opens its list inline when no portal host is mounted", async () => {
    const { getByLabelText, getByText } = await renderWith(wrap, "M");
    await fireEvent(getByLabelText("Città"), "focus");
    expect(getByText("Milano")).toBeTruthy();
  });

  it("opens its list through a mounted portal host", async () => {
    const { getByLabelText, getByText } = await renderWith(wrapHosted, "M");
    await fireEvent(getByLabelText("Città"), "focus");
    expect(getByText("Milano")).toBeTruthy();
  });

  it("selects an option from the portalled list", async () => {
    const onSelect = jest.fn();
    const { getByLabelText, getByText } = await render(
      <HostedProviders>
        <Autocomplete
          label="Città"
          value="M"
          options={options}
          onChangeText={() => {}}
          onSelect={onSelect}
        />
      </HostedProviders>,
    );

    await fireEvent(getByLabelText("Città"), "focus");
    await fireEvent.press(getByText("Modena"));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ label: "Modena" }),
    );
  });
});

describe("overlays already isolated by a native Modal", () => {
  it("keeps a portalled tooltip out of a clipping parent's subtree", async () => {
    const { getByLabelText, getByText } = await wrapHosted(
      <View style={{ overflow: "hidden", height: 20 }}>
        <Tooltip content="Dettagli" enterDelay={0}>
          <Text>Anchor</Text>
        </Tooltip>
      </View>,
    );

    await fireEvent(getByLabelText("Dettagli"), "longPress");
    // Rendered at the host, so it is not a descendant of the clipped View.
    expect(getByText("Dettagli")).toBeTruthy();
  });
});
