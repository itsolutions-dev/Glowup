// GENERATED — do not edit.
// Source: .design-sync/previews/QrCode.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { QrCode, Typography } from "@its/glowup-ui";

const row: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-start",
  gap: 24,
  flexWrap: "wrap",
};

const column: ViewStyle = {
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
};

const INVITE = "https://glowup.example.com/invite/9f3a7c21";

/** Dark modules on a light background, the quiet zone a scanner needs around them. */
export const Default = () => <QrCode value={INVITE} />;

/** `size` is the side of the whole code, quiet zone included, in px. */
export const Sizes = () => (
  <View style={row}>
    {[96, 160, 240].map((size) => (
      <View key={size} style={column}>
        <QrCode value={INVITE} size={size} />
        <Typography variant="bodySmall">{size}px</Typography>
      </View>
    ))}
  </View>
);

/** `level` is how much of the code can be lost and still read: a higher level grows the symbol. */
export const Levels = () => (
  <View style={row}>
    {(["L", "M", "Q", "H"] as const).map((level) => (
      <View key={level} style={column}>
        <QrCode value={INVITE} level={level} size={140} />
        <Typography variant="bodySmall">{level}</Typography>
      </View>
    ))}
  </View>
);

/** `quietZone` is the empty margin in modules: 4 by default, which the standard asks for. */
export const QuietZone = () => (
  <View style={row}>
    {[0, 2, 4, 8].map((quietZone) => (
      <View key={quietZone} style={column}>
        <QrCode value={INVITE} quietZone={quietZone} size={140} />
        <Typography variant="bodySmall">{quietZone} modules</Typography>
      </View>
    ))}
  </View>
);

/** `color` and `backgroundColor` take a theme token or any colour string: keep the modules dark on light. */
export const Colors = () => (
  <View style={row}>
    <QrCode
      value={INVITE}
      size={140}
      color="#0D47A1"
      backgroundColor="#FFFFFF"
    />
    <QrCode
      value={INVITE}
      size={140}
      color="#1b5e20"
      backgroundColor="#e8f5e9"
    />
    <QrCode
      value={INVITE}
      size={140}
      color="#000000"
      backgroundColor="#ffffff"
    />
  </View>
);

/** `logo` is a glyph name or any node over the middle of the code; the level is raised to `"H"`. */
export const WithLogo = () => (
  <View style={row}>
    <QrCode value={INVITE} size={180} logo="wifi" />
    <QrCode value={INVITE} size={180} logo="star" color="#1B5E20" />
    <QrCode
      value={INVITE}
      size={180}
      logo={
        <Typography variant="titleLarge" color="primary">
          G
        </Typography>
      }
    />
  </View>
);

/** Digits and capitals are packed denser than other text, so the same length makes a smaller code. */
export const Modes = () => (
  <View style={row}>
    {[
      ["Numeric", "0123456789012345678901234567890123456789"],
      ["Alphanumeric", "HTTPS://GLOWUP.EXAMPLE.COM/INVITE/9F3A"],
      ["Bytes (UTF-8)", "https://glowup.example.com/invite/caffè-€"],
    ].map(([name, value]) => (
      <View key={name} style={column}>
        <QrCode value={value} size={150} />
        <Typography variant="bodySmall">{name}</Typography>
      </View>
    ))}
  </View>
);

/** A long value grows the symbol, up to version 40 (2953 bytes at level `"L"`). */
export const LongValue = () => (
  <QrCode
    value={"The quick brown fox jumps over the lazy dog. ".repeat(14)}
    level="L"
    size={280}
  />
);

/** A value that does not fit in any code draws an empty box (and calls `onError`). */
export const TooLong = () => (
  <QrCode value={"x".repeat(3000)} size={140} onError={() => {}} />
);

export const variants: Variant[] = [
  {
    name: "Default",
    title: "Default",
    description:
      "Dark modules on a light background, the quiet zone a scanner needs around them.",
    render: Default,
  },
  {
    name: "Sizes",
    title: "Sizes",
    description:
      "`size` is the side of the whole code, quiet zone included, in px.",
    render: Sizes,
  },
  {
    name: "Levels",
    title: "Levels",
    description:
      "`level` is how much of the code can be lost and still read: a higher level grows the symbol.",
    render: Levels,
  },
  {
    name: "QuietZone",
    title: "Quiet zone",
    description:
      "`quietZone` is the empty margin in modules: 4 by default, which the standard asks for.",
    render: QuietZone,
  },
  {
    name: "Colors",
    title: "Colors",
    description:
      "`color` and `backgroundColor` take a theme token or any colour string: keep the modules dark on light.",
    render: Colors,
  },
  {
    name: "WithLogo",
    title: "With logo",
    description:
      '`logo` is a glyph name or any node over the middle of the code; the level is raised to `"H"`.',
    render: WithLogo,
  },
  {
    name: "Modes",
    title: "Modes",
    description:
      "Digits and capitals are packed denser than other text, so the same length makes a smaller code.",
    render: Modes,
  },
  {
    name: "LongValue",
    title: "Long value",
    description:
      'A long value grows the symbol, up to version 40 (2953 bytes at level `"L"`).',
    render: LongValue,
  },
  {
    name: "TooLong",
    title: "Too long",
    description:
      "A value that does not fit in any code draws an empty box (and calls `onError`).",
    render: TooLong,
  },
];
