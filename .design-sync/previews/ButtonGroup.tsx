import React from "react";
import { ButtonGroup, Typography } from "@its/glowup-ui";

const field: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  alignItems: "flex-start",
};

const VIEWS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export const Standard = () => (
  <div style={field}>
    <Typography variant="labelLarge">Calendar view</Typography>
    <ButtonGroup
      options={VIEWS}
      value="week"
      onValueChange={() => {}}
      accessibilityLabel="Calendar view"
    />
  </div>
);

export const Connected = () => (
  <div style={field}>
    <Typography variant="labelLarge">Calendar view</Typography>
    <ButtonGroup
      type="connected"
      options={VIEWS}
      value="week"
      onValueChange={() => {}}
      accessibilityLabel="Calendar view"
    />
  </div>
);

export const MultiSelect = () => (
  <div style={field}>
    <Typography variant="labelLarge">Notify me by</Typography>
    <ButtonGroup
      multiSelect
      type="connected"
      options={[
        { value: "email", label: "Email" },
        { value: "sms", label: "SMS" },
        { value: "push", label: "Push" },
      ]}
      value={["email", "push"]}
      onValueChange={() => {}}
      accessibilityLabel="Notification channels"
    />
  </div>
);

export const Outlined = () => (
  <div style={field}>
    <Typography variant="labelLarge">Calendar view</Typography>
    <ButtonGroup
      mode="outlined"
      type="connected"
      options={VIEWS}
      value="month"
      onValueChange={() => {}}
      accessibilityLabel="Calendar view"
    />
  </div>
);

export const Sizes = () => (
  <div style={field}>
    {(["xs", "s", "m"] as const).map((size) => (
      <ButtonGroup
        key={size}
        size={size}
        type="connected"
        options={VIEWS}
        value="day"
        onValueChange={() => {}}
        accessibilityLabel={`Calendar view, size ${size}`}
      />
    ))}
  </div>
);
