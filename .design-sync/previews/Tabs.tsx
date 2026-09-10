import React from "react";
import { Tabs } from "@its/glowup-ui";

const wrap: React.CSSProperties = { width: 400, display: "flex" };

export const TextTabs = () => (
  <div style={wrap}>
    <Tabs
      tabs={["Overview", "Specs", "Reviews"]}
      activeTab={0}
      onChange={() => {}}
    />
  </div>
);

export const IconTabs = () => (
  <div style={wrap}>
    <Tabs
      activeTab={0}
      onChange={() => {}}
      tabs={[
        { label: "Home", icon: "home" },
        { label: "Reports", icon: "chart-box" },
        { label: "Team", icon: "account-group" },
        { label: "Settings", icon: "cog" },
      ]}
    />
  </div>
);

export const FourTabs = () => (
  <div style={wrap}>
    <Tabs
      tabs={["Details", "Activity", "Files", "Notes"]}
      activeTab={2}
      onChange={() => {}}
    />
  </div>
);

export const TwoTabs = () => (
  <div style={wrap}>
    <Tabs
      tabs={["Sign in", "Create account"]}
      activeTab={0}
      onChange={() => {}}
    />
  </div>
);
