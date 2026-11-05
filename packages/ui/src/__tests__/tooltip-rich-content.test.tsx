import React from "react";
import { Text, View } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { ThemeProvider, Tooltip } from "../index";

// A rich tooltip's body can be laid out (a small sum, a list), not only a sentence.
describe("Tooltip with a node as content", () => {
  const breakdown = (
    <View>
      <Text>Contactable 10.104</Text>
      <Text>− Reached 3.244</Text>
      <Text>To contact 6.860</Text>
    </View>
  );

  it("draws the node in a rich tooltip", async () => {
    const { getByLabelText, getByText } = await render(
      <ThemeProvider>
        <Tooltip
          variant="rich"
          title="To contact"
          content={breakdown}
          enterDelay={0}
        >
          <Text>Anchor</Text>
        </Tooltip>
      </ThemeProvider>,
    );
    await fireEvent(getByLabelText("To contact"), "longPress");
    expect(getByText("− Reached 3.244")).toBeTruthy();
  });

  it("names the anchor by the title alone, never by the node", async () => {
    const { getByLabelText } = await render(
      <ThemeProvider>
        <Tooltip variant="rich" title="To contact" content={breakdown}>
          <Text>Anchor</Text>
        </Tooltip>
      </ThemeProvider>,
    );
    expect(getByLabelText("To contact").props.accessibilityLabel).toBe(
      "To contact",
    );
  });
});
