import { useState } from "react";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardTitle,
  Switch,
  Typography,
  type CardContentProps,
} from "@its/glowup-ui";

const props: CardContentProps = {
  children: "Invitees can read the shared library. Change roles any time.",
};

export default function CardContentExample() {
  const [notify, setNotify] = useState(true);
  const { children, ...rest } = props;

  return (
    <Card variant="outlined">
      <CardTitle
        title="Invite your team"
        subtitle="Workspace · Fernhill Studio"
      />
      <CardContent {...rest}>
        <Typography variant="bodyMedium">{children}</Typography>
        <Switch
          label="Email me when someone joins"
          value={notify}
          onChange={setNotify}
        />
      </CardContent>
      <CardActions>
        <Button variant="text">Copy link</Button>
        <Button iconName="account-plus-outline">Invite</Button>
      </CardActions>
    </Card>
  );
}
