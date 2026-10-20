import React from "react";
import { Dimensions, Text } from "react-native";
import { render } from "@testing-library/react-native";
import { ThemeProvider, ViewportProvider, useBreakpoint } from "..";

const Probe = () => {
  const { width, sizeClass } = useBreakpoint();
  return <Text>{`${sizeClass}:${width}`}</Text>;
};

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("ViewportProvider", () => {
  it("makes useBreakpoint report the width it sets", async () => {
    const { getByText } = await draw(
      <ViewportProvider width={360}>
        <Probe />
      </ViewportProvider>,
    );
    expect(getByText("compact:360")).toBeTruthy();
  });

  it("reports the real window when it sets no width", async () => {
    const { toJSON } = await draw(
      <ViewportProvider>
        <Probe />
      </ViewportProvider>,
    );
    expect(JSON.stringify(toJSON())).toContain(
      `:${Dimensions.get("window").width}`,
    );
  });

  it("nests: the inner provider wins", async () => {
    const { getByText } = await draw(
      <ViewportProvider width={1000}>
        <ViewportProvider width={720}>
          <Probe />
        </ViewportProvider>
      </ViewportProvider>,
    );
    expect(getByText("medium:720")).toBeTruthy();
  });
});
