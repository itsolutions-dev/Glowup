import React from "react";
import { IFrame, Typography } from "@its/glowup-ui";

// The pages are data: URLs, so the previews need no server and work offline.
// On iOS and Android there is no iframe: the component draws a dashed notice.
const page = (body: string) =>
  `data:text/html,<body style='margin:0;padding:20px;font:16px/1.5 system-ui;background:white;color:black'>${body}</body>`;

const HELLO = page(
  "<h3 style='margin:0 0 6px'>Hello from an iframe</h3><p style='margin:0'>A separate document, drawn inside the screen.</p>",
);

// Writes into the page when scripts run; a sandbox without allow-scripts stops it.
const SCRIPT = page(
  "<p id='s' style='margin:0'>Scripts are blocked.</p><script>document.getElementById('s').textContent='Scripts ran.'</script>",
);

const column: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  width: 420,
};

const rounded = { borderRadius: 12, borderWidth: 1, borderColor: "#CAC4D0" };

/** `src` and a `title`, which is the frame's accessible name and required. The frame fills the width and is 300 px tall unless told otherwise. */
export const Default = () => (
  <div style={column}>
    <IFrame src={HELLO} title="Greeting" style={rounded} />
  </div>
);

/** `width` and `height` size the frame; `style` is the box it fills (radius, border, margin). */
export const Sized = () => (
  <div style={column}>
    <IFrame
      src={HELLO}
      title="Greeting"
      width={280}
      height={140}
      style={rounded}
    />
  </div>
);

/** `sandbox=""` applies every restriction, so the script cannot run; listing `allow-scripts` lifts that one. */
export const Sandbox = () => (
  <div style={column}>
    <Typography variant="labelMedium">{`sandbox=""`}</Typography>
    <IFrame
      src={SCRIPT}
      title="Sandboxed page"
      height={80}
      sandbox=""
      style={rounded}
    />
    <Typography variant="labelMedium">{`sandbox="allow-scripts"`}</Typography>
    <IFrame
      src={SCRIPT}
      title="Page allowed to run scripts"
      height={80}
      sandbox="allow-scripts"
      style={rounded}
    />
  </div>
);

/** `allow` grants the page features, `referrerPolicy` limits what it learns of yours, and `loading="eager"` loads it at once instead of near the viewport. */
export const Attributes = () => (
  <div style={column}>
    <IFrame
      src={HELLO}
      title="Greeting"
      height={120}
      allow="fullscreen; clipboard-write"
      referrerPolicy="no-referrer"
      loading="eager"
      style={rounded}
    />
  </div>
);

/** `onLoad` is called once the page has loaded. */
export const Loaded = () => {
  const [loaded, setLoaded] = React.useState(false);
  return (
    <div style={column}>
      <IFrame
        src={HELLO}
        title="Greeting"
        height={120}
        style={rounded}
        onLoad={() => setLoaded(true)}
      />
      <Typography variant="bodySmall">
        {loaded ? "onLoad: the page has loaded" : "Loading…"}
      </Typography>
    </div>
  );
};
