export type TokenKind =
  "comment" | "string" | "keyword" | "tag" | "attribute" | "type" | "number";

export interface Token {
  text: string;
  kind?: TokenKind;
}

// One alternation, tried left to right at every position; the first group that
// matches names the token. Order matters: comments and strings first, so a
// keyword inside a string stays part of the string.
const PATTERN = new RegExp(
  [
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/.source, // 1 comment
    /("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)/.source, // 2 string
    /(<\/?)([A-Za-z][\w.]*)/.source, // 3 bracket, 4 tag name
    /\b(import|from|export|default|const|let|return|function|if|else|true|false|null|undefined|as|interface|type|extends|new|typeof|keyof|async|await)\b/
      .source, // 5 keyword
    /\b([A-Za-z_$][\w$]*)(?==)/.source, // 6 JSX attribute / named argument
    /\b([A-Z][\w$]*)\b/.source, // 7 component or type
    /\b(\d+(?:\.\d+)?)\b/.source, // 8 number
  ].join("|"),
  "g",
);

/**
 * Splits TSX into coloured runs. A regex tokenizer, not a parser: it knows
 * comments, strings, tags, attributes, keywords, PascalCase names and numbers,
 * which is what makes a JSX sample readable, and leaves everything else plain.
 */
export const highlight = (code: string): Token[] => {
  const tokens: Token[] = [];
  let last = 0;
  const push = (text: string, kind?: TokenKind) => {
    if (!text) return;
    const previous = tokens[tokens.length - 1];
    // Merge plain runs so the renderer makes as few Text nodes as it can.
    if (!kind && previous && !previous.kind) previous.text += text;
    else tokens.push({ text, kind });
  };

  for (const match of code.matchAll(PATTERN)) {
    push(code.slice(last, match.index));
    const [, comment, string, bracket, tag, keyword, attribute, type, number] =
      match;
    if (comment) push(comment, "comment");
    else if (string) push(string, "string");
    else if (tag) {
      push(bracket);
      push(tag, "tag");
    } else if (keyword) push(keyword, "keyword");
    else if (attribute) push(attribute, "attribute");
    else if (type) push(type, "type");
    else push(number, "number");
    last = match.index + match[0].length;
  }
  push(code.slice(last));
  return tokens;
};
