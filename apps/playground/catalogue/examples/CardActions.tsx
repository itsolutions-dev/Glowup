import { useState } from "react";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardTitle,
  Icon,
  Typography,
  useTheme,
  type CardActionsProps,
} from "@its/glowup-ui";

const props: Partial<CardActionsProps> = {
  align: "space-between",
};

export default function CardActionsExample() {
  const { theme } = useTheme();
  const [upgraded, setUpgraded] = useState(false);

  return (
    <Card variant="filled">
      <CardTitle
        title={upgraded ? "You are on Pro" : "Storage almost full"}
        subtitle="Photos and backups"
        startIcon={
          <Icon
            source={upgraded ? "cloud-check-outline" : "cloud-alert-outline"}
            color={theme.colors.primary}
          />
        }
      />
      <CardContent>
        <Typography variant="bodyMedium" color="onSurfaceVariant">
          {upgraded
            ? "You now have 500 GB. New photos back up as usual."
            : "You have used 46 of 50 GB. Upgrade to keep backing up photos."}
        </Typography>
      </CardContent>
      <CardActions {...props}>
        <Button variant="text">Learn more</Button>
        <Button
          iconName="rocket-launch-outline"
          disabled={upgraded}
          onClick={() => setUpgraded(true)}
        >
          {upgraded ? "Upgraded" : "Upgrade"}
        </Button>
      </CardActions>
    </Card>
  );
}
