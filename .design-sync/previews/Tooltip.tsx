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
          <Button variant="tonal" iconName="content-copy" onClick={() => {}} />
        </Tooltip>
      </Hovered>
      <Typography variant="labelSmall">top</Typography>
    </div>
    <div style={cell}>
      <Hovered>
        <Tooltip content="Share" position="bottom">
          <Button variant="tonal" iconName="share-variant" onClick={() => {}} />
        </Tooltip>
      </Hovered>
      <Typography variant="labelSmall">bottom</Typography>
    </div>
    <div style={cell}>
      <Hovered>
        <Tooltip content="Rename" position="left">
          <Button
            variant="tonal"
            iconName="pencil-outline"
            onClick={() => {}}
          />
        </Tooltip>
      </Hovered>
      <Typography variant="labelSmall">left</Typography>
    </div>
    <div style={cell}>
      <Hovered>
        <Tooltip content="Delete" position="right">
          <Button
            variant="tonal"
            iconName="delete-outline"
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
        <Button variant="outlined" iconName="download" onClick={() => {}} />
      </Tooltip>
    </Hovered>
    <Hovered>
      <Tooltip content="Archive" position="bottom">
        <Button
          variant="outlined"
          iconName="archive-outline"
          onClick={() => {}}
        />
      </Tooltip>
    </Hovered>
    <Hovered>
      <Tooltip content="Print" position="bottom">
        <Button
          variant="outlined"
          iconName="printer-outline"
          onClick={() => {}}
        />
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
