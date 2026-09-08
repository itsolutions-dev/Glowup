import React from "react";
import { Button } from "@glowup/ui";

const row: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

export const Modes = () => (
  <div style={row}>
    <Button mode="filled" onPress={() => {}}>
      Save changes
    </Button>
    <Button mode="tonal" onPress={() => {}}>
      Duplicate
    </Button>
    <Button mode="outlined" onPress={() => {}}>
      Export CSV
    </Button>
    <Button mode="text" onPress={() => {}}>
      Cancel
    </Button>
  </div>
);

export const WithIcons = () => (
  <div style={row}>
    <Button mode="filled" iconName="plus" onPress={() => {}}>
      New invoice
    </Button>
    <Button mode="tonal" iconName="download" onPress={() => {}}>
      Download
    </Button>
    <Button mode="outlined" iconName="arrow-right" iconPosition="right" onPress={() => {}}>
      Continue
    </Button>
  </div>
);

export const States = () => (
  <div style={row}>
    <Button mode="filled" loading onPress={() => {}}>
      Submitting
    </Button>
    <Button mode="filled" disabled onPress={() => {}}>
      Unavailable
    </Button>
    <Button mode="outlined" disabled iconName="lock-outline" onPress={() => {}}>
      Locked
    </Button>
  </div>
);

export const FullWidth = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 320 }}>
    <Button mode="filled" fullWidth iconName="check" onPress={() => {}}>
      Confirm booking
    </Button>
    <Button mode="text" fullWidth onPress={() => {}}>
      Not now
    </Button>
  </div>
);
