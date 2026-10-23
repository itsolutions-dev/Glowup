import { useState } from "react";
import {
  CodeBlock,
  Typography,
  VStack,
  type CodeBlockProps,
  type CodeLanguage,
} from "@its/glowup-ui";

const props: Partial<CodeBlockProps> = {
  title: "Quick start",
  showLineNumbers: true,
};

// One snippet per language the block colours, so the Language control has
// something to show.
const SNIPPETS: Record<CodeLanguage, string> = {
  tsx: `import { Button } from "@its/glowup-ui";

export default function Save() {
  // Runs when the button is pressed.
  return <Button onClick={save}>Save changes</Button>;
}`,
  jsx: `import { Chip } from "@its/glowup-ui";

const Tag = ({ name }) => <Chip label={name} variant="tonal" />;`,
  ts: `type Order = { id: string; total: number };

export const sum = (orders: Order[]): number =>
  orders.reduce((total, order) => total + order.total, 0);`,
  js: `// Total of a basket, rounded to cents.
const total = items.reduce((sum, item) => sum + item.price, 0);
console.log(Math.round(total * 100) / 100);`,
  json: `{
  "name": "my-app",
  "dependencies": { "@its/glowup-ui": "^0.11.1" },
  "private": true
}`,
  bash: `# Add the library to an Expo app
npm install @its/glowup-ui
npx expo start --web`,
  text: `Quick start

1. Install the library.
2. Wrap the app in a ThemeProvider.
3. Use the components.`,
};

export default function CodeBlockExample() {
  const [copied, setCopied] = useState(false);

  return (
    <VStack spacing="m">
      <VStack spacing="xs">
        <Typography variant="titleMedium">Get started</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          Copy the snippet into your project.
        </Typography>
      </VStack>
      {/* On the web the button writes to the clipboard. A phone has no default
          writer, so the app passes one (`copy`); here it only reports. */}
      <CodeBlock
        {...props}
        code={SNIPPETS[props.language ?? "tsx"]}
        onCopy={() => setCopied(true)}
      />
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {copied ? "Snippet copied." : "Press the button to copy it."}
      </Typography>
    </VStack>
  );
}
