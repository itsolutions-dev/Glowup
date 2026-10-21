import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type ViewToken,
} from "react-native";
import { Banner, CircularProgress, EmptyState, useTheme } from "@its/glowup-ui";
import { usePdfAdapters } from "./PdfProvider";
import PdfPage, { type PdfHighlight } from "./PdfPage";
import { PdfSearchPanel, PdfToolbar } from "./PdfToolbar";
import { toPdfError } from "./errors";
import { usableSize } from "./pageGeometry";
import { fillLabel, withDefaultLabels } from "./labels";
import { resolveSource, sourceKey, type ResolvedFile } from "./source";
import type { PdfError, PdfMatch, PdfPageSize, PdfViewerProps } from "./types";

const ZOOMS = [1, 1.25, 1.5, 2, 3];
/** A page drawn wider than this would fill the memory for no gain on a phone. */
const MAX_RENDER_WIDTH = 2400;
const GAP = 12;
const PAD = 12;

type Loaded =
  | { pages: PdfPageSize[]; uri: string; error?: undefined }
  | { error: PdfError };

type Search = {
  open: boolean;
  query: string;
  searching: boolean;
  searched: boolean;
  matches: PdfMatch[];
  cursor: number;
};

const idleSearch: Search = {
  open: false,
  query: "",
  searching: false,
  searched: false,
  matches: [],
  cursor: 0,
};

/** A user closing the print or share sheet is not a failure to report. */
const isCancellation = (error: unknown) =>
  /cancel|did not complete|dismiss/i.test(
    error instanceof Error ? error.message : String(error),
  );

type DocumentProps = PdfViewerProps & { onRetry: () => void };

const PdfDocument = ({
  source,
  fileName,
  initialPage = 1,
  onLoad,
  onError,
  onPageChange,
  toolbar = true,
  labels: labelOverrides,
  style,
  onRetry,
}: DocumentProps) => {
  const { theme } = useTheme();
  const { native, files, actions } = usePdfAdapters();
  const labels = useMemo(
    () => withDefaultLabels(labelOverrides),
    [labelOverrides],
  );

  // The source the viewer was mounted with: a new one remounts it (see PdfViewer).
  const sourceRef = useRef(source);
  const callbacks = useRef({ onLoad, onError, onPageChange });
  useEffect(() => {
    callbacks.current = { onLoad, onError, onPageChange };
  });
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [canSearch, setCanSearch] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let file: ResolvedFile | null = null;
    let released = false;
    const release = () => {
      if (!file || released) return;
      released = true;
      native.close(file.uri).catch(() => {});
      if (file.temporary) files.remove(file.uri).catch(() => {});
    };
    (async () => {
      try {
        file = await resolveSource(sourceRef.current, files);
        if (cancelled) return release();
        const document = await native.open(file.uri);
        if (cancelled) return release();
        setLoaded({ uri: file.uri, pages: document.pages.map(usableSize) });
        callbacks.current.onLoad?.({ pages: document.pages.length });
      } catch (caught) {
        release();
        if (cancelled) return;
        const error = toPdfError(caught, "unsupported");
        setLoaded({ error });
        callbacks.current.onError?.(error);
      }
    })();
    return () => {
      cancelled = true;
      release();
    };
  }, [native, files]);

  useEffect(() => {
    let cancelled = false;
    native
      .capabilities()
      .then((c) => {
        if (!cancelled) setCanSearch(c.search);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [native]);

  const window = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(window.width);
  const onLayout = (event: LayoutChangeEvent) =>
    setContainerWidth(event.nativeEvent.layout.width);

  const pages = loaded && !loaded.error ? loaded.pages : null;
  const uri = loaded && !loaded.error ? loaded.uri : null;
  const pageCount = pages?.length ?? 0;

  const [zoomIndex, setZoomIndex] = useState(0);
  const zoom = ZOOMS[zoomIndex];
  const pageWidth = Math.max(1, (containerWidth - PAD * 2) * zoom);
  const renderWidth = Math.min(
    MAX_RENDER_WIDTH,
    Math.round(pageWidth * PixelRatio.get()),
  );

  // Page heights are known from the sizes, so the list can jump to any page without drawing the ones before it.
  const layout = useMemo(() => {
    const offsets: number[] = [];
    const lengths: number[] = [];
    let top = PAD;
    (pages ?? []).forEach((size) => {
      const length = (pageWidth * size.height) / size.width + GAP;
      offsets.push(top);
      lengths.push(length);
      top += length;
    });
    return { offsets, lengths };
  }, [pages, pageWidth]);

  const listRef = useRef<FlatList<number>>(null);
  const [page, setPage] = useState(() =>
    Math.max(1, Math.floor(initialPage) || 1),
  );
  const lastReported = useRef(page);
  const pageHandler = useRef<(next: number) => void>(() => {});
  useEffect(() => {
    pageHandler.current = (next) => {
      setPage(next);
      if (next !== lastReported.current) {
        lastReported.current = next;
        callbacks.current.onPageChange?.(next, pageCount);
      }
    };
  });
  // FlatList wants both to stay the same object for the life of the list.
  const [viewability] = useState({ itemVisiblePercentThreshold: 50 });
  const [onViewable] = useState(
    () =>
      ({ viewableItems }: { viewableItems: ViewToken[] }) => {
        const first = viewableItems.find((v) => v.isViewable)?.index;
        if (first != null) pageHandler.current(first + 1);
      },
  );

  const goToPage = useCallback(
    (target: number) => {
      if (pageCount === 0) return;
      const next = Math.min(Math.max(1, Math.round(target)), pageCount);
      pageHandler.current(next);
      listRef.current?.scrollToIndex({ index: next - 1, animated: false });
    },
    [pageCount],
  );

  const [search, setSearch] = useState<Search>(idleSearch);
  const [actionError, setActionError] = useState<PdfError | null>(null);

  const runSearch = async (query: string) => {
    const text = query.trim();
    if (!uri || !text) {
      setSearch((s) => ({ ...s, searched: false, matches: [], cursor: 0 }));
      return;
    }
    setSearch((s) => ({ ...s, searching: true }));
    try {
      const matches = await native.search(uri, text);
      if (!alive.current) return;
      setSearch((s) => ({
        ...s,
        searching: false,
        searched: true,
        matches,
        cursor: 0,
      }));
      if (matches[0]) goToPage(matches[0].page + 1);
    } catch (caught) {
      if (!alive.current) return;
      setSearch((s) => ({ ...s, searching: false }));
      setActionError(toPdfError(caught, "unsupported"));
    }
  };

  const moveResult = (delta: number) => {
    const total = search.matches.length;
    if (total === 0) return;
    const next = (search.cursor + delta + total) % total;
    setSearch((s) => ({ ...s, cursor: next }));
    goToPage(search.matches[next].page + 1);
  };

  const highlights = useMemo(() => {
    const byPage = new Map<number, PdfHighlight[]>();
    search.matches.forEach((match, i) => {
      const list = byPage.get(match.page) ?? [];
      match.rects.forEach((rect) =>
        list.push({ rect, current: i === search.cursor }),
      );
      byPage.set(match.page, list);
    });
    return byPage;
  }, [search.matches, search.cursor]);

  const act = async (task: () => Promise<void>) => {
    setActionError(null);
    try {
      await task();
    } catch (caught) {
      if (alive.current && !isCancellation(caught)) {
        setActionError(toPdfError(caught, "unsupported"));
      }
    }
  };

  const colors = theme.colors;
  let body: React.ReactNode;
  if (!loaded) {
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
  } else if (loaded.error) {
    body = (
      <View style={styles.center}>
        <EmptyState
          icon="file-alert-outline"
          title={labels.errorTitle}
          description={labels.errors[loaded.error.code]}
          action={{ label: labels.retry, onPress: onRetry }}
        />
      </View>
    );
  } else if (pages && uri) {
    const list = (
      <FlatList
        ref={listRef}
        data={pages.map((_, i) => i)}
        keyExtractor={(i) => String(i)}
        style={zoom > 1 ? { width: pageWidth + PAD * 2 } : undefined}
        contentContainerStyle={{ paddingTop: PAD, paddingHorizontal: PAD }}
        getItemLayout={(_, i) => ({
          index: i,
          length: layout.lengths[i],
          offset: layout.offsets[i],
        })}
        initialScrollIndex={Math.min(page, pageCount) - 1}
        onScrollToIndexFailed={({ index }) =>
          listRef.current?.scrollToOffset({
            offset: layout.offsets[index] ?? 0,
            animated: false,
          })
        }
        windowSize={5}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={viewability}
        extraData={`${renderWidth}|${search.cursor}|${search.matches.length}`}
        renderItem={({ item: i }) => (
          <View style={{ marginBottom: GAP }}>
            <PdfPage
              uri={uri}
              index={i}
              size={pages[i]}
              width={pageWidth}
              renderWidth={renderWidth}
              native={native}
              highlights={highlights.get(i) ?? []}
              highlightColor={colors.primary}
              failedLabel={labels.pageFailed}
              accessibilityLabel={`${labels.page} ${fillLabel(labels.pageOf, {
                page: i + 1,
                pages: pageCount,
              })}`}
            />
          </View>
        )}
      />
    );
    body =
      zoom > 1 ? (
        <ScrollView horizontal style={styles.fill}>
          {list}
        </ScrollView>
      ) : (
        list
      );
  }

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.fill,
        { backgroundColor: colors.surfaceContainerHigh },
        style,
      ]}
    >
      {toolbar && pages ? (
        <PdfToolbar
          labels={labels}
          page={Math.min(page, pageCount)}
          pages={pageCount}
          zoom={zoom}
          canZoomIn={zoomIndex < ZOOMS.length - 1}
          canZoomOut={zoomIndex > 0}
          canSearch={canSearch}
          searchOpen={search.open}
          onGoToPage={goToPage}
          onZoomIn={() =>
            setZoomIndex((i) => Math.min(i + 1, ZOOMS.length - 1))
          }
          onZoomOut={() => setZoomIndex((i) => Math.max(i - 1, 0))}
          onFitWidth={() => setZoomIndex(0)}
          onToggleSearch={() =>
            setSearch((s) => ({ ...idleSearch, query: s.query, open: !s.open }))
          }
          onPrint={() => uri && act(() => actions.print(uri, fileName))}
          onSave={() => uri && act(() => actions.save(uri, fileName))}
        />
      ) : null}
      {toolbar && pages && canSearch && search.open ? (
        <PdfSearchPanel
          labels={labels}
          query={search.query}
          total={search.matches.length}
          current={search.cursor}
          searched={search.searched}
          searching={search.searching}
          onChangeQuery={(query) =>
            setSearch((s) => ({
              ...s,
              query,
              ...(query === ""
                ? { searched: false, matches: [], cursor: 0 }
                : {}),
            }))
          }
          onSubmit={runSearch}
          onPrevious={() => moveResult(-1)}
          onNext={() => moveResult(1)}
        />
      ) : null}
      <Banner
        visible={!!actionError}
        type="error"
        message={
          actionError
            ? `${labels.actionFailed}. ${labels.errors[actionError.code]}`
            : ""
        }
        dismissable
        onDismiss={() => setActionError(null)}
      />
      {body}
    </View>
  );
};

/**
 * Shows a PDF inside the app. A new `source` (by content) or a retry opens it again
 * from scratch: the document, the search and the zoom all belong to one source.
 */
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 16,
  },
});
