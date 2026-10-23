import { useState } from "react";
import {
  Avatar,
  Box,
  CaptionValue,
  ListItem,
  TabContent,
  Tabs,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";

export default function TabContentExample() {
  const { theme } = useTheme();
  const [tab, setTab] = useState(0);

  return (
    <Box
      background="surface"
      radius="large"
      borderWidth={1}
      borderColor="outlineVariant"
      height={360}
      width="100%"
      style={{ maxWidth: 480, alignSelf: "center", overflow: "hidden" }}
    >
      <Typography variant="titleMedium" style={{ padding: theme.spacing.m }}>
        Trail runner X2
      </Typography>
      <Tabs
        tabs={["Details", "Specs", "Reviews"]}
        activeTab={tab}
        onChange={setTab}
      />
      {/* One child per tab: only the active one is mounted. */}
      <TabContent activeTab={tab}>
        <Typography variant="bodyMedium">
          A light shoe for long days on rough ground, with a grippy sole and a
          breathable upper that dries fast after a river crossing.
        </Typography>
        <VStack spacing="m">
          <CaptionValue caption="Weight" value="280 g" />
          <CaptionValue caption="Drop" value="6 mm" />
          <CaptionValue caption="Sole" value="Rubber, 4 mm lugs" />
        </VStack>
        <VStack>
          <ListItem
            icon={<Avatar name="Priya Nair" size="small" />}
            primaryText="Priya Nair"
            secondaryText="Grippy on wet rock, true to size."
            action={<Typography variant="labelLarge">5.0</Typography>}
          />
          <ListItem
            icon={<Avatar name="Jonas Weber" size="small" />}
            primaryText="Jonas Weber"
            secondaryText="A bit narrow for me."
            action={<Typography variant="labelLarge">3.5</Typography>}
          />
        </VStack>
      </TabContent>
    </Box>
  );
}
