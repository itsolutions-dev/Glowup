import React from "react";
import { Portal, Typography, Paper, Tooltip, Button } from "@its/glowup-ui";

const stage: React.CSSProperties = {
  width: 420,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

// The only thing about Portal worth looking at is the escape, so the demo has
// to contain a parent that really clips.
export const EscapesAClippingParent = () => (
  <Portal.Host>
    <div style={{ ...stage, height: 220 }}>
      <Typography variant="bodySmall">
        The panel below is 64px tall with overflow: hidden. The portalled badge
        is drawn at the host, so the clip does not reach it.
      </Typography>
      <div
        style={{
          height: 64,
          overflow: "hidden",
          borderRadius: 12,
          position: "relative",
        }}
      >
        <Paper elevation={2} style={{ flex: 1 }}>
          <Typography variant="labelLarge">Clipping parent</Typography>
        </Paper>
        <Portal>
          <div
            style={{
              position: "absolute",
              top: 120,
              left: 24,
              padding: 12,
              borderRadius: 12,
            }}
          >
            <Paper elevation={3}>
              <Typography variant="labelLarge">Drawn at the host</Typography>
            </Paper>
          </div>
        </Portal>
      </div>
    </div>
  </Portal.Host>
);

export const BacksTheTooltip = () => (
  <Portal.Host>
    <div style={{ ...stage, height: 200 }}>
      <Typography variant="bodySmall">
        With a host mounted, Tooltip renders through it — so a tip on an anchor
        inside a scrolling or clipping container is no longer cut off.
      </Typography>
      <div style={{ height: 48, overflow: "hidden", display: "flex" }}>
        <Tooltip content="Not clipped" enterDelay={0}>
          <Button mode="tonal" onPress={() => {}}>
            Hover me
          </Button>
        </Tooltip>
      </div>
    </div>
  </Portal.Host>
);
