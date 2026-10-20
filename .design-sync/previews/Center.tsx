import React from "react";
import { Box, CircularProgress, EmptyState, Typography } from "@its/glowup-ui";

export const Basic = () => (
  <Box
    variant="centered-column-flex"
    background="surfaceContainerLow"
    radius="medium"
    height={160}
    width={360}
  >
    <Typography variant="titleMedium">Centred on both axes</Typography>
  </Box>
);

export const LoadingPane = () => (
  <Box
    variant="centered-column-flex"
    background="surfaceContainerLow"
    radius="large"
    height={200}
    width={360}
    gap={8}
  >
    <CircularProgress size={48} />
    <Typography variant="bodyMedium">Syncing your workspace</Typography>
  </Box>
);

export const AroundAnEmptyState = () => (
  <Box
    variant="centered-column-flex"
    background="surface"
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
  </Box>
);
