import React from "react";
import { Platform } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { Slider, ThemeProvider } from "..";

// The touch area starts at page x = 100 and is 220 wide; the track is inset by
// half a 20 px thumb at each end, so it is 200 wide and 0..100 maps to
// pageX 110..310.
const AREA_X = 100;
const TRACK = 200;
const at = (percent: number) => {
  const locationX = 10 + (percent / 100) * TRACK;
  return { pageX: AREA_X + locationX, locationX };
};

type Props = Partial<React.ComponentProps<typeof Slider>>;

const setup = async (props: Props = {}) => {
  const onValueChange = jest.fn();
  const onSlidingComplete = jest.fn();
  const view = await render(
    <ThemeProvider>
      <Slider
        label="Volume"
        value={0}
        onValueChange={onValueChange}
        onSlidingComplete={onSlidingComplete}
        {...props}
      />
    </ThemeProvider>,
  );
  const area = view.getByLabelText("Volume");
  await fireEvent(area.children[0] as never, "layout", {
    nativeEvent: { layout: { width: TRACK } },
  });
  return { view, area, onValueChange, onSlidingComplete };
};

/** What the responder system does with a touch: ask, then grant, move, release. */
const touch = async (
  area: Awaited<ReturnType<typeof setup>>["area"],
  from: number,
  ...to: number[]
) => {
  const down = { nativeEvent: at(from) };
  if (!area.props.onStartShouldSetResponder(down)) return false;
  await fireEvent(area, "responderGrant", down);
  for (const percent of to) {
    await fireEvent(area, "responderMove", { nativeEvent: at(percent) });
  }
  await fireEvent(area, "responderRelease", {
    nativeEvent: at(to[to.length - 1] ?? from),
  });
  return true;
};

describe("Slider interaction", () => {
  describe("click", () => {
    it.each(["both", "click"] as const)(
      "jumps to the pressed point with interaction=%s",
      async (interaction) => {
        const { area, onValueChange, onSlidingComplete } = await setup({
          interaction,
        });
        await touch(area, 50);
        expect(onValueChange).toHaveBeenLastCalledWith(50);
        expect(onSlidingComplete).toHaveBeenLastCalledWith(50);
      },
    );

    it("does nothing away from the thumb with interaction=drag", async () => {
      const { area, onValueChange } = await setup({ interaction: "drag" });
      expect(await touch(area, 50)).toBe(false);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("snaps to the step and stays within min and max", async () => {
      const { area, onValueChange } = await setup({ step: 10 });
      await touch(area, 47);
      expect(onValueChange).toHaveBeenLastCalledWith(50);
      await touch(area, 130);
      expect(onValueChange).toHaveBeenLastCalledWith(100);
      await touch(area, -30);
      expect(onValueChange).toHaveBeenLastCalledWith(0);
    });
  });

  describe("drag", () => {
    it.each(["both", "drag"] as const)(
      "follows the thumb with interaction=%s",
      async (interaction) => {
        const { area, onValueChange } = await setup({
          interaction,
          value: 20,
        });
        // The thumb sits at 20%: grab it there and pull it to 80%.
        await touch(area, 20, 50, 80);
        expect(onValueChange).toHaveBeenLastCalledWith(80);
        expect(onValueChange).toHaveBeenCalledWith(50);
      },
    );

    it("keeps the grip: grabbing the thumb off-centre does not jump", async () => {
      const { area, onValueChange } = await setup({
        interaction: "drag",
        value: 50,
      });
      // 4 px right of the thumb's centre, still on it.
      const down = {
        nativeEvent: {
          pageX: at(50).pageX + 4,
          locationX: at(50).locationX + 4,
        },
      };
      await fireEvent(area, "responderGrant", down);
      await fireEvent(area, "responderMove", { nativeEvent: down.nativeEvent });
      expect(onValueChange).toHaveBeenLastCalledWith(50);
    });

    it("does not follow a drag with interaction=click", async () => {
      const { area, onValueChange } = await setup({ interaction: "click" });
      await touch(area, 25, 60, 90);
      // Only the press itself moved the value.
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith(25);
    });

    it("is not taken over by a ScrollView while dragging a thumb", async () => {
      const both = await setup({ interaction: "both" });
      expect(both.area.props.onResponderTerminationRequest()).toBe(false);
      const click = await setup({ interaction: "click" });
      expect(click.area.props.onResponderTerminationRequest()).toBe(true);
    });
  });

  it("uses the layout the first touch carries, not a stale offset", async () => {
    // The area's page offset is only known from the touch itself (a measure is
    // asynchronous): a first touch right after mount must still land right.
    const { area, onValueChange } = await setup();
    await fireEvent(area, "responderGrant", {
      nativeEvent: { pageX: 5000 + 10 + TRACK / 2, locationX: 10 + TRACK / 2 },
    });
    expect(onValueChange).toHaveBeenLastCalledWith(50);
  });

  describe("disabled", () => {
    it("blocks the pointer, assistive actions and the keyboard", async () => {
      const { area, onValueChange } = await setup({ disabled: true });
      expect(await touch(area, 50)).toBe(false);
      await fireEvent(area, "accessibilityAction", {
        nativeEvent: { actionName: "increment" },
      });
      expect(onValueChange).not.toHaveBeenCalled();
      expect(area.props.accessibilityState).toMatchObject({ disabled: true });
    });
  });

  describe("native accessibility", () => {
    it("exposes the value and increments and decrements by a step", async () => {
      const { area, onValueChange } = await setup({ value: 30, step: 5 });
      expect(area.props.accessibilityRole).toBe("adjustable");
      expect(area.props.accessibilityValue).toEqual({
        min: 0,
        max: 100,
        now: 30,
      });
      expect(area.props.accessibilityActions.map((a: any) => a.name)).toEqual([
        "increment",
        "decrement",
      ]);
      await fireEvent(area, "accessibilityAction", {
        nativeEvent: { actionName: "increment" },
      });
      expect(onValueChange).toHaveBeenLastCalledWith(35);
      await fireEvent(area, "accessibilityAction", {
        nativeEvent: { actionName: "decrement" },
      });
      expect(onValueChange).toHaveBeenLastCalledWith(25);
    });
  });

  describe("web keyboard", () => {
    beforeEach(() => {
      jest.replaceProperty(Platform, "OS", "web");
    });
    afterEach(() => jest.restoreAllMocks());

    const press = async (area: any, key: string) => {
      const preventDefault = jest.fn();
      await fireEvent(area, "keyDown", { key, preventDefault });
      return preventDefault;
    };

    it("is a focusable slider with its value", async () => {
      const { area } = await setup({ value: 40, min: 10, max: 90 });
      expect(area.props.role).toBe("slider");
      expect(area.props.tabIndex).toBe(0);
      expect(area.props["aria-valuenow"]).toBe(40);
      expect(area.props["aria-valuemin"]).toBe(10);
      expect(area.props["aria-valuemax"]).toBe(90);
    });

    it("steps with the arrows, ten steps with Page Up and Down", async () => {
      const { area, onValueChange, onSlidingComplete } = await setup({
        value: 50,
        step: 2,
      });
      expect(await press(area, "ArrowRight")).toHaveBeenCalled();
      expect(onValueChange).toHaveBeenLastCalledWith(52);
      await press(area, "ArrowUp");
      expect(onValueChange).toHaveBeenLastCalledWith(52);
      await press(area, "ArrowLeft");
      expect(onValueChange).toHaveBeenLastCalledWith(48);
      await press(area, "ArrowDown");
      expect(onValueChange).toHaveBeenLastCalledWith(48);
      await press(area, "PageUp");
      expect(onValueChange).toHaveBeenLastCalledWith(70);
      await press(area, "PageDown");
      expect(onValueChange).toHaveBeenLastCalledWith(30);
      expect(onSlidingComplete).toHaveBeenLastCalledWith(30);
    });

    it("jumps to the ends with Home and End, and ignores other keys", async () => {
      const { area, onValueChange } = await setup({
        value: 50,
        min: 10,
        max: 90,
      });
      await press(area, "Home");
      expect(onValueChange).toHaveBeenLastCalledWith(10);
      await press(area, "End");
      expect(onValueChange).toHaveBeenLastCalledWith(90);
      onValueChange.mockClear();
      expect(await press(area, "a")).not.toHaveBeenCalled();
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("works whatever the pointer interaction is", async () => {
      const { area, onValueChange } = await setup({
        value: 50,
        interaction: "click",
      });
      await press(area, "ArrowRight");
      expect(onValueChange).toHaveBeenLastCalledWith(51);
    });

    it("does not go past the ends", async () => {
      const { area, onValueChange } = await setup({ value: 100 });
      await press(area, "ArrowRight");
      await press(area, "End");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("leaves the tab order and ignores keys when disabled", async () => {
      const { area, onValueChange } = await setup({ disabled: true });
      expect(area.props.tabIndex).toBe(-1);
      expect(area.props["aria-disabled"]).toBe(true);
      await press(area, "ArrowRight");
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });
});
