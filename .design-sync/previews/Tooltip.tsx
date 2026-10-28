import React from "react";
import { Tooltip, Button, IconButton, Typography } from "@its/glowup-ui";

/**
 * Tooltip has no controlled `visible` prop — it opens on real hover (web) or
 * long-press (native). To capture the open state statically we fire the
 * `pointerover` a mouse would, at the anchor View the Tooltip renders: React
 * turns it into the `onPointerEnter` the Tooltip listens to, and the default
 * 500 ms `enterDelay` then opens the tip.
 */
const Hovered = ({ children }: { children: React.ReactNode }) => {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const anchor = hostRef.current?.firstElementChild
      ?.firstElementChild as HTMLElement | null;
    anchor?.dispatchEvent(
      new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }),
    );
  }, []);
  return (
    <div ref={hostRef} style={{ display: "inline-flex" }}>
      {children}
    </div>
  );
};

const cell: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  alignItems: "center",
  justifyContent: "center",
  padding: "30px 40px 20px",
};

/** `position` puts the tip on any side of its anchor. On an icon-only `IconButton`, its own `title` prop draws this same tooltip. */
export const Positions = () => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", width: 400 }}>
    <div style={cell}>
      <Hovered>
        <Tooltip content="Duplicate" position="top">
          <IconButton
            variant="tonal"
            icon="content-copy"
            accessibilityLabel="Duplicate"
            onClick={() => {}}
          />
        </Tooltip>
      </Hovered>
      <Typography variant="labelSmall">top</Typography>
    </div>
    {/* The label goes above here, so the tip below the button does not cover it. */}
    <div
      style={{
        ...cell,
        flexDirection: "column-reverse",
        padding: "20px 40px 30px",
      }}
    >
      <Hovered>
        <Tooltip content="Share" position="bottom">
          <IconButton
            variant="tonal"
            icon="share-variant"
            accessibilityLabel="Share"
            onClick={() => {}}
          />
        </Tooltip>
      </Hovered>
      <Typography variant="labelSmall">bottom</Typography>
    </div>
    <div style={cell}>
      <Hovered>
        <Tooltip content="Rename" position="left">
          <IconButton
            variant="tonal"
            icon="pencil-outline"
            accessibilityLabel="Rename"
            onClick={() => {}}
          />
        </Tooltip>
      </Hovered>
      <Typography variant="labelSmall">left</Typography>
    </div>
    <div style={cell}>
      <Hovered>
        <Tooltip content="Delete" position="right">
          <IconButton
            variant="tonal"
            icon="delete-outline"
            accessibilityLabel="Delete"
            onClick={() => {}}
          />
        </Tooltip>
      </Hovered>
      <Typography variant="labelSmall">right</Typography>
    </div>
  </div>
);

export const ToolbarHints = () => (
  <div
    style={{
      display: "flex",
      gap: 40,
      alignItems: "center",
      justifyContent: "center",
      padding: "12px 20px 46px",
      width: 340,
    }}
  >
    <Hovered>
      <Tooltip content="Download" position="bottom">
        <IconButton
          variant="outlined"
          icon="download"
          accessibilityLabel="Download"
          onClick={() => {}}
        />
      </Tooltip>
    </Hovered>
    <Hovered>
      <Tooltip content="Archive" position="bottom">
        <IconButton
          variant="outlined"
          icon="archive-outline"
          accessibilityLabel="Archive"
          onClick={() => {}}
        />
      </Tooltip>
    </Hovered>
    <Hovered>
      <Tooltip content="Print" position="bottom">
        <IconButton
          variant="outlined"
          icon="printer-outline"
          accessibilityLabel="Print"
          onClick={() => {}}
        />
      </Tooltip>
    </Hovered>
  </div>
);

/** `disabled` keeps the tip closed while the anchor stays as it is: both buttons are hovered here. */
export const DisabledHint = () => (
  <div
    style={{
      display: "flex",
      gap: 28,
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "44px 16px 12px",
      width: 340,
    }}
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "center",
      }}
    >
      <Hovered>
        <Tooltip content="Ctrl+Enter" position="top">
          <Button variant="filled" onClick={() => {}}>
            Publish
          </Button>
        </Tooltip>
      </Hovered>
      <Typography variant="labelSmall">enabled</Typography>
    </div>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "center",
      }}
    >
      <Hovered>
        <Tooltip content="Ctrl+S" position="top" disabled>
          <Button variant="outlined" onClick={() => {}}>
            Save draft
          </Button>
        </Tooltip>
      </Hovered>
      <Typography variant="labelSmall">disabled</Typography>
    </div>
  </div>
);
