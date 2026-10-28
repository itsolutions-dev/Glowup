import React from "react";
import { CodeBlock, HighlightedCode } from "@its/glowup-ui";

const frame: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  width: 480,
};

const tsx = `import { Button } from "@its/glowup-ui";

// A primary action
type SaveProps = { onSave: () => void };

export function Save({ onSave }: SaveProps) {
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
  <div style={frame}>
    <CodeBlock code={tsx} />
  </div>
);

export const WithTitle = () => (
  <div style={frame}>
    <CodeBlock code={tsx} title="Save.tsx" />
  </div>
);

export const LineNumbers = () => (
  <div style={frame}>
    <CodeBlock code={tsx} title="Save.tsx" showLineNumbers />
  </div>
);

/** `highlightLines` marks lines (counted from 1) with a band and an accent edge. */
export const HighlightedLines = () => (
  <div style={frame}>
    <CodeBlock
      code={tsx}
      title="Save.tsx"
      showLineNumbers
      highlightLines={[7, 8, 9, 10]}
    />
  </div>
);

export const Languages = () => (
  <div style={frame}>
    <CodeBlock code={json} language="json" title="package.json" />
    <CodeBlock code={bash} language="bash" title="Terminal" />
    <CodeBlock
      code="Build finished in 4.2 s with 3 warnings"
      language="text"
      title="Output"
    />
  </div>
);

/** Long lines scroll sideways, unless `wrap`. */
export const ScrollOrWrap = () => (
  <div style={frame}>
    <CodeBlock code={long} title="Scrolls" />
    <CodeBlock code={long} title="Wraps" wrap />
  </div>
);

/** `maxHeight` caps the body, which then scrolls. */
export const MaxHeight = () => (
  <div style={frame}>
    <CodeBlock code={tsx} title="Save.tsx" showLineNumbers maxHeight={132} />
  </div>
);

export const WithoutCopy = () => (
  <div style={frame}>
    <CodeBlock code={bash} language="bash" title="Terminal" copyable={false} />
    <CodeBlock code={json} language="json" copyable={false} />
  </div>
);

/** `HighlightedCode`: just the coloured text, no chrome. */
export const JustTheText = () => (
  <div style={frame}>
    <HighlightedCode code={tsx} selectable />
  </div>
);
