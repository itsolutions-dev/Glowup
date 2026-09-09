import React from "react";
import { Rating, Typography } from "@glowup/ui";

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  width: 340,
};

const row: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
};

const noop = () => {};

export const Values = () => (
  <div style={stack}>
    <div style={row}>
      <Rating value={5} onChange={noop} />
      <Typography variant="bodyMedium">Excellent</Typography>
    </div>
    <div style={row}>
      <Rating value={3.5} onChange={noop} />
      <Typography variant="bodyMedium">Good — 3.5 of 5</Typography>
    </div>
    <div style={row}>
      <Rating value={2} onChange={noop} />
      <Typography variant="bodyMedium">Below average</Typography>
    </div>
    <div style={row}>
      <Rating value={0} onChange={noop} />
      <Typography variant="bodyMedium">Not rated yet</Typography>
    </div>
  </div>
);

export const Sizes = () => (
  <div style={stack}>
    <div style={row}>
      <Rating value={4} size={16} />
      <Typography variant="bodySmall">
        16 px — inline in a product list
      </Typography>
    </div>
    <div style={row}>
      <Rating value={4} size={24} />
      <Typography variant="bodySmall">24 px — default</Typography>
    </div>
    <div style={row}>
      <Rating value={4} size={36} />
      <Typography variant="bodySmall">36 px — review form</Typography>
    </div>
  </div>
);

export const ReadOnlyAndDisabled = () => (
  <div style={stack}>
    <div style={row}>
      <Rating value={4.5} />
      <Typography variant="bodyMedium">4.5 — 128 reviews</Typography>
    </div>
    <div style={row}>
      <Rating value={3} disabled onChange={noop} />
      <Typography variant="bodyMedium">Rating locked after 30 days</Typography>
    </div>
  </div>
);

export const TenStarScale = () => (
  <div style={stack}>
    <Typography variant="titleMedium">
      How likely are you to recommend us?
    </Typography>
    <Rating value={8} max={10} size={22} onChange={noop} />
    <Typography variant="bodySmall">8 of 10</Typography>
  </div>
);
