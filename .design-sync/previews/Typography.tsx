import React from "react";
import { Typography } from "@glowup/ui";

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  maxWidth: 560,
};

export const DisplayAndHeadline = () => (
  <div style={stack}>
    <Typography variant="displaySmall">Material You</Typography>
    <Typography variant="headlineMedium">
      Type that scales with intent
    </Typography>
    <Typography variant="headlineSmall">Six roles, three sizes each</Typography>
  </div>
);

export const TitlesAndBody = () => (
  <div style={stack}>
    <Typography variant="titleLarge">Billing preferences</Typography>
    <Typography variant="titleMedium">Payment method</Typography>
    <Typography variant="bodyLarge">
      Invoices are issued on the first working day of each month and charged to
      the card on file.
    </Typography>
    <Typography variant="bodyMedium">
      Changing the card mid-cycle applies from the next invoice; the current one
      is already committed.
    </Typography>
    <Typography variant="bodySmall">
      VAT is calculated from the billing address, not the shipping address.
    </Typography>
  </div>
);

export const Labels = () => (
  <div style={stack}>
    <Typography variant="labelLarge">Continue to payment</Typography>
    <Typography variant="labelMedium">Updated 3 minutes ago</Typography>
    <Typography variant="labelSmall">Required field</Typography>
  </div>
);
