// GENERATED — do not edit.
// Source: .design-sync/previews/Visible.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import type { Variant } from "../types";
import {
  Box,
  Typography,
  ViewportProvider,
  Visible,
  VStack,
} from "@its/glowup-ui";

/**
 * Size classes follow the window, which a gallery cannot resize: a
 * ViewportProvider tells the components under it the width to assume.
 */
const Frame = ({
  width,
  label,
  children,
}: {
  width: number;
  label: string;
  children: React.ReactNode;
}) => (
  <ViewportProvider width={width}>
    <Box
      background="surfaceContainerLow"
      radius="medium"
      padding={16}
      gap={8}
      width={360}
    >
      <Typography variant="labelSmall">{label}</Typography>
      {children}
    </Box>
  </ViewportProvider>
);

const tag = (
  text: string,
  background: "primaryContainer" | "tertiaryContainer",
) => (
  <Box background={background} padding={8} radius="small">
    <Typography variant="labelLarge">{text}</Typography>
  </Box>
);

export const AboveMediumOnAPhone = () => (
  <Frame width={360} label="window 360 dp (compact): above=medium">
    <Visible
      above="medium"
      fallback={tag("Compact fallback", "tertiaryContainer")}
    >
      {tag("Medium and up", "primaryContainer")}
    </Visible>
  </Frame>
);

export const AboveMediumOnADesktop = () => (
  <Frame width={1000} label="window 1000 dp (expanded): above=medium">
    <Visible
      above="medium"
      fallback={tag("Compact fallback", "tertiaryContainer")}
    >
      {tag("Medium and up", "primaryContainer")}
    </Visible>
  </Frame>
);

export const BelowMedium = () => (
  <VStack spacing="m">
    <Frame width={360} label="window 360 dp: below=medium">
      <Visible below="medium">
        {tag("Compact only", "primaryContainer")}
      </Visible>
    </Frame>
    <Frame width={700} label="window 700 dp: below=medium shows nothing">
      <Visible below="medium">
        {tag("Compact only", "primaryContainer")}
      </Visible>
    </Frame>
  </VStack>
);

export const OnlyOneOrSeveral = () => (
  <VStack spacing="m">
    <Frame width={900} label="window 900 dp (expanded): only=expanded">
      <Visible only="expanded">
        {tag("Expanded only", "primaryContainer")}
      </Visible>
    </Frame>
    <Frame width={1300} label="window 1300 dp (large): only=[expanded, large]">
      <Visible only={["expanded", "large"]}>
        {tag("Expanded or large", "primaryContainer")}
      </Visible>
    </Frame>
  </VStack>
);

/** `when` is your own condition; `above`, `below` and `only` all have to hold with it. */
export const WithACondition = () => (
  <VStack spacing="m">
    <Frame width={1000} label="when={true} above=medium">
      <Visible when above="medium">
        {tag("Both hold", "primaryContainer")}
      </Visible>
    </Frame>
    <Frame width={1000} label="when={false} above=medium: the fallback">
      <Visible
        when={false}
        above="medium"
        fallback={tag("Not signed in", "tertiaryContainer")}
      >
        {tag("Signed in", "primaryContainer")}
      </Visible>
    </Frame>
  </VStack>
);

/** `keepMounted` hides with display: none, so the children keep their state. */
export const KeepMountedWhileHidden = () => (
  <Frame
    width={360}
    label="window 360 dp: above=medium keepMounted (mounted, hidden)"
  >
    <Visible
      above="medium"
      keepMounted
      fallback={tag("The children are mounted but hidden", "tertiaryContainer")}
    >
      {tag("Medium and up", "primaryContainer")}
    </Visible>
  </Frame>
);

export const variants: Variant[] = [
  {
    name: "AboveMediumOnAPhone",
    title: "Above medium on a phone",
    render: AboveMediumOnAPhone,
  },
  {
    name: "AboveMediumOnADesktop",
    title: "Above medium on a desktop",
    render: AboveMediumOnADesktop,
  },
  {
    name: "BelowMedium",
    title: "Below medium",
    render: BelowMedium,
  },
  {
    name: "OnlyOneOrSeveral",
    title: "Only one or several",
    render: OnlyOneOrSeveral,
  },
  {
    name: "WithACondition",
    title: "With a condition",
    description:
      "`when` is your own condition; `above`, `below` and `only` all have to hold with it.",
    render: WithACondition,
  },
  {
    name: "KeepMountedWhileHidden",
    title: "Keep mounted while hidden",
    description:
      "`keepMounted` hides with display: none, so the children keep their state.",
    render: KeepMountedWhileHidden,
  },
];
