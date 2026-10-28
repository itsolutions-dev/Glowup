import React from "react";
import {
  Blink,
  Button,
  StatusBadge,
  Typography,
  useTheme,
} from "@its/glowup-ui";

const column: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
  width: 340,
};

const row: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
};

// Only the dot blinks; the label beside it stays readable.
const Dot = ({ color }: { color: string }) => (
  <div
    style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }}
  />
);

/** It fades its children down to `minOpacity` and back, forever: a live indicator or a pending status. */
export const LiveIndicator = () => {
  const { theme } = useTheme();
  return (
    <div style={column}>
      <div style={row}>
        <Blink>
          <Dot color={theme.colors.error} />
        </Blink>
        <Typography variant="labelLarge">Recording</Typography>
      </div>
      <div style={row}>
        <Blink>
          <StatusBadge label="Syncing" type="warning" />
        </Blink>
      </div>
    </div>
  );
};

/**
 * `interval` is the time of one fade in ms (600 by default): short for
 * something urgent, long for a calm wait. `minOpacity` is the dimmest point,
 * from 0 (it vanishes) to 1 (it does not blink), 0.2 by default. Both are
 * timing: a still catches each dot at an arbitrary point of its fade, so the
 * rows are not meant to look different here.
 */
export const Tuning = () => {
  const { theme } = useTheme();
  return (
    <div style={column}>
      {(
        [
          ["Incoming call", 250, 0, theme.colors.error],
          ["Uploading 3 files", 600, 0.2, theme.colors.primary],
          ["Waiting for the courier", 1500, 0.6, theme.colors.tertiary],
        ] as const
      ).map(([label, interval, minOpacity, color]) => (
        <div key={label} style={row}>
          <Blink interval={interval} minOpacity={minOpacity}>
            <Dot color={color} />
          </Blink>
          <Typography variant="labelLarge">{label}</Typography>
        </div>
      ))}
    </div>
  );
};

/** `active={false}` stops it at full opacity, so the same markup can be a quiet status once the wait is over. */
export const Toggled = () => {
  const { theme } = useTheme();
  const [active, setActive] = React.useState(true);
  return (
    <div style={column}>
      <div style={row}>
        <Blink active={active}>
          <Dot color={active ? theme.colors.error : theme.colors.success} />
        </Blink>
        <Typography variant="labelLarge">
          {active ? "Waiting for the courier" : "Delivered"}
        </Typography>
      </div>
      <div>
        <Button variant="tonal" onClick={() => setActive((a) => !a)}>
          {active ? "Mark delivered" : "Undo"}
        </Button>
      </div>
    </div>
  );
};
