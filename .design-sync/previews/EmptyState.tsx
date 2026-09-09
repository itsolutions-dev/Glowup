import React from "react";
import { EmptyState } from "@glowup/ui";

const frame: React.CSSProperties = { display: "flex", width: 400 };

const noop = () => {};

export const NoProjects = () => (
  <div style={frame}>
    <EmptyState
      icon="folder-multiple-outline"
      title="No projects yet"
      description="Create your first project to start collecting components, tokens and screens in one place."
      action={{ label: "New project", iconName: "plus", onPress: noop }}
    />
  </div>
);

export const NoSearchResults = () => (
  <div style={frame}>
    <EmptyState
      icon="file-search-outline"
      title="No results for “invoice 2043”"
      description="Check the spelling or try a broader search — we looked through 1,204 documents."
    />
  </div>
);

export const ConnectionLost = () => (
  <div style={frame}>
    <EmptyState
      icon="cloud-off-outline"
      title="You’re offline"
      description="We couldn’t reach the sync service. Your latest edits are saved locally."
      action={{ label: "Try again", iconName: "refresh", onPress: noop }}
    />
  </div>
);

export const InboxCleared = () => (
  <div style={frame}>
    <EmptyState
      icon="check-circle-outline"
      title="Inbox zero"
      description="Nothing needs your attention. New review requests will land here."
    />
  </div>
);
