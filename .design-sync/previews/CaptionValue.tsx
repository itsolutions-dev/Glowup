import React from "react";
import { CaptionValue, StatusBadge } from "@its/glowup-ui";

const box: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  width: 320,
};

export const Stacked = () => (
  <div style={box}>
    <CaptionValue caption="Phone" value="+39 06 1234 5678" />
    <CaptionValue caption="Email" value="ada@example.com" />
    <CaptionValue caption="Address" value="Via Roma 1, 00100 Roma" />
  </div>
);

export const InARow = () => (
  <div style={box}>
    <CaptionValue caption="Due date" value="12 Oct" direction="row" />
    <CaptionValue caption="Total" value="€1,240.50" direction="row" />
    <CaptionValue
      caption="Status"
      value={<StatusBadge label="Paid" />}
      direction="row"
    />
  </div>
);

export const EmptyValueAndColours = () => (
  <div style={box}>
    <CaptionValue caption="Mobile" value="" />
    <CaptionValue caption="Zero is a value" value={0} />
    <CaptionValue
      caption="Overdue"
      value="3 days"
      valueColor="#B00020"
      captionColor="#B00020"
    />
    <CaptionValue caption="Value first" value="Acme Inc." reverse />
  </div>
);
