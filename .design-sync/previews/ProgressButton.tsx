import React from "react";
import { ProgressButton } from "@its/glowup-ui";
import type { ProgressButtonStatus } from "@its/glowup-ui";

const row: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

const column: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  alignItems: "flex-start",
};

// The four statuses side by side. `status` is controlled: the caller moves it
// as the task reports, and `progress` (0–1) only counts while loading.
export const Statuses = () => (
  <div style={row}>
    <ProgressButton iconName="navigation-variant-outline" onPress={() => {}}>
      Start navigation
    </ProgressButton>
    <ProgressButton
      status="loading"
      progress={0.6}
      loadingLabel="Calculating route…"
      iconName="navigation-variant-outline"
    >
      Start navigation
    </ProgressButton>
    <ProgressButton status="success" successLabel="Route ready">
      Start navigation
    </ProgressButton>
    <ProgressButton
      status="error"
      errorLabel="No route found"
      onPress={() => {}}
    >
      Start navigation
    </ProgressButton>
  </div>
);

// `fill` sweeps a deeper tone of the surface under the label; `bar` runs a
// 4dp line along the bottom edge and leaves the surface alone.
export const Indicators = () => (
  <div style={row}>
    <ProgressButton status="loading" progress={0.45} loadingLabel="Uploading…">
      Upload
    </ProgressButton>
    <ProgressButton
      status="loading"
      progress={0.45}
      indicator="bar"
      loadingLabel="Uploading…"
    >
      Upload
    </ProgressButton>
  </div>
);

// Every Button mode carries progress; each derives its fill from its own
// colours so the label keeps its contrast as the fill passes under it.
export const Modes = () => (
  <div style={row}>
    <ProgressButton status="loading" progress={0.5} mode="filled">
      Filled
    </ProgressButton>
    <ProgressButton status="loading" progress={0.5} mode="tonal">
      Tonal
    </ProgressButton>
    <ProgressButton status="loading" progress={0.5} mode="outlined">
      Outlined
    </ProgressButton>
    <ProgressButton status="loading" progress={0.5} mode="text">
      Text
    </ProgressButton>
  </div>
);

// No `progress` while loading means the task cannot say how far along it is:
// the fill (or bar) sweeps instead of filling.
export const Indeterminate = () => (
  <div style={row}>
    <ProgressButton status="loading" loadingLabel="Syncing…">
      Sync now
    </ProgressButton>
    <ProgressButton status="loading" indicator="bar" loadingLabel="Syncing…">
      Sync now
    </ProgressButton>
  </div>
);

// Customised through props, never classes: `style` for the surface (radius,
// width), `labelStyle` for the type, `progressColor` for the fill.
export const Customised = () => (
  <div style={column}>
    <ProgressButton
      status="loading"
      progress={0.7}
      fullWidth
      style={{ borderRadius: 28 }}
      labelStyle={{ fontSize: 14, letterSpacing: 0.4 }}
      progressColor="rgba(0, 0, 0, 0.32)"
      loadingLabel="Downloading offline map…"
    >
      Download
    </ProgressButton>
  </div>
);

// Press to run a simulated task: loading with progress ticking up, then
// success, which hands back to idle after `successDuration`.
export const TryIt = () => {
  const [status, setStatus] = React.useState<ProgressButtonStatus>("idle");
  const [progress, setProgress] = React.useState(0);
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  const run = () => {
    let value = 0;
    setProgress(0);
    setStatus("loading");
    timer.current = setInterval(() => {
      value = Math.min(1, value + 0.08);
      setProgress(value);
      if (value >= 1) {
        if (timer.current) clearInterval(timer.current);
        setStatus("success");
      }
    }, 160);
  };

  return (
    <div style={row}>
      <ProgressButton
        status={status}
        progress={progress}
        iconName="navigation-variant-outline"
        loadingLabel="Calculating route…"
        successLabel="Route ready"
        onPress={run}
        onSuccessEnd={() => setStatus("idle")}
      >
        Start navigation
      </ProgressButton>
    </div>
  );
};
