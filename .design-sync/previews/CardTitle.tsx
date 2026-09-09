import React from "react";
import { Card, CardTitle, Avatar, IconButton, StatusBadge } from "@glowup/ui";

const panel: React.CSSProperties = { width: 400, display: "flex" };

export const TitleAndSubtitle = () => (
  <div style={panel}>
    <Card variant="elevated" style={{ flex: 1 }}>
      <CardTitle title="Impianto 4" subtitle="Manutenzione programmata" />
    </Card>
  </div>
);

export const WithSlots = () => (
  <div style={{ ...panel, flexDirection: "column", gap: 12 }}>
    <Card variant="elevated">
      <CardTitle
        title="Marta Bianchi"
        subtitle="Tecnico di turno"
        left={<Avatar name="Marta Bianchi" size={40} status="online" />}
        right={
          <IconButton
            icon="dots-vertical"
            accessibilityLabel="Altre azioni"
            onPress={() => {}}
          />
        }
      />
    </Card>
    <Card variant="outlined">
      <CardTitle
        title="Linea di imbottigliamento"
        subtitle="Fermo da 12 minuti"
        left={<Avatar icon="factory" size={40} />}
        right={<StatusBadge label="Fermo" type="error" />}
      />
    </Card>
  </div>
);
