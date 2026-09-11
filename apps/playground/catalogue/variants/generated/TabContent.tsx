// GENERATED — do not edit.
// Source: .design-sync/previews/TabContent.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import {
  Chip,
  Divider,
  StatusBadge,
  Tabs,
  TabContent,
  Typography,
} from "@its/glowup-ui";

// TabContent renders only the child at `activeTab`, so each cell is a real
// Tabs + TabContent pair sharing one index. The children array must line up
// with the tabs array.

const TABS = ["Overview", "Specs", "Reviews"];

const frame: ViewStyle = {
  width: 400,
  height: 220,
  flexDirection: "column",
};

const stack: ViewStyle = {
  flexDirection: "column",
  gap: 8,
};

const row: ViewStyle = {
  flexDirection: "row",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

const between: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: 4,
  paddingBottom: 4,
};

const Overview = () => (
  <View style={stack}>
    <Typography variant="titleMedium">Acoustic Pro X2</Typography>
    <Typography variant="bodyMedium">
      Studio-grade over-ear headphones with adaptive noise cancelling and a
      32-hour battery.
    </Typography>
    <View style={row}>
      <Chip label="In stock" mode="tonal" size="small" icon="check" />
      <Chip label="Free returns" mode="outlined" size="small" />
    </View>
  </View>
);

const Specs = () => (
  <View style={stack}>
    <View style={between}>
      <Typography variant="bodyMedium">Driver</Typography>
      <Typography variant="labelLarge">40 mm dynamic</Typography>
    </View>
    <Divider contentSpacing={0} />
    <View style={between}>
      <Typography variant="bodyMedium">Battery</Typography>
      <Typography variant="labelLarge">32 h</Typography>
    </View>
    <Divider contentSpacing={0} />
    <View style={between}>
      <Typography variant="bodyMedium">Weight</Typography>
      <Typography variant="labelLarge">248 g</Typography>
    </View>
  </View>
);

const Reviews = () => (
  <View style={stack}>
    <View style={row}>
      <Typography variant="titleMedium">4.6 out of 5</Typography>
      <StatusBadge label="Verified" type="success" />
    </View>
    <Typography variant="bodyMedium">
      “Best pair I have owned — the noise cancelling actually holds up on a
      plane.”
    </Typography>
    <Typography variant="labelMedium">Giulia D. · 2 weeks ago</Typography>
  </View>
);

const Panels = ({ activeTab }: { activeTab: number }) => (
  <View style={frame}>
    <Tabs tabs={TABS} activeTab={activeTab} onChange={() => {}} />
    <TabContent activeTab={activeTab}>
      <Overview />
      <Specs />
      <Reviews />
    </TabContent>
  </View>
);

export const ProductOverview = () => <Panels activeTab={0} />;

export const SpecSheet = () => <Panels activeTab={1} />;

export const ReviewFeed = () => <Panels activeTab={2} />;

export const variants: Variant[] = [
  {
    name: "ProductOverview",
    title: "Product overview",
    render: ProductOverview,
  },
  {
    name: "SpecSheet",
    title: "Spec sheet",
    render: SpecSheet,
  },
  {
    name: "ReviewFeed",
    title: "Review feed",
    render: ReviewFeed,
  },
];
