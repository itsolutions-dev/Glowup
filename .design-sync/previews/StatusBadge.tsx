import React from "react";
import { StatusBadge, Typography, Divider } from "@glowup/ui";

const row: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

export const Types = () => (
  <div style={row}>
    <StatusBadge label="Active" type="success" />
    <StatusBadge label="Payment failed" type="error" />
    <StatusBadge label="Expiring soon" type="warning" />
  </div>
);

export const CustomIcons = () => (
  <div style={row}>
    <StatusBadge label="Deployed" type="success" icon="rocket-launch-outline" />
    <StatusBadge label="Build broken" type="error" icon="close-octagon-outline" />
    <StatusBadge label="Pending review" type="warning" icon="clock-outline" />
    <StatusBadge label="Synced" type="success" icon="cloud-check-outline" />
  </div>
);

export const InvoiceList = () => (
  <div style={{ display: "flex", flexDirection: "column", width: 320 }}>
    {[
      { id: "INV-2041", amount: "€1,280.00", label: "Paid", type: "success" },
      { id: "INV-2042", amount: "€640.00", label: "Overdue", type: "error" },
      { id: "INV-2043", amount: "€2,110.00", label: "Due in 3 days", type: "warning" },
    ].map((invoice, i) => (
      <div key={invoice.id}>
        {i > 0 && <Divider contentSpacing={0} />}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "12px 4px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Typography variant="titleSmall">{invoice.id}</Typography>
            <Typography variant="bodySmall">{invoice.amount}</Typography>
          </div>
          <StatusBadge label={invoice.label} type={invoice.type as any} />
        </div>
      </div>
    ))}
  </div>
);
