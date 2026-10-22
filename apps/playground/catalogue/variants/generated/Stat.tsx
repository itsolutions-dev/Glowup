// GENERATED — do not edit.
// Source: .design-sync/previews/Stat.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Paper, Stat, Typography } from "@its/glowup-ui";

const row: ViewStyle = {
  flexDirection: "row",
  gap: 16,
  flexWrap: "wrap",
  width: 560,
};

const column: ViewStyle = {
  flexDirection: "column",
  gap: 12,
  width: 380,
};

export const Trends = () => (
  <View style={row}>
    <Stat label="Revenue" value="€18,420" delta="12.5%" trend="up" />
    <Stat label="Churn" value="2.4%" delta="0.8%" trend="down" />
    <Stat label="Active seats" value="128" delta="0" trend="flat" />
  </View>
);

/**
 * Up is `success`, down is `error` and flat neutral, unless `trendColor` says
 * otherwise: pass it for a metric where a fall is the good news, a role or any colour.
 */
export const TrendColor = () => (
  <View style={row}>
    <Stat
      label="Failed builds"
      value="3"
      delta="42%"
      trend="down"
      trendColor="success"
    />
    <Stat
      label="p95 latency"
      value="240 ms"
      delta="18%"
      trend="up"
      trendColor="error"
    />
    <Stat
      label="Waitlist"
      value="1,380"
      delta="9%"
      trend="up"
      trendColor="#6750A4"
    />
  </View>
);

/** `direction="row"` puts the label, the value and the delta on one line, for a dense strip of figures. */
export const Direction = () => (
  <View style={column}>
    <Stat
      label="Revenue"
      value="€18,420"
      delta="12.5%"
      trend="up"
      direction="row"
    />
    <Stat
      label="Churn"
      value="2.4%"
      delta="0.8%"
      trend="down"
      direction="row"
    />
    <Stat
      label="Active seats"
      value="128"
      icon="account-multiple-outline"
      direction="row"
    />
  </View>
);

export const WithIconsAndHelp = () => (
  <View style={row}>
    <Stat
      label="Monthly recurring"
      value="€42,900"
      delta="6.1%"
      trend="up"
      icon="cash-multiple"
      helpText="Excludes one-off invoices"
    />
    <Stat
      label="New workspaces"
      value="37"
      delta="4"
      trend="up"
      icon="account-plus-outline"
      helpText="Last 30 days"
    />
  </View>
);

export const Bare = () => (
  <View style={row}>
    <Stat label="Components" value="87" />
    <Stat label="Design tokens" value="42" />
    <Stat label="Groups" value="9" />
  </View>
);

export const OnAPanel = () => (
  <View style={column}>
    <Paper elevation={1} style={{ flex: 1 }}>
      <Typography variant="titleMedium">This quarter</Typography>
      <View style={{ height: 12 }} />
      <View style={{ flexDirection: "row", gap: 24, flexWrap: "wrap" }}>
        <Stat
          label="Orders"
          value="1,204"
          delta="9.2%"
          trend="up"
          icon="cart-outline"
        />
        <Stat
          label="Refunds"
          value="18"
          delta="3.1%"
          trend="down"
          trendColor="success"
        />
      </View>
    </Paper>
  </View>
);

export const variants: Variant[] = [
  {
    name: "Trends",
    title: "Trends",
    render: Trends,
  },
  {
    name: "TrendColor",
    title: "Trend color",
    description:
      "Up is `success`, down is `error` and flat neutral, unless `trendColor` says otherwise: pass it for a metric where a fall is the good news, a role or any colour.",
    render: TrendColor,
  },
  {
    name: "Direction",
    title: "Direction",
    description:
      '`direction="row"` puts the label, the value and the delta on one line, for a dense strip of figures.',
    render: Direction,
  },
  {
    name: "WithIconsAndHelp",
    title: "With icons and help",
    render: WithIconsAndHelp,
  },
  {
    name: "Bare",
    title: "Bare",
    render: Bare,
  },
  {
    name: "OnAPanel",
    title: "On a panel",
    render: OnAPanel,
  },
];
