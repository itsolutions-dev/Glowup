import { useRef, useState } from "react";
import type { ScrollView } from "react-native";
import {
  Card,
  Chip,
  CODE_FONT_FAMILY,
  HStack,
  IconButton,
  ScrollArea,
  Typography,
  VStack,
  useTheme,
  type ScrollAreaProps,
} from "@its/glowup-ui";

const props: Partial<ScrollAreaProps> = {
  orientation: "both",
  maxHeight: 220,
};

const LOG = [
  { level: "info", text: "Resolving dependencies" },
  {
    level: "info",
    text: "Compiling packages/ui/src/components/ScrollArea.tsx",
  },
  {
    level: "warn",
    text: "Unused export `scrollbarSize` in packages/ui/src/components/internal/scrollbar.ts",
  },
  { level: "info", text: "Compiling packages/ui/src/components/Visible.tsx" },
  { level: "info", text: "Bundling the web build (2,184 modules)" },
  {
    level: "error",
    text: "Type 'string' is not assignable to type 'number' in apps/playground/catalogue/examples/Chart.tsx:41",
  },
  { level: "info", text: "Retrying with the cache cleared" },
  { level: "warn", text: "Chunk vendor.js is 1.2 MB: consider splitting it" },
  { level: "info", text: "Compiling apps/playground/app/index.tsx" },
  {
    level: "error",
    text: "Cannot find module '@its/glowup-charts' from apps/playground/app/charts.tsx",
  },
  { level: "info", text: "Exporting 54 static pages" },
  { level: "info", text: "Finished with 2 errors and 2 warnings" },
] as const;

const COLORS = {
  info: "onSurfaceVariant",
  warn: "tertiary",
  error: "error",
} as const;

export default function ScrollAreaExample() {
  const { theme } = useTheme();
  const log = useRef<ScrollView>(null);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const lines = errorsOnly ? LOG.filter((l) => l.level === "error") : LOG;

  return (
    <Card variant="outlined">
      <VStack spacing="s">
        <HStack spacing="s" align="center">
          <Typography variant="titleMedium" style={{ flex: 1 }}>
            Build log
          </Typography>
          <Chip
            label="Errors only"
            variant="outlined"
            selected={errorsOnly}
            onClick={() => setErrorsOnly(!errorsOnly)}
          />
          <IconButton
            icon="arrow-collapse-down"
            variant="tonal"
            accessibilityLabel="Jump to the last line"
            onClick={() => log.current?.scrollToEnd({ animated: true })}
          />
        </HStack>

        {/* Long lines scroll sideways, the rest up and down. */}
        <ScrollArea
          {...props}
          ref={log}
          contentContainerStyle={{ padding: theme.spacing.s }}
          style={{
            overflow: "hidden",
            borderRadius: theme.shape.medium,
            backgroundColor: theme.colors.surfaceContainerHighest,
          }}
        >
          <VStack spacing="xs">
            {lines.map((line, i) => (
              <Typography
                key={i}
                variant="bodySmall"
                color={COLORS[line.level]}
                style={{ fontFamily: CODE_FONT_FAMILY }}
              >
                {line.text}
              </Typography>
            ))}
          </VStack>
        </ScrollArea>
      </VStack>
    </Card>
  );
}
