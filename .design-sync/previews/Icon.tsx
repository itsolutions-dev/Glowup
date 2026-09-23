import React from "react";
import { Icon, Typography, Paper } from "@its/glowup-ui";

const row: React.CSSProperties = {
  display: "flex",
  gap: 16,
  alignItems: "center",
  flexWrap: "wrap",
};

const cell: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
  width: 76,
};

export const Glyphs = () => (
  // Top-aligned: a wrapped label must not lift its glyph off the row.
  <div style={{ ...row, alignItems: "flex-start" }}>
    {(
      [
        "camera",
        "bell-outline",
        "cog-outline",
        "heart-outline",
        "map-marker-outline",
      ] as const
    ).map((name) => (
      <div key={name} style={cell}>
        <Icon source={name} size={28} />
        <Typography variant="labelSmall" style={{ textAlign: "center" }}>
          {name}
        </Typography>
      </div>
    ))}
  </div>
);

export const Sizes = () => (
  <div style={row}>
    {[16, 20, 24, 32, 48].map((size) => (
      <div key={size} style={cell}>
        <Icon source="wrench-outline" size={size} />
        <Typography variant="labelSmall">{`${size}px`}</Typography>
      </div>
    ))}
  </div>
);

// The point of the primitive: the source does not have to be a glyph name.
export const CustomSources = () => (
  <div
    style={{ display: "flex", flexDirection: "column", gap: 12, width: 380 }}
  >
    <Typography variant="labelMedium">
      A render function receives the resolved size and colour
    </Typography>
    <Paper elevation={1} outline>
      <div style={row}>
        <Icon
          size={32}
          source={({ size, color }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
              <path d="M12 2 3 20h18L12 2Zm0 5 5.5 11h-11L12 7Z" />
            </svg>
          )}
        />
        <Icon
          size={32}
          source={({ size, color }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
              <circle cx="12" cy="12" r="9" />
            </svg>
          )}
        />
        <Typography variant="bodySmall">inline SVG, themed colour</Typography>
      </div>
    </Paper>
  </div>
);
