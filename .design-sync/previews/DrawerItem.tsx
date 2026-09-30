import React from "react";
import { DrawerItem, DrawerSection, NavigationDrawer } from "@its/glowup-ui";

// DrawerItem is a row of NavigationDrawer; it is shown inside one.
const frame: React.CSSProperties = { height: 300, width: 340, display: "flex" };

export const States = () => (
  <div style={frame}>
    <NavigationDrawer width={320}>
      <DrawerSection>
        <DrawerItem
          label="Inbox"
          icon="inbox-outline"
          selected
          onPress={() => {}}
        />
        <DrawerItem label="Starred" icon="star-outline" onPress={() => {}} />
        <DrawerItem
          label="Archive"
          icon="archive-outline"
          disabled
          onPress={() => {}}
        />
      </DrawerSection>
    </NavigationDrawer>
  </div>
);

export const WithBadges = () => (
  <div style={frame}>
    <NavigationDrawer width={320}>
      <DrawerSection>
        <DrawerItem
          label="Inbox"
          icon="inbox-outline"
          badge={24}
          selected
          onPress={() => {}}
        />
        <DrawerItem
          label="Updates"
          icon="bell-outline"
          badge="New"
          onPress={() => {}}
        />
        <DrawerItem
          label="Drafts"
          icon="file-outline"
          badge={3}
          onPress={() => {}}
        />
      </DrawerSection>
    </NavigationDrawer>
  </div>
);

export const TextOnly = () => (
  <div style={frame}>
    <NavigationDrawer width={320}>
      <DrawerSection>
        <DrawerItem label="Overview" selected onPress={() => {}} />
        <DrawerItem label="Activity" onPress={() => {}} />
        <DrawerItem label="Settings" onPress={() => {}} />
      </DrawerSection>
    </NavigationDrawer>
  </div>
);
