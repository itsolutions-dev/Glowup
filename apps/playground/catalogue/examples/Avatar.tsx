import { useState } from "react";
import {
  Avatar,
  HStack,
  Typography,
  VStack,
  type AvatarProps,
} from "@its/glowup-ui";

const props: Partial<AvatarProps> = {
  name: "Mara Quinn",
  size: "large",
  status: "online",
};

const PRESENCE = {
  online: "Active now",
  away: "Away",
  busy: "In a meeting",
  offline: "Offline",
};

export default function AvatarExample() {
  const [changing, setChanging] = useState(false);

  return (
    <VStack spacing="s">
      <HStack spacing="m" align="center">
        <Avatar {...props} onClick={() => setChanging((now) => !now)} />
        <VStack spacing="xs">
          <Typography variant="titleMedium">
            {props.name || "Add your name"}
          </Typography>
          <Typography variant="bodySmall" color="onSurfaceVariant">
            {props.status ? PRESENCE[props.status] : "Presence hidden"}
          </Typography>
        </VStack>
      </HStack>
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {changing
          ? "Choose a new photo from your library."
          : "Press the avatar to change your photo."}
      </Typography>
    </VStack>
  );
}
