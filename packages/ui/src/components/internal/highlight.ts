/** What a run of code is, as far as colour goes. `CodeBlock` maps each kind to a theme role. */
export type TokenKind =
  "comment" | "string" | "keyword" | "tag" | "attribute" | "type" | "number";

export interface Token {
  text: string;
  kind?: TokenKind;
}

/** The languages `highlight` knows. `"text"` is drawn plain. */
export type CodeLanguage =
  "tsx" | "jsx" | "ts" | "js" | "json" | "bash" | "text";

// A rule is a regex source and, for each capture group in it, the kind of the
// text that group takes (`undefined` is plain). The groups of one rule tile its
// whole match, so tokens always join back into the code that went in.
interface Rule {
  source: string;
  kinds: (TokenKind | undefined)[];
}

const rule = (source: RegExp, ...kinds: (TokenKind | undefined)[]): Rule => ({
  source: source.source,
  kinds,
});

const COMMENT = rule(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/, "comment");
const STRING = rule(
  /("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)/,
  "string",
);
const NUMBER = rule(/\b(0x[\da-fA-F]+|\d+(?:\.\d+)?)\b/, "number");

const KEYWORDS = [
  "import",
  "from",
  "export",
  "default",
  "const",
  "let",
  "var",
  "return",
  "function",
  "class",
  "extends",
  "new",
  "if",
  "else",
  "for",
  "while",
  "do",
  "switch",
  "case",
  "break",
  "continue",
  "throw",
  "try",
  "catch",
  "finally",
  "true",
  "false",
  "null",
  "undefined",
  "as",
  "interface",
  "type",
  "enum",
  "typeof",
  "keyof",
  "in",
  "of",
  "async",
  "await",
  "void",
  "this",
].join("|");

// Order matters: comments and strings first, so a keyword inside a string stays
// part of the string.
const script = (jsx: boolean): Rule[] => [
  COMMENT,
  STRING,
  // 1 bracket, 2 tag name: only where JSX can be, since in plain TS `<Foo>` is a generic.
  ...(jsx ? [rule(/(<\/?)([A-Za-z][\w.]*)/, undefined, "tag")] : []),
  rule(new RegExp(`\\b(${KEYWORDS})\\b`), "keyword"),
  // A JSX attribute or a named argument.
  rule(/\b([A-Za-z_$][\w$]*)(?==)/, "attribute"),
  // A component or a type.
  rule(/\b([A-Z][\w$]*)\b/, "type"),
  NUMBER,
];

const JSON_RULES: Rule[] = [
  COMMENT,
  // A key is a string followed by a colon.
  rule(/("(?:[^"\\\n]|\\.)*")(?=\s*:)/, "attribute"),
  STRING,
  rule(/\b(true|false|null)\b/, "keyword"),
  rule(/(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/, "number"),
];

const BASH_RULES: Rule[] = [
  // `#` starts a comment only after whitespace or at the start of a line.
  rule(/(^|\s)(#[^\n]*)/, undefined, "comment"),
  rule(/("(?:[^"\\]|\\[\s\S])*"|'[^']*')/, "string"),
  // $VAR, ${VAR}, $1, $@
  rule(/(\$\{[^}\n]*\}|\$[A-Za-z_]\w*|\$[0-9@#?!*$-])/, "type"),
  // --flag and -f
  rule(/(^|\s)(--?[A-Za-z][\w-]*)/, undefined, "attribute"),
  // The command: the first word of a line (after an optional `$ ` prompt) or of
  // a pipeline.
  rule(/(^[ \t]*(?:\$ )?|[|;&]\s*)([A-Za-z_./][\w./-]*)/, undefined, "keyword"),
];

interface Grammar {
  pattern: RegExp;
  /** The kind of each capture group of `pattern`, in order. */
  kinds: (TokenKind | undefined)[];
}

const compile = (rules: Rule[], flags = "g"): Grammar => ({
  pattern: new RegExp(rules.map((r) => r.source).join("|"), flags),
  kinds: rules.flatMap((r) => r.kinds),
});

const SCRIPT = compile(script(false));
const SCRIPT_JSX = compile(script(true));
const GRAMMARS: Record<CodeLanguage, Grammar | undefined> = {
  tsx: SCRIPT_JSX,
  jsx: SCRIPT_JSX,
  ts: SCRIPT,
  js: SCRIPT,
  json: compile(JSON_RULES),
  bash: compile(BASH_RULES, "gm"),
  text: undefined,
};

/**
 * Splits code into coloured runs. A regex tokenizer, not a parser: it knows
 * comments, strings, numbers and, per language, keywords, JSX tags and
 * attributes, PascalCase names (`tsx`, `jsx`, `ts`, `js`), keys (`json`),
 * commands, flags and variables (`bash`), which is what makes a sample
 * readable, and leaves everything else plain. Lossless: the runs' text joins
 * back into `code`.
 *
 * ```ts
 * highlight('const n = 42;'); // [{ text: "const", kind: "keyword" }, { text: " n = " }, ...]
 * ```
 */
export const highlight = (
  code: string,
  language: CodeLanguage = "tsx",
): Token[] => {
  const grammar = GRAMMARS[language];
  if (!grammar) return code ? [{ text: code }] : [];

  const tokens: Token[] = [];
  let last = 0;
  const push = (text: string | undefined, kind?: TokenKind) => {
    if (!text) return;
    const previous = tokens[tokens.length - 1];
    // Merge plain runs so the renderer makes as few Text nodes as it can.
    if (!kind && previous && !previous.kind) previous.text += text;
    else tokens.push({ text, kind });
  };

  // `matchAll` clones the regex: the shared one keeps no state between calls.
  for (const match of code.matchAll(grammar.pattern)) {
    push(code.slice(last, match.index));
    for (let group = 1; group < match.length; group++) {
      push(match[group], grammar.kinds[group - 1]);
    }
    last = match.index + match[0].length;
  }
  push(code.slice(last));
  return tokens;
};

/** Cuts runs at their line breaks, so a block comment or a template literal spanning lines is split across the lines. */
export const splitLines = (tokens: Token[]): Token[][] => {
  const lines: Token[][] = [[]];
  for (const { text, kind } of tokens) {
    text.split("\n").forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ text: part, kind });
    });
  }
  return lines;
};
