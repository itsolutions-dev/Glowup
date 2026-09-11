import React from "react";
import { TouchableRipple, Typography, Divider } from "@its/glowup-ui";

const panel: React.CSSProperties = {
  width: 360,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

// RNW renders Text as inline-flex, so stacked Typography siblings need an
// explicit column here or they run onto one line.
const inner: React.CSSProperties = {
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

export const StateLayer = () => (
  <div style={panel}>
    <Typography variant="labelMedium">
      Hover and press — 8% / 12% of the “on” role over the surface
    </Typography>
    <TouchableRipple
      onPress={() => {}}
      accessibilityLabel="Tappable surface"
      borderRadius={12}
    >
      <div style={inner}>
        <Typography variant="bodyLarge">Tappable surface</Typography>
        <Typography variant="bodySmall">
          The layer is derived from the theme, never a hardcoded overlay
        </Typography>
      </div>
    </TouchableRipple>
  </div>
);

export const Borderless = () => (
  <div style={panel}>
    <Typography variant="labelMedium">
      borderless — tints the child without painting a container
    </Typography>
    <TouchableRipple
      onPress={() => {}}
      accessibilityLabel="No container"
      borderless
      borderRadius={12}
    >
      <div style={inner}>
        <Typography variant="bodyLarge">No container background</Typography>
      </div>
    </TouchableRipple>
  </div>
);

export const AsListRows = () => (
  <div style={{ width: 360, display: "flex", flexDirection: "column" }}>
    {["Email digest", "Mentions", "Product updates"].map((label, index) => (
      <React.Fragment key={label}>
        {index > 0 && <Divider contentSpacing={0} />}
        <TouchableRipple onPress={() => {}} accessibilityLabel={label}>
          <div style={{ padding: 14 }}>
            <Typography variant="bodyLarge">{label}</Typography>
          </div>
        </TouchableRipple>
      </React.Fragment>
    ))}
  </div>
);

export const Disabled = () => (
  <div style={panel}>
    <TouchableRipple
      onPress={() => {}}
      accessibilityLabel="Disabled"
      borderRadius={12}
      disabled
    >
      <div style={inner}>
        <Typography variant="bodyLarge">Disabled — no state layer</Typography>
      </div>
    </TouchableRipple>
  </div>
);
