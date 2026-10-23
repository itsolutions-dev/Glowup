import { useState } from "react";
import {
  Box,
  CaptionValue,
  QrCode,
  Typography,
  VStack,
  useTheme,
  type QrCodeProps,
} from "@its/glowup-ui";

const props: Partial<QrCodeProps> & Pick<QrCodeProps, "value"> = {
  value: "https://glowup.example.com/join/ab12-cd34",
  size: 200,
  level: "M",
};

export default function QrCodeExample() {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  return (
    <Box
      background="surfaceContainerLow"
      radius="large"
      padding={theme.spacing.l}
    >
      <VStack spacing="m" align="center">
        <VStack spacing="xs" align="center">
          <Typography variant="titleMedium">Join Glowup Studio</Typography>
          <Typography
            variant="bodySmall"
            color="onSurfaceVariant"
            align="center"
          >
            Scan the code with your phone to join the team. It works until
            Friday.
          </Typography>
        </VStack>
        <QrCode {...props} />
        {/* The link under the code, for whoever cannot scan it. */}
        <CaptionValue
          caption="Invite link"
          value={props.value}
          enableCopy
          onCopy={() => setCopied(true)}
        />
        <Typography variant="bodySmall" color="onSurfaceVariant">
          {copied ? "Link copied." : "Or copy the link and send it."}
        </Typography>
      </VStack>
    </Box>
  );
}
