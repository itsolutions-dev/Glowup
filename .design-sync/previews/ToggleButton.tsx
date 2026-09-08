import React from "react";
import { ToggleButton, Typography } from "@glowup/ui";

// ToggleButton is the segment leaf: isFirst/isLast round the outer ends, so it is
// only ever true-to-life inside a row of siblings.
const segments: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
};

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  alignItems: "flex-start",
};

export const Segments = () => (
  <div style={stack}>
    <Typography variant="labelLarge">View</Typography>
    <div style={segments}>
      <ToggleButton label="List" icon="format-list-bulleted" active isFirst onPress={() => {}} />
      <ToggleButton label="Grid" icon="view-grid-outline" active={false} onPress={() => {}} />
      <ToggleButton label="Cards" icon="card-outline" active={false} isLast onPress={() => {}} />
    </div>
  </div>
);

export const IconOnly = () => (
  <div style={stack}>
    <Typography variant="labelLarge">Text alignment</Typography>
    <div style={segments}>
      <ToggleButton icon="format-align-left" active isFirst onPress={() => {}} />
      <ToggleButton icon="format-align-center" active={false} onPress={() => {}} />
      <ToggleButton icon="format-align-right" active={false} onPress={() => {}} />
      <ToggleButton icon="format-align-justify" active={false} isLast onPress={() => {}} />
    </div>
  </div>
);

export const LabelOnly = () => (
  <div style={segments}>
    <ToggleButton label="Day" active={false} isFirst onPress={() => {}} />
    <ToggleButton label="Week" active onPress={() => {}} />
    <ToggleButton label="Month" active={false} onPress={() => {}} />
    <ToggleButton label="Year" active={false} isLast onPress={() => {}} />
  </div>
);

export const Standalone = () => (
  <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
    <ToggleButton label="Notifications" icon="bell-outline" active isFirst isLast onPress={() => {}} />
    <ToggleButton label="Do not disturb" icon="bell-off-outline" active={false} isFirst isLast onPress={() => {}} />
  </div>
);
