import React from "react";
import { Pressable, Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  Button,
  Checkbox,
  Chip,
  FAB,
  IconButton,
  RadioButton,
  RadioGroup,
  Slider,
  ThemeProvider,
  Toggle,
  ToggleButtonGroup,
  useInteractionFeedback,
  type InteractionFeedbackKind,
} from "../index";

let kinds: InteractionFeedbackKind[];
const onFeedback = (kind: InteractionFeedbackKind) => kinds.push(kind);
beforeEach(() => {
  kinds = [];
});

const wrap = (ui: React.ReactElement) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider onInteractionFeedback={onFeedback}>{ui}</ThemeProvider>
    </SafeAreaProvider>,
  );

describe("onInteractionFeedback", () => {
  it("reports a press, before the handler runs", async () => {
    const order: string[] = [];
    const { getByText } = await wrap(
      <Button onPress={() => order.push(`handler after ${kinds.length}`)}>
        Save
      </Button>,
    );
    await fireEvent.press(getByText("Save"));
    expect(kinds).toEqual(["press"]);
    expect(order).toEqual(["handler after 1"]);
  });

  it("stays silent for a disabled, loading or handler-less control", async () => {
    const { getByText } = await wrap(
      <>
        <Button disabled onPress={() => {}}>
          Off
        </Button>
        <Button loading onPress={() => {}}>
          Busy
        </Button>
        <Button>Inert</Button>
      </>,
    );
    await fireEvent.press(getByText("Off"));
    await fireEvent.press(getByText("Inert"));
    expect(kinds).toEqual([]);
  });

  it("is switched off per control with feedback={false}", async () => {
    const onPress = jest.fn();
    const { getByText } = await wrap(
      <Button feedback={false} onPress={onPress}>
        Quiet
      </Button>,
    );
    await fireEvent.press(getByText("Quiet"));
    expect(onPress).toHaveBeenCalled();
    expect(kinds).toEqual([]);
  });

  it("tells a press from a toggle on IconButton", async () => {
    const { getByLabelText } = await wrap(
      <>
        <IconButton icon="plus" accessibilityLabel="Add" onPress={() => {}} />
        <IconButton
          icon="star"
          accessibilityLabel="Favourite"
          selected={false}
          onPress={() => {}}
        />
      </>,
    );
    await fireEvent.press(getByLabelText("Add"));
    await fireEvent.press(getByLabelText("Favourite"));
    expect(kinds).toEqual(["press", "toggle"]);
  });

  it("reports FAB, Toggle and Checkbox", async () => {
    const { getByLabelText, getByRole, getByText } = await wrap(
      <>
        <FAB icon="pencil" label="Compose" onPress={() => {}} />
        <Toggle value={false} onValueChange={() => {}} />
        <Checkbox label="Remember" checked={false} onValueChange={() => {}} />
      </>,
    );
    await fireEvent.press(getByLabelText("Compose"));
    await fireEvent.press(getByRole("switch"));
    await fireEvent.press(getByText("Remember"));
    expect(kinds).toEqual(["press", "toggle", "toggle"]);
  });

  it("reports a selection from RadioButton, RadioGroup and a single-choice group", async () => {
    const { getByText } = await wrap(
      <>
        <RadioButton label="Solo" selected={false} onPress={() => {}} />
        <RadioGroup
          options={[{ id: "a", label: "Alpha", value: "a" }]}
          value={null}
          onValueChange={() => {}}
        />
        <ToggleButtonGroup
          options={[{ value: "day", label: "Day" }]}
          value="week"
          onValueChange={() => {}}
        />
        <ToggleButtonGroup
          multiSelect
          options={[{ value: "bold", label: "Bold" }]}
          value={[]}
          onValueChange={() => {}}
        />
      </>,
    );
    await fireEvent.press(getByText("Solo"));
    await fireEvent.press(getByText("Alpha"));
    await fireEvent.press(getByText("Day"));
    await fireEvent.press(getByText("Bold"));
    expect(kinds).toEqual(["selection", "selection", "selection", "toggle"]);
  });

  it("passes RadioGroup's feedback={false} to its buttons", async () => {
    const { getByText } = await wrap(
      <RadioGroup
        feedback={false}
        options={[{ id: "a", label: "Alpha", value: "a" }]}
        value={null}
        onValueChange={() => {}}
      />,
    );
    await fireEvent.press(getByText("Alpha"));
    expect(kinds).toEqual([]);
  });

  it("reads a chip's role: action, filter, choice and its close button", async () => {
    const { getByText, getByLabelText } = await wrap(
      <>
        <Chip label="Action" onPress={() => {}} />
        <Chip label="Filter" accessibilityRole="checkbox" onPress={() => {}} />
        <Chip label="Choice" accessibilityRole="radio" onPress={() => {}} />
        <Chip label="Tag" onClose={() => {}} />
        <Chip label="Off" disabled onPress={() => {}} />
      </>,
    );
    await fireEvent.press(getByText("Action"));
    await fireEvent.press(getByText("Filter"));
    await fireEvent.press(getByText("Choice"));
    await fireEvent.press(getByLabelText("Close Tag"));
    await fireEvent.press(getByText("Off"));
    expect(kinds).toEqual(["press", "toggle", "selection", "press"]);
  });

  describe("Slider", () => {
    async function drag(step: number | undefined, to: number[], value = 0) {
      const { getByLabelText } = await wrap(
        <Slider
          label="Volume"
          value={value}
          step={step}
          onValueChange={() => {}}
        />,
      );
      const area = getByLabelText("Volume");
      await fireEvent(area.children[0] as never, "layout", {
        nativeEvent: { layout: { width: 100 } },
      });
      for (const pageX of to) {
        await fireEvent(area, "responderMove", { nativeEvent: { pageX } });
      }
    }

    it("ticks once per step it lands on away from the value", async () => {
      await drag(10, [3, 31, 52]);
      // 3 rounds to 0 (the value: no tick); 31 → 30 and 52 → 50 tick.
      expect(kinds).toEqual(["selection", "selection"]);
    });

    it("never ticks without a step", async () => {
      await drag(undefined, [10, 20, 30]);
      expect(kinds).toEqual([]);
    });
  });

  it("lets a nested provider without a handler inherit the outer one", async () => {
    const { getByText } = await render(
      <ThemeProvider onInteractionFeedback={onFeedback}>
        <ThemeProvider>
          <Button onPress={() => {}}>Inner</Button>
        </ThemeProvider>
      </ThemeProvider>,
    );
    await fireEvent.press(getByText("Inner"));
    expect(kinds).toEqual(["press"]);
  });

  it("calls the latest handler without changing the function controls hold", async () => {
    const seen: unknown[] = [];
    function Probe() {
      const emit = useInteractionFeedback();
      seen.push(emit);
      return (
        <Pressable onPress={() => emit("longPress")}>
          <Text>Probe</Text>
        </Pressable>
      );
    }
    const second: InteractionFeedbackKind[] = [];
    const { getByText, rerender } = await render(
      <ThemeProvider onInteractionFeedback={(kind) => kinds.push(kind)}>
        <Probe />
      </ThemeProvider>,
    );
    await rerender(
      <ThemeProvider onInteractionFeedback={(kind) => second.push(kind)}>
        <Probe />
      </ThemeProvider>,
    );
    await fireEvent.press(getByText("Probe"));
    expect(kinds).toEqual([]);
    expect(second).toEqual(["longPress"]);
    expect(new Set(seen).size).toBe(1);
  });

  it("never lets a throwing handler cancel the press", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <ThemeProvider
        onInteractionFeedback={() => {
          throw new Error("haptics unavailable");
        }}
      >
        <Button onPress={onPress}>Go</Button>
      </ThemeProvider>,
    );
    await fireEvent.press(getByText("Go"));
    expect(onPress).toHaveBeenCalled();
  });

  it("does nothing without a handler", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <ThemeProvider>
        <Button onPress={onPress}>Plain</Button>
      </ThemeProvider>,
    );
    await fireEvent.press(getByText("Plain"));
    expect(onPress).toHaveBeenCalled();
  });
});
