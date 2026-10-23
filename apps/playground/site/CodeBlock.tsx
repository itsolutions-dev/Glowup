import { setStringAsync } from "expo-clipboard";
import {
  CodeBlock as GlowupCodeBlock,
  type CodeBlockProps,
} from "@its/glowup-ui";

/**
 * The library's `CodeBlock`, with the phone's clipboard wired in: the library
 * has no clipboard dependency, so on iOS and Android its copy button needs the
 * writer from `expo-clipboard`. Every code sample on the site goes through
 * here, so the copy affordance and the type treatment are the same whether the
 * snippet was written by hand or generated from the properties panel.
 */
export const CodeBlock = (props: CodeBlockProps) => (
  <GlowupCodeBlock copy={setStringAsync} {...props} />
);

export default CodeBlock;
