import React from "react";
import { Card, CardTitle, CardContent, Typography, Chip } from "@glowup/ui";

export const Body = () => (
  <div style={{ width: 400, display: "flex" }}>
    <Card variant="elevated" style={{ flex: 1 }}>
      <CardTitle title="Impianto 4" subtitle="Manutenzione programmata" />
      <CardContent>
        <Typography variant="bodyMedium">
          Prossimo intervento previsto il 12 marzo. Ultima revisione completata
          senza anomalie.
        </Typography>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Chip label="Ordinaria" size="small" />
          <Chip label="Trimestrale" size="small" mode="outlined" />
        </div>
      </CardContent>
    </Card>
  </div>
);
