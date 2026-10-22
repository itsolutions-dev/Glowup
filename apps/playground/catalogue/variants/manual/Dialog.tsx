import { useState } from "react";
import { View } from "react-native";
import {
  Button,
  Dialog,
  Divider,
  Icon,
  Input,
  Typography,
  type DialogWidth,
} from "@its/glowup-ui";
import type { Variant } from "../types";
import { demo, useOverlayDemo } from "./shared";

// Hand-written because the authored preview mounts the dialog already open: the
// right shape for a screenshot, the wrong one for a page. See `useOverlayDemo`.
// Same demos, opened from a trigger and closed by their own buttons.

const Basic = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Typography variant="headlineSmall">Component library</Typography>
      <Typography variant="bodyMedium">
        34 components · last synced 4 minutes ago
      </Typography>
      <Button variant="filled" iconName="publish" onClick={show}>
        Publish 0.1.0
      </Button>
      <Dialog visible={open} title="Publish 0.1.0" onClose={hide}>
        Publishing makes every component in this library available to the Glowup
        playground and to any workspace that depends on it.
      </Dialog>
    </View>
  );
};

const RichContent = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Typography variant="headlineSmall">Team</Typography>
      <Typography variant="bodyMedium">
        3 members · 2 pending invites
      </Typography>
      <Button variant="tonal" iconName="account-plus-outline" onClick={show}>
        Invite your team
      </Button>
      <Dialog
        visible={open}
        title="Invite your team"
        icon="account-plus-outline"
        onClose={hide}
        actions={
          <>
            <Button variant="text" onClick={hide}>
              Not now
            </Button>
            <Button
              variant="filled"
              iconName="account-plus-outline"
              onClick={hide}
            >
              Send invites
            </Button>
          </>
        }
      >
        <View style={demo.stack}>
          <Typography variant="bodyMedium">
            Everyone you invite gets read access to the shared component
            library. You can raise their role later from Settings.
          </Typography>
          <Typography variant="labelLarge">Invitees</Typography>
          <Typography variant="bodySmall">marta@itsol.it · Viewer</Typography>
          <Typography variant="bodySmall">luca@itsol.it · Viewer</Typography>
          <Divider contentSpacing={0} />
        </View>
      </Dialog>
    </View>
  );
};

const Widths = () => {
  const { open, show, hide } = useOverlayDemo();
  // Kept after closing, so the card does not change while it fades out.
  const [width, setWidth] = useState<DialogWidth>("md");

  return (
    <View style={demo.row}>
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <Button
          key={size}
          variant="outlined"
          onClick={() => {
            setWidth(size);
            show();
          }}
        >
          {size}
        </Button>
      ))}
      <Dialog
        visible={open}
        width={width}
        title={`Width ${width}`}
        onClose={hide}
      >
        The dialog takes 85% of the window, up to 360 (xs), 480 (sm), 560 (md)
        or 800 (lg) px. On a narrow window all four look the same.
      </Dialog>
    </View>
  );
};

const FormDialog = () => {
  const { open, show, hide } = useOverlayDemo();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [invited, setInvited] = useState<string | null>(null);

  return (
    <View style={demo.panel}>
      <Button variant="tonal" iconName="account-plus-outline" onClick={show}>
        Invite a teammate
      </Button>
      {invited !== null && (
        <Typography variant="bodySmall">Invited {invited}.</Typography>
      )}
      <Dialog
        visible={open}
        form
        title="Invite a teammate"
        onClose={hide}
        onSubmit={() => {
          setInvited(name || email || "no one");
          hide();
        }}
        actions={
          <>
            <Button variant="text" onClick={hide}>
              Cancel
            </Button>
            <Button type="submit">Send invite</Button>
          </>
        }
      >
        <View style={demo.stack}>
          <Input label="Name" value={name} onChange={setName} />
          <Input label="Email" value={email} onChange={setEmail} />
        </View>
      </Dialog>
    </View>
  );
};

const CloseIcons = () => {
  const { open, show, hide } = useOverlayDemo();
  const [which, setWhich] = useState<"glyph" | "element" | "none">("glyph");
  const openWith = (next: typeof which) => {
    setWhich(next);
    show();
  };

  return (
    <View style={demo.row}>
      <Button variant="outlined" onClick={() => openWith("glyph")}>
        Another glyph
      </Button>
      <Button variant="outlined" onClick={() => openWith("element")}>
        Your own element
      </Button>
      <Button variant="outlined" onClick={() => openWith("none")}>
        Hidden
      </Button>
      <Dialog
        visible={open}
        title="Close icon"
        onClose={hide}
        closeText="Got it"
        closeIcon={
          which === "glyph" ? (
            "close-circle-outline"
          ) : which === "element" ? (
            <Icon source="arrow-left" />
          ) : (
            false
          )
        }
      >
        {which === "none"
          ? "Hidden, a dialog without actions falls back to a text button."
          : "The close control is a glyph name, or any element you pass."}
      </Dialog>
    </View>
  );
};

const MustAnswer = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Button variant="outlined" color="error" iconName="logout" onClick={show}>
        Sign out everywhere
      </Button>
      <Dialog
        visible={open}
        title="Sign out everywhere?"
        icon="logout"
        closeIcon={false}
        disableBackdropClick
        disableEscapeKeyDown
        onClose={hide}
        actions={
          <>
            <Button variant="text" onClick={hide}>
              Stay signed in
            </Button>
            <Button color="error" onClick={hide}>
              Sign out
            </Button>
          </>
        }
      >
        Neither a click outside nor Escape closes this dialog: only one of its
        buttons does.
      </Dialog>
    </View>
  );
};

const FixedHeight = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Button variant="outlined" iconName="text-box-outline" onClick={show}>
        Terms of service
      </Button>
      <Dialog
        visible={open}
        title="Terms of service"
        height="60%"
        onClose={hide}
        actions={
          <Button variant="filled" onClick={hide}>
            Accept
          </Button>
        }
      >
        <View style={demo.stack}>
          {Array.from({ length: 12 }, (_, index) => (
            <Typography key={index} variant="bodyMedium">
              {index + 1}. Dark mode contrast was corrected across every tonal
              surface, and the card stays at 60% of the window while this body
              scrolls.
            </Typography>
          ))}
        </View>
      </Dialog>
    </View>
  );
};

const Untitled = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Typography variant="headlineSmall">Release notes</Typography>
      <Typography variant="bodyMedium">@its/glowup-ui 0.1.0</Typography>
      <Button variant="outlined" iconName="text-box-outline" onClick={show}>
        What changed
      </Button>
      <Dialog visible={open} closeText="Got it" onClose={hide}>
        Dark mode contrast was corrected across every tonal surface.
      </Dialog>
    </View>
  );
};

export const variants: Variant[] = [
  {
    name: "Dialog",
    title: "Dialog",
    description: "A title, a body and the close icon.",
    render: Basic,
  },
  {
    name: "RichContent",
    title: "Rich content",
    description:
      "Children instead of a string, a hero icon and the dialog's own action row.",
    render: RichContent,
  },
  {
    name: "Widths",
    title: "Widths",
    description: "width caps the card at xs 360, sm 480, md 560 or lg 800 px.",
    render: Widths,
  },
  {
    name: "Form",
    title: "Form",
    description:
      "form wraps the body and the actions in a Form: the submit button, or Enter in a field, calls onSubmit.",
    render: FormDialog,
  },
  {
    name: "CloseIcon",
    title: "Close icon",
    description: "A glyph, your own element, or false to hide it.",
    render: CloseIcons,
  },
  {
    name: "MustAnswer",
    title: "Must answer",
    description:
      "disableBackdropClick and disableEscapeKeyDown leave only the buttons.",
    render: MustAnswer,
  },
  {
    name: "FixedHeight",
    title: "Fixed height",
    description: "height fixes the card; the body scrolls inside it.",
    render: FixedHeight,
  },
  { name: "Untitled", title: "Untitled", render: Untitled },
];
