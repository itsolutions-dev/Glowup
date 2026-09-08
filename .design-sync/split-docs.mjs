// Splits packages/ui/src/components/components.md (the DS's own 670-line spec)
// into per-component docs the converter can bind as <Name>.prompt.md, plus a
// guidelines file holding the design-system section (tokens, type scale, shape).
//
//   - `## N. <Group>` headings become the component's `category` frontmatter,
//     which is what puts the card in a real group instead of "general".
//   - `### <Heading>` bodies become the doc; headings name one or two
//     components ("FAB (Floating Action Button)", "RadioButton / RadioGroup").
//
// Output: .design-sync/docs/<Name>.md, .design-sync/guidelines/design-system.md
// Run from the repo root before .ds-sync/package-build.mjs.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'packages/ui/src/components/components.md';
const DOCS = '.design-sync/docs';
const GUIDES = '.design-sync/guidelines';

// Section headings that are prose about the system, not a component group.
const NON_COMPONENT_SECTIONS = /^(Design System|Component Index|Framework Selection)/;

const lines = readFileSync(SRC, 'utf8').split(/\r?\n/);
rmSync(DOCS, { recursive: true, force: true });
mkdirSync(DOCS, { recursive: true });
mkdirSync(GUIDES, { recursive: true });

let group = null;
let current = null; // { names: [], buf: [] }
const docs = [];
const systemBuf = [];
let inSystem = false;

const flush = () => {
  if (current) docs.push({ ...current, group });
  current = null;
};

for (const line of lines) {
  const h2 = /^##\s+(?:\d+\.\s*)?(.+?)\s*$/.exec(line);
  if (h2 && !line.startsWith('###')) {
    flush();
    const title = h2[1];
    inSystem = /^Design System/.test(title);
    group = NON_COMPONENT_SECTIONS.test(title) ? null : title;
    if (inSystem) systemBuf.push(`## ${title}`);
    continue;
  }
  const h3 = /^###\s+(.+?)\s*$/.exec(line);
  if (h3 && group) {
    flush();
    // "FAB (Floating Action Button)" -> FAB; "RadioButton / RadioGroup" -> both.
    const names = h3[1]
      .replace(/\(.*?\)/g, '')
      .split('/')
      .map((s) => s.trim())
      .filter((s) => /^[A-Z][A-Za-z0-9]*$/.test(s));
    current = names.length ? { names, buf: [] } : null;
    continue;
  }
  if (h3 && inSystem) { systemBuf.push(line); continue; }
  if (current) current.buf.push(line);
  else if (inSystem) systemBuf.push(line);
}
flush();

let written = 0;
for (const { names, group: g, buf } of docs) {
  const body = buf.join('\n').replace(/^\s+|\s+$/g, '');
  if (!body) continue;
  for (const name of names) {
    const fm = ['---', `category: ${g}`, '---', ''].join('\n');
    writeFileSync(join(DOCS, `${name}.md`), `${fm}# ${name}\n\n${body}\n`);
    written++;
  }
}

// Components that predate (or sit outside) components.md. Hand-written here so
// they get a real .prompt.md and a real group instead of landing in "general".
const EXTRA_DOCS = {
  LanguageSelector: ['Inputs & Forms', [
    'A single-tap language cycler. Shows the active language as flag + code and',
    'advances through `en -> es -> it -> fr` on every press, calling `onChange`',
    'with the next code. Unknown `currentLang` values fall back to `it`.',
    '',
    '| Prop | Type | Req | Description |',
    '|---|---|---|---|',
    '| currentLang | `"en" \\| "es" \\| "it" \\| "fr"` | ✓ | Active language code |',
    '| onChange | `(lang: string) => void` | ✓ | Receives the next code |',
  ]],
  StatusBar: ['Foundations', [
    'Theme-aware platform status bar. On native it renders `expo-status-bar` with',
    'the light/dark style implied by the theme; on web it keeps the',
    '`<meta name="theme-color">` tag and the document background in sync with',
    '`theme.colors.surface` / `theme.colors.background`. Renders no visible box of',
    'its own — mount it once near the root of a screen.',
    '',
    '| Prop | Type | Req | Description |',
    '|---|---|---|---|',
    '| backgroundColor | string | | Overrides `theme.colors.surface` |',
  ]],
  TabContent: ['Navigation', [
    'Panel host for `Tabs`. Renders only the child at index `activeTab`, so the',
    'children array must line up with the tab array passed to `Tabs`.',
    '',
    '| Prop | Type | Req | Description |',
    '|---|---|---|---|',
    '| activeTab | number | ✓ | Index of the visible child |',
    '| children | ReactNode | ✓ | One node per tab, in tab order |',
    '| style | object | | Style for the container |',
  ]],
  DrawerPreferenceItem: ['Navigation', [
    'Labelled row for the navigation drawer\'s preferences area: leading',
    'MaterialCommunityIcons glyph, label, and a trailing control supplied as',
    '`children` (a `Toggle`, a `LanguageSelector`, a `Select`).',
    '',
    '| Prop | Type | Req | Description |',
    '|---|---|---|---|',
    '| icon | MaterialCommunityIconsGlyphs | ✓ | Leading glyph name |',
    '| label | string | ✓ | Row label |',
    '| children | ReactNode | | Trailing control |',
  ]],
  ThemeProvider: ['Providers', [
    'Root of the Material You theme. Derives the active palette from',
    '`providers/theme.json`, follows the OS colour scheme by default, and exposes',
    '`{ theme, toggleTheme }` through `useTheme()`. **Every Glowup component reads',
    'the theme from this context — nothing is styled without it.**',
    '',
    '```tsx',
    '<ThemeProvider>',
    '  <AlertProvider>',
    '    <AlertProviderWrapper>{/* app */}</AlertProviderWrapper>',
    '  </AlertProvider>',
    '</ThemeProvider>',
    '```',
    '',
    'Companion exports: `useTheme()`, `getStateColor()`, `getGlowStyles()`, and the',
    '`Theme` type.',
  ]],
  AlertProvider: ['Providers', [
    'Hosts the cross-platform alert dialog: native `Alert.alert` on iOS/Android, a',
    'themed modal on web. Wrap it inside `ThemeProvider`.',
    '',
    'Consumers raise an alert through the `Alert(title, message, buttons)`',
    'singleton, which requires `AlertProviderWrapper` to be mounted below this',
    'provider.',
  ]],
  AlertProviderWrapper: ['Providers', [
    'Binds the `Alert(title, message, buttons)` singleton to the nearest',
    '`AlertProvider`. Mount it directly inside `AlertProvider`; without it, calls',
    'to `Alert()` only log a warning.',
  ]],
};

for (const [name, [g, body]] of Object.entries(EXTRA_DOCS)) {
  const fm = ['---', `category: ${g}`, '---', ''].join('\n');
  writeFileSync(join(DOCS, `${name}.md`), `${fm}# ${name}\n\n${body.join('\n')}\n`);
  written++;
}

writeFileSync(
  join(GUIDES, 'design-system.md'),
  `# Glowup design system\n\n${systemBuf.join('\n').trim()}\n`,
);
console.log(`wrote ${written} component docs to ${DOCS} + ${GUIDES}/design-system.md`);
