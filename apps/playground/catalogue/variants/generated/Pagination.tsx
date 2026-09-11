// GENERATED — do not edit.
// Source: .design-sync/previews/Pagination.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Pagination } from "@its/glowup-ui";

const wrap: ViewStyle = { width: 400, flexDirection: "row" };

export const Default = () => (
  <View style={wrap}>
    <Pagination page={3} totalPages={12} onPageChange={() => {}} />
  </View>
);

export const WithFirstLast = () => (
  <View style={wrap}>
    <Pagination page={1} totalPages={8} showFirstLast onPageChange={() => {}} />
  </View>
);

export const Compact = () => (
  <View style={wrap}>
    <Pagination
      page={8}
      totalPages={20}
      siblingCount={0}
      onPageChange={() => {}}
    />
  </View>
);

export const Disabled = () => (
  <View style={wrap}>
    <Pagination page={4} totalPages={6} disabled onPageChange={() => {}} />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Default",
    title: "Default",
    render: Default,
  },
  {
    name: "WithFirstLast",
    title: "With first last",
    render: WithFirstLast,
  },
  {
    name: "Compact",
    title: "Compact",
    render: Compact,
  },
  {
    name: "Disabled",
    title: "Disabled",
    render: Disabled,
  },
];
