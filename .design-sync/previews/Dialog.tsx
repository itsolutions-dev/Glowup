import React from "react";
import { Dialog, Typography, Button, Divider, Input } from "@its/glowup-ui";

// Dialog renders through react-native-web's Modal, which is a real portal into
// document.body with a position: fixed scrim — so it fills the capture
// viewport rather than the card. Needs cfg.overrides
// { cardMode: "single", viewport: "560x440" }.
//
// RNW's Modal focus-traps and focuses the first focusable child on open, so
// the sheets show a focus ring on it. That is the product's real open state.
const backdrop: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  width: 460,
};

const lines: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

export const Basic = () => (
  <div style={backdrop}>
    <Typography variant="headlineSmall">Component library</Typography>
    <Typography variant="bodyMedium">
      34 components · last synced 4 minutes ago
    </Typography>
    <Dialog visible title="Publish 0.1.0" onClose={() => {}}>
      Publishing makes every component in this library available to the Glowup
      playground and to any workspace that depends on it.
    </Dialog>
  </div>
);

export const RichContent = () => (
  <div style={backdrop}>
    <Typography variant="headlineSmall">Team</Typography>
    <Typography variant="bodyMedium">3 members · 2 pending invites</Typography>
    <Dialog
      visible
      title="Invite your team"
      icon="account-plus-outline"
      onClose={() => {}}
      actions={
        <>
          <Button variant="text" onClick={() => {}}>
            Not now
          </Button>
          <Button
            variant="filled"
            iconName="account-plus-outline"
            onClick={() => {}}
          >
            Send invites
          </Button>
        </>
      }
    >
      <div style={lines}>
        <Typography variant="bodyMedium">
          Everyone you invite gets read access to the shared component library.
          You can raise their role later from Settings.
        </Typography>
        <div style={{ height: 12 }} />
        <Typography variant="labelLarge">Invitees</Typography>
        <Typography variant="bodySmall">marta@itsol.it · Viewer</Typography>
        <Typography variant="bodySmall">luca@itsol.it · Viewer</Typography>
        <div style={{ height: 12 }} />
        <Divider contentSpacing={0} />
      </div>
    </Dialog>
  </div>
);

export const Widths = () => (
  <div style={backdrop}>
    <Typography variant="headlineSmall">Components</Typography>
    <Typography variant="bodyMedium">34 results</Typography>
    <Dialog visible width="xs" title="Clear filters?" onClose={() => {}}>
      The xs width caps the card at 360 px; sm is 480, md (the default) 560 and
      lg 800.
    </Dialog>
  </div>
);

export const FormDialog = () => (
  <div style={backdrop}>
    <Typography variant="headlineSmall">Team</Typography>
    <Typography variant="bodyMedium">3 members · 2 pending invites</Typography>
    <Dialog
      visible
      form
      title="Invite a teammate"
      onClose={() => {}}
      onSubmit={() => {}}
      actions={
        <>
          <Button variant="text" onClick={() => {}}>
            Cancel
          </Button>
          <Button type="submit">Send invite</Button>
        </>
      }
    >
      <div style={{ ...lines, gap: 12 }}>
        <Input label="Name" value="Marta Rossi" onChange={() => {}} />
        <Input label="Email" value="marta@itsol.it" onChange={() => {}} />
      </div>
    </Dialog>
  </div>
);

export const CloseIcon = () => (
  <div style={backdrop}>
    <Typography variant="headlineSmall">Release notes</Typography>
    <Typography variant="bodyMedium">@its/glowup-ui 0.1.0</Typography>
    <Dialog
      visible
      title="What changed"
      closeIcon={false}
      closeText="Got it"
      onClose={() => {}}
    >
      With the close icon hidden and no actions, the dialog falls back to a text
      button labelled by closeText.
    </Dialog>
  </div>
);

export const MustAnswer = () => (
  <div style={backdrop}>
    <Typography variant="headlineSmall">Account</Typography>
    <Typography variant="bodyMedium">3 devices signed in</Typography>
    <Dialog
      visible
      title="Sign out everywhere?"
      icon="logout"
      closeIcon={false}
      disableBackdropClick
      disableEscapeKeyDown
      onClose={() => {}}
      actions={
        <>
          <Button variant="text" onClick={() => {}}>
            Stay signed in
          </Button>
          <Button color="error" onClick={() => {}}>
            Sign out
          </Button>
        </>
      }
    >
      Neither a click outside nor Escape closes this dialog: only one of its
      buttons does.
    </Dialog>
  </div>
);

export const FixedHeight = () => (
  <div style={backdrop}>
    <Typography variant="headlineSmall">Legal</Typography>
    <Typography variant="bodyMedium">Last updated in March</Typography>
    <Dialog
      visible
      title="Terms of service"
      height={280}
      onClose={() => {}}
      actions={
        <Button variant="filled" onClick={() => {}}>
          Accept
        </Button>
      }
    >
      <div style={lines}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <Typography key={n} variant="bodyMedium">
            {n}. height fixes the card at 280 px; the body scrolls inside it
            once the content is taller.
          </Typography>
        ))}
      </div>
    </Dialog>
  </div>
);

export const Untitled = () => (
  <div style={backdrop}>
    <Typography variant="headlineSmall">Release notes</Typography>
    <Typography variant="bodyMedium">@its/glowup-ui 0.1.0</Typography>
    <Dialog visible onClose={() => {}}>
      Dark mode contrast was corrected across every tonal surface.
    </Dialog>
  </div>
);
