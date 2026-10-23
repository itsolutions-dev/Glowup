// GENERATED — do not edit.
// Source: .design-sync/previews/Clipboard.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Button, Clipboard, Typography } from "@its/glowup-ui";

const row: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
};

const column: ViewStyle = {
  flexDirection: "column",
  gap: 16,
  width: 360,
};

/** An icon button that copies `value`, then shows a check for a moment. */
export const Default = () => (
  <View style={row}>
    <Clipboard value="sk_live_51Hx9A2eZvKYlo2C" />
  </View>
);

export const Variants = () => (
  <View style={row}>
    <Clipboard value="a" variant="standard" />
    <Clipboard value="a" variant="filled" />
    <Clipboard value="a" variant="tonal" />
    <Clipboard value="a" variant="outlined" />
  </View>
);

export const Sizes = () => (
  <View style={row}>
    <Clipboard value="a" size="small" />
    <Clipboard value="a" size="medium" />
    <Clipboard value="a" size="large" />
  </View>
);

/** `color` is a colour role; the confirmation is always `success`. */
export const Colors = () => (
  <View style={row}>
    <Clipboard value="a" variant="tonal" color="primary" />
    <Clipboard value="a" variant="tonal" color="secondary" />
    <Clipboard value="a" variant="tonal" color="tertiary" />
    <Clipboard value="a" variant="tonal" color="error" />
    <Clipboard value="a" variant="tonal" color="info" />
  </View>
);

export const Disabled = () => (
  <View style={row}>
    <Clipboard value="a" disabled />
    <Clipboard value="a" variant="filled" disabled />
  </View>
);

/** Beside the value it copies: the usual place for an API key or an order number. */
export const BesideAValue = () => (
  <View style={column}>
    <View style={row}>
      <Typography variant="bodyLarge">INV-2026-00418</Typography>
      <Clipboard
        value="INV-2026-00418"
        size="small"
        label="Copy invoice number"
      />
    </View>
  </View>
);

/** A node as `children` is the content of the trigger: your own look, the same behaviour. */
export const CustomContent = () => (
  <View style={row}>
    <Clipboard value="https://glowup.dev/invite/x7Kq">
      <Typography variant="labelLarge" color="primary">
        Copy invite link
      </Typography>
    </Clipboard>
  </View>
);

/** A function as `children` draws the whole trigger, from `{ copied, copy }`. */
export const RenderProp = () => (
  <View style={row}>
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
  </View>
);

export const variants: Variant[] = [
  {
    name: "Default",
    title: "Default",
    description:
      "An icon button that copies `value`, then shows a check for a moment.",
    render: Default,
  },
  {
    name: "Variants",
    title: "Variants",
    render: Variants,
  },
  {
    name: "Sizes",
    title: "Sizes",
    render: Sizes,
  },
  {
    name: "Colors",
    title: "Colors",
    description:
      "`color` is a colour role; the confirmation is always `success`.",
    render: Colors,
  },
  {
    name: "Disabled",
    title: "Disabled",
    render: Disabled,
  },
  {
    name: "BesideAValue",
    title: "Beside a value",
    description:
      "Beside the value it copies: the usual place for an API key or an order number.",
    render: BesideAValue,
  },
  {
    name: "CustomContent",
    title: "Custom content",
    description:
      "A node as `children` is the content of the trigger: your own look, the same behaviour.",
    render: CustomContent,
  },
  {
    name: "RenderProp",
    title: "Render prop",
    description:
      "A function as `children` draws the whole trigger, from `{ copied, copy }`.",
    render: RenderProp,
  },
];
