import React, { useState } from "react";
import { Linking, Pressable, Text } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import { Collapse, Input, Link, ThemeProvider, useTheme } from "../index";
import type { Theme } from "../index";

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("Input type=number", () => {
  it("applies precision after merging extra decimal points", async () => {
    const onChangeText = jest.fn();
    const { getByDisplayValue } = await wrap(
      <Input
        type="number"
        precision={2}
        value="1"
        onChangeText={onChangeText}
      />,
    );
    await fireEvent.changeText(getByDisplayValue("1"), "1.2.34");
    expect(onChangeText).toHaveBeenLastCalledWith("1.23");
  });

  it("keeps a leading minus and drops other characters", async () => {
    const onChangeText = jest.fn();
    const { getByDisplayValue } = await wrap(
      <Input type="number" value="0" onChangeText={onChangeText} />,
    );
    await fireEvent.changeText(getByDisplayValue("0"), "-12a.5");
    expect(onChangeText).toHaveBeenLastCalledWith("-12.5");
  });
});

describe("Link", () => {
  let openURL: jest.SpyInstance;
  beforeEach(() => {
    openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });
  afterEach(() => openURL.mockRestore());

  it("opens an allowed scheme", async () => {
    const { getByRole } = await wrap(
      <Link href="https://example.com">Site</Link>,
    );
    await fireEvent.press(getByRole("link"));
    expect(openURL).toHaveBeenCalledWith("https://example.com");
  });

  it.each([
    "javascript:alert(1)",
    "JavaScript:x",
    "java\nscript:x",
    "intent://x",
  ])("does nothing for %j", async (href) => {
    const { getByRole } = await wrap(<Link href={href}>Bad</Link>);
    await fireEvent.press(getByRole("link"));
    expect(openURL).not.toHaveBeenCalled();
  });

  it("opens an app scheme once it is allowed", async () => {
    const { getByRole } = await wrap(
      <Link href="myapp://orders/1" allowedSchemes={["myapp"]}>
        Order
      </Link>,
    );
    await fireEvent.press(getByRole("link"));
    expect(openURL).toHaveBeenCalledWith("myapp://orders/1");
  });
});

describe("ThemeProvider", () => {
  it("keeps the same theme object across unrelated re-renders", async () => {
    const seen: Theme[] = [];
    const Probe = () => {
      seen.push(useTheme().theme);
      return null;
    };
    const Parent = () => {
      const [count, setCount] = useState(0);
      return (
        <ThemeProvider>
          <Pressable onPress={() => setCount(count + 1)}>
            <Text>{`bump ${count}`}</Text>
          </Pressable>
          <Probe />
        </ThemeProvider>
      );
    };
    const { getByText } = await render(<Parent />);
    await fireEvent.press(getByText("bump 0"));
    expect(seen.length).toBeGreaterThan(1);
    expect(seen[seen.length - 1]).toBe(seen[0]);
  });
});

describe("Collapse", () => {
  it("keeps its children mounted until the closing animation ends", async () => {
    const tree = (open: boolean) => (
      <ThemeProvider>
        <Collapse open={open} duration={200}>
          <Text>Body</Text>
        </Collapse>
      </ThemeProvider>
    );
    const { queryByText, rerender } = await render(tree(true));
    await rerender(tree(false));
    // Collapsed content is hidden from assistive tech at once, so the query
    // has to include hidden elements to see that it is still mounted.
    const body = () => queryByText("Body", { includeHiddenElements: true });
    // Still there while the height animates down…
    expect(body()).toBeTruthy();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });
    // …and gone once it has.
    expect(body()).toBeNull();
  });
});
