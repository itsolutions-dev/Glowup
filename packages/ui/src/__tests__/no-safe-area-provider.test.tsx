import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import {
  AppBar,
  Drawer,
  DrawerItem,
  FAB,
  SpeedDial,
  ThemeProvider,
  Toolbar,
} from "..";

// These read the safe-area insets, and threw ("No safe area value available")
// in an app without a SafeAreaProvider. Without one the insets are zero.
const cases: [string, React.ReactElement][] = [
  ["AppBar", <AppBar key="a" title="Orders" />],
  [
    "Toolbar",
    <Toolbar key="t">
      <Text>Tools</Text>
    </Toolbar>,
  ],
  ["FAB", <FAB key="f" icon="plus" label="New" onClick={() => {}} />],
  [
    "animated FAB",
    <FAB
      key="af"
      variant="animated"
      icon="plus"
      label="New"
      onClick={() => {}}
    />,
  ],
  [
    "SpeedDial",
    <SpeedDial
      key="s"
      mainIcon="plus"
      actions={[{ id: 1, icon: "pencil", label: "Edit", onPress: () => {} }]}
    />,
  ],
  [
    "a swipeable Drawer",
    <Drawer key="d" variant="swipeable" visible onClose={() => {}}>
      <DrawerItem label="Inbox" onClick={() => {}} />
    </Drawer>,
  ],
];

it.each(cases)("%s renders without a SafeAreaProvider", async (_name, ui) => {
  await expect(
    render(<ThemeProvider>{ui}</ThemeProvider>),
  ).resolves.toBeTruthy();
});
