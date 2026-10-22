import React from "react";
import { Blink, Button, StatusBadge, Typography } from "@its/glowup-ui";

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

const dot = (color: string): React.CSSProperties => ({
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: color,
});

/** It fades its children down to `minOpacity` and back, forever: a live indicator or a pending status. */
export const LiveIndicator = () => (
  <div style={column}>
    <Blink>
      <div style={row}>
        <div style={dot("#B00020")} />
        <Typography variant="labelLarge">Recording</Typography>
      </div>
    </Blink>
    <Blink>
      <StatusBadge label="Syncing" type="warning" />
    </Blink>
  </div>
);

/** `interval` is the time of one fade, in ms, 600 by default: 250 is urgent, 1500 calm. */
export const Interval = () => (
  <div style={column}>
    {[250, 600, 1500].map((interval) => (
      <Blink key={interval} interval={interval}>
        <div style={row}>
          <div style={dot("#1B5E20")} />
          <Typography variant="labelLarge">{`${interval} ms`}</Typography>
        </div>
      </Blink>
    ))}
  </div>
);

/** `minOpacity` is the dimmest point, from 0 (it vanishes) to 1 (it does not blink): 0.2 by default. */
export const MinOpacity = () => (
  <div style={column}>
    {[0, 0.2, 0.6].map((minOpacity) => (
      <Blink key={minOpacity} minOpacity={minOpacity}>
        <div style={row}>
          <div style={dot("#6750A4")} />
          <Typography variant="labelLarge">{`minOpacity ${minOpacity}`}</Typography>
        </div>
      </Blink>
    ))}
  </div>
);

/** `active={false}` stops it at full opacity, so the same markup can be a quiet status once the wait is over. */
export const Toggled = () => {
  const [active, setActive] = React.useState(true);
  return (
    <div style={column}>
      <Blink active={active}>
        <div style={row}>
          <div style={dot("#B00020")} />
          <Typography variant="labelLarge">
            {active ? "Waiting for the courier" : "Delivered"}
          </Typography>
        </div>
      </Blink>
      <div>
        <Button variant="tonal" onClick={() => setActive((a) => !a)}>
          {active ? "Stop" : "Start"}
        </Button>
      </div>
    </div>
  );
};
