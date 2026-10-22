import React from "react";
import { Button, Clipboard, Typography } from "@its/glowup-ui";

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
};

const column: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  width: 360,
};

/** An icon button that copies `value`, then shows a check for a moment. */
export const Default = () => (
  <div style={row}>
    <Clipboard value="sk_live_51Hx9A2eZvKYlo2C" />
  </div>
);

export const Variants = () => (
  <div style={row}>
    <Clipboard value="a" variant="standard" />
    <Clipboard value="a" variant="filled" />
    <Clipboard value="a" variant="tonal" />
    <Clipboard value="a" variant="outlined" />
  </div>
);

export const Sizes = () => (
  <div style={row}>
    <Clipboard value="a" size="small" />
    <Clipboard value="a" size="medium" />
    <Clipboard value="a" size="large" />
  </div>
);

/** `color` is a colour role; the confirmation is always `success`. */
export const Colors = () => (
  <div style={row}>
    <Clipboard value="a" variant="tonal" color="primary" />
    <Clipboard value="a" variant="tonal" color="secondary" />
    <Clipboard value="a" variant="tonal" color="tertiary" />
    <Clipboard value="a" variant="tonal" color="error" />
    <Clipboard value="a" variant="tonal" color="info" />
  </div>
);

export const Disabled = () => (
  <div style={row}>
    <Clipboard value="a" disabled />
    <Clipboard value="a" variant="filled" disabled />
  </div>
);

/** Beside the value it copies: the usual place for an API key or an order number. */
export const BesideAValue = () => (
  <div style={column}>
    <div style={row}>
      <Typography variant="bodyLarge">INV-2026-00418</Typography>
      <Clipboard
        value="INV-2026-00418"
        size="small"
        label="Copy invoice number"
      />
    </div>
  </div>
);

/** A node as `children` is the content of the trigger: your own look, the same behaviour. */
export const CustomContent = () => (
  <div style={row}>
    <Clipboard value="https://glowup.dev/invite/x7Kq">
      <Typography variant="labelLarge" color="primary">
        Copy invite link
      </Typography>
    </Clipboard>
  </div>
);

/** A function as `children` draws the whole trigger, from `{ copied, copy }`. */
export const RenderProp = () => (
  <div style={row}>
    <Clipboard value="npm install @its/glowup-ui">
      {({ copied, copy }) => (
        <Button
          variant="tonal"
          iconName={copied ? "check" : "content-copy"}
          onClick={copy}
        >
          {copied ? "Copied" : "Copy command"}
        </Button>
      )}
    </Clipboard>
  </div>
);
