// GENERATED — do not edit.
// Source: .design-sync/previews/CodeBlock.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { CodeBlock, HighlightedCode } from "@its/glowup-ui";

const frame: ViewStyle = {
  flexDirection: "column",
  gap: 16,
  width: 480,
};

const tsx = `import { Button } from "@its/glowup-ui";

// A primary action
export default function Save({ onSave }: { onSave: () => void }) {
  return (
    <Button variant="filled" onClick={onSave}>
      Save changes
    </Button>
  );
}`;

const json = `{
  "name": "@its/glowup-ui",
  "version": "0.11.1",
  "private": false,
  "keywords": ["react-native", "material-you"]
}`;

const bash = `# install the library
npm install @its/glowup-ui

# then run the playground
npm start --workspace=@its/glowup-playground`;

const long =
  'const message = "A line that is much longer than the width of the block, so it either scrolls sideways or wraps onto the next line";';

/** Syntax colours from the theme, a header with a copy button, text you can select. */
export const Default = () => (
  <View style={frame}>
    <CodeBlock code={tsx} />
  </View>
);

export const WithTitle = () => (
  <View style={frame}>
    <CodeBlock code={tsx} title="Save.tsx" />
  </View>
);

export const LineNumbers = () => (
  <View style={frame}>
    <CodeBlock code={tsx} title="Save.tsx" showLineNumbers />
  </View>
);

/** `highlightLines` marks lines (counted from 1) with a band and an accent edge. */
export const HighlightedLines = () => (
  <View style={frame}>
    <CodeBlock
      code={tsx}
      title="Save.tsx"
      showLineNumbers
      highlightLines={[4, 5, 6, 7]}
    />
  </View>
);

export const Languages = () => (
  <View style={frame}>
    <CodeBlock code={json} language="json" title="package.json" />
    <CodeBlock code={bash} language="bash" title="Terminal" />
    <CodeBlock code="plain text, nothing coloured" language="text" />
  </View>
);

/** Long lines scroll sideways, unless `wrap`. */
export const ScrollOrWrap = () => (
  <View style={frame}>
    <CodeBlock code={long} title="Scrolls" />
    <CodeBlock code={long} title="Wraps" wrap />
  </View>
);

/** `maxHeight` caps the body, which then scrolls. */
export const MaxHeight = () => (
  <View style={frame}>
    <CodeBlock code={tsx} title="Save.tsx" showLineNumbers maxHeight={120} />
  </View>
);

export const WithoutCopy = () => (
  <View style={frame}>
    <CodeBlock code={bash} language="bash" title="Terminal" copyable={false} />
    <CodeBlock code={json} language="json" copyable={false} />
  </View>
);

/** `HighlightedCode`: just the coloured text, no chrome. */
export const JustTheText = () => (
  <View style={frame}>
    <HighlightedCode code={tsx} selectable />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Default",
    title: "Default",
    description:
      "Syntax colours from the theme, a header with a copy button, text you can select.",
    render: Default,
  },
  {
    name: "WithTitle",
    title: "With title",
    render: WithTitle,
  },
  {
    name: "LineNumbers",
    title: "Line numbers",
    render: LineNumbers,
  },
  {
    name: "HighlightedLines",
    title: "Highlighted lines",
    description:
      "`highlightLines` marks lines (counted from 1) with a band and an accent edge.",
    render: HighlightedLines,
  },
  {
    name: "Languages",
    title: "Languages",
    render: Languages,
  },
  {
    name: "ScrollOrWrap",
    title: "Scroll or wrap",
    description: "Long lines scroll sideways, unless `wrap`.",
    render: ScrollOrWrap,
  },
  {
    name: "MaxHeight",
    title: "Max height",
    description: "`maxHeight` caps the body, which then scrolls.",
    render: MaxHeight,
  },
  {
    name: "WithoutCopy",
    title: "Without copy",
    render: WithoutCopy,
  },
  {
    name: "JustTheText",
    title: "Just the text",
    description: "`HighlightedCode`: just the coloured text, no chrome.",
    render: JustTheText,
  },
];
