import React from "react";
import { render } from "@testing-library/react-native";
import { Button, IconButton, ThemeProvider } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("badge on Button and IconButton", () => {
  it("shows the count after a Button's label and exposes it to assistive tech", async () => {
    const { getByText, getByRole } = await draw(
      <Button iconName="filter-outline" badge={3}>
        Filters
      </Button>,
    );
    expect(getByText("Filters")).toBeTruthy();
    expect(getByText("3")).toBeTruthy();
    expect(getByRole("button").props.accessibilityValue).toEqual({ text: "3" });
  });

  it("caps a large count the way Badge does", async () => {
    const { getByText } = await draw(<Button badge={120}>Inbox</Button>);
    expect(getByText("99+")).toBeTruthy();
  });

  it("draws nothing at 0 or without the prop", async () => {
    const zero = await draw(<Button badge={0}>Filters</Button>);
    expect(zero.queryByText("0")).toBeNull();
    expect(
      zero.getByRole("button").props.accessibilityValue?.text,
    ).toBeUndefined();
    const none = await draw(<Button>Filters</Button>);
    expect(
      none.getByRole("button").props.accessibilityValue?.text,
    ).toBeUndefined();
  });

  it("puts the count on an IconButton", async () => {
    const { getByText, getByRole } = await draw(
      <IconButton icon="bell-outline" accessibilityLabel="Alerts" badge={7} />,
    );
    expect(getByText("7")).toBeTruthy();
    expect(getByRole("button").props.accessibilityValue).toEqual({ text: "7" });
    const empty = await draw(
      <IconButton icon="bell-outline" accessibilityLabel="Alerts" badge={0} />,
    );
    expect(empty.queryByText("0")).toBeNull();
  });
});
