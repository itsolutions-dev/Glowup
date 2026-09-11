// GENERATED — do not edit.
// Source: .design-sync/previews/Skeleton.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Skeleton, Paper, Typography, Divider } from "@its/glowup-ui";

const col: ViewStyle = { flexDirection: "column" };

export const Variants = () => (
  <View style={{ ...col, gap: 20, width: 340 }}>
    <View style={col}>
      <Typography variant="labelSmall" style={{ marginBottom: 8 }}>
        circle — avatar placeholder
      </Typography>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Skeleton variant="circle" width={56} />
        <Skeleton variant="circle" width={40} />
        <Skeleton variant="circle" width={24} />
      </View>
    </View>
    <View style={col}>
      <Typography variant="labelSmall" style={{ marginBottom: 8 }}>
        text — copy placeholder
      </Typography>
      <View style={{ ...col, gap: 8 }}>
        <Skeleton variant="text" width={320} />
        <Skeleton variant="text" width={280} />
        <Skeleton variant="text" width={180} />
      </View>
    </View>
    <View style={col}>
      <Typography variant="labelSmall" style={{ marginBottom: 8 }}>
        rect — media placeholder
      </Typography>
      <Skeleton variant="rect" width={320} height={96} />
    </View>
  </View>
);

export const CardPlaceholder = () => (
  <View style={{ flexDirection: "row", width: 360 }}>
    <Paper
      elevation={0}
      outline
      style={{ width: "100%", paddingVertical: 16, paddingHorizontal: 16 }}
    >
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          alignItems: "center",
        }}
      >
        <Skeleton variant="circle" width={48} />
        <View style={{ ...col, gap: 8, flex: 1 }}>
          <Skeleton variant="text" width={150} />
          <Skeleton variant="text" width={90} height={12} />
        </View>
      </View>
      <View style={{ marginTop: 16, flexDirection: "row" }}>
        <Skeleton variant="rect" width={328} height={140} />
      </View>
      <View style={{ ...col, gap: 8, marginTop: 16 }}>
        <Skeleton variant="text" width={328} />
        <Skeleton variant="text" width={280} />
        <Skeleton variant="text" width={200} />
      </View>
    </Paper>
  </View>
);

export const ListPlaceholder = () => (
  <View style={{ ...col, width: 340 }}>
    {[0, 1, 2].map((i) => (
      <View key={i} style={col}>
        {i > 0 && <Divider contentSpacing={0} />}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          <Skeleton variant="circle" width={40} />
          <View style={{ ...col, gap: 8, flex: 1 }}>
            <Skeleton variant="text" width={200} />
            <Skeleton variant="text" width={130} height={12} />
          </View>
          <Skeleton variant="rect" width={56} height={28} borderRadius={14} />
        </View>
      </View>
    ))}
  </View>
);

export const Shapes = () => (
  <View style={{ ...col, gap: 20, width: 340 }}>
    <View style={col}>
      <Typography variant="labelSmall" style={{ marginBottom: 8 }}>
        borderRadius 0 — table cell
      </Typography>
      <Skeleton variant="rect" width={320} height={40} borderRadius={0} />
    </View>
    <View style={col}>
      <Typography variant="labelSmall" style={{ marginBottom: 8 }}>
        borderRadius 8 — default
      </Typography>
      <Skeleton variant="rect" width={320} height={40} />
    </View>
    <View style={col}>
      <Typography variant="labelSmall" style={{ marginBottom: 8 }}>
        borderRadius 20 — pill, standing in for a chip row
      </Typography>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Skeleton variant="rect" width={96} height={40} borderRadius={20} />
        <Skeleton variant="rect" width={120} height={40} borderRadius={20} />
        <Skeleton variant="rect" width={80} height={40} borderRadius={20} />
      </View>
    </View>
  </View>
);

export const variants: Variant[] = [
  {
    name: "Variants",
    title: "Variants",
    render: Variants,
  },
  {
    name: "CardPlaceholder",
    title: "Card placeholder",
    render: CardPlaceholder,
  },
  {
    name: "ListPlaceholder",
    title: "List placeholder",
    render: ListPlaceholder,
  },
  {
    name: "Shapes",
    title: "Shapes",
    render: Shapes,
  },
];
