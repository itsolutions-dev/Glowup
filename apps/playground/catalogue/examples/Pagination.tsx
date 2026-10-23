import { useState } from "react";
import {
  Box,
  ListItem,
  Pagination,
  Typography,
  useTheme,
  type PaginationProps,
} from "@its/glowup-ui";

const props: Partial<PaginationProps> = {
  totalPages: 24,
  pageSelect: true,
};

const PER_PAGE = 4;
const CUSTOMERS = [
  "Mara Quinn",
  "Theo Alvarez",
  "Priya Nair",
  "Jonas Weber",
  "Lena Fischer",
  "Omar Haddad",
  "Sofia Rossi",
  "Kenji Mori",
];

export default function PaginationExample() {
  const { theme } = useTheme();
  const [page, setPage] = useState(1);
  const totalPages = props.totalPages ?? 1;
  const first = (page - 1) * PER_PAGE;

  return (
    <Box
      background="surface"
      radius="large"
      borderWidth={1}
      borderColor="outlineVariant"
      width="100%"
      style={{ maxWidth: 480, alignSelf: "center", overflow: "hidden" }}
    >
      <Typography variant="titleMedium" style={{ padding: theme.spacing.m }}>
        Orders
      </Typography>
      {Array.from({ length: PER_PAGE }, (_, index) => first + index).map(
        (n) => (
          <ListItem
            key={n}
            icon="receipt-text-outline"
            primaryText={CUSTOMERS[n % CUSTOMERS.length]}
            secondaryText={`Order #${4800 + n}`}
          />
        ),
      )}
      <Box padding={theme.spacing.m} gap={theme.spacing.s}>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          {`${first + 1}-${first + PER_PAGE} of ${totalPages * PER_PAGE} orders`}
        </Typography>
        <Pagination
          {...props}
          totalPages={totalPages}
          activePage={page}
          onChange={setPage}
        />
      </Box>
    </Box>
  );
}
