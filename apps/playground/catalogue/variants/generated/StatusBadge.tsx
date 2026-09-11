// GENERATED — do not edit.
// Source: .design-sync/previews/StatusBadge.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { StatusBadge, Typography, Divider } from "@its/glowup-ui";

const row: ViewStyle = {
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

export const Types = () => (
  <View style={row}>
    <StatusBadge label="Active" type="success" />
    <StatusBadge label="Payment failed" type="error" />
    <StatusBadge label="Expiring soon" type="warning" />
  </View>
);

export const CustomIcons = () => (
  <View style={row}>
    <StatusBadge label="Deployed" type="success" icon="rocket-launch-outline" />
    <StatusBadge
      label="Build broken"
      type="error"
      icon="close-octagon-outline"
    />
    <StatusBadge label="Pending review" type="warning" icon="clock-outline" />
    <StatusBadge label="Synced" type="success" icon="cloud-check-outline" />
  </View>
);

export const InvoiceList = () => (
  <View style={{ flexDirection: "column", width: 320 }}>
    {[
      { id: "INV-2041", amount: "€1,280.00", label: "Paid", type: "success" },
      { id: "INV-2042", amount: "€640.00", label: "Overdue", type: "error" },
      {
        id: "INV-2043",
        amount: "€2,110.00",
        label: "Due in 3 days",
        type: "warning",
      },
    ].map((invoice, i) => (
      <View key={invoice.id}>
        {i > 0 && <Divider contentSpacing={0} />}
        <View
          style={{
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            paddingVertical: 12,
            paddingHorizontal: 4,
          }}
        >
          <View style={{ flexDirection: "column" }}>
            <Typography variant="titleSmall">{invoice.id}</Typography>
            <Typography variant="bodySmall">{invoice.amount}</Typography>
          </View>
          <StatusBadge label={invoice.label} type={invoice.type as any} />
        </View>
      </View>
    ))}
  </View>
);

export const variants: Variant[] = [
  {
    name: "Types",
    title: "Types",
    render: Types,
  },
  {
    name: "CustomIcons",
    title: "Custom icons",
    render: CustomIcons,
  },
  {
    name: "InvoiceList",
    title: "Invoice list",
    render: InvoiceList,
  },
];
