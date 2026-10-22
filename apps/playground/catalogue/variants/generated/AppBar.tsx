// GENERATED — do not edit.
// Source: .design-sync/previews/AppBar.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { AppBar, Avatar, Button, IconButton } from "@its/glowup-ui";

const bar: ViewStyle = { width: 400, flexDirection: "row" };

const trailing: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  paddingRight: 8,
};

const back = (
  <IconButton icon="arrow-left" accessibilityLabel="Back" onClick={() => {}} />
);

const actions = (
  <>
    <IconButton icon="magnify" accessibilityLabel="Search" onClick={() => {}} />
    <IconButton
      icon="dots-vertical"
      accessibilityLabel="More"
      onClick={() => {}}
    />
  </>
);

// The four sizes of the M3 top app bar, on a screen's own `title`, `leading`
// and `actions`.
export const Small = () => (
  <View style={bar}>
    <AppBar title="Inbox" leading={back} actions={actions} safeArea={false} />
  </View>
);

export const CenterAligned = () => (
  <View style={bar}>
    <AppBar
      variant="center"
      title="Glowup"
      leading={
        <IconButton icon="menu" accessibilityLabel="Menu" onClick={() => {}} />
      }
      actions={<Avatar name="Marta Rossi" size={32} />}
      safeArea={false}
    />
  </View>
);

export const Medium = () => (
  <View style={bar}>
    <AppBar
      variant="medium"
      title="Team settings"
      subtitle="12 members"
      leading={back}
      actions={actions}
      safeArea={false}
    />
  </View>
);

export const Large = () => (
  <View style={bar}>
    <AppBar
      variant="large"
      title="Quarterly report"
      leading={back}
      actions={actions}
      safeArea={false}
    />
  </View>
);

/** `elevated` is the on-scroll state: `surfaceContainer` instead of `surface`. */
export const Elevated = () => (
  <View style={bar}>
    <AppBar
      elevated
      title="Invoice #10428"
      leading={back}
      actions={actions}
      safeArea={false}
    />
  </View>
);

/** `paper` goes to the `Paper` the bar is drawn on: here level 3. */
export const OnPaper = () => (
  <View style={bar}>
    <AppBar
      title="Reports"
      paper={{ elevation: 3 }}
      leading={back}
      actions={actions}
      safeArea={false}
    />
  </View>
);

export const WithDivider = () => (
  <View style={bar}>
    <AppBar
      divider
      title="Settings"
      leading={back}
      actions={actions}
      safeArea={false}
    />
  </View>
);

// As a navigator's `header`, the bar reads react-navigation's contract:
// `navigation`, `route`, `options` and `back` give it the title, the back or
// menu button and the actions.
const drawerNav = { openDrawer: () => {}, goBack: () => {} };
const stackNav = { goBack: () => {} };

export const UnderADrawerNavigator = () => (
  <View style={bar}>
    <AppBar
      navigation={drawerNav}
      route={{ name: "Dashboard" }}
      options={{
        title: "Dashboard",
        headerRight: () => (
          <View style={trailing}>
            <IconButton
              icon="bell-outline"
              accessibilityLabel="Notifications"
              onClick={() => {}}
            />
            <Avatar name="Marta Rossi" size={32} />
          </View>
        ),
      }}
    />
  </View>
);

export const WithBackAction = () => (
  <View style={bar}>
    <AppBar
      navigation={stackNav}
      route={{ name: "InvoiceDetail" }}
      options={{
        title: "Invoice #10428",
        headerRight: () => (
          <View style={trailing}>
            <Button variant="text" iconName="download" onClick={() => {}}>
              PDF
            </Button>
          </View>
        ),
      }}
      back={{ title: "Invoices" }}
    />
  </View>
);

export const Pinned = () => (
  <View style={bar}>
    <AppBar
      navigation={drawerNav}
      route={{ name: "Settings" }}
      options={{ title: "Team settings" }}
      isPinned
    />
  </View>
);

export const TitleOnly = () => (
  <View style={bar}>
    <AppBar
      navigation={{}}
      route={{ name: "Notifications" }}
      options={{ hideMenuIcon: true }}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Small",
    title: "Small",
    render: Small,
  },
  {
    name: "CenterAligned",
    title: "Center aligned",
    render: CenterAligned,
  },
  {
    name: "Medium",
    title: "Medium",
    render: Medium,
  },
  {
    name: "Large",
    title: "Large",
    render: Large,
  },
  {
    name: "Elevated",
    title: "Elevated",
    description:
      "`elevated` is the on-scroll state: `surfaceContainer` instead of `surface`.",
    render: Elevated,
  },
  {
    name: "OnPaper",
    title: "On paper",
    description:
      "`paper` goes to the `Paper` the bar is drawn on: here level 3.",
    render: OnPaper,
  },
  {
    name: "WithDivider",
    title: "With divider",
    render: WithDivider,
  },
  {
    name: "UnderADrawerNavigator",
    title: "Under a drawer navigator",
    render: UnderADrawerNavigator,
  },
  {
    name: "WithBackAction",
    title: "With back action",
    render: WithBackAction,
  },
  {
    name: "Pinned",
    title: "Pinned",
    render: Pinned,
  },
  {
    name: "TitleOnly",
    title: "Title only",
    render: TitleOnly,
  },
];
