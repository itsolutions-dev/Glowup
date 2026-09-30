import React from "react";
import {
  Button,
  DrawerItem,
  DrawerSection,
  NavigationDrawer,
} from "@its/glowup-ui";

const frame: React.CSSProperties = { height: 440, width: 340, display: "flex" };

const Mail = () => (
  <>
    <DrawerSection>
      <DrawerItem
        label="Inbox"
        icon="inbox-outline"
        badge={24}
        selected
        onPress={() => {}}
      />
      <DrawerItem label="Sent" icon="send-outline" onPress={() => {}} />
      <DrawerItem
        label="Drafts"
        icon="file-outline"
        badge={3}
        onPress={() => {}}
      />
    </DrawerSection>
    <DrawerSection title="Labels" showDivider>
      <DrawerItem label="Family" icon="label-outline" onPress={() => {}} />
      <DrawerItem label="Work" icon="label-outline" onPress={() => {}} />
    </DrawerSection>
  </>
);

export const Standard = () => (
  <div style={frame}>
    <NavigationDrawer title="Mail" width={320}>
      <Mail />
    </NavigationDrawer>
  </div>
);

export const WithFooter = () => (
  <div style={frame}>
    <NavigationDrawer
      title="Acme workspace"
      width={320}
      footer={
        <Button mode="text" iconName="logout" onPress={() => {}}>
          Sign out
        </Button>
      }
    >
      <DrawerSection>
        <DrawerItem
          label="Dashboard"
          icon="view-dashboard-outline"
          selected
          onPress={() => {}}
        />
        <DrawerItem label="Projects" icon="folder-outline" onPress={() => {}} />
        <DrawerItem
          label="Team"
          icon="account-group-outline"
          onPress={() => {}}
        />
        <DrawerItem
          label="Billing"
          icon="credit-card-outline"
          disabled
          onPress={() => {}}
        />
      </DrawerSection>
    </NavigationDrawer>
  </div>
);
