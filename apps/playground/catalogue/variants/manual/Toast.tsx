import { View } from "react-native";
import { Button, Typography, useToast } from "@its/glowup-ui";
import type { Variant } from "../types";
import { demo } from "./shared";

// Hand-written because there is nothing to convert: Toast is not a component
// but the imperative `useToast()` API, so its gallery is the calls that raise
// one.

const Kinds = () => {
  const toast = useToast();

  return (
    <View style={demo.row}>
      <Button variant="tonal" onClick={() => toast.success("Changes saved")}>
        Success
      </Button>
      <Button variant="tonal" onClick={() => toast.info("Update available")}>
        Info
      </Button>
      <Button
        variant="tonal"
        onClick={() => toast.warning("Storage is almost full")}
      >
        Warning
      </Button>
      <Button
        variant="tonal"
        color="error"
        onClick={() => toast.error("Upload failed")}
      >
        Error
      </Button>
      <Button
        variant="outlined"
        onClick={() => toast.show({ message: "Draft restored" })}
      >
        Default
      </Button>
    </View>
  );
};

const WithAction = () => {
  const toast = useToast();

  return (
    <View style={demo.row}>
      <Button
        variant="filled"
        onClick={() =>
          toast.error("Upload failed", {
            action: {
              label: "Retry",
              onClick: () => toast.success("Uploaded"),
            },
          })
        }
      >
        Raise a retryable error
      </Button>
      <Typography variant="bodySmall">
        The action stays on the toast until it is dismissed or times out.
      </Typography>
    </View>
  );
};

const Placement = () => {
  const toast = useToast();

  return (
    <View style={demo.row}>
      <Button
        variant="tonal"
        onClick={() =>
          toast.info("Sync paused", {
            variant: "outlined",
            position: "top-right",
          })
        }
      >
        Outlined, top right
      </Button>
      <Button
        variant="tonal"
        onClick={() =>
          toast.warning("Connection lost", {
            onClose: () => {},
          })
        }
      >
        Stays until closed
      </Button>
      <Typography variant="bodySmall">
        variant and position are per toast; with onClose it shows a close button
        and waits for it instead of timing out.
      </Typography>
    </View>
  );
};

const Queued = () => {
  const toast = useToast();

  return (
    <View style={demo.row}>
      <Button
        variant="tonal"
        onClick={() => {
          toast.show({ message: "First", duration: 2000 });
          toast.show({ message: "Second", duration: 2000 });
          toast.show({ message: "Third", duration: 2000 });
        }}
      >
        Raise three
      </Button>
      <Button
        variant="outlined"
        onClick={() =>
          toast.show({
            id: "sync",
            message: `Syncing — ${new Date().toLocaleTimeString()}`,
          })
        }
      >
        Repeat one id
      </Button>
      <Typography variant="bodySmall">
        Toasts queue one at a time; passing the same `id` replaces the queued
        one instead of stacking.
      </Typography>
    </View>
  );
};

export const variants: Variant[] = [
  { name: "Kinds", title: "Kinds", render: Kinds },
  { name: "WithAction", title: "With an action", render: WithAction },
  {
    name: "Placement",
    title: "Variant and position",
    render: Placement,
  },
  {
    name: "Queued",
    title: "Queueing",
    description:
      "One toast is on screen at a time; the rest wait their turn unless they share an id.",
    render: Queued,
  },
];
