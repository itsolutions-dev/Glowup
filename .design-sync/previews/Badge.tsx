import React from "react";
import { Badge, Avatar, IconButton, Typography } from "@its/glowup-ui";

const row: React.CSSProperties = {
  display: "flex",
  gap: 28,
  alignItems: "center",
  flexWrap: "wrap",
};

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  alignItems: "center",
};

/** Badge is absolutely positioned — it needs a relatively-positioned anchor. */
const anchor: React.CSSProperties = {
  position: "relative",
  display: "inline-flex",
};

/** `position="top-right"` pins the badge to the anchor's corner, overlapping it slightly. (`IconButton` also has its own `badge` prop.) */
export const OnIconButtons = () => (
  <div style={row}>
    {(
      [
        ["email-outline", "Inbox", 3],
        ["bell-outline", "Alerts", 12],
        ["cart-outline", "Cart", 128],
      ] as const
    ).map(([icon, label, count]) => (
      <div key={label} style={stack}>
        <div style={anchor}>
          <IconButton
            variant="tonal"
            icon={icon}
            accessibilityLabel={label}
            onClick={() => {}}
          />
          <Badge count={count} position="top-right" />
        </div>
        <Typography variant="labelSmall">{label}</Typography>
      </div>
    ))}
  </div>
);

/** `size="large"` carries a count; `size="small"` (or no `count`) is a 6 px dot that only says "something new". */
export const Sizes = () => (
  <div style={row}>
    <div style={stack}>
      <div style={anchor}>
        <IconButton
          variant="outlined"
          icon="message-outline"
          accessibilityLabel="Messages"
          onClick={() => {}}
        />
        <Badge count={7} size="large" position="top-right" />
      </div>
      <Typography variant="labelSmall">large (count)</Typography>
    </div>
    <div style={stack}>
      <div style={anchor}>
        <IconButton
          variant="outlined"
          icon="message-outline"
          accessibilityLabel="Messages"
          onClick={() => {}}
        />
        <Badge size="small" style={{ top: 6, right: 6 }} />
      </div>
      <Typography variant="labelSmall">small (dot)</Typography>
    </div>
  </div>
);

/** `color` takes a colour role; `error` is the default. */
export const Colors = () => (
  <div style={row}>
    {(
      [
        ["error", "bell-outline"],
        ["primary", "email-outline"],
        ["tertiary", "message-outline"],
        ["success", "cloud-check-outline"],
        ["warning", "alert-outline"],
        ["info", "information-outline"],
        ["neutral", "inbox-outline"],
      ] as const
    ).map(([color, icon]) => (
      <div key={color} style={stack}>
        <div style={anchor}>
          <IconButton
            variant="tonal"
            icon={icon}
            accessibilityLabel={color}
            onClick={() => {}}
          />
          <Badge count={4} color={color} position="top-right" />
        </div>
        <Typography variant="labelSmall">{color}</Typography>
      </div>
    ))}
  </div>
);

export const OverflowAndZero = () => (
  <div style={row}>
    <div style={stack}>
      <div style={anchor}>
        <Avatar name="Ada Lovelace" size={44} variant="rounded" />
        <Badge count={250} max={99} style={{ top: -4, right: -8 }} />
      </div>
      <Typography variant="labelSmall">250, max 99</Typography>
    </div>
    <div style={stack}>
      <div style={anchor}>
        <Avatar name="Grace Hopper" size={44} variant="rounded" />
        <Badge count={9} max={5} style={{ top: -4, right: -8 }} />
      </div>
      <Typography variant="labelSmall">9, max 5</Typography>
    </div>
    <div style={stack}>
      <div style={anchor}>
        <Avatar name="Alan Turing" size={44} variant="rounded" />
        <Badge count={0} showZero style={{ top: -4, right: -8 }} />
      </div>
      <Typography variant="labelSmall">0, showZero</Typography>
    </div>
    <div style={stack}>
      <div style={anchor}>
        <Avatar name="Marie Curie" size={44} variant="rounded" />
        <Badge count={0} style={{ top: -4, right: -8 }} />
      </div>
      <Typography variant="labelSmall">0, hidden</Typography>
    </div>
  </div>
);

export const OnAvatar = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", width: 300 }}>
    <div style={anchor}>
      <Avatar name="Katherine Johnson" size={48} />
      <Badge count={4} style={{ top: 0, right: -4 }} />
    </div>
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Typography variant="titleSmall">Katherine Johnson</Typography>
      <Typography variant="bodySmall">4 unread messages</Typography>
    </div>
  </div>
);
