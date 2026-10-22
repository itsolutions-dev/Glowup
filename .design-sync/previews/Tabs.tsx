import React from "react";
import { Tabs } from "@its/glowup-ui";

const wrap: React.CSSProperties = { width: 400, display: "flex" };
const stack: React.CSSProperties = {
  width: 400,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};
const narrow: React.CSSProperties = { width: 320, display: "flex" };

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

export const KeysAndDisabled = () => (
  <div style={wrap}>
    <Tabs
      tabs={[
        { label: "Overview", key: "overview" },
        { label: "Billing", key: "billing" },
        { label: "Audit log", key: "audit", disabled: true },
      ]}
      activeKey="billing"
      onChange={() => {}}
    />
  </div>
);

/** `variant="rounded"`: a pill on a rounded track instead of an underline. */
export const Rounded = () => (
  <div style={wrap}>
    <Tabs
      variant="rounded"
      tabs={["Overview", "Specs", "Reviews"]}
      activeTab={1}
      onChange={() => {}}
    />
  </div>
);

/** In the rounded variant the icon sits before the label, not above it. */
export const RoundedWithIcons = () => (
  <div style={wrap}>
    <Tabs
      variant="rounded"
      activeTab={0}
      onChange={() => {}}
      tabs={[
        { label: "Home", icon: "home" },
        { label: "Reports", icon: "chart-box" },
        { label: "Team", icon: "account-group" },
      ]}
    />
  </div>
);

/** `showBorders` draws dividers between the tabs, and an outline on the rounded track. */
export const WithBorders = () => (
  <div style={stack}>
    <Tabs
      showBorders
      tabs={["Overview", "Specs", "Reviews"]}
      activeTab={0}
      onChange={() => {}}
    />
    <Tabs
      showBorders
      variant="rounded"
      tabs={["Overview", "Specs", "Reviews"]}
      activeTab={2}
      onChange={() => {}}
    />
  </div>
);

/** `size` sets the height and the type: sm 40, md 48, lg 56. */
export const Sizes = () => (
  <div style={stack}>
    <Tabs
      size="sm"
      tabs={["Overview", "Specs", "Reviews"]}
      activeTab={0}
      onChange={() => {}}
    />
    <Tabs
      size="md"
      tabs={["Overview", "Specs", "Reviews"]}
      activeTab={0}
      onChange={() => {}}
    />
    <Tabs
      size="lg"
      tabs={["Overview", "Specs", "Reviews"]}
      activeTab={0}
      onChange={() => {}}
    />
  </div>
);

/** `color` is a colour role: it paints the indicator and the selected tab. */
export const Colors = () => (
  <div style={stack}>
    <Tabs
      color="secondary"
      tabs={["Overview", "Specs", "Reviews"]}
      activeTab={1}
      onChange={() => {}}
    />
    <Tabs
      color="error"
      variant="rounded"
      tabs={["Open", "Failing", "Closed"]}
      activeTab={1}
      onChange={() => {}}
    />
  </div>
);

/** `fullWidth={false}` sizes each tab to its label; the bar scrolls when they do not fit. */
export const ScrollingTabs = () => (
  <div style={narrow}>
    <Tabs
      fullWidth={false}
      tabs={[
        "Overview",
        "Activity",
        "Files",
        "Notes",
        "Billing",
        "Audit log",
        "Settings",
      ]}
      activeTab={3}
      onChange={() => {}}
    />
  </div>
);

/** `width` and `height` override the bar's own size: dp or a percentage. */
export const FixedSize = () => (
  <div style={wrap}>
    <Tabs
      width={280}
      height={64}
      tabs={["Overview", "Specs", "Reviews"]}
      activeTab={0}
      onChange={() => {}}
    />
  </div>
);
