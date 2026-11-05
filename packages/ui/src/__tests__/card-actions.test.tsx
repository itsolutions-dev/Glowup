import React from "react";
import { Text } from "react-native";
import { fireEvent, render, within } from "@testing-library/react-native";
import { Button, Card, ThemeProvider } from "..";

// A pressable Card was one button around everything in it: its Card.Actions
// buttons were nested inside it (invalid on the web, and on iOS merged into
// the card's single element, out of VoiceOver's reach).
const draw = (onOpen = jest.fn(), onConfirm = jest.fn()) =>
  render(
    <ThemeProvider>
      <Card onClick={onOpen} accessibilityLabel="Line 4" selected={false}>
        <Card.Title title="Line 4" subtitle="Scheduled maintenance" />
        <Card.Content>
          <Text>Next service: 12 March</Text>
        </Card.Content>
        <Card.Actions>
          <Button onClick={onConfirm}>Confirm</Button>
        </Card.Actions>
      </Card>
    </ThemeProvider>,
  );

describe("Card with actions", () => {
  it("keeps the action buttons out of the card's own button", async () => {
    const view = await draw();
    const card = view.getByRole("button", { name: "Line 4" });
    expect(within(card).queryByText("Confirm")).toBeNull();
    expect(within(card).getByText("Next service: 12 March")).toBeTruthy();
    expect(view.getByRole("button", { name: "Confirm" })).toBeTruthy();
  });

  it("an action runs alone; the body still opens the card", async () => {
    const onOpen = jest.fn();
    const onConfirm = jest.fn();
    const view = await draw(onOpen, onConfirm);
    await fireEvent.press(view.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
    await fireEvent.press(view.getByText("Next service: 12 March"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
