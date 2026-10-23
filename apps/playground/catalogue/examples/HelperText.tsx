import { useState } from "react";
import {
  HelperText,
  Input,
  Typography,
  VStack,
  type HelperTextProps,
} from "@its/glowup-ui";

const props: Partial<HelperTextProps> = {
  children: "3 to 12 letters or numbers.",
};

export default function HelperTextExample() {
  const [username, setUsername] = useState("maraquinn");
  const valid = /^[a-z0-9]{3,12}$/i.test(username);

  return (
    <VStack spacing="s">
      <Typography variant="titleMedium">Choose a username</Typography>
      {/* A field of your own, or one with no helper text of its own, takes the
          same hint line as every Glowup input. */}
      <VStack spacing="xs">
        <Input label="Username" value={username} onChange={setUsername} />
        <HelperText {...props} type={valid ? props.type : "error"}>
          {valid ? props.children : "Use only letters and numbers, 3 to 12."}
        </HelperText>
      </VStack>
    </VStack>
  );
}
