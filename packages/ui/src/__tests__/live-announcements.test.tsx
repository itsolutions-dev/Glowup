import React from "react";
import { AccessibilityInfo, Platform } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { Banner, Snackbar, ThemeProvider } from "..";

// iOS has no live regions: what Android reads from accessibilityLiveRegion,
// VoiceOver only hears through announceForAccessibility.
const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

let announce: jest.SpyInstance;
beforeEach(() => {
  announce = jest
    .spyOn(AccessibilityInfo, "announceForAccessibility")
    .mockImplementation(() => {});
});
afterEach(() => announce.mockRestore());

describe("Snackbar announcements", () => {
  it("announces the message on iOS when it shows", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const view = await draw(<Snackbar visible={false} message="Saved" />);
    expect(announce).not.toHaveBeenCalled();
    await view.rerender(
      <ThemeProvider>
        <Snackbar visible message="Saved" />
      </ThemeProvider>,
    );
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith("Saved");
  });

  it("announces a toast that mounts already visible", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    await draw(<Snackbar visible message="Copied" />);
    expect(announce).toHaveBeenCalledWith("Copied");
  });

  it.each(["android", "web"] as const)(
    "leaves %s to its live region",
    async (os) => {
      jest.replaceProperty(Platform, "OS", os);
      await draw(<Snackbar visible message="Saved" />);
      expect(announce).not.toHaveBeenCalled();
    },
  );
});

describe("Snackbar that never times out", () => {
  it("gets a close button when nothing else could dismiss it", async () => {
    const onDismiss = jest.fn();
    const view = await draw(
      <Snackbar visible message="Offline" duration={0} onDismiss={onDismiss} />,
    );
    await fireEvent.press(view.getByRole("button", { name: "Close" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("keeps the old look while a timer or an action can dismiss it", async () => {
    const timed = await draw(
      <Snackbar visible message="Saved" onDismiss={() => {}} />,
    );
    expect(timed.queryByRole("button", { name: "Close" })).toBeNull();
    const withAction = await draw(
      <Snackbar
        visible
        message="Deleted"
        duration={0}
        onDismiss={() => {}}
        action={{ label: "Undo", onClick: () => {} }}
      />,
    );
    expect(withAction.queryByRole("button", { name: "Close" })).toBeNull();
  });
});

describe("Banner announcements", () => {
  it("announces on iOS when it appears or its message changes, not on mount", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const view = await draw(<Banner visible message="Offline" />);
    expect(announce).not.toHaveBeenCalled();

    const show = (visible: boolean, message: string) =>
      view.rerender(
        <ThemeProvider>
          <Banner visible={visible} message={message} />
        </ThemeProvider>,
      );
    await show(false, "Offline");
    await show(true, "Offline");
    expect(announce).toHaveBeenLastCalledWith("Offline");
    await show(true, "Back online");
    expect(announce).toHaveBeenLastCalledWith("Back online");
    expect(announce).toHaveBeenCalledTimes(2);
  });

  it("is a polite status on the web, not an alert that interrupts", async () => {
    jest.replaceProperty(Platform, "OS", "web");
    const { getByText } = await draw(<Banner visible message="Offline" />);
    let node = getByText("Offline").parent;
    while (node && node.props.role === undefined) node = node.parent;
    expect(node?.props.role).toBe("status");
    expect(node?.props.accessibilityRole).toBeUndefined();
  });
});
