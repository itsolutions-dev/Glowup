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
      <Button mode="tonal" onPress={() => toast.success("Changes saved")}>
        Success
      </Button>
      <Button
        mode="tonal"
        tone="error"
        onPress={() => toast.error("Upload failed")}
      >
        Error
      </Button>
      <Button
        mode="outlined"
        onPress={() => toast.show({ message: "Draft restored" })}
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
        mode="filled"
        onPress={() =>
          toast.error("Upload failed", {
            action: {
              label: "Retry",
              onPress: () => toast.success("Uploaded"),
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

const Queued = () => {
  const toast = useToast();

  return (
    <View style={demo.row}>
      <Button
        mode="tonal"
        onPress={() => {
          toast.show({ message: "First", duration: 2000 });
          toast.show({ message: "Second", duration: 2000 });
          toast.show({ message: "Third", duration: 2000 });
        }}
      >
        Raise three
      </Button>
      <Button
        mode="outlined"
        onPress={() =>
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
    name: "Queued",
    title: "Queueing",
    description:
      "One toast is on screen at a time; the rest wait their turn unless they share an id.",
    render: Queued,
  },
];
