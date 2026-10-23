import { useState } from "react";
import { Platform } from "react-native";
import {
  IFrame,
  Typography,
  VStack,
  useTheme,
  type IFrameProps,
} from "@its/glowup-ui";

// A page of its own, so the frame has something to show offline.
const props: Partial<IFrameProps> & Pick<IFrameProps, "src" | "title"> = {
  src: "data:text/html,<body style='margin:0;padding:24px;font:16px/1.5 system-ui;background:white;color:black'><h2 style='margin:0 0 8px'>Release notes</h2><p style='margin:0'>Version 2.4 makes exports twice as fast.</p></body>",
  title: "Release notes",
  height: 200,
};

export default function IFrameExample() {
  const { theme } = useTheme();
  // The `src` the last `onLoad` was for: a new one loads, and reports, again.
  const [loaded, setLoaded] = useState<string | null>(null);

  return (
    <VStack spacing="s">
      <Typography variant="titleMedium">What is new</Typography>
      <IFrame
        {...props}
        style={{
          borderRadius: theme.shape.medium,
          borderWidth: 1,
          borderColor: theme.colors.outlineVariant,
        }}
        onLoad={() => setLoaded(props.src)}
      />
      {Platform.OS === "web" && (
        <Typography variant="bodySmall" color="onSurfaceVariant">
          {loaded === props.src ? "The page has loaded." : "Loading the page…"}
        </Typography>
      )}
    </VStack>
  );
}
