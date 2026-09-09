import React from "react";
import { Stat, Typography, Divider } from "@glowup/ui";

const row: React.CSSProperties = {
  display: "flex",
  gap: 32,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

export const Trends = () => (
  <div style={row}>
    <Stat label="Revenue" value="€48.2k" delta="12.5%" trend="up" />
    <Stat label="Refunds" value="€1.9k" delta="4.1%" trend="down" />
    <Stat label="Open seats" value="24" delta="0%" trend="flat" />
  </div>
);

export const WithIcons = () => (
  <div style={row}>
    <Stat
      label="Active users"
      value="1,284"
      delta="8.3%"
      trend="up"
      icon="account-group"
      helpText="Last 30 days"
    />
    <Stat
      label="Downloads"
      value="96,410"
      delta="2.7%"
      trend="up"
      icon="download"
      helpText="All platforms"
    />
  </div>
);

export const InvertedTrendColors = () => (
  <div style={row}>
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Stat
        label="Churn"
        value="2.1%"
        delta="0.6pp"
        trend="down"
        invertTrendColors
        icon="account-multiple-outline"
      />
      <Typography variant="labelSmall">down is good</Typography>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Stat
        label="p95 latency"
        value="412 ms"
        delta="88 ms"
        trend="up"
        invertTrendColors
        icon="clock-outline"
      />
      <Typography variant="labelSmall">up is bad</Typography>
    </div>
  </div>
);

export const Bare = () => (
  <div style={row}>
    <Stat label="Components" value="86" />
    <Stat label="Bundle" value="3.1 MB" helpText="minified, pre-gzip" />
  </div>
);

export const DashboardPanel = () => (
  <div
    style={{ display: "flex", flexDirection: "column", width: 320, gap: 12 }}
  >
    <Typography variant="titleMedium">This month</Typography>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
      <Stat
        label="MRR"
        value="€14.6k"
        delta="5.2%"
        trend="up"
        icon="chart-box"
      />
      <Stat
        label="Failed jobs"
        value="7"
        delta="3"
        trend="down"
        invertTrendColors
        icon="cloud-off-outline"
      />
    </div>
    <Divider contentSpacing={0} />
    <Stat
      label="Uptime"
      value="99.98%"
      delta="0.01pp"
      trend="up"
      icon="check-circle-outline"
      helpText="30-day rolling window"
    />
  </div>
);
