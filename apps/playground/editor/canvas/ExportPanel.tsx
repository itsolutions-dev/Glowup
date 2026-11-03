// The Export panel (spec §2, §14, §15): the layout as a component file to copy
// or download, a Preview that runs that very file, and the layout's JSON to
// copy, download or replace by an import.

import React, { useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import {
  Button,
  CodeBlock,
  Dialog,
  Download,
  InputArea,
  ScrollArea,
  Tabs,
  Typography,
  Upload,
  useTheme,
  ViewportProvider,
  type Theme,
} from "@its/glowup-ui";

import { componentName, exportCode } from "../codegen";
import { parseLayout, type ImportResult } from "../importJson";
import { DemoErrorBoundary } from "../../site/ErrorBoundary";
import { compileExample } from "../../site/liveCode";
import { STAGE_WIDTHS, type StageWidth } from "../../site/stage";
import type { Editor } from "./useEditor";

const TABS = ["Code", "Preview", "JSON"];

export const ExportPanel = ({
  editor,
  device,
  visible,
  onClose,
}: {
  editor: Editor;
  device: StageWidth;
  visible: boolean;
  onClose: () => void;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [tab, setTab] = useState(0);
  const [pasted, setPasted] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const { doc } = editor;
  const name = componentName(doc.name);
  // Only while the panel is open: nothing to print for a closed one.
  const code = useMemo(() => (visible ? exportCode(doc) : ""), [doc, visible]);
  const json = useMemo(
    () => (visible ? JSON.stringify(doc, null, 2) : ""),
    [doc, visible],
  );
  // Compiled once per exported text, and only while the Preview is open.
  const compiled = useMemo(
    () => (visible && tab === 1 ? compileExample(code) : null),
    [code, tab, visible],
  );

  const open = (text: string) => {
    const next = parseLayout(text);
    setResult(next);
    if (next.ok) editor.apply(next.doc);
  };

  return (
    <Dialog visible={visible} onClose={onClose} title="Export" width="lg">
      <Tabs tabs={TABS} activeTab={tab} onChange={setTab} />
      {tab === 0 ? (
        <View style={styles.section}>
          <CodeBlock code={code} language="tsx" copyable maxHeight={480} />
          <Download
            data={code}
            filename={`${name}.tsx`}
            mimeType="text/plain"
          />
        </View>
      ) : null}
      {tab === 1 ? (
        <ScrollArea testID="export-preview" style={styles.preview}>
          {compiled?.ok ? (
            // At the toolbar's width, as the component pages' stage does.
            <View
              testID="export-preview-stage"
              style={
                STAGE_WIDTHS[device] !== undefined && {
                  width: STAGE_WIDTHS[device],
                  maxWidth: "100%",
                  alignSelf: "center",
                }
              }
            >
              <ViewportProvider width={STAGE_WIDTHS[device]}>
                <DemoErrorBoundary label="Export preview">
                  <compiled.Component />
                </DemoErrorBoundary>
              </ViewportProvider>
            </View>
          ) : (
            <Typography variant="bodyMedium" color="error">
              {compiled?.error}
            </Typography>
          )}
        </ScrollArea>
      ) : null}
      {tab === 2 ? (
        <View style={styles.section}>
          <CodeBlock code={json} language="json" copyable maxHeight={320} />
          <Download
            data={json}
            filename={`${name}.json`}
            mimeType="application/json"
          />
          {/* The web picks a file; every platform takes pasted text. */}
          {Platform.OS === "web" ? (
            <Upload
              variant="button"
              accept=".json,application/json"
              label="Import a file"
              onChange={(files) => {
                void files[0]?.file?.text().then(open);
              }}
            />
          ) : null}
          <InputArea
            label="Paste a layout's JSON"
            value={pasted}
            onChange={setPasted}
            rows={4}
          />
          <Button variant="tonal" onClick={() => open(pasted)}>
            Import
          </Button>
          {result && !result.ok ? (
            <Typography variant="bodyMedium" color="error">
              {result.error}
            </Typography>
          ) : null}
          {result?.ok ? (
            <View>
              <Typography variant="titleSmall">Imported</Typography>
              <Typography variant="bodySmall" color="onSurfaceVariant">
                {result.notes.length > 0
                  ? result.notes.join("\n")
                  : "Nothing to repair."}
              </Typography>
            </View>
          ) : null}
        </View>
      ) : null}
    </Dialog>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    section: { gap: theme.spacing.s, paddingTop: theme.spacing.m },
    preview: { height: 480, marginTop: theme.spacing.m },
  });
