import React from "react";
import {
  Card,
  CardCover,
  CardTitle,
  CardContent,
  Typography,
} from "@glowup/ui";

const IMAGE = { uri: "https://picsum.photos/seed/glowup/800/450" };

export const Cover = () => (
  <div style={{ width: 400, display: "flex" }}>
    <Card variant="elevated" style={{ flex: 1 }}>
      {/* Bleeds past the card padding — that is what makes it read as a cover
          rather than an inset picture. */}
      <CardCover source={IMAGE} alt="Impianto 4 visto dall'alto" />
      <CardTitle title="Impianto 4" subtitle="Manutenzione programmata" />
      <CardContent>
        <Typography variant="bodyMedium">
          Prossimo intervento: 12 marzo
        </Typography>
      </CardContent>
    </Card>
  </div>
);

export const Ratios = () => (
  <div
    style={{ width: 400, display: "flex", flexDirection: "column", gap: 12 }}
  >
    {[
      { ratio: 16 / 9, label: "16 / 9 — default" },
      { ratio: 1, label: "1 / 1" },
      { ratio: 21 / 9, label: "21 / 9" },
    ].map(({ ratio, label }) => (
      <Card key={label} variant="outlined">
        <CardCover source={IMAGE} alt={label} ratio={ratio} />
        <Typography variant="labelMedium">{label}</Typography>
      </Card>
    ))}
  </div>
);
