import React from "react";
import { QrCode, Typography } from "@its/glowup-ui";

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 24,
  flexWrap: "wrap",
};

const column: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
};

const INVITE = "https://glowup.example.com/invite/9f3a7c21";

/** Dark modules on a light background, the quiet zone a scanner needs around them. */
export const Default = () => <QrCode value={INVITE} />;

/** `size` is the side of the whole code, quiet zone included, in px. */
export const Sizes = () => (
  <div style={row}>
    {[96, 160, 240].map((size) => (
      <div key={size} style={column}>
        <QrCode value={INVITE} size={size} />
        <Typography variant="bodySmall">{size}px</Typography>
      </div>
    ))}
  </div>
);

/** `level` is how much of the code can be lost and still read: a higher level grows the symbol. */
export const Levels = () => (
  <div style={row}>
    {(["L", "M", "Q", "H"] as const).map((level) => (
      <div key={level} style={column}>
        <QrCode value={INVITE} level={level} size={140} />
        <Typography variant="bodySmall">{level}</Typography>
      </div>
    ))}
  </div>
);

/** `quietZone` is the empty margin in modules: 4 by default, which the standard asks for. */
export const QuietZone = () => (
  <div style={row}>
    {[0, 2, 4, 8].map((quietZone) => (
      <div key={quietZone} style={column}>
        <QrCode value={INVITE} quietZone={quietZone} size={140} />
        <Typography variant="bodySmall">{quietZone} modules</Typography>
      </div>
    ))}
  </div>
);

/** `color` and `backgroundColor` take a theme token or any colour string: keep the modules dark on light. */
export const Colors = () => (
  <div style={row}>
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
  </div>
);

/** `logo` is a glyph name or any node over the middle of the code; the level is raised to `"H"`. */
export const WithLogo = () => (
  <div style={row}>
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
  </div>
);

/** Digits and capitals are packed denser than other text, so the same length makes a smaller code. */
export const Modes = () => (
  <div style={row}>
    {[
      ["Numeric", "0123456789012345678901234567890123456789"],
      ["Alphanumeric", "HTTPS://GLOWUP.EXAMPLE.COM/INVITE/9F3A"],
      ["Bytes (UTF-8)", "https://glowup.example.com/invite/caffè-€"],
    ].map(([name, value]) => (
      <div key={name} style={column}>
        <QrCode value={value} size={150} />
        <Typography variant="bodySmall">{name}</Typography>
      </div>
    ))}
  </div>
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
