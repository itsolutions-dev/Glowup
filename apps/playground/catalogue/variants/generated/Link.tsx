// GENERATED — do not edit.
// Source: .design-sync/previews/Link.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import type { Variant } from "../types";
import { Link, Typography, VStack } from "@its/glowup-ui";

export const Underline = () => (
  <VStack spacing="s" width={420}>
    <Link href="https://m3.material.io" underline="always">
      Always underlined
    </Link>
    <Link href="https://m3.material.io" underline="hover">
      Underlined on hover (default)
    </Link>
    <Link href="https://m3.material.io" underline="none">
      Never underlined
    </Link>
  </VStack>
);

export const InProse = () => (
  <VStack spacing="xs" width={420}>
    <Typography variant="bodyMedium">
      Every colour and type role in this library follows the Material 3 spec.
    </Typography>
    <Link href="https://m3.material.io/styles/color/roles">
      Read the colour-role reference
    </Link>
  </VStack>
);

export const Variants = () => (
  <VStack spacing="s" width={420}>
    <Link onPress={() => {}} variant="titleMedium">
      titleMedium, in-app press handler
    </Link>
    <Link onPress={() => {}} variant="bodySmall">
      bodySmall
    </Link>
    <Link href="https://m3.material.io" disabled>
      Disabled
    </Link>
  </VStack>
);

export const variants: Variant[] = [
  {
    name: "Underline",
    title: "Underline",
    render: Underline,
  },
  {
    name: "InProse",
    title: "In prose",
    render: InProse,
  },
  {
    name: "Variants",
    title: "Variants",
    render: Variants,
  },
];
