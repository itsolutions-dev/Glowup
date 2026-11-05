import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { Checkbox, FormControl, ThemeProvider } from "..";

// A disabled FormControl dimmed its control and left it working.
it("a disabled FormControl's control takes no presses", async () => {
  const onValueChange = jest.fn();
  const view = await render(
    <ThemeProvider>
      <FormControl label="Terms" disabled>
        <Checkbox
          label="I accept"
          checked={false}
          onValueChange={onValueChange}
        />
      </FormControl>
    </ThemeProvider>,
  );
  await fireEvent.press(view.getByLabelText("I accept"));
  expect(onValueChange).not.toHaveBeenCalled();
});
