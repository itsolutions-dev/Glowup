import React from "react";
import { Avatar, IconButton, AppBar } from "@its/glowup-ui";

const bar: React.CSSProperties = { width: 400, display: "flex" };

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
