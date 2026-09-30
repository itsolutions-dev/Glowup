import React from "react";
import { DrawerItem, DrawerSection, NavigationDrawer } from "@its/glowup-ui";

// DrawerSection groups the rows of a NavigationDrawer; it is shown inside one.
const frame: React.CSSProperties = { height: 420, width: 340, display: "flex" };

export const TitledSections = () => (
  <div style={frame}>
    <NavigationDrawer width={320}>
      <DrawerSection title="Library">
        <DrawerItem
          label="All books"
          icon="bookshelf"
          selected
          onPress={() => {}}
        />
        <DrawerItem
          label="Reading now"
          icon="book-open-outline"
          onPress={() => {}}
        />
      </DrawerSection>
      <DrawerSection title="Collections" showDivider>
        <DrawerItem
          label="Favourites"
          icon="heart-outline"
          onPress={() => {}}
        />
        <DrawerItem
          label="To read"
          icon="bookmark-outline"
          onPress={() => {}}
        />
        <DrawerItem
          label="Finished"
          icon="check-circle-outline"
          onPress={() => {}}
        />
      </DrawerSection>
    </NavigationDrawer>
  </div>
);

export const Untitled = () => (
  <div style={frame}>
    <NavigationDrawer width={320}>
      <DrawerSection>
        <DrawerItem
          label="Home"
          icon="home-outline"
          selected
          onPress={() => {}}
        />
        <DrawerItem label="Explore" icon="compass-outline" onPress={() => {}} />
      </DrawerSection>
      <DrawerSection showDivider>
        <DrawerItem label="Settings" icon="cog-outline" onPress={() => {}} />
        <DrawerItem
          label="Help"
          icon="help-circle-outline"
          onPress={() => {}}
        />
      </DrawerSection>
    </NavigationDrawer>
  </div>
);
