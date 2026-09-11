// GENERATED — do not edit.
// Source: .design-sync/previews/Rating.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Rating, Typography } from "@its/glowup-ui";

const stack: ViewStyle = {
  flexDirection: "column",
  gap: 16,
  width: 340,
};

const row: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
};

const noop = () => {};

export const Values = () => (
  <View style={stack}>
    <View style={row}>
      <Rating value={5} onChange={noop} />
      <Typography variant="bodyMedium">Excellent</Typography>
    </View>
    <View style={row}>
      <Rating value={3.5} onChange={noop} />
      <Typography variant="bodyMedium">Good — 3.5 of 5</Typography>
    </View>
    <View style={row}>
      <Rating value={2} onChange={noop} />
      <Typography variant="bodyMedium">Below average</Typography>
    </View>
    <View style={row}>
      <Rating value={0} onChange={noop} />
      <Typography variant="bodyMedium">Not rated yet</Typography>
    </View>
  </View>
);

export const Sizes = () => (
  <View style={stack}>
    <View style={row}>
      <Rating value={4} size={16} />
      <Typography variant="bodySmall">
        16 px — inline in a product list
      </Typography>
    </View>
    <View style={row}>
      <Rating value={4} size={24} />
      <Typography variant="bodySmall">24 px — default</Typography>
    </View>
    <View style={row}>
      <Rating value={4} size={36} />
      <Typography variant="bodySmall">36 px — review form</Typography>
    </View>
  </View>
);

export const ReadOnlyAndDisabled = () => (
  <View style={stack}>
    <View style={row}>
      <Rating value={4.5} />
      <Typography variant="bodyMedium">4.5 — 128 reviews</Typography>
    </View>
    <View style={row}>
      <Rating value={3} disabled onChange={noop} />
      <Typography variant="bodyMedium">Rating locked after 30 days</Typography>
    </View>
  </View>
);

export const TenStarScale = () => (
  <View style={stack}>
    <Typography variant="titleMedium">
      How likely are you to recommend us?
    </Typography>
    <Rating value={8} max={10} size={22} onChange={noop} />
    <Typography variant="bodySmall">8 of 10</Typography>
  </View>
);

export const variants: Variant[] = [
  {
    name: "Values",
    title: "Values",
    render: Values,
  },
  {
    name: "Sizes",
    title: "Sizes",
    render: Sizes,
  },
  {
    name: "ReadOnlyAndDisabled",
    title: "Read only and disabled",
    render: ReadOnlyAndDisabled,
  },
  {
    name: "TenStarScale",
    title: "Ten star scale",
    render: TenStarScale,
  },
];
