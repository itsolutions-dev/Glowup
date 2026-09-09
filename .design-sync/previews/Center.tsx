import React from "react";
import {
  Center,
  CircularProgress,
  EmptyState,
  Typography,
} from "@glowup/ui";

export const Basic = () => (
  <Center bg="surfaceContainerLow" radius="medium" height={160} width={360}>
    <Typography variant="titleMedium">Centred on both axes</Typography>
  </Center>
);

export const LoadingPane = () => (
  <Center
    bg="surfaceContainerLow"
    radius="large"
    height={200}
    width={360}
    gap="s"
  >
    <CircularProgress size={48} />
    <Typography variant="bodyMedium">Syncing your workspace</Typography>
  </Center>
);

export const AroundAnEmptyState = () => (
  <Center
    bg="surface"
    radius="large"
    height={260}
    width={360}
    borderWidth={1}
    borderColor="outlineVariant"
  >
    <EmptyState
      icon="folder-multiple-outline"
      title="No projects yet"
      description="Create your first project to start collecting components."
    />
  </Center>
);
