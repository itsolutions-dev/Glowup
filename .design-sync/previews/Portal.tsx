import React from "react";
import { Portal, Typography, Paper, Tooltip, Button } from "@its/glowup-ui";

const stage: React.CSSProperties = {
  width: 420,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

// Opens the tooltip for the capture with a real hover. Tooltip's web anchor
// listens through React's onPointerEnter, which React synthesises from a
// bubbling `pointerover` (a native `pointerenter` never reaches it).
const Hovered = ({ children }: { children: React.ReactNode }) => {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const anchor = hostRef.current?.firstElementChild
      ?.firstElementChild as HTMLElement | null;
    anchor?.dispatchEvent(
      new PointerEvent("pointerover", { pointerType: "mouse", bubbles: true }),
    );
  }, []);
  return (
    <div ref={hostRef} style={{ display: "inline-flex" }}>
      {children}
    </div>
  );
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

// Tooltip places a portalled tip in window coordinates, which assumes the
// host sits at the window origin, as it does wrapping an app root. The card
// is inset in the page, so this wrapper moves the host's box back to the
// origin (padding keeps the content where it was).
const AtWindowOrigin = ({ children }: { children: React.ReactNode }) => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [inset, setInset] = React.useState({ x: 0, y: 0 });
  React.useLayoutEffect(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setInset({ x: rect.left, y: rect.top });
  }, []);
  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        left: -inset.x,
        top: -inset.y,
        paddingLeft: inset.x,
        paddingTop: inset.y,
      }}
    >
      {children}
    </div>
  );
};

export const BacksTheTooltip = () => (
  <AtWindowOrigin>
    <Portal.Host>
      <div style={{ ...stage, height: 200 }}>
        <Typography variant="bodySmall">
          With a host mounted, Tooltip renders through it — so a tip on an
          anchor inside a scrolling or clipping container is no longer cut off.
        </Typography>
        <div
          style={{
            height: 56,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Hovered>
            <Tooltip content="Not clipped" position="bottom" enterDelay={0}>
              <Button variant="tonal" onClick={() => {}}>
                Hover me
              </Button>
            </Tooltip>
          </Hovered>
        </div>
      </div>
    </Portal.Host>
  </AtWindowOrigin>
);
