import React from "react";
import { render } from "@testing-library/react-native";
import { ThemeProvider } from "@its/glowup-ui";
import NativeCheck from "../app/native-check";

// The screen only runs in the native smoke job, so this just keeps it from
// breaking unnoticed: it mounts, and shows what the Android script looks for.
describe("native check screen", () => {
  it("mounts with its title, its interaction controls and pending measurements", async () => {
    const { getByText, getByLabelText } = await render(
      <ThemeProvider>
        <NativeCheck />
      </ThemeProvider>,
    );
    expect(getByText("Native check")).toBeTruthy();
    expect(getByLabelText("Amount")).toBeTruthy();
    expect(getByText("reported=")).toBeTruthy();
    expect(getByText("badge=0")).toBeTruthy();
    expect(getByText("tab=overview")).toBeTruthy();
    expect(getByText("sheet=closed")).toBeTruthy();
    // jest lays nothing out, so no measurement has arrived yet.
    expect(getByText(/^PENDING input dense is 24 shorter/)).toBeTruthy();
  });
});
