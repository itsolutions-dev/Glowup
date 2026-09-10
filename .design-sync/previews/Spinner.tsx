import React from "react";
import { Spinner } from "@its/glowup-ui";

const row: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  gap: 24,
  flexWrap: "wrap",
  alignItems: "flex-start",
};

const noop = () => {};

export const Default = () => (
  <div style={row}>
    <Spinner label="Guests" value={2} min={1} max={12} onChange={noop} />
  </div>
);

export const Steps = () => (
  <div style={row}>
    <Spinner
      label="Quantity"
      value={6}
      step={1}
      min={1}
      max={99}
      onChange={noop}
    />
    <Spinner
      label="Seats (packs of 5)"
      value={25}
      step={5}
      min={5}
      max={100}
      onChange={noop}
    />
  </div>
);

export const AtBounds = () => (
  <div style={row}>
    <Spinner label="Nights" value={1} min={1} max={14} onChange={noop} />
    <Spinner label="Nights" value={14} min={1} max={14} onChange={noop} />
  </div>
);

export const Disabled = () => (
  <div style={row}>
    <Spinner
      label="Licences"
      value={10}
      min={1}
      max={50}
      disabled
      onChange={noop}
    />
  </div>
);
