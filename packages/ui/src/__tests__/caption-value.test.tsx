import React from "react";
import { Platform, StyleSheet, Text } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import { CaptionValue, ThemeProvider, useTheme } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("CaptionValue", () => {
  it("draws the caption and the value, and reads them as one phrase", async () => {
    const { getByText, getByLabelText } = await draw(
      <CaptionValue caption="Phone" value="+39 06 1234" />,
    );
    expect(getByText("Phone")).toBeTruthy();
    expect(getByText("+39 06 1234")).toBeTruthy();
    expect(getByLabelText("Phone: +39 06 1234")).toBeTruthy();
  });

  it("shows the fallback for an empty value, but 0 is a value", async () => {
    const empty = await draw(<CaptionValue caption="Mobile" value="" />);
    expect(empty.getByText("N/A")).toBeTruthy();
    const custom = await draw(
      <CaptionValue caption="Mobile" value={null} fallback="n/a" />,
    );
    expect(custom.getByText("n/a")).toBeTruthy();
    const zero = await draw(<CaptionValue caption="Open" value={0} />);
    expect(zero.getByText("0")).toBeTruthy();
    expect(zero.queryByText("N/A")).toBeNull();
  });

  it("draws a node as given, and omits the caption entirely on request", async () => {
    const node = await draw(
      <CaptionValue caption="Status" value={<Text testID="n">Paid</Text>} />,
    );
    expect(node.getByTestId("n")).toBeTruthy();
    const omitted = await draw(
      <CaptionValue caption="Hidden" value="x" omitCaption />,
    );
    expect(omitted.queryByText("Hidden")).toBeNull();
    expect(omitted.getByText("x")).toBeTruthy();
  });

  it("lays out by direction and reverse, and applies colours", async () => {
    const json = async (ui: React.ReactElement) =>
      JSON.stringify((await draw(ui)).toJSON());
    expect(await json(<CaptionValue caption="a" value="b" />)).toContain(
      '"flexDirection":"column"',
    );
    const row = await json(
      <CaptionValue caption="a" value="b" direction="row" reverse />,
    );
    expect(row).toContain('"flexDirection":"row-reverse"');
    expect(row).toContain('"alignItems":"center"');
    const coloured = await json(
      <CaptionValue
        caption="a"
        value="b"
        captionColor="#111111"
        valueColor="#B00020"
      />,
    );
    expect(coloured).toContain('"color":"#111111"');
    expect(coloured).toContain('"color":"#B00020"');
  });

  it("takes a theme colour token as well as a colour string", async () => {
    let primary = "";
    const Probe = () => {
      primary = useTheme().theme.colors.primary;
      return null;
    };
    const { getByText } = await draw(
      <>
        <Probe />
        <CaptionValue
          caption="Plan"
          value="Pro"
          captionColor="primary"
          valueColor="#B00020"
        />
      </>,
    );
    expect(StyleSheet.flatten(getByText("Plan").props.style).color).toBe(
      primary,
    );
    expect(StyleSheet.flatten(getByText("Pro").props.style).color).toBe(
      "#B00020",
    );
  });

  it("takes width, height, flex, padding and gap as props", async () => {
    const out = JSON.stringify(
      (
        await draw(
          <CaptionValue
            caption="a"
            value="b"
            width={120}
            height={40}
            flex={1}
            padding={6}
            gap={10}
          />,
        )
      ).toJSON(),
    );
    for (const part of [
      '"width":120',
      '"height":40',
      '"flex":1',
      '"padding":6',
      '"gap":10',
    ]) {
      expect(out).toContain(part);
    }
  });

  it("wraps a text value in a Tooltip with the value as its content, on request", async () => {
    const plain = await draw(<CaptionValue caption="a" value="A long value" />);
    await fireEvent(plain.getByText("A long value"), "longPress");
    expect(plain.getAllByText("A long value")).toHaveLength(1);

    const tipped = await draw(
      <CaptionValue caption="a" value="A long value" showTooltip />,
    );
    expect(tipped.getAllByText("A long value")).toHaveLength(1);
    // The long press shows the tip: the value again, as its content.
    await fireEvent(tipped.getByText("A long value"), "longPress");
    expect(tipped.getAllByText("A long value")).toHaveLength(2);
  });

  describe("enableCopy", () => {
    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it("on native shows the button only with an onCopy, and reports the value", async () => {
      jest.useFakeTimers();
      const without = await draw(
        <CaptionValue caption="IBAN" value="IT60X" enableCopy />,
      );
      expect(without.queryByRole("button")).toBeNull();

      const onCopy = jest.fn();
      const { getByRole, queryByRole } = await draw(
        <CaptionValue
          caption="IBAN"
          value="IT60X"
          enableCopy
          onCopy={onCopy}
        />,
      );
      await fireEvent.press(getByRole("button", { name: "Copy" }));
      expect(onCopy).toHaveBeenCalledWith("IT60X");
      // The confirmation shows for a moment, then the button is back.
      expect(getByRole("button", { name: "Copied" })).toBeTruthy();
      await act(async () => {
        jest.advanceTimersByTime(1600);
      });
      expect(queryByRole("button", { name: "Copied" })).toBeNull();
      expect(getByRole("button", { name: "Copy" })).toBeTruthy();
    });

    it("has nothing to copy for a node or an empty value", async () => {
      const node = await draw(
        <CaptionValue
          caption="a"
          value={<Text>node</Text>}
          enableCopy
          onCopy={() => {}}
        />,
      );
      expect(node.queryByRole("button")).toBeNull();
      const empty = await draw(
        <CaptionValue caption="a" value="" enableCopy onCopy={() => {}} />,
      );
      expect(empty.queryByRole("button")).toBeNull();
    });

    it("on web writes to the clipboard, then reports; a refused write reports nothing", async () => {
      jest.replaceProperty(Platform, "OS", "web");
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(globalThis.navigator, "clipboard", {
        value: { writeText },
        configurable: true,
      });
      const onCopy = jest.fn();
      const { getByRole } = await draw(
        <CaptionValue caption="IBAN" value={42} enableCopy onCopy={onCopy} />,
      );
      await fireEvent.press(getByRole("button", { name: "Copy" }));
      expect(writeText).toHaveBeenCalledWith("42");
      expect(onCopy).toHaveBeenCalledWith("42");
      expect(getByRole("button", { name: "Copied" })).toBeTruthy();

      writeText.mockRejectedValue(new Error("denied"));
      onCopy.mockClear();
      const refused = await draw(
        <CaptionValue caption="IBAN" value="x" enableCopy onCopy={onCopy} />,
      );
      await fireEvent.press(refused.getByRole("button", { name: "Copy" }));
      expect(onCopy).not.toHaveBeenCalled();
      expect(refused.getByRole("button", { name: "Copy" })).toBeTruthy();
    });

    it("on web without a clipboard API still shows the button and leaves the copying to onCopy", async () => {
      jest.replaceProperty(Platform, "OS", "web");
      Object.defineProperty(globalThis.navigator, "clipboard", {
        value: undefined,
        configurable: true,
      });
      const onCopy = jest.fn();
      const { getByRole } = await draw(
        <CaptionValue caption="a" value="v" enableCopy onCopy={onCopy} />,
      );
      await fireEvent.press(getByRole("button", { name: "Copy" }));
      expect(onCopy).toHaveBeenCalledWith("v");
    });
  });
});
