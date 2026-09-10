import React from "react";
import { AppBar, Avatar, Button, IconBadge } from "@its/glowup-ui";

const bar: React.CSSProperties = { width: 400, display: "flex" };

const trailing: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  paddingRight: 8,
};

const drawerNav = { openDrawer: () => {}, goBack: () => {} };
const stackNav = { goBack: () => {} };

export const Default = () => (
  <div style={bar}>
    <AppBar
      navigation={drawerNav}
      route={{ name: "Dashboard" }}
      options={{
        title: "Dashboard",
        headerRight: () => (
          <div style={trailing}>
            <IconBadge
              iconName="bell-outline"
              badgeCount={4}
              onPress={() => {}}
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
            <Button mode="text" iconName="download" onPress={() => {}}>
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
