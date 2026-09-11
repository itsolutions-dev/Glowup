// GENERATED — do not edit.
// Source: .design-sync/previews/Accordion.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Accordion, Typography, StatusBadge, Divider } from "@its/glowup-ui";

const panel: ViewStyle = {
  flexDirection: "column",
  width: 380,
};

export const CollapsedAndExpanded = () => (
  <View style={panel}>
    <Accordion title="Shipping address" startExpanded>
      Orders ship from the Milan warehouse within one business day. Tracking
      details arrive by email as soon as the courier scans the parcel.
    </Accordion>
    <Accordion title="Payment methods">Hidden until expanded.</Accordion>
    <Accordion title="Returns and refunds">Hidden until expanded.</Accordion>
  </View>
);

export const RichContent = () => (
  <View style={panel}>
    <Accordion title="Deployment status" startExpanded>
      <View style={{ flexDirection: "column", gap: 10 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="bodyMedium">api-gateway</Typography>
          <StatusBadge label="Live" type="success" />
        </View>
        <Divider contentSpacing={0} />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="bodyMedium">billing-worker</Typography>
          <StatusBadge label="Rolling out" type="warning" />
        </View>
        <Divider contentSpacing={0} />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="bodyMedium">report-exporter</Typography>
          <StatusBadge label="Failed" type="error" />
        </View>
      </View>
    </Accordion>
  </View>
);

export const FaqGroup = () => (
  <View style={panel}>
    <Accordion title="How do I reset my password?">
      Open Settings, choose Security, then Reset password. A one-time link is
      sent to your work email and stays valid for 30 minutes.
    </Accordion>
    <Accordion title="Can I invite external collaborators?" startExpanded>
      Workspace owners can invite guests from the Members tab. Guests see only
      the projects they are added to and never appear in billing seats.
    </Accordion>
    <Accordion title="Where is my data stored?">
      All workspace data lives in the EU (Frankfurt) region.
    </Accordion>
  </View>
);

export const variants: Variant[] = [
  {
    name: "CollapsedAndExpanded",
    title: "Collapsed and expanded",
    render: CollapsedAndExpanded,
  },
  {
    name: "RichContent",
    title: "Rich content",
    render: RichContent,
  },
  {
    name: "FaqGroup",
    title: "Faq group",
    render: FaqGroup,
  },
];
