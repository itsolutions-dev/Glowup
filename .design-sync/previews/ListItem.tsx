import React from "react";
import {
  Avatar,
  Icon,
  ListItem,
  StatusBadge,
  Switch,
  Typography,
  useTheme,
} from "@its/glowup-ui";

const list: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: 340,
};

const chevron = <Icon source="chevron-right" size={20} color="#79747E" />;

export const SettingsList = () => (
  <div style={list}>
    <ListItem
      onClick={() => {}}
      icon={<Icon source="account-multiple-outline" size={24} />}
      secondaryText="3 members, 1 pending invite"
      action={chevron}
      primaryText="Workspace members"
    />
    <ListItem
      onClick={() => {}}
      icon={<Icon source="lock-outline" size={24} />}
      secondaryText="Passkeys and two-factor"
      action={chevron}
      primaryText="Privacy and security"
    />
    <ListItem
      icon={<Icon source="email-outline" size={24} />}
      secondaryText="Weekly digest"
      action={<Switch value onChange={() => {}} />}
      primaryText="Email notifications"
    />
  </div>
);

/** `standard` is transparent with no border, like a sidebar's rows; `outlined` draws an outline; `contained` (the default) fills the row. */
export const Variants = () => (
  <div style={list}>
    {(["standard", "outlined", "contained"] as const).map((variant) => (
      <ListItem
        key={variant}
        variant={variant}
        onClick={() => {}}
        icon="folder-outline"
        secondaryText={`variant="${variant}"`}
        action={chevron}
        primaryText={variant[0].toUpperCase() + variant.slice(1)}
      />
    ))}
  </div>
);

/** Every slot is optional: a leading `icon`, a `secondaryText` line, a trailing `action`, in any mix. */
export const Slots = () => (
  <div style={list}>
    <ListItem
      icon={<Icon source="folder-multiple-outline" size={24} />}
      primaryText="Shared drive"
    />
    <ListItem action={chevron} primaryText="Storage" />
    <ListItem secondaryText="Today at 09:42" primaryText="Last sync" />
    <ListItem
      icon={<Icon source="chart-box" size={24} />}
      secondaryText="Generated on 1 Oct"
      action={chevron}
      primaryText="Monthly report"
    />
  </div>
);

/** `icon` takes a glyph name as well as a node: the name is drawn at 24 px in the muted colour. */
export const GlyphNames = () => (
  <div style={list}>
    <ListItem icon="folder-outline" primaryText="Documents" />
    <ListItem
      icon="image-outline"
      secondaryText="1,204 items"
      primaryText="Photos"
    />
    <ListItem
      icon="trash-can-outline"
      secondaryText="Emptied after 30 days"
      primaryText="Bin"
    />
  </div>
);

export const WithAvatars = () => (
  <div style={list}>
    {[
      { name: "Ada Lovelace", role: "Engineering lead", access: "Owner" },
      { name: "Grace Hopper", role: "Platform architect", access: "Admin" },
      { name: "Katherine Johnson", role: "Data science", access: "Member" },
    ].map((m) => (
      <ListItem
        key={m.name}
        variant="standard"
        onClick={() => {}}
        icon={<Avatar name={m.name} size={40} />}
        secondaryText={m.role}
        action={<Typography variant="labelLarge">{m.access}</Typography>}
        primaryText={m.name}
      />
    ))}
  </div>
);

/** With `onClick` and an `action`, only the icon and the texts are the button: the switch is a control of its own beside it. */
export const PressableWithAction = () => {
  const [on, setOn] = React.useState(true);
  return (
    <div style={list}>
      <ListItem
        onClick={() => {}}
        icon="bell-outline"
        secondaryText="Push, email and SMS"
        action={<Switch value={on} onChange={setOn} />}
        primaryText="Notifications"
      />
      <ListItem
        onClick={() => {}}
        icon="cog-outline"
        secondaryText="Language, theme and density"
        action={chevron}
        primaryText="Preferences"
      />
    </div>
  );
};

/** `disabled` fades the row and stops it being pressed; `dimmed` only fades it, for a row that is inactive but still opens. */
export const DisabledAndDimmed = () => (
  <div style={list}>
    <ListItem
      onClick={() => {}}
      icon="backup-restore"
      secondaryText="Last run 2 hours ago"
      primaryText="Local backup"
    />
    <ListItem
      disabled
      onClick={() => {}}
      icon="cloud-off-outline"
      secondaryText="Available on the Pro plan"
      primaryText="Cloud backup"
    />
    <ListItem
      dimmed
      onClick={() => {}}
      icon="archive-outline"
      secondaryText="Archived on 3 Oct"
      primaryText="Archived project"
    />
  </div>
);

/** `primaryTextStyle` and `secondaryTextStyle` are merged after the row's own type, for a text `primaryText` or `secondaryText`. */
export const TextStyles = () => {
  const { theme } = useTheme();
  return (
    <div style={list}>
      <ListItem
        icon="alert-circle-outline"
        secondaryText="Retrying on 14 Nov"
        secondaryTextStyle={{ color: theme.colors.error }}
        primaryTextStyle={{ fontWeight: "700" }}
        primaryText="Payment failed"
      />
      <ListItem
        icon="check-circle-outline"
        secondaryText="All systems operational"
        secondaryTextStyle={{ fontStyle: "italic" }}
        primaryTextStyle={{ color: theme.colors.success }}
        primaryText="Status"
      />
    </div>
  );
};

export const CustomSurface = () => (
  <div style={list}>
    {[
      { label: "Milan — Hub 01", parcels: "1.240 parcels", tint: "#D7E3FF" },
      { label: "Turin — Hub 02", parcels: "860 parcels", tint: "#E8DEF8" },
      { label: "Genoa — Hub 03", parcels: "312 parcels", tint: "#FFD8E4" },
    ].map((hub) => (
      <ListItem
        key={hub.label}
        onClick={() => {}}
        icon={<Icon source="domain" size={24} color="#1D1B20" />}
        secondaryText={hub.parcels}
        itemContainerStyle={{ backgroundColor: hub.tint }}
        primaryTextStyle={{ color: "#1D1B20" }}
        secondaryTextStyle={{ color: "#49454F" }}
        primaryText={hub.label}
      />
    ))}
  </div>
);

/** No slots at all: the original single-line centred tile is still what you get. */
export const TextOnly = () => (
  <div style={list}>
    <ListItem onClick={() => {}} primaryText="Q1 revenue report" />
    <ListItem onClick={() => {}} primaryText="Warehouse capacity plan" />
    <ListItem onClick={() => {}} primaryText="Supplier contract renewal" />
  </div>
);

/** `primaryText` can be a node, drawn as given; `trailingWidth` lines the actions up on one edge. */
export const StatusRows = () => (
  <div style={list}>
    <ListItem
      indicatorColor="#B00020"
      secondaryText="Call back before Friday"
      action={<StatusBadge label="Urgent" type="error" />}
      trailingWidth={112}
      primaryText={<Typography variant="titleMedium">Marta Bianchi</Typography>}
    />
    <ListItem
      indicatorColor="#61B340"
      secondaryText="Quote accepted"
      action={<StatusBadge label="Won" />}
      trailingWidth={112}
      primaryText={<Typography variant="titleMedium">Luca Verdi</Typography>}
    />
    <ListItem
      dimmed
      secondaryText="Removed on 12 Oct"
      action={<StatusBadge label="Removed" type="warning" />}
      trailingWidth={112}
      primaryText={<Typography variant="titleMedium">Anna Neri</Typography>}
    />
  </div>
);
