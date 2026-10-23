import { useState } from "react";
import {
  Avatar,
  Button,
  HStack,
  Skeleton,
  Typography,
  VStack,
  type SkeletonProps,
} from "@its/glowup-ui";

const props: Partial<SkeletonProps> = {
  variant: "circle",
  width: 40,
  animate: true,
};

const MESSAGES = [
  {
    from: "Maya Chen",
    subject: "Invoice for March",
    preview: "The final invoice is attached, due on the 5th.",
  },
  {
    from: "Jonas Weber",
    subject: "Design review moved",
    preview: "We meet on Thursday at 10:00 instead.",
  },
  {
    from: "Priya Nair",
    subject: "Welcome aboard",
    preview: "Here is everything you need for your first week.",
  },
];

// The row while it loads: an avatar and two lines of text, as big as the
// content that will replace them.
const Placeholder = () => {
  const pulse = { animate: props.animate, duration: props.duration };

  return (
    <HStack spacing="m" align="center">
      <Skeleton {...props} />
      <VStack spacing="xs" style={{ flex: 1 }}>
        <Skeleton variant="text" width="45%" {...pulse} />
        <Skeleton variant="text" {...pulse} />
      </VStack>
    </HStack>
  );
};

export default function SkeletonExample() {
  const [loaded, setLoaded] = useState(false);

  return (
    <VStack spacing="m">
      <Typography variant="titleMedium">Inbox</Typography>
      <VStack spacing="m">
        {MESSAGES.map((message) =>
          loaded ? (
            <HStack key={message.subject} spacing="m" align="center">
              <Avatar name={message.from} />
              <VStack style={{ flex: 1 }}>
                <Typography variant="titleSmall">{message.subject}</Typography>
                <Typography variant="bodySmall" color="onSurfaceVariant">
                  {message.preview}
                </Typography>
              </VStack>
            </HStack>
          ) : (
            <Placeholder key={message.subject} />
          ),
        )}
      </VStack>
      <Button variant="tonal" onClick={() => setLoaded(!loaded)}>
        {loaded ? "Load again" : "Finish loading"}
      </Button>
    </VStack>
  );
}
