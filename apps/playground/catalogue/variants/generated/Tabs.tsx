// GENERATED — do not edit.
// Source: .design-sync/previews/Tabs.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Tabs } from "@its/glowup-ui";

const wrap: ViewStyle = { width: 400, flexDirection: "row" };
const stack: ViewStyle = {
  width: 400,
  flexDirection: "column",
  gap: 16,
};
const narrow: ViewStyle = { width: 320, flexDirection: "row" };

export const TextTabs = () => (
  <View style={wrap}>
    <Tabs
      tabs={["Overview", "Specs", "Reviews"]}
      activeTab={0}
      onChange={() => {}}
    />
  </View>
);

export const IconTabs = () => (
  <View style={wrap}>
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
  </View>
);

export const FourTabs = () => (
  <View style={wrap}>
    <Tabs
      tabs={["Details", "Activity", "Files", "Notes"]}
      activeTab={2}
      onChange={() => {}}
    />
  </View>
);

export const TwoTabs = () => (
  <View style={wrap}>
    <Tabs
      tabs={["Sign in", "Create account"]}
      activeTab={0}
      onChange={() => {}}
    />
  </View>
);

export const KeysAndDisabled = () => (
  <View style={wrap}>
    <Tabs
      tabs={[
        { label: "Overview", key: "overview" },
        { label: "Billing", key: "billing" },
        { label: "Audit log", key: "audit", disabled: true },
      ]}
      activeKey="billing"
      onChange={() => {}}
    />
  </View>
);

/** `variant="rounded"`: a pill on a rounded track instead of an underline. */
export const Rounded = () => (
  <View style={wrap}>
    <Tabs
      variant="rounded"
      tabs={["Overview", "Specs", "Reviews"]}
      activeTab={1}
      onChange={() => {}}
    />
  </View>
);

/** In the rounded variant the icon sits before the label, not above it. */
export const RoundedWithIcons = () => (
  <View style={wrap}>
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
  </View>
);

/** `showBorders` draws dividers between the tabs, and an outline on the rounded track. */
export const WithBorders = () => (
  <View style={stack}>
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
  </View>
);

/** `size` sets the height and the type: sm 40, md 48, lg 56. */
export const Sizes = () => (
  <View style={stack}>
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
  </View>
);

/** `color` is a colour role: it paints the indicator and the selected tab. */
export const Colors = () => (
  <View style={stack}>
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
  </View>
);

/** `fullWidth={false}` sizes each tab to its label; the bar scrolls when they do not fit. */
export const ScrollingTabs = () => (
  <View style={narrow}>
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
  </View>
);

/** `width` and `height` override the bar's own size: dp or a percentage. */
export const FixedSize = () => (
  <View style={wrap}>
    <Tabs
      width={280}
      height={64}
      tabs={["Overview", "Specs", "Reviews"]}
      activeTab={0}
      onChange={() => {}}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "TextTabs",
    title: "Text tabs",
    render: TextTabs,
  },
  {
    name: "IconTabs",
    title: "Icon tabs",
    render: IconTabs,
  },
  {
    name: "FourTabs",
    title: "Four tabs",
    render: FourTabs,
  },
  {
    name: "TwoTabs",
    title: "Two tabs",
    render: TwoTabs,
  },
  {
    name: "KeysAndDisabled",
    title: "Keys and disabled",
    render: KeysAndDisabled,
  },
  {
    name: "Rounded",
    title: "Rounded",
    description:
      '`variant="rounded"`: a pill on a rounded track instead of an underline.',
    render: Rounded,
  },
  {
    name: "RoundedWithIcons",
    title: "Rounded with icons",
    description:
      "In the rounded variant the icon sits before the label, not above it.",
    render: RoundedWithIcons,
  },
  {
    name: "WithBorders",
    title: "With borders",
    description:
      "`showBorders` draws dividers between the tabs, and an outline on the rounded track.",
    render: WithBorders,
  },
  {
    name: "Sizes",
    title: "Sizes",
    description: "`size` sets the height and the type: sm 40, md 48, lg 56.",
    render: Sizes,
  },
  {
    name: "Colors",
    title: "Colors",
    description:
      "`color` is a colour role: it paints the indicator and the selected tab.",
    render: Colors,
  },
  {
    name: "ScrollingTabs",
    title: "Scrolling tabs",
    description:
      "`fullWidth={false}` sizes each tab to its label; the bar scrolls when they do not fit.",
    render: ScrollingTabs,
  },
  {
    name: "FixedSize",
    title: "Fixed size",
    description:
      "`width` and `height` override the bar's own size: dp or a percentage.",
    render: FixedSize,
  },
];
