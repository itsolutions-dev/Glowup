import React from "react";
import { StyleSheet, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { fireEvent, render } from "@testing-library/react-native";
import {
  Accordion,
  Avatar,
  Button,
  ButtonGroup,
  Card,
  Chip,
  FAB,
  IconButton,
  SpeedDial,
  Tabs,
  ThemeProvider,
  ToggleButton,
} from "..";

// Hover, press and focus feedback may change colour, shadow and elevation,
// never the box: a border that appears on hover pushes the page around.
const LAYOUT =
  /^(border.*Width|padding|margin|width|height|min|max|top|left|right|bottom|flex|gap|position)/;

const layoutOf = (style: unknown) =>
  Object.fromEntries(
    Object.entries(StyleSheet.flatten(style as never) ?? {}).filter(([k]) =>
      LAYOUT.test(k),
    ),
  );

const wrap = (ui: React.ReactElement) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <ThemeProvider>{ui}</ThemeProvider>
    </SafeAreaProvider>,
  );

const STATES = [{ hovered: true }, { pressed: true }, { focused: true }];

type StyleFn = (state: {
  hovered?: boolean;
  pressed?: boolean;
  focused?: boolean;
}) => unknown;

// The module object itself: a namespace import is a copy.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RN = require("react-native") as typeof import("react-native");

// react-native-web hands a Pressable's style callback `hovered` and `focused`;
// react-native does not, so the callbacks are collected as the controls render
// and called with each state here.
const seen: StyleFn[] = [];
const Real = RN.Pressable;
const Spy = React.forwardRef<unknown, any>(function Spy(props, ref) {
  if (typeof props.style === "function") seen.push(props.style);
  return <Real ref={ref as never} {...props} />;
});
beforeAll(() => {
  Object.defineProperty(RN, "Pressable", {
    configurable: true,
    get: () => Spy,
  });
});
afterAll(() => {
  Object.defineProperty(RN, "Pressable", {
    configurable: true,
    get: () => Real,
  });
});
beforeEach(() => {
  seen.length = 0;
});

/** Every Pressable that takes a style callback must keep its box in every state. */
const expectStableBox = (minimum = 1) => {
  const fns = [...new Set(seen)];
  expect(fns.length).toBeGreaterThanOrEqual(minimum);
  for (const style of fns) {
    const idle = layoutOf(style({}));
    for (const state of STATES) {
      expect(layoutOf(style(state))).toEqual(idle);
    }
  }
  return fns;
};

describe("hover, press and focus feedback never change the layout box", () => {
  it.each(["filled", "tonal", "outlined", "text"] as const)(
    "Button %s",
    async (variant) => {
      await wrap(
        <Button variant={variant} onClick={() => {}}>
          Save
        </Button>,
      );
      const [style] = expectStableBox();
      // The feedback is still there, only not in the box.
      expect(StyleSheet.flatten(style({ hovered: true }) as never)).not.toEqual(
        StyleSheet.flatten(style({}) as never),
      );
    },
  );

  it("Button with an icon, a badge and dense density", async () => {
    await wrap(
      <Button iconName="plus" badge={3} density="dense" onClick={() => {}}>
        Add
      </Button>,
    );
    expectStableBox();
  });

  it("ButtonGroup", async () => {
    await wrap(
      <ButtonGroup
        value="one"
        onValueChange={() => {}}
        options={[
          { value: "one", label: "One" },
          { value: "two", label: "Two" },
        ]}
      />,
    );
    expectStableBox(2);
  });

  it.each(["standard", "filled", "tonal", "outlined"] as const)(
    "IconButton %s",
    async (variant) => {
      await wrap(
        <IconButton
          icon="plus"
          accessibilityLabel="Add"
          variant={variant}
          onClick={() => {}}
        />,
      );
      expectStableBox();
    },
  );

  it("ToggleButton", async () => {
    await wrap(
      <ToggleButton label="A" active={false} isFirst onPress={() => {}} />,
    );
    expectStableBox();
  });

  it("FAB", async () => {
    await wrap(<FAB icon="plus" onClick={() => {}} />);
    expectStableBox();
  });

  it("SpeedDial", async () => {
    await wrap(
      <SpeedDial
        mainIcon="plus"
        defaultOpen
        actions={[{ id: 1, icon: "pencil", label: "Edit", onPress: () => {} }]}
      />,
    );
    expectStableBox(2);
  });

  it("Card", async () => {
    for (const variant of ["elevated", "filled", "outlined"] as const) {
      await wrap(
        <Card variant={variant} onClick={() => {}}>
          <Text>Body</Text>
        </Card>,
      );
      expectStableBox();
    }
  });

  it("Avatar", async () => {
    await wrap(<Avatar name="Ada Lovelace" onClick={() => {}} />);
    expectStableBox();
  });

  it("Accordion header", async () => {
    await wrap(<Accordion title="More">Body</Accordion>);
    expectStableBox();
  });

  it.each(["standard", "rounded"] as const)("Tabs %s", async (variant) => {
    await wrap(
      <Tabs
        variant={variant}
        tabs={["One", "Two", "Three"]}
        activeTab={0}
        onChange={() => {}}
      />,
    );
    expectStableBox(3);
  });

  it("Chip keeps its box while hovered and pressed", async () => {
    for (const variant of ["filled", "tonal", "outlined"] as const) {
      const view = await wrap(
        <Chip label="Tag" variant={variant} onClick={() => {}} />,
      );
      const idle = layoutOf((view.toJSON() as any).props.style);
      const target = view.getByRole("button");
      await fireEvent(target, "hoverIn");
      expect(layoutOf((view.toJSON() as any).props.style)).toEqual(idle);
      await fireEvent(target, "pressIn");
      expect(layoutOf((view.toJSON() as any).props.style)).toEqual(idle);
    }
  });
});
