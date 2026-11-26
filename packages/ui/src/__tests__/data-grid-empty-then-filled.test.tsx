import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import { DataGrid, ThemeProvider, type ColumnDefinition } from "..";

// A grid mounted before its rows arrive (a fetch in flight) kept the render window of its empty first
// render: about ten rows drawn and onEndReached never called (P8 in docs/crm-proposals.md). The list
// starts again when the rows arrive; it is counted by wrapping FlatList.
let mockListMounts = 0;
jest.mock("react-native/Libraries/Lists/FlatList", () => {
  const ReactActual = jest.requireActual("react");
  const Actual = jest.requireActual(
    "react-native/Libraries/Lists/FlatList",
  ).default;
  const Counted = ReactActual.forwardRef((props: object, ref: unknown) => {
    ReactActual.useEffect(() => {
      mockListMounts++;
    }, []);
    return ReactActual.createElement(Actual, { ...props, ref });
  });
  return { __esModule: true, default: Counted };
});

const columns: ColumnDefinition[] = [
  {
    id: "name",
    label: "Name",
    renderCell: (value: string) => <Text>{value}</Text>,
  },
];
const rows = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  name: `Contact ${i}`,
}));

const Grid = ({ data }: { data: typeof rows }) => (
  <ThemeProvider>
    <DataGrid columns={columns} data={data} height={400} />
  </ThemeProvider>
);

beforeEach(() => {
  mockListMounts = 0;
});

describe("DataGrid mounted with no rows", () => {
  it("starts a new list when the rows arrive", async () => {
    const view = await render(<Grid data={[]} />);
    expect(mockListMounts).toBe(1);
    await view.rerender(<Grid data={rows} />);
    expect(mockListMounts).toBe(2);
    expect(view.getByText("Contact 0")).toBeTruthy();
  });

  it("keeps its list while it has rows", async () => {
    const view = await render(<Grid data={rows} />);
    await view.rerender(<Grid data={rows.slice(0, 20)} />);
    expect(mockListMounts).toBe(1);
  });
});
