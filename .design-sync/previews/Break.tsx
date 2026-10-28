import React from "react";
import { Box, Break, Typography } from "@its/glowup-ui";

const lorem =
  "Padding keeps the text off the edge; Break lets one child run out to it.";

/** `inline="m"` cancels the 16px of padding on both sides. */
export const FullBleedBand = () => (
  <Box
    background="surfaceContainerLow"
    padding={16}
    radius="medium"
    gap={8}
    width={360}
  >
    <Typography variant="bodyMedium">{lorem}</Typography>
    <Break inline="m">
      <Box background="primaryContainer" padding={12}>
        <Typography variant="labelLarge">inline=&quot;m&quot;</Typography>
      </Box>
    </Break>
    <Typography variant="bodyMedium">Back inside the padding.</Typography>
  </Box>
);

export const Edges = () => (
  <Box
    background="surfaceContainerLow"
    padding={16}
    radius="medium"
    gap={16}
    width={360}
    style={{ overflow: "hidden" }}
  >
    <Break inlineStart="m" blockStart={16}>
      <Box background="secondaryContainer" padding={8}>
        <Typography variant="labelMedium">
          inlineStart=&quot;m&quot; blockStart=&#123;16&#125;
        </Typography>
      </Box>
    </Break>
    <Break inlineEnd="m">
      <Box background="tertiaryContainer" padding={8}>
        <Typography variant="labelMedium">inlineEnd=&quot;m&quot;</Typography>
      </Box>
    </Break>
    <Break blockEnd={16}>
      <Box background="primaryContainer" padding={8}>
        <Typography variant="labelMedium">
          blockEnd=&#123;16&#125; into the padding below
        </Typography>
      </Box>
    </Break>
  </Box>
);

/** Both axes at once, in px: the band meets the corners of the container. */
export const BothAxes = () => (
  <Box
    background="surfaceContainerHigh"
    padding={24}
    radius="large"
    width={360}
    style={{ overflow: "hidden" }}
  >
    <Break inline="l" block="l">
      <Box background="primaryContainer" padding={16}>
        <Typography variant="titleSmall">
          inline=&quot;l&quot; block=&quot;l&quot;
        </Typography>
      </Box>
    </Break>
  </Box>
);
