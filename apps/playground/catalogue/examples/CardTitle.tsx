import { useState } from "react";
import {
  Avatar,
  Button,
  Card,
  CardActions,
  CardContent,
  CardTitle,
  IconButton,
  Typography,
  type CardTitleProps,
} from "@its/glowup-ui";

const props: CardTitleProps = {
  title: "Priya Nair",
  subtitle: "Reviewed the Q3 budget and left three comments for you.",
};

export default function CardTitleExample() {
  const [starred, setStarred] = useState(false);

  return (
    <Card variant="outlined">
      <CardTitle
        {...props}
        startIcon={<Avatar name="Priya Nair" status="online" />}
        endIcon={
          <IconButton
            icon={starred ? "star" : "star-outline"}
            accessibilityLabel={starred ? "Remove star" : "Star this message"}
            onClick={() => setStarred(!starred)}
          />
        }
      />
      <CardContent>
        <Typography variant="bodyMedium">
          Can you check the travel line before Friday?
        </Typography>
      </CardContent>
      <CardActions>
        <Button variant="text">Archive</Button>
        <Button iconName="reply-outline">Reply</Button>
      </CardActions>
    </Card>
  );
}
