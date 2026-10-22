import React from "react";
import { AppBar, Avatar, Button, IconButton } from "@its/glowup-ui";

const bar: React.CSSProperties = { width: 400, display: "flex" };

const trailing: React.CSSProperties = {
  display: "flex",
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
  <div style={bar}>
    <AppBar title="Inbox" leading={back} actions={actions} safeArea={false} />
  </div>
);

export const CenterAligned = () => (
  <div style={bar}>
    <AppBar
      variant="center"
      title="Glowup"
      leading={
        <IconButton icon="menu" accessibilityLabel="Menu" onClick={() => {}} />
      }
      actions={<Avatar name="Marta Rossi" size={32} />}
      safeArea={false}
    />
  </div>
);

export const Medium = () => (
  <div style={bar}>
    <AppBar
      variant="medium"
      title="Team settings"
      subtitle="12 members"
      leading={back}
      actions={actions}
      safeArea={false}
    />
  </div>
);

export const Large = () => (
  <div style={bar}>
    <AppBar
      variant="large"
      title="Quarterly report"
      leading={back}
      actions={actions}
      safeArea={false}
    />
  </div>
);

/** `elevated` is the on-scroll state: `surfaceContainer` instead of `surface`. */
export const Elevated = () => (
  <div style={bar}>
    <AppBar
      elevated
      title="Invoice #10428"
      leading={back}
      actions={actions}
      safeArea={false}
    />
  </div>
);

/** `paper` goes to the `Paper` the bar is drawn on: here level 3. */
export const OnPaper = () => (
  <div style={bar}>
    <AppBar
      title="Reports"
      paper={{ elevation: 3 }}
      leading={back}
      actions={actions}
      safeArea={false}
    />
  </div>
);

export const WithDivider = () => (
  <div style={bar}>
    <AppBar
      divider
      title="Settings"
      leading={back}
      actions={actions}
      safeArea={false}
    />
  </div>
);

// As a navigator's `header`, the bar reads react-navigation's contract:
// `navigation`, `route`, `options` and `back` give it the title, the back or
// menu button and the actions.
const drawerNav = { openDrawer: () => {}, goBack: () => {} };
const stackNav = { goBack: () => {} };

export const UnderADrawerNavigator = () => (
  <div style={bar}>
    <AppBar
      navigation={drawerNav}
      route={{ name: "Dashboard" }}
      options={{
        title: "Dashboard",
        headerRight: () => (
          <div style={trailing}>
            <IconButton
              icon="bell-outline"
              accessibilityLabel="Notifications"
              onClick={() => {}}
            />
            <Avatar name="Marta Rossi" size={32} />
          </div>
        ),
      }}
    />
  </div>
);

export const WithBackAction = () => (
  <div style={bar}>
    <AppBar
      navigation={stackNav}
      route={{ name: "InvoiceDetail" }}
      options={{
        title: "Invoice #10428",
        headerRight: () => (
          <div style={trailing}>
            <Button variant="text" iconName="download" onClick={() => {}}>
              PDF
            </Button>
          </div>
        ),
      }}
      back={{ title: "Invoices" }}
    />
  </div>
);

export const Pinned = () => (
  <div style={bar}>
    <AppBar
      navigation={drawerNav}
      route={{ name: "Settings" }}
      options={{ title: "Team settings" }}
      isPinned
    />
  </div>
);

export const TitleOnly = () => (
  <div style={bar}>
    <AppBar
      navigation={{}}
      route={{ name: "Notifications" }}
      options={{ hideMenuIcon: true }}
    />
  </div>
);
