import React from "react";
import { HStack, Image, Typography, VStack } from "@glowup/ui";

// Drawn inline so the capture needs no network.
const svg = (a: string, b: string) => ({
  uri:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' +
        a +
        '"/><stop offset="1" stop-color="' +
        b +
        '"/></linearGradient></defs>' +
        '<rect width="320" height="180" fill="url(#g)"/></svg>',
    ),
});

export const Ratios = () => (
  <HStack spacing="m" wrap width={480} align="flex-start">
    <Image
      source={svg("#6750A4", "#B3261E")}
      alt="Release banner"
      width={200}
      ratio={16 / 9}
      radius="medium"
    />
    <Image
      source={svg("#625B71", "#7D5260")}
      alt="Team cover"
      width={120}
      ratio={1}
      radius="large"
    />
  </HStack>
);

export const ResizeModes = () => (
  <HStack spacing="m" wrap width={480} align="flex-start">
    {(["cover", "contain", "center"] as const).map((mode) => (
      <VStack key={mode} spacing="xs">
        <Image
          source={svg("#6750A4", "#EADDFF")}
          alt={"resizeMode " + mode}
          width={140}
          height={100}
          radius="small"
          resizeMode={mode}
        />
        <Typography variant="labelSmall">{mode}</Typography>
      </VStack>
    ))}
  </HStack>
);

/** A source that cannot resolve falls back to an icon rather than a blank box. */
export const Fallback = () => (
  <VStack spacing="xs" width={480}>
    <Image
      source={{ uri: "https://example.invalid/missing.png" }}
      alt="Missing cover"
      width={200}
      ratio={16 / 9}
      radius="medium"
      fallbackIcon="image"
      showLoader={false}
    />
    <Typography variant="labelSmall">
      broken source → fallbackIcon
    </Typography>
  </VStack>
);
