import React from "react";
import { Accordion, Typography, StatusBadge, Divider } from "@glowup/ui";

const panel: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: 380,
};

export const CollapsedAndExpanded = () => (
  <div style={panel}>
    <Accordion title="Shipping address" startExpanded>
      Orders ship from the Milan warehouse within one business day. Tracking
      details arrive by email as soon as the courier scans the parcel.
    </Accordion>
    <Accordion title="Payment methods">Hidden until expanded.</Accordion>
    <Accordion title="Returns and refunds">Hidden until expanded.</Accordion>
  </div>
);

export const RichContent = () => (
  <div style={panel}>
    <Accordion title="Deployment status" startExpanded>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="bodyMedium">api-gateway</Typography>
          <StatusBadge label="Live" type="success" />
        </div>
        <Divider contentSpacing={0} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="bodyMedium">billing-worker</Typography>
          <StatusBadge label="Rolling out" type="warning" />
        </div>
        <Divider contentSpacing={0} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="bodyMedium">report-exporter</Typography>
          <StatusBadge label="Failed" type="error" />
        </div>
      </div>
    </Accordion>
  </div>
);

export const FaqGroup = () => (
  <div style={panel}>
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
  </div>
);
