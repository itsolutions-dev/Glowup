import React from "react";
import { AnimatedFAB, Typography, Paper, ListItem } from "@glowup/ui";

const stage: React.CSSProperties = {
  width: 420,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

export const ExtendedAndCollapsed = () => (
  <div style={stage}>
    <Typography variant="labelMedium">
      extended toggles between the pill and the icon
    </Typography>
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <AnimatedFAB
        icon="plus"
        label="Nuovo intervento"
        placement="inline"
        onPress={() => {}}
      />
      <AnimatedFAB
        icon="plus"
        label="Nuovo intervento"
        placement="inline"
        extended={false}
        onPress={() => {}}
      />
    </div>
  </div>
);

export const AnimateFrom = () => (
  <div style={stage}>
    {(["right", "left"] as const).map((from) => (
      <div
        key={from}
        style={{ display: "flex", flexDirection: "column", gap: 6 }}
      >
        <Typography variant="labelSmall">{`animateFrom="${from}"`}</Typography>
        <div style={{ display: "flex" }}>
          <AnimatedFAB
            icon="pencil-outline"
            label="Modifica"
            animateFrom={from}
            placement="inline"
            onPress={() => {}}
          />
        </div>
      </div>
    ))}
  </div>
);

// The behaviour it exists for: collapse while the list scrolls.
export const ShrinkOnScroll = () => {
  const [extended, setExtended] = React.useState(true);

  return (
    <div style={{ ...stage, height: 300 }}>
      <Typography variant="labelMedium">Scroll the list</Typography>
      <div style={{ position: "relative", flex: 1, display: "flex" }}>
        <Paper elevation={1} outline style={{ flex: 1 }}>
          <div
            style={{ maxHeight: 200, overflowY: "auto" }}
            onScroll={(event) =>
              setExtended(event.currentTarget.scrollTop <= 0)
            }
          >
            {Array.from({ length: 12 }, (_, index) => (
              <ListItem key={index}>{`Intervento ${index + 1}`}</ListItem>
            ))}
          </div>
        </Paper>
        <div style={{ position: "absolute", right: 12, bottom: 12 }}>
          <AnimatedFAB
            icon="plus"
            label="Nuovo intervento"
            extended={extended}
            placement="inline"
            onPress={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export const Disabled = () => (
  <div style={{ display: "flex" }}>
    <AnimatedFAB
      icon="plus"
      label="Non disponibile"
      placement="inline"
      disabled
      onPress={() => {}}
    />
  </div>
);
