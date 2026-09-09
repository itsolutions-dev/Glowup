import React from "react";
import { IconButton, Typography, Divider } from "@glowup/ui";

const row: React.CSSProperties = {
  display: "flex",
  gap: 24,
  alignItems: "center",
  flexWrap: "wrap",
};

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  alignItems: "center",
};

export const Modes = () => (
  <div style={row}>
    <div style={stack}>
      <IconButton icon="pencil-outline" accessibilityLabel="Edit" />
      <Typography variant="labelSmall">standard</Typography>
    </div>
    <div style={stack}>
      <IconButton
        icon="pencil-outline"
        mode="filled"
        accessibilityLabel="Edit"
      />
      <Typography variant="labelSmall">filled</Typography>
    </div>
    <div style={stack}>
      <IconButton
        icon="pencil-outline"
        mode="tonal"
        accessibilityLabel="Edit"
      />
      <Typography variant="labelSmall">tonal</Typography>
    </div>
    <div style={stack}>
      <IconButton
        icon="pencil-outline"
        mode="outlined"
        accessibilityLabel="Edit"
      />
      <Typography variant="labelSmall">outlined</Typography>
    </div>
  </div>
);

export const Sizes = () => (
  <div style={row}>
    <div style={stack}>
      <IconButton
        icon="magnify"
        mode="tonal"
        size="small"
        accessibilityLabel="Search"
      />
      <Typography variant="labelSmall">small</Typography>
    </div>
    <div style={stack}>
      <IconButton icon="magnify" mode="tonal" accessibilityLabel="Search" />
      <Typography variant="labelSmall">medium</Typography>
    </div>
    <div style={stack}>
      <IconButton
        icon="magnify"
        mode="tonal"
        size="large"
        accessibilityLabel="Search"
      />
      <Typography variant="labelSmall">large</Typography>
    </div>
  </div>
);

export const States = () => (
  <div style={row}>
    <div style={stack}>
      <IconButton icon="check" mode="filled" accessibilityLabel="Confirm" />
      <Typography variant="labelSmall">enabled</Typography>
    </div>
    <div style={stack}>
      <IconButton
        icon="check"
        mode="filled"
        disabled
        accessibilityLabel="Confirm"
      />
      <Typography variant="labelSmall">disabled</Typography>
    </div>
    <div style={stack}>
      <IconButton
        icon="refresh"
        mode="filled"
        loading
        accessibilityLabel="Refreshing"
      />
      <Typography variant="labelSmall">loading</Typography>
    </div>
  </div>
);

export const Selected = () => (
  <div style={row}>
    <div style={stack}>
      <IconButton
        icon="home-outline"
        mode="tonal"
        selected
        accessibilityLabel="Pin to home"
      />
      <Typography variant="labelSmall">tonal on</Typography>
    </div>
    <div style={stack}>
      <IconButton
        icon="home-outline"
        mode="tonal"
        selected={false}
        accessibilityLabel="Pin to home"
      />
      <Typography variant="labelSmall">tonal off</Typography>
    </div>
    <div style={stack}>
      <IconButton
        icon="home-outline"
        mode="outlined"
        selected
        accessibilityLabel="Pin to home"
      />
      <Typography variant="labelSmall">outlined on</Typography>
    </div>
    <div style={stack}>
      <IconButton
        icon="home-outline"
        mode="outlined"
        selected={false}
        accessibilityLabel="Pin to home"
      />
      <Typography variant="labelSmall">outlined off</Typography>
    </div>
  </div>
);

export const CardToolbar = () => (
  <div style={{ display: "flex", flexDirection: "column", width: 320, gap: 4 }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        padding: "4px 0",
      }}
    >
      <Typography variant="titleMedium">Q3 forecast</Typography>
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <IconButton
          icon="pencil-outline"
          size="small"
          accessibilityLabel="Edit forecast"
        />
        <IconButton
          icon="content-copy"
          size="small"
          accessibilityLabel="Duplicate forecast"
        />
        <IconButton
          icon="delete-outline"
          size="small"
          accessibilityLabel="Delete forecast"
        />
      </div>
    </div>
    <Divider contentSpacing={0} />
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        padding: "8px 0 0",
      }}
    >
      <IconButton
        icon="chevron-left"
        mode="outlined"
        size="small"
        accessibilityLabel="Previous quarter"
      />
      <Typography variant="labelLarge">Jul – Sep 2026</Typography>
      <IconButton
        icon="chevron-right"
        mode="outlined"
        size="small"
        accessibilityLabel="Next quarter"
      />
    </div>
  </div>
);
