import React from "react";
import { DrawerItem, DrawerSection, Drawer } from "@its/glowup-ui";

// DrawerItem is a row of Drawer; it is shown inside one.
const frame: React.CSSProperties = { height: 300, width: 340, display: "flex" };

export const States = () => (
  <div style={frame}>
    <Drawer width={320}>
      <DrawerSection>
        <DrawerItem
          label="Inbox"
          icon="inbox-outline"
          selected
          onClick={() => {}}
        />
        <DrawerItem label="Starred" icon="star-outline" onClick={() => {}} />
        <DrawerItem
          label="Archive"
          icon="archive-outline"
          disabled
          onClick={() => {}}
        />
      </DrawerSection>
    </Drawer>
  </div>
);

export const WithBadges = () => (
  <div style={frame}>
    <Drawer width={320}>
      <DrawerSection>
        <DrawerItem
          label="Inbox"
          icon="inbox-outline"
          badge={24}
          selected
          onClick={() => {}}
        />
        <DrawerItem
          label="Updates"
          icon="bell-outline"
          badge="New"
          onClick={() => {}}
        />
        <DrawerItem
          label="Drafts"
          icon="file-outline"
          badge={3}
          onClick={() => {}}
        />
      </DrawerSection>
    </Drawer>
  </div>
);

export const TextOnly = () => (
  <div style={frame}>
    <Drawer width={320}>
      <DrawerSection>
        <DrawerItem label="Overview" selected onClick={() => {}} />
        <DrawerItem label="Activity" onClick={() => {}} />
        <DrawerItem label="Settings" onClick={() => {}} />
      </DrawerSection>
    </Drawer>
  </div>
);

/** Items with `children` are a group: pressing one opens and closes its sub-items. */
export const Group = () => (
  <div style={frame}>
    <Drawer width={320}>
      <DrawerSection>
        <DrawerItem
          label="Reports"
          icon="chart-box-outline"
          defaultExpanded
          onClick={() => {}}
        >
          <DrawerItem label="Sales" selected onClick={() => {}} />
          <DrawerItem label="Agents" onClick={() => {}} />
        </DrawerItem>
        <DrawerItem label="Billing" icon="credit-card-outline">
          <DrawerItem label="Invoices" onClick={() => {}} />
          <DrawerItem label="Payment methods" onClick={() => {}} />
        </DrawerItem>
      </DrawerSection>
    </Drawer>
  </div>
);
