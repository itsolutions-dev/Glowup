import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { Button, Dialog, ThemeProvider } from "..";

// `initialFocus="actions"` starts on the least destructive button. A leading
// "Delete" comes first in the row, so it must not be the one focused.
describe("Dialog initialFocus with leadingActions", () => {
  it("focuses the trailing actions, not the leading ones", async () => {
    render(
      <ThemeProvider>
        <Dialog
          visible
          title="Edit route"
          animationType="none"
          initialFocus="actions"
          leadingActions={<Button>Delete</Button>}
          actions={<Button>Cancel</Button>}
        >
          Body
        </Dialog>
      </ThemeProvider>,
    );
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Cancel" }),
      ),
    );
  });
});
