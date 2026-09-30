import React from "react";
import { Avatar, IconButton, TopAppBar } from "@its/glowup-ui";

const bar: React.CSSProperties = { width: 400, display: "flex" };

const back = (
  <IconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => {}} />
);

const actions = (
  <>
    <IconButton icon="magnify" accessibilityLabel="Search" onPress={() => {}} />
    <IconButton
      icon="dots-vertical"
      accessibilityLabel="More"
      onPress={() => {}}
    />
  </>
);

export const Small = () => (
  <div style={bar}>
    <TopAppBar
      title="Inbox"
      leading={back}
      actions={actions}
      safeArea={false}
    />
  </div>
);

export const CenterAligned = () => (
  <div style={bar}>
    <TopAppBar
      variant="center"
      title="Glowup"
      leading={
        <IconButton icon="menu" accessibilityLabel="Menu" onPress={() => {}} />
      }
      actions={<Avatar name="Marta Rossi" size={32} />}
      safeArea={false}
    />
  </div>
);

export const Medium = () => (
  <div style={bar}>
    <TopAppBar
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
    <TopAppBar
      variant="large"
      title="Quarterly report"
      leading={back}
      actions={actions}
      safeArea={false}
    />
  </div>
);

export const Elevated = () => (
  <div style={bar}>
    <TopAppBar
      elevated
      title="Invoice #10428"
      leading={back}
      actions={actions}
      safeArea={false}
    />
  </div>
);
