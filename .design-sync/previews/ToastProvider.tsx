import React from "react";
import {
  Button,
  ToastProvider,
  Typography,
  VStack,
  useToast,
} from "@glowup/ui";

type Toast = ReturnType<typeof useToast>;

// The toast lives in a Snackbar the provider owns, so a card previewing one
// mounts its own ToastProvider and fires the call after the effect that
// installs the context has run.
const Raise = ({
  run,
  children,
}: {
  run: (t: Toast) => void;
  children: React.ReactNode;
}) => {
  const toast = useToast();
  React.useEffect(() => {
    const id = setTimeout(() => run(toast), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <>{children}</>;
};

const stage = (run: (t: Toast) => void, caption: string) => (
  <VStack
    spacing="s"
    p="m"
    bg="surfaceContainerLow"
    radius="large"
    width={420}
    height={200}
  >
    <ToastProvider>
      <Raise run={run}>
        <Typography variant="titleMedium">Component library</Typography>
        <Typography variant="bodySmall">{caption}</Typography>
      </Raise>
    </ToastProvider>
  </VStack>
);

export const Success = () =>
  stage(
    (t) =>
      t.success("Published @glowup/ui 0.2.0 to the registry.", {
        duration: 0,
      }),
    "toast.success(message)",
  );

export const WithAction = () =>
  stage(
    (t) =>
      t.show({
        message: "Chip moved to Buttons & actions.",
        action: { label: "Undo", onPress: () => {} },
        duration: 0,
      }),
    "toast.show({ message, action })",
  );

export const Failure = () =>
  stage(
    (t) =>
      t.error("Upload failed — the token file is larger than 2 MB.", {
        duration: 0,
      }),
    "toast.error(message)",
  );

export const TheApi = () => (
  <VStack spacing="s" p="m" bg="surfaceContainerLow" radius="large" width={420}>
    <Typography variant="titleMedium">Raising a toast</Typography>
    <Typography variant="bodyMedium">
      Mount ToastProvider once near the root, then call useToast() from anywhere
      below it. There is no visible state to thread through a screen.
    </Typography>
    <VStack spacing="xs" p="s" bg="surface" radius="medium">
      <Typography variant="bodySmall">const toast = useToast();</Typography>
      <Typography variant="bodySmall">
        toast.show({"{ message, type?, duration?, icon?, action?, id? }"})
      </Typography>
      <Typography variant="bodySmall">
        toast.success(msg) · toast.error(msg) · toast.hide(key?)
      </Typography>
    </VStack>
    <Typography variant="bodySmall">
      Toasts play back FIFO, one at a time; a repeated event reuses its id
      instead of stacking up.
    </Typography>
    <Button mode="tonal" onPress={() => {}}>
      Publish
    </Button>
  </VStack>
);
