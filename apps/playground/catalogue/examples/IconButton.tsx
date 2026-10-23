import { useState } from "react";
import {
  Avatar,
  IconButton,
  ListItem,
  Typography,
  VStack,
  type IconButtonProps,
} from "@its/glowup-ui";

const props: Partial<IconButtonProps> = {
  icon: "heart-outline",
  variant: "tonal",
};

export default function IconButtonExample() {
  const [saved, setSaved] = useState(false);

  return (
    <VStack spacing="s">
      <ListItem
        icon={<Avatar name="Night Drive" />}
        primaryText="Night Drive"
        secondaryText="The Night Owls · 3:42"
        action={
          <IconButton
            icon="heart-outline"
            {...props}
            accessibilityLabel={
              saved ? "Remove from favourites" : "Save to favourites"
            }
            selected={saved}
            onClick={() => setSaved(!saved)}
          />
        }
      />
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {saved ? "Saved to your favourites." : "Press the heart to save it."}
      </Typography>
    </VStack>
  );
}
