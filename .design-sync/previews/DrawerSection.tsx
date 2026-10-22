import React from "react";
import { DrawerItem, DrawerSection, Drawer } from "@its/glowup-ui";

// DrawerSection groups the rows of a Drawer; it is shown inside one.
const frame: React.CSSProperties = { height: 420, width: 340, display: "flex" };

export const TitledSections = () => (
  <div style={frame}>
    <Drawer width={320}>
      <DrawerSection title="Library">
        <DrawerItem
          label="All books"
          icon="bookshelf"
          selected
          onClick={() => {}}
        />
        <DrawerItem
          label="Reading now"
          icon="book-open-outline"
          onClick={() => {}}
        />
      </DrawerSection>
      <DrawerSection title="Collections" showDivider>
        <DrawerItem
          label="Favourites"
          icon="heart-outline"
          onClick={() => {}}
        />
        <DrawerItem
          label="To read"
          icon="bookmark-outline"
          onClick={() => {}}
        />
        <DrawerItem
          label="Finished"
          icon="check-circle-outline"
          onClick={() => {}}
        />
      </DrawerSection>
    </Drawer>
  </div>
);

export const Untitled = () => (
  <div style={frame}>
    <Drawer width={320}>
      <DrawerSection>
        <DrawerItem
          label="Home"
          icon="home-outline"
          selected
          onClick={() => {}}
        />
        <DrawerItem label="Explore" icon="compass-outline" onClick={() => {}} />
      </DrawerSection>
      <DrawerSection showDivider>
        <DrawerItem label="Settings" icon="cog-outline" onClick={() => {}} />
        <DrawerItem
          label="Help"
          icon="help-circle-outline"
          onClick={() => {}}
        />
      </DrawerSection>
    </Drawer>
  </div>
);

/** `collapsible` makes the title a button that opens and closes the items. */
export const Collapsible = () => (
  <div style={frame}>
    <Drawer width={320}>
      <DrawerSection title="Workspace" collapsible>
        <DrawerItem
          label="Dashboard"
          icon="view-dashboard-outline"
          selected
          onClick={() => {}}
        />
        <DrawerItem label="Projects" icon="folder-outline" onClick={() => {}} />
      </DrawerSection>
      <DrawerSection
        title="Administration"
        showDivider
        collapsible
        defaultExpanded={false}
      >
        <DrawerItem
          label="Users"
          icon="shield-account-outline"
          onClick={() => {}}
        />
        <DrawerItem label="Routes" icon="sitemap-outline" onClick={() => {}} />
      </DrawerSection>
    </Drawer>
  </div>
);
