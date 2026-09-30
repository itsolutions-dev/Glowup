import React from "react";
import { FAB, IconButton, Toolbar } from "@its/glowup-ui";

const stage: React.CSSProperties = {
  width: 400,
  display: "flex",
  justifyContent: "center",
};

const formatting = [
  "format-bold",
  "format-italic",
  "format-underline",
  "link",
].map((icon) => (
  <IconButton
    key={icon}
    icon={icon as "format-bold"}
    accessibilityLabel={icon.replace("format-", "")}
    onPress={() => {}}
  />
));

export const Floating = () => (
  <div style={stage}>
    <Toolbar
      variant="floating"
      safeArea={false}
      accessibilityLabel="Formatting"
    >
      {formatting}
    </Toolbar>
  </div>
);

export const Vibrant = () => (
  <div style={stage}>
    <Toolbar
      variant="floating"
      color="vibrant"
      safeArea={false}
      accessibilityLabel="Formatting"
    >
      {formatting}
    </Toolbar>
  </div>
);

export const WithFab = () => (
  <div style={stage}>
    <Toolbar
      variant="floating"
      safeArea={false}
      accessibilityLabel="Formatting"
      fab={<FAB icon="plus" placement="inline" onPress={() => {}} />}
    >
      {formatting}
    </Toolbar>
  </div>
);

export const Docked = () => (
  <div style={{ width: 400, display: "flex" }}>
    <Toolbar
      variant="docked"
      safeArea={false}
      accessibilityLabel="Photo actions"
    >
      {[
        "share-variant-outline",
        "heart-outline",
        "pencil-outline",
        "delete-outline",
      ].map((icon) => (
        <IconButton
          key={icon}
          icon={icon as "heart-outline"}
          accessibilityLabel={icon.replace("-outline", "")}
          onPress={() => {}}
        />
      ))}
    </Toolbar>
  </div>
);

export const Vertical = () => (
  <div style={{ height: 240, display: "flex" }}>
    <Toolbar
      variant="floating"
      orientation="vertical"
      safeArea={false}
      accessibilityLabel="Formatting"
    >
      {formatting}
    </Toolbar>
  </div>
);
