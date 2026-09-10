import React from "react";
import { Tooltip, Button, Typography } from "@its/glowup-ui";

/**
 * Tooltip has no controlled `visible` prop — it opens on real hover (web) or
 * long-press (native). To capture the open state statically we fire the same
 * pointerenter the browser would, on the Pressable anchor the Tooltip renders.
 */
const Hovered = ({ children }: { children: React.ReactNode }) => {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const anchor = hostRef.current?.firstElementChild
      ?.firstElementChild as HTMLElement | null;
    anchor?.dispatchEvent(
      new PointerEvent("pointerenter", { pointerType: "mouse" }),
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

export const Positions = () => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", width: 400 }}>
    <div style={cell}>
      <Hovered>
        <Tooltip content="Duplicate" position="top">
          <Button mode="tonal" iconName="content-copy" onPress={() => {}} />
        </Tooltip>
      </Hovered>
      <Typography variant="labelSmall">top</Typography>
    </div>
    <div style={cell}>
      <Hovered>
        <Tooltip content="Share" position="bottom">
          <Button mode="tonal" iconName="share-variant" onPress={() => {}} />
        </Tooltip>
      </Hovered>
      <Typography variant="labelSmall">bottom</Typography>
    </div>
    <div style={cell}>
      <Hovered>
        <Tooltip content="Rename" position="left">
          <Button mode="tonal" iconName="pencil-outline" onPress={() => {}} />
        </Tooltip>
      </Hovered>
      <Typography variant="labelSmall">left</Typography>
    </div>
    <div style={cell}>
      <Hovered>
        <Tooltip content="Delete" position="right">
          <Button mode="tonal" iconName="delete-outline" onPress={() => {}} />
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
        <Button mode="outlined" iconName="download" onPress={() => {}} />
      </Tooltip>
    </Hovered>
    <Hovered>
      <Tooltip content="Archive" position="bottom">
        <Button mode="outlined" iconName="archive-outline" onPress={() => {}} />
      </Tooltip>
    </Hovered>
    <Hovered>
      <Tooltip content="Print" position="bottom">
        <Button mode="outlined" iconName="printer-outline" onPress={() => {}} />
      </Tooltip>
    </Hovered>
  </div>
);

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
          <Button mode="filled" onPress={() => {}}>
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
          <Button mode="outlined" onPress={() => {}}>
            Save draft
          </Button>
        </Tooltip>
      </Hovered>
      <Typography variant="labelSmall">disabled</Typography>
    </div>
  </div>
);
