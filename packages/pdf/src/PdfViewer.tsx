import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  FlatList,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from "react-native";
import { Banner, CircularProgress, EmptyState, useTheme } from "@its/glowup-ui";
import { usePdfAdapters } from "./PdfProvider";
import PdfPage, { type PdfHighlight } from "./PdfPage";
import { PdfSearchPanel, PdfToolbar } from "./PdfToolbar";
import { toPdfError } from "./errors";
import { usableSize } from "./pageGeometry";
import { createRenderQueue } from "./renderQueue";
import { mergeMatches, startSearch, type SearchRun } from "./searchDocument";
import { fillLabel, withDefaultLabels } from "./labels";
import { resolveSource, sourceKey, type ResolvedFile } from "./source";
import { PinchController, type Point } from "./pinch";
import { GAP, MAX_ZOOM, MIN_ZOOM, stepZoom } from "./zoom";
import type { PdfError, PdfMatch, PdfPageSize, PdfViewerProps } from "./types";

/** A page drawn wider than this would fill the memory for no gain on a phone. */
const MAX_RENDER_WIDTH = 2400;
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
  /** Pages searched so far. */
  done: number;
};

const idleSearch: Search = {
  open: false,
  query: "",
  searching: false,
  searched: false,
  matches: [],
  cursor: 0,
  done: 0,
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
  const [downloaded, setDownloaded] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const abort = new AbortController();
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
        file = await resolveSource(sourceRef.current, files, {
          signal: abort.signal,
          onProgress: (fraction) => {
            if (!cancelled) setDownloaded(fraction);
          },
        });
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
      abort.abort();
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

  const [zoom, setZoom] = useState(MIN_ZOOM);
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
  const horizontalRef = useRef<ScrollView>(null);

  // Zoom. A pinch scales what is drawn while the fingers are down (`pinch.live`, about the point between them)
  // and, once they lift, asks for the new zoom: the pages are laid out and drawn again at that width, and the scroll
  // position is set so that what was under the fingers is still there (zoom.ts has the arithmetic, pinch.ts the gesture).
  const [pinch] = useState(() => new PinchController());
  const [pinching, setPinching] = useState(false);
  const applyZoom = useCallback(
    (next: number, focus: Point) => {
      const to = pinch.plan(next, focus);
      if (to === null) return false;
      setZoom(to);
      return true;
    },
    [pinch],
  );
  useEffect(() => {
    pinch.sync(zoom, layout, setPinching, applyZoom);
  }, [pinch, zoom, layout, applyZoom]);
  useEffect(() => {
    const to = pinch.settle(layout);
    if (!to) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: Math.max(0, to.y),
        animated: false,
      });
      horizontalRef.current?.scrollTo({ x: to.x, animated: false });
    });
  }, [zoom, layout, pinch]);
  const [page, setPage] = useState(() =>
    Math.max(1, Math.floor(initialPage) || 1),
  );
  const lastReported = useRef(page);
  // The drawings wait in a queue that serves the page being read first (see renderQueue.ts).
  const queue = useMemo(
    () => (uri ? createRenderQueue(native, uri) : null),
    [native, uri],
  );
  useEffect(() => queue?.reading(page), [queue, page]);
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
  const [notice, setNotice] = useState<string | null>(null);

  // The search in progress: it goes page by page and can be stopped between two (see searchDocument.ts).
  const searchRun = useRef<SearchRun | null>(null);
  const stopSearch = () => {
    searchRun.current?.cancel();
    searchRun.current = null;
  };

  const runSearch = (query: string) => {
    stopSearch();
    const text = query.trim();
    const none = {
      searching: false,
      searched: false,
      matches: [],
      cursor: 0,
      done: 0,
    };
    if (!uri || !text || pageCount === 0) {
      setSearch((s) => ({ ...s, ...none }));
      return;
    }
    setSearch((s) => ({ ...s, ...none, searching: true }));
    // The first hit found, which is the nearest one ahead of the page being read, is where the viewer goes.
    let first = true;
    const run = startSearch(native, uri, text, pageCount, page - 1, {
      // A viewer that is gone stops its own search: a ref cannot be read in the effect that sees it go.
      found: (added) => {
        if (!alive.current) return run.cancel();
        setSearch((s) => ({
          ...s,
          ...mergeMatches(
            s.matches,
            added,
            s.matches.length > 0 ? s.cursor : -1,
          ),
        }));
        if (first) {
          first = false;
          goToPage(added[0].page + 1);
        }
      },
      progress: (done) => {
        if (!alive.current) return run.cancel();
        setSearch((s) => ({ ...s, done }));
      },
    });
    searchRun.current = run;
    run.finished.then(
      () => {
        if (!alive.current || searchRun.current !== run) return;
        searchRun.current = null;
        setSearch((s) => ({ ...s, searching: false, searched: true }));
      },
      (caught) => {
        if (!alive.current || searchRun.current !== run) return;
        searchRun.current = null;
        setSearch((s) => ({ ...s, searching: false }));
        setActionError(toPdfError(caught, "unsupported"));
      },
    );
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
    setNotice(null);
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
        <CircularProgress
          accessibilityLabel={labels.loading}
          progress={downloaded ?? undefined}
        />
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
  } else if (pages && uri && queue) {
    const list = (
      <FlatList
        ref={listRef}
        data={pages.map((_, i) => i)}
        keyExtractor={(i) => String(i)}
        style={zoom > 1 ? { width: pageWidth + PAD * 2 } : undefined}
        scrollEnabled={!pinching}
        // Android: a list inside a scrolling page (a detail screen) keeps its own touches only with this.
        nestedScrollEnabled
        scrollEventThrottle={16}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          pinch.scroll("y", e.nativeEvent.contentOffset.y);
        }}
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
              index={i}
              size={pages[i]}
              width={pageWidth}
              renderWidth={renderWidth}
              queue={queue}
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
    const content =
      zoom > 1 ? (
        <ScrollView
          ref={horizontalRef}
          horizontal
          style={styles.fill}
          scrollEnabled={!pinching}
          nestedScrollEnabled
          scrollEventThrottle={16}
          onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
            pinch.scroll("x", e.nativeEvent.contentOffset.x);
          }}
        >
          {list}
        </ScrollView>
      ) : (
        list
      );
    body = (
      <View
        ref={(node) => pinch.attach(node)}
        onLayout={(e: LayoutChangeEvent) =>
          pinch.resize(e.nativeEvent.layout.width, e.nativeEvent.layout.height)
        }
        style={styles.clip}
        {...pinch.responder.panHandlers}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              transform: [
                { translateX: pinch.live.x },
                { translateY: pinch.live.y },
                { scale: pinch.live.scale },
              ],
            },
          ]}
        >
          {content}
        </Animated.View>
      </View>
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
          canZoomIn={zoom < MAX_ZOOM - 0.005}
          canZoomOut={zoom > MIN_ZOOM + 0.005}
          canSearch={canSearch}
          searchOpen={search.open}
          onGoToPage={goToPage}
          onZoomIn={() => applyZoom(stepZoom(zoom, 1), pinch.center())}
          onZoomOut={() => applyZoom(stepZoom(zoom, -1), pinch.center())}
          onFitWidth={() => applyZoom(MIN_ZOOM, pinch.center())}
          onToggleSearch={() => {
            stopSearch();
            setSearch((s) => ({
              ...idleSearch,
              query: s.query,
              open: !s.open,
            }));
          }}
          onPrint={() => uri && act(() => actions.print(uri, fileName))}
          onSave={() =>
            uri &&
            act(async () => {
              const where = await actions.save(uri, fileName);
              if (alive.current && where === "downloads") {
                setNotice(labels.savedToDownloads);
              }
            })
          }
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
          done={search.done}
          pages={pageCount}
          onChangeQuery={(query) => {
            if (query === "") stopSearch();
            setSearch((s) => ({
              ...s,
              query,
              ...(query === ""
                ? {
                    searching: false,
                    searched: false,
                    matches: [],
                    cursor: 0,
                    done: 0,
                  }
                : {}),
            }));
          }}
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
      <Banner
        visible={!!notice}
        type="info"
        message={notice ?? ""}
        dismissable
        onDismiss={() => setNotice(null)}
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
  clip: { flex: 1, overflow: "hidden" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 16,
  },
});
