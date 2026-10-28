import React from "react";
import { HighlightedCode, Paper } from "@its/glowup-ui";

// HighlightedCode is the coloured text alone, with no frame, scroller or copy
// button (CodeBlock adds those). The stories set it on a surface the way a
// page would, at a fixed width so long lines wrap the same in every capture.
const surface = { width: 560, padding: 16 };

export const Tsx = () => (
  <Paper outline elevation={0} style={surface}>
    <HighlightedCode
      language="tsx"
      code={`import { Button } from "@its/glowup-ui";

export const Save = ({ busy }: { busy: boolean }) => (
  <Button variant="filled" loading={busy} onClick={save}>
    Save changes
  </Button>
);`}
    />
  </Paper>
);

export const Json = () => (
  <Paper outline elevation={0} style={surface}>
    <HighlightedCode
      language="json"
      code={`{
  "name": "@its/glowup-ui",
  "version": "0.11.1",
  "private": false,
  "peerDependencies": { "react-native": ">=0.79" }
}`}
    />
  </Paper>
);

export const Bash = () => (
  <Paper outline elevation={0} style={surface}>
    <HighlightedCode
      language="bash"
      code={`# install the library and its peers
npm install @its/glowup-ui
npx expo install react-native-svg react-native-safe-area-context`}
    />
  </Paper>
);

// `selectable` lets the reader select the text; `style` sets size and padding.
export const SelectableAndSized = () => (
  <Paper outline elevation={0} style={surface}>
    <HighlightedCode
      language="ts"
      selectable
      style={{ fontSize: 16 }}
      code={`const total = items.reduce((sum, item) => sum + item.price, 0);`}
    />
  </Paper>
);
