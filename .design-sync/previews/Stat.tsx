import React from "react";
import { Paper, Stat, Typography } from "@its/glowup-ui";

const row: React.CSSProperties = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
  width: 560,
};

const column: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  width: 380,
};

export const Trends = () => (
  <div style={row}>
    <Stat label="Revenue" value="€18,420" delta="12.5%" trend="up" />
    <Stat label="Churn" value="2.4%" delta="0.8%" trend="down" />
    <Stat label="Active seats" value="128" delta="0" trend="flat" />
  </div>
);

/**
 * Up is `success`, down is `error` and flat neutral, unless `trendColor` says
 * otherwise: pass it for a metric where a fall is the good news, a role or any colour.
 */
export const TrendColor = () => (
  <div style={row}>
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
  </div>
);

/** `direction="row"` puts the label, the value and the delta on one line, for a dense strip of figures. */
export const Direction = () => (
  <div style={column}>
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
  </div>
);

export const WithIconsAndHelp = () => (
  <div style={row}>
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
  </div>
);

export const Bare = () => (
  <div style={row}>
    <Stat label="Components" value="87" />
    <Stat label="Design tokens" value="42" />
    <Stat label="Groups" value="9" />
  </div>
);

export const OnAPanel = () => (
  <div style={column}>
    <Paper elevation={1} style={{ flex: 1 }}>
      <Typography variant="titleMedium">This quarter</Typography>
      <div style={{ height: 12 }} />
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
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
      </div>
    </Paper>
  </div>
);
