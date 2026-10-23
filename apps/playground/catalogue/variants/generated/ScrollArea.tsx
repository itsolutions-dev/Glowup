// GENERATED — do not edit.
// Source: .design-sync/previews/ScrollArea.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import type { Variant } from "../types";
import { Box, HStack, ScrollArea, Typography, VStack } from "@its/glowup-ui";

const rows = (count: number) =>
  Array.from({ length: count }, (_, i) => (
    <Box
      key={i}
      padding={12}
      background={i % 2 ? "surfaceContainerLow" : "surfaceContainer"}
    >
      <Typography variant="bodyMedium">{`Row ${i + 1}`}</Typography>
    </Box>
  ));

export const Vertical = () => (
  <VStack spacing="s" width={320}>
    <Typography variant="labelSmall">
      maxHeight=&#123;200&#125; type=&quot;auto&quot;: the scrollbar shows while
      the content overflows
    </Typography>
    <ScrollArea maxHeight={200}>{rows(10)}</ScrollArea>
  </VStack>
);

export const Horizontal = () => (
  <VStack spacing="s" width={320}>
    <Typography variant="labelSmall">
      orientation=&quot;horizontal&quot;
    </Typography>
    <ScrollArea orientation="horizontal" style={{ height: 96 }}>
      <HStack spacing="s" padding={12} align="center">
        {Array.from({ length: 12 }, (_, i) => (
          <Box
            key={i}
            width={96}
            height={56}
            radius="small"
            background="primaryContainer"
            align="center"
            justify="center"
          >
            <Typography variant="labelLarge">{`Card ${i + 1}`}</Typography>
          </Box>
        ))}
      </HStack>
    </ScrollArea>
  </VStack>
);

export const Both = () => (
  <VStack spacing="s" width={320}>
    <Typography variant="labelSmall">
      orientation=&quot;both&quot;: both scrollbars, the corner left free
    </Typography>
    <ScrollArea orientation="both" height={200} width={320}>
      <Box width={640}>{rows(10)}</Box>
    </ScrollArea>
  </VStack>
);

/** `always` draws the scrollbar even when nothing overflows. */
export const AlwaysVisible = () => (
  <VStack spacing="s" width={320}>
    <Typography variant="labelSmall">
      type=&quot;always&quot;, nothing to scroll
    </Typography>
    <ScrollArea type="always" height={120}>
      {rows(2)}
    </ScrollArea>
  </VStack>
);

/** `scroll` and `hover` hide at rest: the scrollbar appears while scrolling, or under the pointer. */
export const HiddenAtRest = () => (
  <HStack spacing="m" align="flex-start" width={660}>
    {(["scroll", "hover"] as const).map((type) => (
      <VStack key={type} spacing="s" width={320}>
        <Typography variant="labelSmall">
          {`type="${type}": hidden until ${type === "scroll" ? "you scroll" : "the pointer is over it"}`}
        </Typography>
        <ScrollArea type={type} maxHeight={160}>
          {rows(8)}
        </ScrollArea>
      </VStack>
    ))}
  </HStack>
);

export const ThickScrollbar = () => (
  <VStack spacing="s" width={320}>
    <Typography variant="labelSmall">
      scrollbarSize=&#123;16&#125;, for a touch screen
    </Typography>
    <ScrollArea maxHeight={160} scrollbarSize={16}>
      {rows(8)}
    </ScrollArea>
  </VStack>
);

/** `slotStyles` restyles the track and the thumb. */
export const ThemedThumb = () => (
  <VStack spacing="s" width={320}>
    <Typography variant="labelSmall">
      slotStyles for the track and the thumb
    </Typography>
    <ScrollArea
      maxHeight={160}
      type="always"
      slotStyles={{
        track: { backgroundColor: "rgba(103, 80, 164, 0.12)" },
        thumb: { backgroundColor: "#6750a4" },
      }}
    >
      {rows(8)}
    </ScrollArea>
  </VStack>
);

/** The scrollbar lies over the content: pad it where it must not be covered. */
export const InsideACard = () => (
  <Box
    background="surface"
    radius="medium"
    borderWidth={1}
    borderColor="outlineVariant"
    padding={16}
    gap={8}
    width={320}
  >
    <Typography variant="titleSmall">Activity</Typography>
    <ScrollArea maxHeight={140} contentContainerStyle={{ paddingRight: 12 }}>
      {rows(8)}
    </ScrollArea>
  </Box>
);

export const variants: Variant[] = [
  {
    name: "Vertical",
    title: "Vertical",
    render: Vertical,
  },
  {
    name: "Horizontal",
    title: "Horizontal",
    render: Horizontal,
  },
  {
    name: "Both",
    title: "Both",
    render: Both,
  },
  {
    name: "AlwaysVisible",
    title: "Always visible",
    description: "`always` draws the scrollbar even when nothing overflows.",
    render: AlwaysVisible,
  },
  {
    name: "HiddenAtRest",
    title: "Hidden at rest",
    description:
      "`scroll` and `hover` hide at rest: the scrollbar appears while scrolling, or under the pointer.",
    render: HiddenAtRest,
  },
  {
    name: "ThickScrollbar",
    title: "Thick scrollbar",
    render: ThickScrollbar,
  },
  {
    name: "ThemedThumb",
    title: "Themed thumb",
    description: "`slotStyles` restyles the track and the thumb.",
    render: ThemedThumb,
  },
  {
    name: "InsideACard",
    title: "Inside a card",
    description:
      "The scrollbar lies over the content: pad it where it must not be covered.",
    render: InsideACard,
  },
];
