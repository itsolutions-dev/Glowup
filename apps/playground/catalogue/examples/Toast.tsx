import { useState } from "react";
import {
  Button,
  HStack,
  ToastProvider,
  Typography,
  VStack,
  useToast,
  type ToastOptions,
} from "@its/glowup-ui";

// The options of `toast.show`, spread into the calls below.
const props: ToastOptions = {
  message: "Draft saved",
  severity: "success",
  duration: 3000,
};

const Drafts = () => {
  const toast = useToast();
  const [drafts, setDrafts] = useState(3);

  return (
    <VStack spacing="m">
      <VStack spacing="xs">
        <Typography variant="titleMedium">Drafts</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          {drafts === 1 ? "1 draft" : `${drafts} drafts`} in this folder.
        </Typography>
      </VStack>
      <HStack spacing="s" wrap>
        <Button
          iconName="content-save-outline"
          onClick={() => toast.show(props)}
        >
          Save draft
        </Button>
        <Button
          variant="tonal"
          iconName="trash-can-outline"
          disabled={drafts === 0}
          onClick={() => {
            setDrafts(drafts - 1);
            toast.show({
              ...props,
              message: "Moved to trash",
              action: { label: "Undo", onClick: () => setDrafts(drafts) },
            });
          }}
        >
          Delete draft
        </Button>
        <Button
          variant="outlined"
          iconName="layers-outline"
          onClick={() => {
            // Three at once: they stack, each on its own timer.
            toast.info("Syncing 3 drafts", { duration: 6000 });
            toast.success("Draft 1 synced", { duration: 4000 });
            toast.warning("Draft 2 has no title", { duration: 5000 });
          }}
        >
          Raise three
        </Button>
      </HStack>
    </VStack>
  );
};

// An app mounts the provider once at its root; the example brings its own, so
// the toasts appear on this stage. `maxVisible` lets up to three show together.
export default function ToastExample() {
  return (
    <ToastProvider maxVisible={3}>
      <Drafts />
    </ToastProvider>
  );
}
