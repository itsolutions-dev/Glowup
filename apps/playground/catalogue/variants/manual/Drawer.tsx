import { useState } from "react";
import { View } from "react-native";
import { Button, Drawer, DrawerItem, DrawerSection } from "@its/glowup-ui";
import type { Variant } from "../types";
import { variants as generated } from "../generated/Drawer";
import { demo, useOverlayDemo } from "./shared";

// The static states are the authored preview's (../generated/Drawer). The
// swipeable one slides over the whole window on a scrim, so the preview cannot
// mount it open: here it starts closed and opens from a button, as in an app.

const FOLDERS = [
  { id: "inbox", label: "Inbox", icon: "inbox-outline", badge: 24 },
  { id: "sent", label: "Sent", icon: "send-outline" },
  { id: "drafts", label: "Drafts", icon: "file-outline", badge: 3 },
] as const;

const Swipeable = () => {
  const { open, show, hide } = useOverlayDemo();
  const [selected, setSelected] = useState<string>("inbox");

  return (
    <View style={demo.panel}>
      <Button variant="tonal" iconName="menu" onClick={show}>
        Open drawer
      </Button>
      <Drawer variant="swipeable" visible={open} onClose={hide} title="Mail">
        <DrawerSection>
          {FOLDERS.map((folder) => (
            <DrawerItem
              key={folder.id}
              {...folder}
              selected={selected === folder.id}
              onClick={() => {
                setSelected(folder.id);
                hide();
              }}
            />
          ))}
        </DrawerSection>
      </Drawer>
    </View>
  );
};

export const variants: Variant[] = [
  generated[0],
  {
    name: "Swipeable",
    title: "Swipeable",
    description:
      "Over the content on a scrim; a drag toward the edge, the scrim, Escape and Android back close it.",
    render: Swipeable,
  },
  ...generated.slice(1),
];
