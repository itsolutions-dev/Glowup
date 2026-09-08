import React from "react";
import { Badge, Avatar, Button, Typography } from "@glowup/ui";

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

export const OnIconButtons = () => (
  <div style={row}>
    <div style={stack}>
      <div style={anchor}>
        <Button mode="tonal" iconName="email-outline" onPress={() => {}} />
        <Badge count={3} style={{ top: -2, right: -2 }} />
      </div>
      <Typography variant="labelSmall">Inbox</Typography>
    </div>
    <div style={stack}>
      <div style={anchor}>
        <Button mode="tonal" iconName="bell-outline" onPress={() => {}} />
        <Badge count={12} style={{ top: -2, right: -2 }} />
      </div>
      <Typography variant="labelSmall">Alerts</Typography>
    </div>
    <div style={stack}>
      <div style={anchor}>
        <Button mode="tonal" iconName="cart-outline" onPress={() => {}} />
        <Badge count={128} style={{ top: -2, right: -2 }} />
      </div>
      <Typography variant="labelSmall">Cart</Typography>
    </div>
  </div>
);

export const Sizes = () => (
  <div style={row}>
    <div style={stack}>
      <div style={anchor}>
        <Button mode="outlined" iconName="message-outline" onPress={() => {}} />
        <Badge count={7} size="large" style={{ top: -2, right: -2 }} />
      </div>
      <Typography variant="labelSmall">large (count)</Typography>
    </div>
    <div style={stack}>
      <div style={anchor}>
        <Button mode="outlined" iconName="message-outline" onPress={() => {}} />
        <Badge size="small" style={{ top: 2, right: 2 }} />
      </div>
      <Typography variant="labelSmall">small (dot)</Typography>
    </div>
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
