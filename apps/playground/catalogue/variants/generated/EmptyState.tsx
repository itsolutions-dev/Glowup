// GENERATED — do not edit.
// Source: .design-sync/previews/EmptyState.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { EmptyState } from "@its/glowup-ui";

const frame: ViewStyle = { width: 400 };

const noop = () => {};

export const NoProjects = () => (
  <View style={frame}>
    <EmptyState
      icon="folder-multiple-outline"
      title="No projects yet"
      description="Create your first project to start collecting components, tokens and screens in one place."
      action={{ label: "New project", iconName: "plus", onPress: noop }}
    />
  </View>
);

export const NoSearchResults = () => (
  <View style={frame}>
    <EmptyState
      icon="file-search-outline"
      title="No results for “invoice 2043”"
      description="Check the spelling or try a broader search — we looked through 1,204 documents."
    />
  </View>
);

export const ConnectionLost = () => (
  <View style={frame}>
    <EmptyState
      icon="cloud-off-outline"
      title="You’re offline"
      description="We couldn’t reach the sync service. Your latest edits are saved locally."
      action={{ label: "Try again", iconName: "refresh", onPress: noop }}
    />
  </View>
);

export const InboxCleared = () => (
  <View style={frame}>
    <EmptyState
      icon="check-circle-outline"
      title="Inbox zero"
      description="Nothing needs your attention. New review requests will land here."
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "NoProjects",
    title: "No projects",
    render: NoProjects,
  },
  {
    name: "NoSearchResults",
    title: "No search results",
    render: NoSearchResults,
  },
  {
    name: "ConnectionLost",
    title: "Connection lost",
    render: ConnectionLost,
  },
  {
    name: "InboxCleared",
    title: "Inbox cleared",
    render: InboxCleared,
  },
];
