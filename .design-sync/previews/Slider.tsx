import React from "react";
import { Slider } from "@glowup/ui";

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 24,
  width: 340,
};

const noop = () => {};

export const WithValueLabel = () => (
  <div style={stack}>
    <Slider label="Volume" value={40} showValueLabel onValueChange={noop} />
    <Slider label="Brightness" value={82} showValueLabel onValueChange={noop} />
    <Slider label="Microphone gain" value={0} showValueLabel onValueChange={noop} />
  </div>
);

export const Marks = () => (
  <div style={stack}>
    <Slider
      label="Image quality"
      value={75}
      min={0}
      max={100}
      step={25}
      marks
      showValueLabel
      onValueChange={noop}
    />
    <Slider
      label="Team seats"
      value={6}
      min={1}
      max={10}
      step={1}
      marks
      showValueLabel
      onValueChange={noop}
    />
  </div>
);

export const RangesAndSteps = () => (
  <div style={stack}>
    <Slider
      label="Playback speed"
      value={1.5}
      min={0.5}
      max={2}
      step={0.25}
      showValueLabel
      onValueChange={noop}
    />
    <Slider
      label="Monthly budget (€)"
      value={2400}
      min={0}
      max={5000}
      step={100}
      showValueLabel
      onValueChange={noop}
    />
    <Slider label="Zoom" value={55} onValueChange={noop} />
  </div>
);

export const Disabled = () => (
  <div style={stack}>
    <Slider
      label="Storage quota (fixed by plan)"
      value={30}
      showValueLabel
      disabled
      onValueChange={noop}
    />
    <Slider
      label="Retention (days)"
      value={90}
      min={0}
      max={365}
      step={30}
      marks
      showValueLabel
      disabled
      onValueChange={noop}
    />
  </div>
);
