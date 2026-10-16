import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Pdf from "react-native-pdf";
import ReactNativeBlobUtil from "react-native-blob-util";

import { SAMPLE_PDF_BASE64 } from "./samplePdf";

/**
 * Spike 0.3 (native): react-native-pdf with a base64 data URI, an authenticated
 * URL (headers on the source), an unauthenticated URL (must fail) and the
 * download-to-a-file-with-headers route through react-native-blob-util that the
 * plan (Phase 6) suggests. Results on screen and as `SPIKE03 …` log lines.
 */
const BASE = `http://${process.env.EXPO_PUBLIC_PDF_SPIKE_HOST ?? "localhost"}:8100/doc.pdf`;
const AUTH = { Authorization: "Bearer spike-token" };

type Results = Record<string, string>;

export default function PdfSpike() {
  const [results, setResults] = useState<Results>({});
  const [filePath, setFilePath] = useState<string | null>(null);

  const report = (id: string, text: string) => {
    // eslint-disable-next-line no-console
    console.log(`SPIKE03 ${id}: ${text}`);
    setResults((r) => ({ ...r, [id]: text }));
  };
  const loaded = (id: string) => (pages: number) =>
    report(id, `ok, ${pages} pages`);
  const failed = (id: string) => (e: unknown) =>
    report(id, `ERROR ${String((e as Error)?.message ?? e)}`);

  useEffect(() => {
    ReactNativeBlobUtil.config({ fileCache: true, appendExt: "pdf" })
      .fetch("GET", BASE, AUTH)
      .then((res) => {
        const status = res.info().status;
        report("download", `http ${status}, file ${res.path()}`);
        if (status === 200) setFilePath(res.path());
      })
      .catch(failed("download"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cases: { id: string; source: object | null }[] = [
    {
      id: "base64",
      source: { uri: `data:application/pdf;base64,${SAMPLE_PDF_BASE64}` },
    },
    { id: "auth", source: { uri: BASE, headers: AUTH, cache: false } },
    { id: "noauth", source: { uri: BASE, cache: false } },
    { id: "file", source: filePath ? { uri: filePath } : null },
  ];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 8, gap: 6 }}
    >
      <Text style={{ fontSize: 11, fontWeight: "700" }}>SPIKE03 {BASE}</Text>
      <Text style={{ fontSize: 11 }}>
        download: {results.download ?? "..."}
      </Text>
      {cases.map((c) => (
        <View key={c.id}>
          <Text style={{ fontSize: 11 }}>
            {c.id}: {results[c.id] ?? "..."}
          </Text>
          {c.source && (
            <Pdf
              source={c.source as never}
              style={{ height: 120, width: "100%" }}
              onLoadComplete={loaded(c.id)}
              onError={failed(c.id)}
            />
          )}
        </View>
      ))}
    </ScrollView>
  );
}
