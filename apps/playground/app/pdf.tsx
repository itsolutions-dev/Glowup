import { useMemo, useState } from "react";
import { View } from "react-native";
import {
  Banner,
  Button,
  Input,
  Paper,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";
import { PdfViewer, type PdfSource } from "@its/glowup-pdf";

import { CodeBlock } from "../site/CodeBlock";
import { Page, Section } from "../site/Page";
import { samplePdf } from "../site/samplePdf";

const INSTALL = `npx expo install @its/glowup-pdf expo-file-system expo-print expo-sharing`;

const USAGE = `import { PdfViewer } from "@its/glowup-pdf";

// A file behind a login: the viewer sends the headers, keeps the copy in the cache and removes it
<PdfViewer
  source={{ uri: "https://crm.example.com/files/42.pdf", headers: { Authorization: \`Bearer \${token}\` } }}
  fileName="contract-42.pdf"
  onError={(error) => report(error.code)}
/>

// Already in memory
<PdfViewer source={{ base64 }} />
<PdfViewer source={{ bytes }} />`;

/** The PDF of the live viewer, and the form that points it at another one. */
const Demo = () => {
  const { theme } = useTheme();
  const sample = useMemo<PdfSource>(() => ({ bytes: samplePdf() }), []);
  const [source, setSource] = useState<PdfSource>(sample);
  const [url, setUrl] = useState("");
  const [authorization, setAuthorization] = useState("");

  return (
    <VStack spacing={16}>
      <Paper
        style={{
          height: 560,
          overflow: "hidden",
          borderRadius: 12,
          backgroundColor: theme.colors.surfaceContainerHigh,
        }}
      >
        <PdfViewer source={source} fileName="sample.pdf" />
      </Paper>
      <Input
        label="Address of a PDF"
        placeholder="https://…/file.pdf"
        value={url}
        onChange={setUrl}
      />
      <Input
        label="Authorization header (optional)"
        placeholder="Bearer …"
        value={authorization}
        onChange={setAuthorization}
      />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Button
          variant="filled"
          disabled={url.trim() === ""}
          onClick={() =>
            setSource({
              uri: url.trim(),
              headers: authorization.trim()
                ? { Authorization: authorization.trim() }
                : undefined,
            })
          }
        >
          Open the address
        </Button>
        <Button variant="outlined" onClick={() => setSource(sample)}>
          Back to the sample
        </Button>
      </View>
    </VStack>
  );
};

export default function PdfPage() {
  return (
    <Page
      eyebrow="Companion package"
      title="PDF"
      description="@its/glowup-pdf shows a PDF inside the app, with no third-party library: the browser's own viewer on the web, and a small native module over PDFKit (iOS) and PdfRenderer (Android) on a phone. This page is not published yet."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message="On a phone the viewer draws the pages itself, with page by page search, two-finger zoom, print and save (Android saves to Downloads). On the web it is the browser's viewer, with its own search, print and download. A phone's browser shows little of a PDF in a page: use “Open in a new tab”."
        />
      }
    >
      <Section
        title="Live"
        description="A three-page document built in code. Point the viewer at any address, with an Authorization header if the file is behind a login."
      >
        <Demo />
      </Section>
      <Section
        title="Use it"
        description="The viewer downloads the file when it needs the headers, keeps a copy in the cache, and removes it when it closes."
      >
        <CodeBlock code={INSTALL} language="bash" title="Terminal" />
        <CodeBlock code={USAGE} title="Screen.tsx" />
        <Typography variant="bodyMedium">
          The prop reference is in packages/pdf/README.md until the generator
          covers this package.
        </Typography>
      </Section>
    </Page>
  );
}
