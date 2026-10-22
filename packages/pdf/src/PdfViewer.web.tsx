// The web viewer: the browser's own PDF viewer in an iframe, with all it has (search,
// print, download, thumbnails). Phones' browsers show little of a PDF in a page, so the
// bar always offers to open it in a tab. Needs no native module and no library.
import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  CircularProgress,
  EmptyState,
  IconButton,
  useTheme,
} from "@its/glowup-ui";
import { toPdfError } from "./errors";
import { withDefaultLabels } from "./labels";
import { sourceKey } from "./source";
import type { PdfError, PdfViewerProps } from "./types";
import { loadPdfBlob } from "./webSource";

type State = { url: string } | { error: PdfError } | null;

type DocumentProps = PdfViewerProps & { onRetry: () => void };

/** Takes the hidden print frame away, if there is one (and a document to look in: tests have none). */
const removePrintFrame = (id: string) => {
  try {
    document.getElementById(id)?.remove();
  } catch {
    // Nothing to remove.
  }
};

const PdfDocument = ({
  source,
  fileName,
  initialPage = 1,
  onLoad,
  onError,
  toolbar = true,
  labels: labelOverrides,
  style,
  onRetry,
}: DocumentProps) => {
  const { theme } = useTheme();
  const labels = useMemo(
    () => withDefaultLabels(labelOverrides),
    [labelOverrides],
  );
  const sourceRef = useRef(source);
  const callbacks = useRef({ onLoad, onError });
  useEffect(() => {
    callbacks.current = { onLoad, onError };
  });
  const [state, setState] = useState<State>(null);
  const printFrameId = useId();

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    loadPdfBlob(sourceRef.current)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setState({ url });
        callbacks.current.onLoad?.({ pages: null });
      })
      .catch((caught) => {
        if (cancelled) return;
        const error = toPdfError(caught, "unsupported");
        setState({ error });
        callbacks.current.onError?.(error);
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
      removePrintFrame(printFrameId);
    };
  }, [printFrameId]);

  const colors = theme.colors;
  const url = state && "url" in state ? state.url : null;

  let body: React.ReactNode;
  if (!state) {
    body = (
      <View style={styles.center}>
        <CircularProgress accessibilityLabel={labels.loading} />
        <Text
          style={[
            theme.typography.bodyMedium,
            { color: colors.onSurfaceVariant },
          ]}
        >
          {labels.loading}
        </Text>
      </View>
    );
  } else if ("error" in state) {
    body = (
      <View style={styles.center}>
        <EmptyState
          icon="file-alert-outline"
          title={labels.errorTitle}
          description={labels.errors[state.error.code]}
          action={{ label: labels.retry, onPress: onRetry }}
        />
      </View>
    );
  } else {
    body = (
      <iframe
        title={fileName ?? labels.page}
        src={initialPage > 1 ? `${state.url}#page=${initialPage}` : state.url}
        style={{ flexGrow: 1, width: "100%", border: "none", minHeight: 0 }}
      />
    );
  }

  const openInTab = () => {
    if (url) window.open(url, "_blank", "noopener");
  };
  // The browser prints the page it is in, not the PDF in a frame of it: the PDF gets a frame of its own, out of
  // sight, and that frame is printed. Kept until the next print or the viewer's unmount (the dialog may still be open).
  const print = () => {
    if (!url) return;
    removePrintFrame(printFrameId);
    const frame = document.createElement("iframe");
    frame.id = printFrameId;
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText =
      "position:fixed;width:0;height:0;border:0;visibility:hidden";
    frame.onload = () => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch {
        // A browser that will not print a frame's PDF: its own viewer, in a tab, has the print button.
        openInTab();
      }
    };
    frame.src = url;
    document.body.appendChild(frame);
  };
  const download = () => {
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName ?? "document.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <View
      style={[
        styles.fill,
        { backgroundColor: colors.surfaceContainerHigh },
        style,
      ]}
    >
      {toolbar && url ? (
        <View
          style={[styles.bar, { backgroundColor: colors.surfaceContainerLow }]}
        >
          <IconButton
            icon="open-in-new"
            accessibilityLabel={labels.openInTab}
            onPress={openInTab}
          />
          <IconButton
            icon="printer-outline"
            accessibilityLabel={labels.print}
            onPress={print}
          />
          <IconButton
            icon="download-outline"
            accessibilityLabel={labels.save}
            onPress={download}
          />
        </View>
      ) : null}
      {body}
    </View>
  );
};

/** Shows a PDF in the page. A new source (by content) or a retry opens it again from scratch. */
const PdfViewer = (props: PdfViewerProps) => {
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  return (
    <PdfDocument
      key={`${sourceKey(props.source)}#${attempt}`}
      {...props}
      onRetry={retry}
    />
  );
};

export default PdfViewer;

const styles = StyleSheet.create({
  fill: { flex: 1 },
  bar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 4,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 16,
  },
});
