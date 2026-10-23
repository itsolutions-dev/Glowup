import { useState } from "react";
import {
  Card,
  CardContent,
  CardTitle,
  Icon,
  Typography,
  useTheme,
  type CardProps,
} from "@its/glowup-ui";

const props: Partial<CardProps> = {
  variant: "elevated",
};

export default function CardExample() {
  const { theme } = useTheme();
  const [saved, setSaved] = useState(false);

  return (
    <Card {...props} onClick={() => setSaved(!saved)}>
      <CardTitle
        title="Team offsite"
        subtitle="12-14 June · Lisbon"
        endIcon={
          <Icon
            source={saved ? "bookmark" : "bookmark-outline"}
            color={theme.colors.primary}
          />
        }
      />
      <CardContent>
        <Typography variant="bodyMedium" color="onSurfaceVariant">
          Flights and the hotel are booked. Add your dietary needs before 1
          June.
        </Typography>
        <Typography variant="labelMedium" color="primary">
          {saved ? "Saved to your trips" : "Press the card to save it"}
        </Typography>
      </CardContent>
    </Card>
  );
}
