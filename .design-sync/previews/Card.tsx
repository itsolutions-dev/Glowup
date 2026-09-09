import React from "react";
import {
  Card,
  Typography,
  Divider,
  Avatar,
  StatusBadge,
  Chip,
  Button,
} from "@glowup/ui";

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  width: 380,
};

const spacer = (h: number) => <div style={{ height: h }} />;

// react-native-web renders Typography as an inline-flex <Text>, so sibling lines
// inside a plain <div> need an explicit column flex to stack.
const lines: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

export const Variants = () => (
  <div style={stack}>
    <Card variant="filled">
      <Typography variant="titleSmall">Filled</Typography>
      <Typography variant="bodySmall">
        Default surface container — the everyday card.
      </Typography>
    </Card>
    <Card variant="outlined">
      <Typography variant="titleSmall">Outlined</Typography>
      <Typography variant="bodySmall">
        A hairline outline instead of a tonal fill.
      </Typography>
    </Card>
    <Card variant="elevated">
      <Typography variant="titleSmall">Elevated</Typography>
      <Typography variant="bodySmall">
        Raised off the background with a shadow.
      </Typography>
    </Card>
    <Card variant="glow">
      <Typography variant="titleSmall">Glow</Typography>
      <Typography variant="bodySmall">
        Accent halo for the primary call to action.
      </Typography>
    </Card>
  </div>
);

export const ProfileCard = () => (
  <div style={{ width: 380 }}>
    <Card variant="elevated">
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Avatar name="Marta Rossi" size={48} status="online" />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="titleMedium">Marta Rossi</Typography>
          <Typography variant="bodySmall">Lead product designer</Typography>
        </div>
      </div>
      {spacer(12)}
      <Divider contentSpacing={0} />
      {spacer(12)}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Chip
          label="Design system"
          size="small"
          mode="tonal"
          onPress={() => {}}
        />
        <Chip
          label="Accessibility"
          size="small"
          mode="tonal"
          onPress={() => {}}
        />
      </div>
    </Card>
  </div>
);

export const Pressable = () => (
  <div style={stack}>
    <Card
      variant="filled"
      onPress={() => {}}
      accessibilityLabel="Open billing settings"
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={lines}>
          <Typography variant="titleSmall">Billing</Typography>
          <Typography variant="bodySmall">
            Visa ending 4021 · renews 12 Oct
          </Typography>
        </div>
        <StatusBadge label="Active" type="success" />
      </div>
    </Card>
    <Card
      variant="outlined"
      onPress={() => {}}
      accessibilityLabel="Review failed payment"
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={lines}>
          <Typography variant="titleSmall">Payment method</Typography>
          <Typography variant="bodySmall">Last charge was declined</Typography>
        </div>
        <StatusBadge label="Action needed" type="error" />
      </div>
    </Card>
  </div>
);

export const WithActions = () => (
  <div style={{ width: 380 }}>
    <Card variant="outlined">
      <Typography variant="titleMedium">Invite your team</Typography>
      {spacer(4)}
      <Typography variant="bodyMedium">
        Everyone you invite gets read access to the shared component library.
        You can raise their role later from Settings.
      </Typography>
      {spacer(16)}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button mode="text" onPress={() => {}}>
          Not now
        </Button>
        <Button
          mode="filled"
          iconName="account-plus-outline"
          onPress={() => {}}
        >
          Invite
        </Button>
      </div>
    </Card>
  </div>
);
