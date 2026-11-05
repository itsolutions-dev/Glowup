import React, { useEffect } from "react";
import { Text } from "react-native";
import { act, render, within } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  BottomSheet,
  Dialog,
  Drawer,
  DrawerItem,
  ThemeProvider,
  ToastProvider,
  useToast,
} from "..";

// On iOS and Android a Dialog, BottomSheet or swipeable Drawer is a separate
// native window: toasts drawn at the app's root sat under it, out of sight.
// The topmost open overlay now draws them inside its own window.
let toast: ReturnType<typeof useToast>;
const Grab = () => {
  const api = useToast();
  useEffect(() => {
    toast = api;
  });
  return null;
};

const draw = (overlay: React.ReactElement | null) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <ToastProvider>
          <Grab />
          <Text>Screen</Text>
          {overlay}
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );

const overlays: [string, (visible: boolean) => React.ReactElement][] = [
  [
    "Dialog",
    (visible) => (
      <Dialog visible={visible} title="Edit" testID="overlay">
        <Text>Body</Text>
      </Dialog>
    ),
  ],
  [
    "BottomSheet",
    (visible) => (
      <BottomSheet visible={visible} onClose={() => {}} testID="overlay">
        <Text>Body</Text>
      </BottomSheet>
    ),
  ],
  [
    "swipeable Drawer",
    (visible) => (
      <Drawer
        variant="swipeable"
        visible={visible}
        onClose={() => {}}
        testID="overlay"
      >
        <DrawerItem label="Inbox" onClick={() => {}} />
      </Drawer>
    ),
  ],
];

describe.each(overlays)("a toast while a %s is open", (_name, overlay) => {
  it("is drawn inside the overlay's window, and back at the root once it closes", async () => {
    const view = await draw(overlay(true));
    await act(async () => {
      toast.show({ message: "Saved", duration: 0 });
    });
    const layer = view.getByTestId("overlay");
    expect(
      within(layer).getByText("Saved", { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(
      view.getAllByText("Saved", { includeHiddenElements: true }),
    ).toHaveLength(1);

    await view.rerender(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <ThemeProvider>
          <ToastProvider>
            <Grab />
            <Text>Screen</Text>
            {overlay(false)}
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>,
    );
    // Closing, the overlay may still be on screen for its exit animation; the
    // toast is already back at the root, and drawn once.
    expect(view.getAllByText("Saved")).toHaveLength(1);
    const leaving = view.queryByTestId("overlay");
    if (leaving) {
      expect(
        within(leaving).queryByText("Saved", { includeHiddenElements: true }),
      ).toBeNull();
    }
  });
});

it("with no overlay open, the toast is at the root as before", async () => {
  const view = await draw(null);
  await act(async () => {
    toast.show({ message: "Saved", duration: 0 });
  });
  expect(view.getAllByText("Saved")).toHaveLength(1);
});
