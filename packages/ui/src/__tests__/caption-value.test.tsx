import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import { CaptionValue, ThemeProvider } from "..";

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
    expect(empty.getByText("—")).toBeTruthy();
    const custom = await draw(
      <CaptionValue caption="Mobile" value={null} fallback="n/a" />,
    );
    expect(custom.getByText("n/a")).toBeTruthy();
    const zero = await draw(<CaptionValue caption="Open" value={0} />);
    expect(zero.getByText("0")).toBeTruthy();
    expect(zero.queryByText("—")).toBeNull();
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
});
