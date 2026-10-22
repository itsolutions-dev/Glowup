import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { IconButton, SearchBar, useTheme } from "@its/glowup-ui";
import { fillLabel } from "./labels";
import type { PdfLabels } from "./types";

type ToolbarProps = {
  labels: PdfLabels;
  page: number;
  pages: number;
  zoom: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  canSearch: boolean;
  searchOpen: boolean;
  onGoToPage: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onToggleSearch: () => void;
  onPrint: () => void;
  onSave: () => void;
};

/** Page, zoom, search, print and save. */
export const PdfToolbar = ({
  labels,
  page,
  pages,
  zoom,
  canZoomIn,
  canZoomOut,
  canSearch,
  searchOpen,
  onGoToPage,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onToggleSearch,
  onPrint,
  onSave,
}: ToolbarProps) => {
  const { theme } = useTheme();
  // The field shows what is being typed; it follows the page when it is not focused.
  const [typed, setTyped] = useState<string | null>(null);
  const submit = () => {
    const next = Number.parseInt(typed ?? "", 10);
    if (Number.isFinite(next)) onGoToPage(next);
    setTyped(null);
  };
  const textColor = { color: theme.colors.onSurface };

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.colors.surfaceContainerLow },
      ]}
    >
      <IconButton
        icon="chevron-up"
        accessibilityLabel={labels.previousPage}
        disabled={page <= 1}
        onPress={() => onGoToPage(page - 1)}
      />
      <TextInput
        accessibilityLabel={labels.goToPage}
        keyboardType="number-pad"
        value={typed ?? String(page)}
        onChangeText={setTyped}
        onSubmitEditing={submit}
        onBlur={() => setTyped(null)}
        selectTextOnFocus
        style={[
          styles.page,
          theme.typography.bodyMedium,
          textColor,
          { borderColor: theme.colors.outlineVariant },
        ]}
      />
      <Text style={[theme.typography.bodyMedium, textColor]}>
        {`/ ${pages}`}
      </Text>
      <IconButton
        icon="chevron-down"
        accessibilityLabel={labels.nextPage}
        disabled={page >= pages}
        onPress={() => onGoToPage(page + 1)}
      />
      <View style={styles.spacer} />
      <IconButton
        icon="magnify-minus-outline"
        accessibilityLabel={labels.zoomOut}
        disabled={!canZoomOut}
        onPress={onZoomOut}
      />
      <Text
        accessibilityLabel={`${Math.round(zoom * 100)}%`}
        style={[theme.typography.bodyMedium, textColor]}
      >
        {`${Math.round(zoom * 100)}%`}
      </Text>
      <IconButton
        icon="magnify-plus-outline"
        accessibilityLabel={labels.zoomIn}
        disabled={!canZoomIn}
        onPress={onZoomIn}
      />
      <IconButton
        icon="arrow-expand-horizontal"
        accessibilityLabel={labels.fitWidth}
        disabled={zoom === 1}
        onPress={onFitWidth}
      />
      {canSearch ? (
        <IconButton
          icon="magnify"
          accessibilityLabel={labels.search}
          selected={searchOpen}
          onPress={onToggleSearch}
        />
      ) : null}
      <IconButton
        icon="printer-outline"
        accessibilityLabel={labels.print}
        onPress={onPrint}
      />
      <IconButton
        icon="download-outline"
        accessibilityLabel={labels.save}
        onPress={onSave}
      />
    </View>
  );
};

type SearchPanelProps = {
  labels: PdfLabels;
  query: string;
  /** Hits found for the last search, and the one shown (0-based). */
  total: number;
  current: number;
  searched: boolean;
  searching: boolean;
  /** Pages searched so far, of `pages`. */
  done: number;
  pages: number;
  onChangeQuery: (query: string) => void;
  onSubmit: (query: string) => void;
  onPrevious: () => void;
  onNext: () => void;
};

export const PdfSearchPanel = ({
  labels,
  query,
  total,
  current,
  searched,
  searching,
  done,
  pages,
  onChangeQuery,
  onSubmit,
  onPrevious,
  onNext,
}: SearchPanelProps) => {
  const { theme } = useTheme();
  // Hits show as they are found (the count grows while the search goes on); before the first, the progress.
  const status =
    total > 0
      ? fillLabel(labels.searchResult, { current: current + 1, total })
      : searching
        ? fillLabel(labels.searching, { done, pages })
        : searched
          ? labels.noResults
          : "";
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.colors.surfaceContainerLow },
      ]}
    >
      <SearchBar
        value={query}
        onChangeText={onChangeQuery}
        onSubmit={onSubmit}
        onClear={() => onChangeQuery("")}
        placeholder={labels.searchPlaceholder}
        autoFocus
        style={styles.search}
      />
      <Text
        accessibilityLiveRegion="polite"
        style={[theme.typography.bodyMedium, { color: theme.colors.onSurface }]}
      >
        {status}
      </Text>
      <IconButton
        icon="chevron-up"
        accessibilityLabel={labels.previousResult}
        disabled={total === 0}
        onPress={onPrevious}
      />
      <IconButton
        icon="chevron-down"
        accessibilityLabel={labels.nextResult}
        disabled={total === 0}
        onPress={onNext}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    gap: 4,
  },
  spacer: { flexGrow: 1 },
  page: {
    minWidth: 44,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 0,
    textAlign: "center",
  },
  search: { flexGrow: 1, flexShrink: 1, minWidth: 160 },
});
