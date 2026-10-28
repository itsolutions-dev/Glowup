import React from "react";
import { Avatar, Button, HoverCard, Link, Typography } from "@its/glowup-ui";

// HoverCard opens on hover or focus on the web (and on a long press on native).
// `defaultOpen` shows it open for the capture. Without a PortalHost the card
// renders through react-native-web's Modal, a portal into document.body, so the
// card needs cfg.overrides { cardMode: "single", viewport }.
const page: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  width: 440,
  padding: 24,
};

const Profile = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Avatar name="Marta Rossi" size="medium" />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Typography variant="titleSmall">Marta Rossi</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          Product designer · Milan
        </Typography>
      </div>
    </div>
    <Typography variant="bodyMedium">
      Owns the design system and the release notes. Usually answers within a
      day.
    </Typography>
  </div>
);

export const ProfilePreview = () => (
  <div style={page}>
    <Typography variant="bodyMedium">Last edited by</Typography>
    <HoverCard defaultOpen placement="bottom" content={<Profile />}>
      <Link onPress={() => {}}>Marta Rossi</Link>
    </HoverCard>
  </div>
);

export const OnAButton = () => (
  <div style={page}>
    <HoverCard
      defaultOpen
      placement="right"
      width={240}
      content={
        <Typography variant="bodyMedium">
          Publishes every component to the playground and to the npm registry.
        </Typography>
      }
    >
      <Button variant="tonal" iconName="upload-outline" onClick={() => {}}>
        Publish
      </Button>
    </HoverCard>
  </div>
);
