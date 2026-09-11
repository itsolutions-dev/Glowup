// Extracts the public prop table of every component the library's barrel
// exports, straight from the TypeScript source, and writes it to
// props.generated.json for the docs site to render.
//
// Why the source and not a hand-written table: the props table is the part of a
// component library's documentation that rots first. Reading the `interface
// XProps` declaration and the destructuring defaults means the table cannot
// disagree with the component — if it does, `npm run docgen` produces a diff and
// CI fails on it.
//
// What it reads, per component:
//   - the annotation of the component function's single parameter, resolved to
//     the interface or type alias it names;
//   - each property's name, optionality, JSDoc comment and type *as written*
//     (not as resolved — `MaterialCommunityIconsGlyphs` is useful in a table,
//     the 7000-member union it expands to is not);
//   - the default value, taken from the initialiser in the destructuring
//     pattern, which is where every component in this library puts it;
//   - string-literal unions, kept as a value list so a control can be built
//     from them without a second source of truth.
//
// Run from the playground workspace: `npm run docgen -w @its/glowup-playground`.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Project, Node } from "ts-morph";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../../..");
const UI_ROOT = resolve(REPO_ROOT, "packages/ui");
// Normalised to forward slashes: ts-morph reports POSIX paths on every
// platform, so the `startsWith(UI_SRC)` filter below matched nothing on Windows
// and every checker-derived prop was silently dropped from the tables.
const UI_SRC = resolve(UI_ROOT, "src").replace(/\\/g, "/");
const BARREL = resolve(UI_ROOT, "src/index.ts");
const OUT = resolve(HERE, "props.generated.json");

/** A union written with more members than this is summarised, not listed. */
const MAX_UNION_MEMBERS = 24;

const project = new Project({
  tsConfigFilePath: resolve(UI_ROOT, "tsconfig.json"),
  skipAddingFilesFromTsConfig: false,
});

const barrel = project.getSourceFileOrThrow(BARREL);

/**
 * `export { default as Button } from "./components/Button"` — the barrel's only
 * shape for a component. Anything else it re-exports (types, hooks, the `*`
 * re-exports that carry prop interfaces) is not a component and is skipped.
 */
const componentExports = [];
const namedComponentExports = [];
for (const decl of barrel.getExportDeclarations()) {
  const target = decl.getModuleSpecifierSourceFile();
  if (!target) continue;

  if (decl.isNamespaceExport()) {
    // `export * from "./components/RadioButton"` also carries components that
    // are not their module's default — RadioGroup lives beside RadioButton.
    // Take the PascalCase arrow functions whose parameter is annotated; the
    // hooks, option interfaces and constants in the same modules are not
    // components and have no props table.
    for (const [name, declarations] of target.getExportedDeclarations()) {
      if (!/^[A-Z]/.test(name)) continue;
      for (const declaration of declarations) {
        if (!Node.isVariableDeclaration(declaration)) continue;
        const initializer = declaration.getInitializer();
        if (
          !Node.isArrowFunction(initializer) &&
          !Node.isFunctionExpression(initializer)
        ) {
          continue;
        }
        if (!initializer.getParameters()[0]?.getTypeNode()) continue;
        namedComponentExports.push({
          name,
          file: target,
          declaration: initializer,
        });
      }
    }
    continue;
  }

  for (const spec of decl.getNamedExports()) {
    if (spec.getName() !== "default") continue;
    componentExports.push({
      name: spec.getAliasNode()?.getText() ?? spec.getName(),
      file: target,
    });
  }
}

/** The declaration a file default-exports, whatever syntax it used. */
const defaultExportDeclaration = (file) => {
  const symbol = file.getDefaultExportSymbol();
  if (!symbol) return undefined;
  for (const decl of symbol.getDeclarations()) {
    if (Node.isFunctionDeclaration(decl) || Node.isArrowFunction(decl)) {
      return decl;
    }
    // `const Button = (...) => {}; export default Button;` and
    // `function ListItem(...) {} export default ListItem;`
    if (Node.isExportAssignment(decl)) {
      const expr = decl.getExpression();
      if (Node.isIdentifier(expr)) {
        const targets = expr.getDefinitionNodes();
        const fn = targets.find((n) => Node.isFunctionDeclaration(n));
        if (fn) return fn;
        const init = targets
          .find((n) => Node.isVariableDeclaration(n))
          ?.getInitializer();
        if (
          Node.isArrowFunction(init) ||
          Node.isFunctionExpression(init) ||
          Node.isCallExpression(init) // React.memo / forwardRef / Object.assign
        ) {
          return init;
        }
      }
    }
    if (Node.isVariableDeclaration(decl)) {
      const init = decl.getInitializer();
      if (Node.isArrowFunction(init) || Node.isFunctionExpression(init)) {
        return init;
      }
    }
  }
  return undefined;
};

/**
 * The props parameter, unwrapping the call expressions components are wrapped
 * in: `memo(fn)` / `forwardRef(fn)` take the function inline, while
 * `Object.assign(CardBase, { Title, Content })` — the compound-component
 * pattern Card uses — names a function declared elsewhere in the file.
 */
const propsParameter = (decl) => {
  let fn = decl;
  if (Node.isCallExpression(fn)) {
    const args = fn.getArguments();
    const inline = args.find(
      (a) => Node.isArrowFunction(a) || Node.isFunctionExpression(a),
    );
    if (inline) {
      fn = inline;
    } else {
      const referenced = args
        .filter(Node.isIdentifier)
        .flatMap((a) => a.getDefinitionNodes())
        .map((n) => (Node.isVariableDeclaration(n) ? n.getInitializer() : n))
        .find(
          (n) =>
            Node.isArrowFunction(n) ||
            Node.isFunctionExpression(n) ||
            Node.isFunctionDeclaration(n),
        );
      if (!referenced) return undefined;
      fn = referenced;
    }
  }
  return fn.getParameters?.()[0];
};

/**
 * Defaults live in the destructuring pattern
 * (`({ mode = "filled", disabled = false })`), so read them from there rather
 * than from a defaultProps object no component in this library uses.
 */
const defaultsFromPattern = (param) => {
  const defaults = {};
  const pattern = param?.getNameNode();
  if (!Node.isObjectBindingPattern(pattern)) return defaults;
  for (const element of pattern.getElements()) {
    const initializer = element.getInitializer();
    if (!initializer) continue;
    const propertyName =
      element.getPropertyNameNode()?.getText() ?? element.getName();
    defaults[propertyName] = initializer.getText();
  }
  return defaults;
};

/** The interface or type alias a parameter annotation names, if it names one. */
const resolveAnnotation = (typeNode) => {
  if (!typeNode) return undefined;
  if (Node.isTypeLiteral(typeNode)) return typeNode;
  if (!Node.isTypeReference(typeNode)) return undefined;
  const symbol = typeNode.getTypeName().getSymbol();
  // An imported props type (`import { DateTimePickerProps } from "./shared"`)
  // resolves to the import specifier; the interface is behind the alias.
  const declarations =
    (symbol?.getAliasedSymbol() ?? symbol)?.getDeclarations() ?? [];
  return declarations.find(
    (d) => Node.isInterfaceDeclaration(d) || Node.isTypeAliasDeclaration(d),
  );
};

/** Members of an interface / type alias / inline type literal. */
const membersOf = (declaration) => {
  if (Node.isInterfaceDeclaration(declaration)) return declaration.getMembers();
  if (Node.isTypeLiteral(declaration)) return declaration.getMembers();
  if (Node.isTypeAliasDeclaration(declaration)) {
    const node = declaration.getTypeNode();
    if (Node.isTypeLiteral(node)) return node.getMembers();
    // `type XProps = YProps & { ... }` — collect every literal in the
    // intersection, and let the named halves show up as `extends` instead.
    if (Node.isIntersectionTypeNode(node)) {
      return node
        .getTypeNodes()
        .filter(Node.isTypeLiteral)
        .flatMap((n) => n.getMembers());
    }
  }
  return [];
};

/**
 * Fallback for props types built by type-level operations rather than written
 * out — `Omit<BoxProps, "align">`, `DistributiveOmit<…>`, or a union of three
 * interfaces (the DateTimePicker family). Reading the declaration's syntax
 * finds no members there, so ask the checker instead and keep each property's
 * ORIGINAL declaration, which still carries the JSDoc and the written type.
 * A union contributes every member's properties, not just the shared ones:
 * `onChange` exists on each variant of DateTimePicker with a different
 * signature, and documenting the first is better than documenting none.
 */
const membersFromChecker = (param) => {
  if (!param) return [];
  const type = param.getType();
  const branches = type.isUnion() ? type.getUnionTypes() : [type];
  const byName = new Map();
  for (const branch of branches) {
    for (const symbol of branch.getProperties()) {
      if (byName.has(symbol.getName())) continue;
      const declaration = symbol
        .getDeclarations()
        .find((d) => Node.isPropertySignature(d));
      if (!declaration) continue;
      // The checker also hands back everything the props type inherits from
      // react-native (`ViewProps` alone is ~110 members). Those belong to the
      // platform, not to this library, and listing them buries the four props
      // the component actually adds — so keep only what this package declares
      // and let `extends` say where the rest comes from.
      if (!declaration.getSourceFile().getFilePath().startsWith(UI_SRC)) {
        continue;
      }
      byName.set(symbol.getName(), declaration);
    }
  }
  return [...byName.values()];
};

/** Named types a props type builds on, reported rather than inlined. */
const extendsOf = (declaration) => {
  if (Node.isInterfaceDeclaration(declaration)) {
    return declaration.getExtends().map((e) => e.getText());
  }
  if (Node.isTypeAliasDeclaration(declaration)) {
    const node = declaration.getTypeNode();
    if (Node.isIntersectionTypeNode(node)) {
      return node
        .getTypeNodes()
        .filter((n) => !Node.isTypeLiteral(n))
        .map((n) => n.getText());
    }
  }
  return [];
};

/** Collapses whitespace so a multi-line annotation fits a table cell. */
const normaliseType = (text) => text.replace(/\s+/g, " ").trim();

/**
 * String-literal unions become a value list a control can be generated from;
 * anything longer than MAX_UNION_MEMBERS is left as prose, because a select
 * with hundreds of options is not a control anyone can use.
 */
const literalUnionValues = (typeNode) => {
  if (!typeNode || !Node.isUnionTypeNode(typeNode)) return undefined;
  const members = typeNode.getTypeNodes();
  if (members.length > MAX_UNION_MEMBERS) return undefined;
  const values = [];
  for (const member of members) {
    if (!Node.isLiteralTypeNode(member)) return undefined;
    const literal = member.getLiteral();
    if (Node.isStringLiteral(literal)) values.push(literal.getLiteralValue());
    else if (Node.isNumericLiteral(literal))
      values.push(literal.getLiteralValue());
    else return undefined;
  }
  return values.length ? values : undefined;
};

const jsDocOf = (member) =>
  member
    .getJsDocs?.()
    .map((doc) => doc.getCommentText() ?? "")
    .join("\n")
    .trim() || undefined;

const components = {};
const skipped = [];

// Default exports win: a name reached both ways is the same component, and the
// default export is the one the barrel advertises.
const defaultNames = new Set(componentExports.map((entry) => entry.name));
const allExports = [
  ...componentExports,
  ...namedComponentExports.filter((entry) => !defaultNames.has(entry.name)),
];

for (const entry of allExports) {
  const { name, file } = entry;
  const declaration = entry.declaration ?? defaultExportDeclaration(file);
  if (!declaration) {
    skipped.push({ name, reason: "no default-exported function found" });
    continue;
  }
  const param = propsParameter(declaration);
  const annotation = resolveAnnotation(param?.getTypeNode());
  if (!annotation) {
    skipped.push({ name, reason: "props parameter is not annotated" });
    continue;
  }

  const defaults = defaultsFromPattern(param);
  const props = [];

  const declaredMembers = membersOf(annotation);
  const derived = declaredMembers.length === 0;
  const members = derived ? membersFromChecker(param) : declaredMembers;

  for (const member of members) {
    if (!Node.isPropertySignature(member)) continue;
    const propName = member.getName();
    const typeNode = member.getTypeNode();
    props.push({
      name: propName,
      type: normaliseType(typeNode?.getText() ?? "unknown"),
      required: !member.hasQuestionToken(),
      default: defaults[propName],
      description: jsDocOf(member),
      values: literalUnionValues(typeNode),
      deprecated: member
        .getJsDocs?.()
        .some((doc) =>
          doc.getTags().some((tag) => tag.getTagName() === "deprecated"),
        ),
    });
  }

  components[name] = {
    name,
    // Repo-relative so the site can link to the source on GitHub.
    source: relative(REPO_ROOT, file.getFilePath()).replace(/\\/g, "/"),
    propsTypeName: Node.isTypeLiteral(annotation)
      ? undefined
      : annotation.getName(),
    // For a props type the checker had to compute (`Omit<BoxProps, …>`, a
    // union of variants), the written alias is what tells a reader where the
    // props not listed below come from.
    extends: derived
      ? [normaliseType(annotation.getTypeNode?.()?.getText() ?? "")].filter(
          Boolean,
        )
      : extendsOf(annotation),
    description:
      annotation.getJsDocs?.().length > 0
        ? annotation
            .getJsDocs()
            .map((d) => d.getCommentText() ?? "")
            .join("\n")
            .trim() || undefined
        : undefined,
    props: props.sort((a, b) => {
      if (a.required !== b.required) return a.required ? -1 : 1;
      return a.name.localeCompare(b.name);
    }),
  };
}

const { version: libraryVersion, name: libraryName } = JSON.parse(
  readFileSync(resolve(UI_ROOT, "package.json"), "utf8"),
);

const payload = {
  // The site shows these in its navigation; reading them here keeps the app
  // from importing a path inside packages/ui, which ESLint forbids.
  libraryName,
  libraryVersion,
  // Regenerate with `npm run docgen -w @its/glowup-playground`.
  generatedFrom: relative(REPO_ROOT, BARREL).replace(/\\/g, "/"),
  componentCount: Object.keys(components).length,
  components,
};

writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");

const total = allExports.length;
console.log(
  `docgen: ${Object.keys(components).length}/${total} components documented → ${relative(REPO_ROOT, OUT)}`,
);
if (skipped.length) {
  console.log("docgen: skipped");
  for (const { name, reason } of skipped) console.log(`  - ${name}: ${reason}`);
}
