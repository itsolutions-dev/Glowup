import React from "react";
import {
  Card,
  CardTitle,
  CardContent,
  CardActions,
  Button,
  Typography,
} from "@glowup/ui";

const panel: React.CSSProperties = { width: 400, display: "flex" };

export const TrailingActions = () => (
  <div style={panel}>
    <Card variant="elevated" style={{ flex: 1 }}>
      <CardTitle title="Impianto 4" subtitle="Conferma l'intervento" />
      <CardContent>
        <Typography variant="bodyMedium">
          L&apos;intervento verrà assegnato al turno di mattina.
        </Typography>
      </CardContent>
      <CardActions>
        <Button mode="text" onPress={() => {}}>
          Rinvia
        </Button>
        <Button onPress={() => {}}>Conferma</Button>
      </CardActions>
    </Card>
  </div>
);

export const Alignment = () => (
  <div style={{ ...panel, flexDirection: "column", gap: 12 }}>
    {(["end", "start", "space-between"] as const).map((align) => (
      <Card key={align} variant="outlined">
        <Typography variant="labelMedium">{`align="${align}"`}</Typography>
        <CardActions align={align}>
          <Button mode="text" onPress={() => {}}>
            Annulla
          </Button>
          <Button onPress={() => {}}>Salva</Button>
        </CardActions>
      </Card>
    ))}
  </div>
);
