import React from "react";
import { HStack, Image, Typography, VStack } from "@its/glowup-ui";

// Drawn inline so the capture needs no network. `size` gives the picture an
// intrinsic width and height, which `resizeMode="center"` draws it at.
const svg = (a: string, b: string, size = "") => ({
  uri:
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"' +
        size +
        ">" +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' +
        a +
        '"/><stop offset="1" stop-color="' +
        b +
        '"/></linearGradient></defs>' +
        '<rect width="320" height="180" fill="url(#g)"/>' +
        '<circle cx="200" cy="64" r="28" fill="#FFFFFF" fill-opacity="0.7"/></svg>',
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

// An 80 x 45 picture in a 140 x 100 box: cover crops it to fill, contain fits
// it whole, center keeps it at its own size.
const SMALL = svg("#6750A4", "#EADDFF", ' width="80" height="45"');

/** `resizeMode` fits the picture to the box: `cover` fills and crops, `contain` shows it whole, `center` keeps its own size (shrunk only when larger than the box). */
export const ResizeModes = () => (
  <HStack spacing="m" wrap width={480} align="flex-start">
    {(["cover", "contain", "center"] as const).map((mode) => (
      <VStack key={mode} spacing="xs">
        <Image
          source={SMALL}
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
    <Typography variant="labelSmall">broken source → fallbackIcon</Typography>
  </VStack>
);
