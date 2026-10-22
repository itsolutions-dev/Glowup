import React from "react";
import { Platform, StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import {
  CODE_FONT_FAMILY,
  CodeBlock,
  HighlightedCode,
  ThemeProvider,
  highlight,
  useTheme,
} from "..";
import { splitLines } from "../components/internal/highlight";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

const kinds = (code: string, language?: Parameters<typeof highlight>[1]) =>
  Object.fromEntries(
    highlight(code, language)
      .filter((token) => token.kind)
      .map((token) => [token.text, token.kind]),
  );

const joined = (code: string, language?: Parameters<typeof highlight>[1]) =>
  highlight(code, language)
    .map((token) => token.text)
    .join("");

describe("highlight", () => {
  const tsx = `import { Button } from "@its/glowup-ui";
// a comment
/* a block
   comment */
const n = 42;
export default () => <Button mode="filled" onClick={go}>Go</Button>;`;

  it("is lossless, in every language", () => {
    const bash = `# setup\nnpm install --save-dev glow && echo "done $HOME"\n$ git commit -m 'x' | cat\n`;
    const json = `{\n  "a": [1, -2.5e3, true, null],\n  "b": { "c": "d" } // note\n}`;
    for (const language of ["tsx", "jsx", "ts", "js"] as const) {
      expect(joined(tsx, language)).toBe(tsx);
    }
    expect(joined(bash, "bash")).toBe(bash);
    expect(joined(json, "json")).toBe(json);
    expect(joined(tsx, "text")).toBe(tsx);
    expect(joined("", "tsx")).toBe("");
    expect(highlight("", "text")).toEqual([]);
  });

  it("colours tsx: tags, attributes, strings, keywords, comments, numbers", () => {
    expect(kinds(tsx)).toMatchObject({
      import: "keyword",
      '"@its/glowup-ui"': "string",
      "// a comment": "comment",
      "/* a block\n   comment */": "comment",
      "42": "number",
      Button: "tag",
      mode: "attribute",
      '"filled"': "string",
    });
  });

  it("tsx is the default language, and a keyword inside a string stays in the string", () => {
    expect(highlight('const s = "import me";')).toEqual(
      highlight('const s = "import me";', "tsx"),
    );
    const tokens = highlight('const s = "import me";');
    expect(tokens.find((t) => t.text === '"import me"')?.kind).toBe("string");
    expect(tokens.filter((t) => t.kind === "keyword")).toHaveLength(1);
  });

  it("reads <Foo> as a generic in ts and js, a tag only in tsx and jsx", () => {
    const code = "const a: Array<Foo> = [];";
    expect(kinds(code, "ts").Foo).toBe("type");
    expect(kinds(code, "js").Foo).toBe("type");
    expect(kinds(code, "tsx").Foo).toBe("tag");
    expect(kinds("<Foo />", "jsx").Foo).toBe("tag");
  });

  it("colours json: keys apart from string values, numbers, literals", () => {
    const out = kinds(
      `{"name": "glow", "n": 1.5, "m": -2e3, "ok": true, "none": null}`,
      "json",
    );
    expect(out).toMatchObject({
      '"name"': "attribute",
      '"glow"': "string",
      "1.5": "number",
      "-2e3": "number",
      true: "keyword",
      null: "keyword",
    });
  });

  it("colours bash: comments, commands, flags, variables, strings", () => {
    const out = kinds(
      `# setup\nnpm install --save-dev glow && echo "done $HOME" $PATH\n$ git commit -m 'x' | cat`,
      "bash",
    );
    expect(out).toMatchObject({
      "# setup": "comment",
      npm: "keyword",
      "--save-dev": "attribute",
      echo: "keyword",
      '"done $HOME"': "string",
      $PATH: "type",
      git: "keyword",
      "-m": "attribute",
      "'x'": "string",
      cat: "keyword",
    });
    // A # inside a word is not a comment.
    expect(kinds("echo a#b", "bash")["#b"]).toBeUndefined();
  });

  it("text and an unknown language are plain", () => {
    expect(highlight("const a = 1;", "text")).toEqual([
      { text: "const a = 1;" },
    ]);
  });

  it("merges plain runs", () => {
    const tokens = highlight("a + b");
    expect(tokens).toEqual([{ text: "a + b" }]);
  });
});

describe("splitLines", () => {
  it("cuts runs at line breaks, including inside a block comment", () => {
    const lines = splitLines(highlight("a\n/* x\ny */\nb"));
    expect(lines.map((line) => line.map((t) => t.text).join(""))).toEqual([
      "a",
      "/* x",
      "y */",
      "b",
    ]);
    expect(lines[1][0].kind).toBe("comment");
    expect(lines[2][0].kind).toBe("comment");
  });

  it("keeps empty lines", () => {
    expect(splitLines(highlight("a\n\nb")).map((l) => l.length)).toEqual([
      1, 0, 1,
    ]);
  });
});

describe("HighlightedCode", () => {
  it("draws the runs as nested Text coloured from the theme", async () => {
    let primary = "";
    let tertiary = "";
    const Probe = () => {
      const { colors } = useTheme().theme;
      primary = colors.primary;
      tertiary = colors.tertiary;
      return null;
    };
    const { getByText } = await draw(
      <>
        <Probe />
        <HighlightedCode code={'const s = "a";'} />
      </>,
    );
    expect(StyleSheet.flatten(getByText("const").props.style).color).toBe(
      primary,
    );
    expect(StyleSheet.flatten(getByText('"a"').props.style).color).toBe(
      tertiary,
    );
  });

  it("is one monospace Text, selectable on request, hideable from screen readers", async () => {
    const plain = await draw(<HighlightedCode code="x" testID="c" />);
    const node = plain.getByTestId("c");
    expect(StyleSheet.flatten(node.props.style).fontFamily).toBe(
      CODE_FONT_FAMILY,
    );
    expect(node.props.selectable).toBeFalsy();
    expect(node.props["aria-hidden"]).toBeUndefined();

    const set = await draw(
      <HighlightedCode code="x" testID="c" selectable decorative />,
    );
    // Hidden from assistive technology, so the queries skip it unless told.
    const hidden = set.getByTestId("c", { includeHiddenElements: true });
    expect(hidden.props.selectable).toBe(true);
    expect(hidden.props["aria-hidden"]).toBe(true);
  });

  it("takes a language, and merges a style", async () => {
    const { getByText } = await draw(
      <HighlightedCode
        code={'{"a": 1}'}
        language="json"
        style={{ padding: 7 }}
        testID="c"
      />,
    );
    expect(getByText('"a"')).toBeTruthy();
  });
});

const SAMPLE = `const a = 1;
// two

const b = 2;
`;

describe("CodeBlock", () => {
  it("shows the code under a title, and reads as a named group", async () => {
    const { getByText, getByLabelText } = await draw(
      <CodeBlock code={SAMPLE} title="sample.tsx" />,
    );
    expect(getByText("sample.tsx")).toBeTruthy();
    expect(getByText("// two")).toBeTruthy();
    expect(getByLabelText("sample.tsx")).toBeTruthy();
  });

  it("falls back to the language for its header and its label", async () => {
    const { getByText, getByLabelText } = await draw(
      <CodeBlock code="a" language="json" copy={() => {}} />,
    );
    expect(getByText("JSON")).toBeTruthy();
    expect(getByLabelText("JSON code")).toBeTruthy();
    const custom = await draw(
      <CodeBlock code="a" accessibilityLabel="The install command" title="x" />,
    );
    expect(custom.getByLabelText("The install command")).toBeTruthy();
  });

  it("the code is selectable text", async () => {
    const out = JSON.stringify((await draw(<CodeBlock code="a b" />)).toJSON());
    expect(out).toContain('"selectable":true');
  });

  it("copies the code through the writer, and reports it", async () => {
    const write = jest.fn();
    const onCopy = jest.fn();
    const { getByRole } = await draw(
      <CodeBlock code={SAMPLE} copy={write} onCopy={onCopy} />,
    );
    await fireEvent.press(getByRole("button", { name: "Copy code" }));
    // As given: the trailing newline is the author's.
    expect(write).toHaveBeenCalledWith(SAMPLE);
    expect(onCopy).toHaveBeenCalledWith(SAMPLE);
    expect(getByRole("button", { name: "Copied" })).toBeTruthy();
  });

  it("on native there is no copy button without a writer or an onCopy, and no header without a title", async () => {
    const { queryByRole, queryByText } = await draw(<CodeBlock code="a" />);
    expect(queryByRole("button")).toBeNull();
    expect(queryByText("TSX")).toBeNull();

    const titled = await draw(<CodeBlock code="a" title="App.tsx" />);
    expect(titled.getByText("App.tsx")).toBeTruthy();
    expect(titled.queryByRole("button")).toBeNull();
  });

  it("on web the copy button is there as is", async () => {
    jest.replaceProperty(Platform, "OS", "web");
    const { getByRole, getByText } = await draw(<CodeBlock code="a" />);
    expect(getByRole("button", { name: "Copy code" })).toBeTruthy();
    expect(getByText("TSX")).toBeTruthy();
  });

  it("copyable={false} drops the button and keeps the title", async () => {
    const { queryByRole, getByText } = await draw(
      <CodeBlock code="a" title="Sample" copy={() => {}} copyable={false} />,
    );
    expect(queryByRole("button")).toBeNull();
    expect(getByText("Sample")).toBeTruthy();
  });

  it("numbers the lines, without counting the final newline, and keeps the numbers away from screen readers", async () => {
    const { queryByText, getAllByText } = await draw(
      <CodeBlock code={SAMPLE} showLineNumbers />,
    );
    const all = { includeHiddenElements: true };
    // Lines 3 and 4 hold no digit of their own: only the gutter says them.
    for (const n of ["3", "4"]) {
      const found = getAllByText(n, all);
      expect(found).toHaveLength(1);
      expect(found[0].props["aria-hidden"]).toBe(true);
    }
    expect(queryByText("3")).toBeNull();
    expect(queryByText("5", all)).toBeNull();
  });

  it("an empty line still has a row", async () => {
    const { getByTestId } = await draw(
      <CodeBlock code={SAMPLE} showLineNumbers testID="cb" />,
    );
    expect(getByTestId("cb-line-3")).toBeTruthy();
  });

  it("marks the lines asked for, and only those", async () => {
    let primary = "";
    const Probe = () => {
      primary = useTheme().theme.colors.primary;
      return null;
    };
    const { getByTestId } = await draw(
      <>
        <Probe />
        <CodeBlock code={SAMPLE} highlightLines={[2, 4]} testID="cb" />
      </>,
    );
    const edge = (n: number) =>
      StyleSheet.flatten(getByTestId(`cb-line-${n}`).props.style)
        .borderLeftColor;
    expect(edge(2)).toBe(primary);
    expect(edge(4)).toBe(primary);
    expect(edge(1)).toBe("transparent");
    expect(edge(3)).toBe("transparent");
    expect(
      StyleSheet.flatten(getByTestId("cb-line-2").props.style).backgroundColor,
    ).toBeTruthy();
    expect(
      StyleSheet.flatten(getByTestId("cb-line-1").props.style).backgroundColor,
    ).toBeUndefined();
  });

  it("normalises Windows line endings", async () => {
    const { getByTestId, queryByTestId } = await draw(
      <CodeBlock code={"a\r\nb\r\nc\r\n"} showLineNumbers testID="cb" />,
    );
    expect(getByTestId("cb-line-3")).toBeTruthy();
    expect(queryByTestId("cb-line-4")).toBeNull();
  });

  it("scrolls sideways unless it wraps", async () => {
    const scrolled = JSON.stringify(
      (await draw(<CodeBlock code="a" />)).toJSON(),
    );
    expect(scrolled).toContain('"horizontal":true');
    const wrapped = JSON.stringify(
      (await draw(<CodeBlock code="a" wrap />)).toJSON(),
    );
    expect(wrapped).not.toContain('"horizontal":true');
  });

  it("caps its height and scrolls inside it", async () => {
    const out = JSON.stringify(
      (await draw(<CodeBlock code="a" maxHeight={120} />)).toJSON(),
    );
    expect(out).toContain('"maxHeight":120');
    const free = JSON.stringify((await draw(<CodeBlock code="a" />)).toJSON());
    expect(free).not.toContain("maxHeight");
  });

  it("takes a style and a testID", async () => {
    const { getByTestId } = await draw(
      <CodeBlock code="a" style={{ margin: 9 }} testID="cb" />,
    );
    expect(StyleSheet.flatten(getByTestId("cb").props.style).margin).toBe(9);
  });
});
