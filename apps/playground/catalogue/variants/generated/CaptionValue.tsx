// GENERATED — do not edit.
// Source: .design-sync/previews/CaptionValue.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { CaptionValue, StatusBadge } from "@its/glowup-ui";

const box: ViewStyle = {
  flexDirection: "column",
  gap: 16,
  width: 320,
};

export const Stacked = () => (
  <View style={box}>
    <CaptionValue caption="Phone" value="+39 06 1234 5678" />
    <CaptionValue caption="Email" value="ada@example.com" />
    <CaptionValue caption="Address" value="Via Roma 1, 00100 Roma" />
  </View>
);

export const InARow = () => (
  <View style={box}>
    <CaptionValue caption="Due date" value="12 Oct" direction="row" />
    <CaptionValue caption="Total" value="€1,240.50" direction="row" />
    <CaptionValue
      caption="Status"
      value={<StatusBadge label="Paid" />}
      direction="row"
    />
  </View>
);

/** An empty value (`""`, `null`, `undefined`, `false`) draws `fallback`, "N/A" unless you say otherwise. `0` is a value. */
export const EmptyValueFallback = () => (
  <View style={box}>
    <CaptionValue caption="Mobile" value="" />
    <CaptionValue caption="Fax" value={null} fallback="Not given" />
    <CaptionValue caption="Zero is a value" value={0} />
  </View>
);

/** `captionColor` and `valueColor` take a theme token or any colour string; `reverse` puts the value first. */
export const Colours = () => (
  <View style={box}>
    <CaptionValue
      caption="Overdue"
      value="3 days"
      captionColor="error"
      valueColor="error"
    />
    <CaptionValue caption="Plan" value="Pro" captionColor="primary" />
    <CaptionValue
      caption="Brand"
      value="#6750A4"
      valueColor="#6750A4"
      captionColor="#6750A4"
    />
    <CaptionValue caption="Value first" value="Acme Inc." reverse />
  </View>
);

/** `enableCopy` adds a copy button after a text or number value; `onCopy` is where native writes to the clipboard. */
export const Copy = () => (
  <View style={box}>
    <CaptionValue
      caption="IBAN"
      value="IT60 X054 2811 1010 0000 0123 456"
      enableCopy
      onCopy={() => {}}
    />
    <CaptionValue
      caption="Order"
      value="#10428"
      direction="row"
      enableCopy
      onCopy={() => {}}
    />
  </View>
);

/** A value is cut at `numberOfLines` (1 by default, 0 for no limit); `showTooltip` gives the full text on hover or long press. */
export const CutValue = () => (
  <View style={box}>
    <CaptionValue
      caption="Address"
      value="Via Giuseppe Garibaldi 128, interno 4, 00185 Roma RM"
      width={200}
      showTooltip
    />
    <CaptionValue
      caption="Notes"
      value="Ring twice and leave the parcel with the neighbour at number 6 if nobody answers."
      width={200}
      numberOfLines={2}
    />
    <CaptionValue
      caption="Notes, in full"
      value="Ring twice and leave the parcel with the neighbour at number 6 if nobody answers."
      width={200}
      numberOfLines={0}
    />
  </View>
);

/** `width`, `height`, `flex` and `padding` size the pair; `gap` spaces the caption from the value and `textAlign` aligns the text. */
export const Sizing = () => (
  <View style={{ ...box, width: 360 }}>
    <CaptionValue
      caption="Padded"
      value="12 px around"
      padding={12}
      style={{ backgroundColor: "#E8DEF8" }}
    />
    <CaptionValue
      caption="Fixed box"
      value="Centred in 160 × 72"
      width={160}
      height={72}
      textAlign="center"
      style={{ backgroundColor: "#D7E3FF", justifyContent: "center" }}
    />
    <View style={{ flexDirection: "row", gap: 12 }}>
      <CaptionValue caption="Flex 1" value="Takes the rest" flex={1} />
      <CaptionValue caption="Flex 2" value="Twice as much" flex={2} />
    </View>
    <CaptionValue caption="Gap" value="16 px apart" gap={16} />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Stacked",
    title: "Stacked",
    render: Stacked,
  },
  {
    name: "InARow",
    title: "In a row",
    render: InARow,
  },
  {
    name: "EmptyValueFallback",
    title: "Empty value fallback",
    description:
      'An empty value (`""`, `null`, `undefined`, `false`) draws `fallback`, "N/A" unless you say otherwise. `0` is a value.',
    render: EmptyValueFallback,
  },
  {
    name: "Colours",
    title: "Colours",
    description:
      "`captionColor` and `valueColor` take a theme token or any colour string; `reverse` puts the value first.",
    render: Colours,
  },
  {
    name: "Copy",
    title: "Copy",
    description:
      "`enableCopy` adds a copy button after a text or number value; `onCopy` is where native writes to the clipboard.",
    render: Copy,
  },
  {
    name: "CutValue",
    title: "Cut value",
    description:
      "A value is cut at `numberOfLines` (1 by default, 0 for no limit); `showTooltip` gives the full text on hover or long press.",
    render: CutValue,
  },
  {
    name: "Sizing",
    title: "Sizing",
    description:
      "`width`, `height`, `flex` and `padding` size the pair; `gap` spaces the caption from the value and `textAlign` aligns the text.",
    render: Sizing,
  },
];
