import React from "react";
import { InputArea } from "@its/glowup-ui";

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  width: 360,
};

const noop = () => {};

const LONG = [
  "Checkout fails with a blank screen after I enter my card.",
  "It happens on the second attempt only.",
  "I am on version 4.2.1, on a Pixel 8.",
  "The first attempt shows the 3-D Secure sheet, the second one never does.",
  "I tried clearing the cache and signing in again.",
  "Nothing changed. Happy to send a screen recording.",
].join("\n");

export const Default = () => (
  <div style={stack}>
    <InputArea
      label="Message"
      placeholder="Tell us what you need"
      helperText="Four lines tall, and it scrolls past that."
      value=""
      onChange={noop}
    />
  </div>
);

export const FixedRows = () => (
  <div style={stack}>
    <InputArea
      label="Two rows"
      rows={2}
      value={
        "Ring the bell twice.\nThe intercom is broken.\nLeave it with the concierge."
      }
      onChange={noop}
    />
    <InputArea
      label="Six rows"
      rows={6}
      value=""
      placeholder="Notes"
      onChange={noop}
    />
  </div>
);

export const AutoGrow = () => (
  <div style={stack}>
    <InputArea
      label="Grows from 2 to 4 rows"
      minRows={2}
      maxRows={4}
      helperText="Past four rows the text scrolls."
      value={LONG}
      onChange={noop}
    />
    <InputArea
      label="Starts at 2, grows"
      minRows={2}
      value="One short line."
      onChange={noop}
    />
    <InputArea
      label="Up to 3 rows"
      maxRows={3}
      value="One short line."
      onChange={noop}
    />
  </div>
);

export const Variants = () => (
  <div style={stack}>
    <InputArea
      variant="outlined"
      label="Outlined"
      rows={3}
      value="Short and sweet."
      onChange={noop}
    />
    <InputArea
      variant="filled"
      label="Filled"
      rows={3}
      value="Short and sweet."
      onChange={noop}
    />
    <InputArea
      variant="filled"
      labelPlacement="inside"
      label="Filled, label inside"
      rows={3}
      value="Short and sweet."
      onChange={noop}
    />
  </div>
);

export const ValidationStates = () => (
  <div style={stack}>
    <InputArea
      label="Reason"
      required
      rows={3}
      maxLength={200}
      helperText="Shown to the reviewer."
      value="Duplicate of ticket 1042."
      onChange={noop}
    />
    <InputArea
      label="Reason"
      required
      rows={3}
      error="Write at least 20 characters."
      value="Duplicate."
      onChange={noop}
    />
  </div>
);

export const Disabled = () => (
  <div style={stack}>
    <InputArea
      label="Disabled"
      disabled
      rows={3}
      value="This ticket is closed."
      onChange={noop}
    />
    <InputArea
      label="Read only"
      readonly
      rows={3}
      value="Only the author can edit this."
      onChange={noop}
    />
  </div>
);
