import { StyleSheet } from "react-native";
import { router } from "expo-router";
import { EmptyState, ScrollArea } from "@its/glowup-ui";
import { PageHead } from "../site/Page";

/**
 * Rendered for any URL the site does not have a route for. GitHub Pages serves
 * a static 404.html for unknown paths, and expo-router's static export writes
 * this route out as that file.
 */
export default function NotFound() {
  return (
    <ScrollArea style={styles.fill} contentContainerStyle={styles.page}>
      <PageHead
        title="Page not found"
        description="This page does not exist on the Glowup documentation site."
      />
      <EmptyState
        icon="compass-off-outline"
        title="Page not found"
        description="That URL is not part of the documentation."
        action={{
          label: "Back to the overview",
          iconName: "home-outline",
          onPress: () => router.replace("/"),
        }}
      />
    </ScrollArea>
  );
}

const styles = StyleSheet.create({
  // What a ScrollView does by itself, for the `ScrollArea` view around it.
  fill: { flexGrow: 1, flexShrink: 1 },
  page: { flexGrow: 1, justifyContent: "center", padding: 24 },
});
