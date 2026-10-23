import { useState } from "react";
import {
  Button,
  Dialog,
  LinearProgress,
  Typography,
  VStack,
  type DialogProps,
} from "@its/glowup-ui";

const props: Partial<DialogProps> = {
  title: "Storage almost full",
  icon: "cloud-alert-outline",
  children: "Free up space or upgrade to keep backing up your photos.",
};

export default function DialogExample() {
  const [open, setOpen] = useState(false);
  const [upgraded, setUpgraded] = useState(false);
  const close = () => setOpen(false);

  return (
    <VStack spacing="m">
      <VStack spacing="xs">
        <Typography variant="titleMedium">Storage</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          {upgraded ? "14.1 of 200 GB used" : "14.1 of 15 GB used"}
        </Typography>
      </VStack>
      <LinearProgress progress={upgraded ? 0.07 : 0.94} />
      {upgraded ? (
        <Button variant="text" onClick={() => setUpgraded(false)}>
          Back to the free plan
        </Button>
      ) : (
        <Button
          variant="tonal"
          iconName="cloud-outline"
          onClick={() => setOpen(true)}
        >
          Manage storage
        </Button>
      )}
      <Dialog
        {...props}
        visible={open}
        onClose={close}
        actions={
          <>
            <Button variant="text" onClick={close}>
              Not now
            </Button>
            <Button
              onClick={() => {
                setUpgraded(true);
                close();
              }}
            >
              Upgrade to 200 GB
            </Button>
          </>
        }
      >
        {props.children}
      </Dialog>
    </VStack>
  );
}
