import React from "react";
import {
  Chip,
  Divider,
  StatusBadge,
  Tabs,
  TabContent,
  Typography,
} from "@glowup/ui";

// TabContent renders only the child at `activeTab`, so each cell is a real
// Tabs + TabContent pair sharing one index. The children array must line up
// with the tabs array.

const TABS = ["Overview", "Specs", "Reviews"];

const frame: React.CSSProperties = {
  width: 400,
  height: 220,
  display: "flex",
  flexDirection: "column",
};

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const row: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

const between: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: 4,
  paddingBottom: 4,
};

const Overview = () => (
  <div style={stack}>
    <Typography variant="titleMedium">Acoustic Pro X2</Typography>
    <Typography variant="bodyMedium">
      Studio-grade over-ear headphones with adaptive noise cancelling and a
      32-hour battery.
    </Typography>
    <div style={row}>
      <Chip label="In stock" mode="tonal" size="small" icon="check" />
      <Chip label="Free returns" mode="outlined" size="small" />
    </div>
  </div>
);

const Specs = () => (
  <div style={stack}>
    <div style={between}>
      <Typography variant="bodyMedium">Driver</Typography>
      <Typography variant="labelLarge">40 mm dynamic</Typography>
    </div>
    <Divider contentSpacing={0} />
    <div style={between}>
      <Typography variant="bodyMedium">Battery</Typography>
      <Typography variant="labelLarge">32 h</Typography>
    </div>
    <Divider contentSpacing={0} />
    <div style={between}>
      <Typography variant="bodyMedium">Weight</Typography>
      <Typography variant="labelLarge">248 g</Typography>
    </div>
  </div>
);

const Reviews = () => (
  <div style={stack}>
    <div style={row}>
      <Typography variant="titleMedium">4.6 out of 5</Typography>
      <StatusBadge label="Verified" type="success" />
    </div>
    <Typography variant="bodyMedium">
      “Best pair I have owned — the noise cancelling actually holds up on a
      plane.”
    </Typography>
    <Typography variant="labelMedium">Giulia D. · 2 weeks ago</Typography>
  </div>
);

const Panels = ({ activeTab }: { activeTab: number }) => (
  <div style={frame}>
    <Tabs tabs={TABS} activeTab={activeTab} onChange={() => {}} />
    <TabContent activeTab={activeTab}>
      <Overview />
      <Specs />
      <Reviews />
    </TabContent>
  </div>
);

export const ProductOverview = () => <Panels activeTab={0} />;

export const SpecSheet = () => <Panels activeTab={1} />;

export const ReviewFeed = () => <Panels activeTab={2} />;
