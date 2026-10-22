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
    <Accordion title="Shipping address" expanded>
      Orders ship from the Milan warehouse within one business day. Tracking
      details arrive by email as soon as the courier scans the parcel.
    </Accordion>
    <Accordion title="Payment methods">Hidden until expanded.</Accordion>
    <Accordion title="Returns and refunds">Hidden until expanded.</Accordion>
  </View>
);

export const RichContent = () => (
  <View style={panel}>
    <Accordion title="Deployment status" expanded>
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
    <Accordion title="Can I invite external collaborators?" expanded>
      Workspace owners can invite guests from the Members tab. Guests see only
      the projects they are added to and never appear in billing seats.
    </Accordion>
    <Accordion title="Where is my data stored?">
      All workspace data lives in the EU (Frankfurt) region.
    </Accordion>
  </View>
);

/** `variant="contained"` is a filled tonal panel with no border. */
export const Contained = () => (
  <View style={panel}>
    <Accordion title="Shipping address" variant="contained" expanded>
      Orders ship from the Milan warehouse within one business day.
    </Accordion>
    <Accordion title="Payment methods" variant="contained">
      Hidden until expanded.
    </Accordion>
    <Accordion title="Returns and refunds" variant="contained">
      Hidden until expanded.
    </Accordion>
  </View>
);

/** `icon` replaces the chevron, with a glyph name or any node. The chevron turns with the panel; a custom icon does not. */
export const CustomIcon = () => (
  <View style={panel}>
    <Accordion title="Advanced options" icon="cog-outline">
      Hidden until expanded.
    </Accordion>
    <Accordion
      title="Billing"
      icon={<StatusBadge label="New" type="success" />}
      expanded
    >
      The icon slot takes any node, a badge here.
    </Accordion>
  </View>
);

/** `expanded` follows the parent when it changes, and `onClick` reports each toggle: one accordion open at a time. */
export const OneAtATime = () => {
  const [open, setOpen] = React.useState("shipping");
  return (
    <View style={panel}>
      {[
        ["shipping", "Shipping address", "Ships from the Milan warehouse."],
        ["payment", "Payment methods", "Cards and bank transfer."],
        ["returns", "Returns and refunds", "Within 30 days of delivery."],
      ].map(([id, title, text]) => (
        <Accordion
          key={id}
          title={title}
          expanded={open === id}
          onClick={(expanded) => setOpen(expanded ? id : "")}
        >
          {text}
        </Accordion>
      ))}
    </View>
  );
};

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
  {
    name: "Contained",
    title: "Contained",
    description:
      '`variant="contained"` is a filled tonal panel with no border.',
    render: Contained,
  },
  {
    name: "CustomIcon",
    title: "Custom icon",
    description:
      "`icon` replaces the chevron, with a glyph name or any node. The chevron turns with the panel; a custom icon does not.",
    render: CustomIcon,
  },
  {
    name: "OneAtATime",
    title: "One at a time",
    description:
      "`expanded` follows the parent when it changes, and `onClick` reports each toggle: one accordion open at a time.",
    render: OneAtATime,
  },
];
