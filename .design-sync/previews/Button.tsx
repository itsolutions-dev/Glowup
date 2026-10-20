import React from "react";
import { Button } from "@its/glowup-ui";

const row: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

export const Modes = () => (
  <div style={row}>
    <Button variant="filled" onClick={() => {}}>
      Save changes
    </Button>
    <Button variant="tonal" onClick={() => {}}>
      Duplicate
    </Button>
    <Button variant="outlined" onClick={() => {}}>
      Export CSV
    </Button>
    <Button variant="text" onClick={() => {}}>
      Cancel
    </Button>
  </div>
);

export const WithIcons = () => (
  <div style={row}>
    <Button variant="filled" iconName="plus" onClick={() => {}}>
      New invoice
    </Button>
    <Button variant="tonal" iconName="download" onClick={() => {}}>
      Download
    </Button>
    <Button
      variant="outlined"
      iconName="arrow-right"
      iconPosition="end"
      onClick={() => {}}
    >
      Continue
    </Button>
  </div>
);

export const States = () => (
  <div style={row}>
    <Button variant="filled" loading onClick={() => {}}>
      Submitting
    </Button>
    <Button variant="filled" disabled onClick={() => {}}>
      Unavailable
    </Button>
    <Button
      variant="outlined"
      disabled
      iconName="lock-outline"
      onClick={() => {}}
    >
      Locked
    </Button>
  </div>
);

export const FullWidth = () => (
  <div
    style={{ display: "flex", flexDirection: "column", gap: 12, width: 320 }}
  >
    <Button variant="filled" fullWidth iconName="check" onClick={() => {}}>
      Confirm booking
    </Button>
    <Button variant="text" fullWidth onClick={() => {}}>
      Not now
    </Button>
  </div>
);

export const WithBadge = () => (
  <div style={row}>
    <Button variant="outlined" iconName="filter-outline">
      Filters
    </Button>
    <Button iconName="filter-variant" badge={3}>
      Filters
    </Button>
    <Button variant="tonal" badge={12}>
      Inbox
    </Button>
    <Button variant="outlined" badge={120}>
      Alerts
    </Button>
  </div>
);
