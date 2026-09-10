import React from "react";
import { StatusBar, Paper, Typography, Divider } from "@its/glowup-ui";

// StatusBar renders no visible node by design. On native it drives the OS status
// bar style; on web it writes <meta name="theme-color"> and the document
// background from the active theme. The cell mounts it for real and explains it
// rather than faking a bar.
export const ThemeColorSync = () => (
  <div style={{ width: 380, display: "flex" }}>
    <Paper elevation={1} outline style={{ flex: 1 }}>
      <StatusBar />
      <Typography variant="titleSmall">StatusBar (mounted here)</Typography>
      <div style={{ height: 12 }} />
      <Divider contentSpacing={0} />
      <div style={{ height: 12 }} />
      <Typography variant="bodyMedium">
        Renders nothing visible. On web it keeps the browser chrome in step with
        the theme by writing meta[name=&quot;theme-color&quot;] and the document
        background.
      </Typography>
      <div style={{ height: 8 }} />
      <Typography variant="bodySmall">
        On iOS and Android it sets the OS status bar to light or dark content.
        Mount it once, near the root of the app.
      </Typography>
    </Paper>
  </div>
);

export const CustomBarColor = () => (
  <div style={{ width: 380, display: "flex" }}>
    <Paper elevation={1} style={{ flex: 1 }}>
      <StatusBar backgroundColor="#6750A4" />
      <Typography variant="titleSmall">backgroundColor override</Typography>
      <div style={{ height: 8 }} />
      <Typography variant="bodyMedium">
        Pass backgroundColor to pin the theme-color to a brand value instead of
        the current surface — e.g. a marketing screen that keeps a purple
        browser chrome in both themes.
      </Typography>
    </Paper>
  </div>
);
