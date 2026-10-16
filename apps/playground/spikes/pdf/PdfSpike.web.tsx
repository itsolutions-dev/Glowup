import { createElement, useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import * as pdfjs from "pdfjs-dist";

import { SAMPLE_PDF_BASE64 } from "./samplePdf";

/**
 * Spike 0.3 (web): pdfjs-dist on a canvas, from base64 and from a URL that
 * needs a bearer token (fetched with the header, then handed over as bytes).
 */
const BASE = "http://localhost:8100/doc.pdf";
const AUTH = { Authorization: "Bearer spike-token" };

// The worker is copied to public/ for the test (not committed).
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const fromBase64 = (b64: string) =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

const getBytes = async (headers?: Record<string, string>) => {
  const res = await fetch(BASE, { headers });
  if (!res.ok) throw new Error(`http ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
};

const PdfCanvas = ({
  id,
  load,
  report,
}: {
  id: string;
  load: () => Promise<Uint8Array>;
  report: (id: string, t: string) => void;
}) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const doc = await pdfjs.getDocument({ data: await load() }).promise;
        const page = await doc.getPage(1);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = ref.current!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, viewport }).promise;
        report(
          id,
          `ok, ${doc.numPages} pages, rendered ${Math.round(viewport.width)}x${Math.round(viewport.height)}`,
        );
      } catch (e) {
        report(id, `ERROR ${(e as Error).message}`);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return createElement("canvas", { ref, style: { border: "1px solid #888" } });
};

export default function PdfSpike() {
  const [results, setResults] = useState<Record<string, string>>({});
  const report = (id: string, text: string) => {
    // eslint-disable-next-line no-console
    console.log(`SPIKE03 ${id}: ${text}`);
    setResults((r) => ({ ...r, [id]: text }));
  };
  const cases = [
    { id: "base64", load: async () => fromBase64(SAMPLE_PDF_BASE64) },
    { id: "auth", load: () => getBytes(AUTH) },
    { id: "noauth", load: () => getBytes() },
  ];
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 8, gap: 6 }}
    >
      <Text style={{ fontWeight: "700" }}>SPIKE03 web {BASE}</Text>
      {cases.map((c) => (
        <View key={c.id}>
          <Text>
            {c.id}: {results[c.id] ?? "..."}
          </Text>
          <PdfCanvas id={c.id} load={c.load} report={report} />
        </View>
      ))}
    </ScrollView>
  );
}
