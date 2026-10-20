import React from "react";
import { Button, DrawerItem, DrawerSection, Drawer } from "@its/glowup-ui";

const frame: React.CSSProperties = { height: 440, width: 340, display: "flex" };

const Mail = () => (
  <>
    <DrawerSection>
      <DrawerItem
        label="Inbox"
        icon="inbox-outline"
        badge={24}
        selected
        onClick={() => {}}
      />
      <DrawerItem label="Sent" icon="send-outline" onClick={() => {}} />
      <DrawerItem
        label="Drafts"
        icon="file-outline"
        badge={3}
        onClick={() => {}}
      />
    </DrawerSection>
    <DrawerSection title="Labels" showDivider>
      <DrawerItem label="Family" icon="label-outline" onClick={() => {}} />
      <DrawerItem label="Work" icon="label-outline" onClick={() => {}} />
    </DrawerSection>
  </>
);

export const Standard = () => (
  <div style={frame}>
    <Drawer title="Mail" width={320}>
      <Mail />
    </Drawer>
  </div>
);

export const WithFooter = () => (
  <div style={frame}>
    <Drawer
      title="Acme workspace"
      width={320}
      footer={
        <Button variant="text" iconName="logout" onClick={() => {}}>
          Sign out
        </Button>
      }
    >
      <DrawerSection>
        <DrawerItem
          label="Dashboard"
          icon="view-dashboard-outline"
          selected
          onClick={() => {}}
        />
        <DrawerItem label="Projects" icon="folder-outline" onClick={() => {}} />
        <DrawerItem
          label="Team"
          icon="account-group-outline"
          onClick={() => {}}
        />
        <DrawerItem
          label="Billing"
          icon="credit-card-outline"
          disabled
          onClick={() => {}}
        />
      </DrawerSection>
    </Drawer>
  </div>
);
