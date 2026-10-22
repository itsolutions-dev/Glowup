import React from "react";
import {
  Button,
  DrawerItem,
  DrawerSection,
  Drawer,
  IconButton,
  Typography,
} from "@its/glowup-ui";

// Every state is `variant="static"`, a panel in the layout. A swipeable drawer
// slides over the whole window on a scrim, so it is not mounted open here:
// `<Drawer variant="swipeable" visible onClose={...}>` takes the same props.

const frame: React.CSSProperties = { height: 440, width: 340, display: "flex" };
const rail: React.CSSProperties = { height: 440, width: 120, display: "flex" };
const atRight: React.CSSProperties = {
  height: 360,
  width: 420,
  display: "flex",
  justifyContent: "flex-end",
};
const atTop: React.CSSProperties = {
  height: 300,
  width: 420,
  display: "flex",
  flexDirection: "column",
};
const atBottom: React.CSSProperties = {
  height: 300,
  width: 420,
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
};

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

// A menu with a group of sub-items and a collapsible section.
const Crm = () => (
  <>
    <DrawerSection>
      <DrawerItem
        label="Customers"
        icon="account-multiple-outline"
        selected
        onClick={() => {}}
      />
      <DrawerItem label="Reports" icon="chart-box-outline" defaultExpanded>
        <DrawerItem label="Sales" onClick={() => {}} />
        <DrawerItem label="Agents" onClick={() => {}} />
      </DrawerItem>
    </DrawerSection>
    <DrawerSection title="Administration" showDivider collapsible>
      <DrawerItem
        label="Users"
        icon="shield-account-outline"
        onClick={() => {}}
      />
      <DrawerItem label="Routes" icon="sitemap-outline" onClick={() => {}} />
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

/** Nested items, a collapsible section and a header: a menu with depth. */
export const NestedItems = () => (
  <div style={frame}>
    <Drawer
      width={320}
      header={
        <Button variant="outlined" onClick={() => {}}>
          Acme · Rome
        </Button>
      }
    >
      <Crm />
    </Drawer>
  </div>
);

/** `collapsed` keeps the icons and drops labels, badges and sub-items: 72 wide. */
export const Collapsed = () => (
  <div style={rail}>
    <Drawer
      collapsed
      header={
        <IconButton
          icon="domain"
          accessibilityLabel="Acme"
          onClick={() => {}}
        />
      }
    >
      <Crm />
    </Drawer>
  </div>
);

/** On the right, with a close button and actions: a drawer as a side sheet. */
export const SideSheet = () => (
  <div style={atRight}>
    <Drawer
      position="right"
      title="Filters"
      width={320}
      showCloseButton
      onClose={() => {}}
      actions={
        <>
          <Button onClick={() => {}}>Apply</Button>
          <Button variant="outlined" onClick={() => {}}>
            Reset
          </Button>
        </>
      }
    >
      <Typography variant="bodyMedium">
        Filters, details or a secondary form, beside the main content.
      </Typography>
    </Drawer>
  </div>
);

/** Top and bottom span the width and grow with their content, up to `height`. */
export const Top = () => (
  <div style={atTop}>
    <Drawer position="top" title="Mail" height={240}>
      <Mail />
    </Drawer>
  </div>
);

export const Bottom = () => (
  <div style={atBottom}>
    <Drawer position="bottom" title="Mail" height={240}>
      <Mail />
    </Drawer>
  </div>
);

/** `elevation` sets the tone of the surface, 0 to 5. */
export const Elevated = () => (
  <div style={frame}>
    <Drawer title="Mail" width={320} elevation={3}>
      <Mail />
    </Drawer>
  </div>
);
