import { Slot, usePathname } from "expo-router";
import { StyleSheet, View } from "react-native";
import { CatalogueSidebar } from "../../site/CatalogueSidebar";
import { useLayout } from "../../site/breakpoints";

/**
 * Layout for the component reference. The catalogue list is mounted here, not
 * inside the pages, so it keeps its scroll position and its filter while the
 * reader moves from one component to the next.
 *
 * It is hidden on the section's own index — that page IS the catalogue, in grid
 * form — and below `expanded`, where 248dp of list would leave nothing for the
 * component being documented.
 */
export default function ComponentsLayout() {
  const { hasSidebar } = useLayout();
  const pathname = usePathname();
  const isIndex = pathname === "/components" || pathname === "/components/";

  return (
    <View style={styles.row}>
      {hasSidebar && !isIndex && <CatalogueSidebar />}
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: "row" },
  content: { flex: 1 },
});
