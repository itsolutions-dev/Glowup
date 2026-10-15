import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import {
  Button,
  Checkbox,
  DataGrid,
  Divider,
  Input,
  Pagination,
  SearchBar,
  Select,
  StatusBadge,
  ThemeProvider,
  palettes,
  useTheme,
  type ColumnDefinition,
} from "@its/glowup-ui";

/**
 * Spike 0.2 (docs/solaris-native.md, Phase 0): a CRM-grade desktop screen —
 * filtered list, dense table, long form — built with the library alone and the
 * `databeasy` palette. Throwaway: it exists to find what breaks at desktop
 * density on react-native-web, not to ship. Gaps are marked `GAP:`.
 */

const STATUSES = ["Nuovo", "In corso", "Chiuso", "Perso"] as const;
const OWNERS = ["Rossi", "Bianchi", "Verdi", "Neri", "Gallo"];
const CITIES = ["Milano", "Roma", "Torino", "Napoli", "Bologna", "Firenze"];

const ROWS = Array.from({ length: 240 }, (_, i) => ({
  id: String(i + 1),
  name: `Contatto ${i + 1}`,
  company: `Azienda ${(i * 7) % 53} S.r.l.`,
  email: `contatto${i + 1}@example.it`,
  phone: `+39 02 5550 ${String(1000 + i)}`,
  status: STATUSES[i % STATUSES.length],
  owner: OWNERS[i % OWNERS.length],
  city: CITIES[(i * 3) % CITIES.length],
  created: `2026-0${(i % 9) + 1}-${String((i % 27) + 1).padStart(2, "0")}`,
  amount: (i * 137) % 9000,
  calls: (i * 5) % 31,
  priority: (i % 3) + 1,
}));

// GAP: no `align` and no cell renderer, so a status badge has to be put in the
// data itself (below) and numbers cannot be right-aligned.
const COLUMNS: ColumnDefinition[] = [
  { id: "name", label: "Nome", width: 160, sortable: true },
  { id: "company", label: "Azienda", width: 190, sortable: true },
  { id: "email", label: "Email", width: 220 },
  { id: "phone", label: "Telefono", width: 150 },
  { id: "statusCell", label: "Stato", width: 130 },
  { id: "owner", label: "Operatore", width: 120, sortable: true },
  { id: "city", label: "Città", width: 110, sortable: true },
  { id: "created", label: "Creato il", width: 110, sortable: true },
  { id: "amount", label: "Valore €", width: 100, sortable: true },
  { id: "calls", label: "Chiamate", width: 100, sortable: true },
  { id: "priority", label: "Priorità", width: 90, sortable: true },
];

const PAGE_SIZE = 25;
const BADGE = {
  Nuovo: "success",
  "In corso": "warning",
  Chiuso: undefined,
  Perso: "error",
} as const;

const STATUS_OPTIONS = [
  { id: "all", label: "Tutti gli stati", value: "all" },
  ...STATUSES.map((s) => ({ id: s, label: s, value: s })),
];
const OWNER_OPTIONS = [
  { id: "all", label: "Tutti gli operatori", value: "all" },
  ...OWNERS.map((s) => ({ id: s, label: s, value: s })),
];
const CITY_OPTIONS = CITIES.map((s) => ({ id: s, label: s, value: s }));

const Field = ({
  children,
  basis = 280,
}: {
  children: React.ReactNode;
  basis?: number;
}) => (
  <View style={{ flexGrow: 1, flexBasis: basis, minWidth: 220 }}>
    {children}
  </View>
);

function Screen() {
  const { theme } = useTheme();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [owner, setOwner] = useState("all");
  const [sort, setSort] = useState<{ id: string; dir: "asc" | "desc" }>({
    id: "name",
    dir: "asc",
  });
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = ROWS.filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (owner === "all" || r.owner === owner) &&
        (!q ||
          r.name.toLowerCase().includes(q) ||
          r.company.toLowerCase().includes(q)),
    );
    // GAP: DataGrid does not sort `data`; the screen has to.
    return [...list].sort((a, b) => {
      const x = (a as any)[sort.id];
      const y = (b as any)[sort.id];
      const c = x < y ? -1 : x > y ? 1 : 0;
      return sort.dir === "asc" ? c : -c;
    });
  }, [query, status, owner, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    .map((r) => ({
      ...r,
      statusCell: (
        <StatusBadge label={r.status} type={BADGE[r.status] as any} />
      ),
    }));

  const [form, setForm] = useState<Record<string, string>>({
    firstName: "Mario",
    lastName: "Rossi",
    email: "mario.rossi@example.it",
    phone: "+39 02 5550 1000",
    vat: "",
    company: "",
    role: "",
    address: "",
    zip: "",
    notes: "",
  });
  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const [city, setCity] = useState<string | undefined>();
  const [consent, setConsent] = useState(false);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{
        padding: 24,
        gap: 16,
        maxWidth: 1600,
        width: "100%",
        alignSelf: "center",
      }}
    >
      <Text
        style={[
          theme.typography.headlineSmall,
          { color: theme.colors.onSurface },
        ]}
      >
        Contatti · {filtered.length} risultati
      </Text>

      {/* Filters */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <View style={{ flexGrow: 1, flexBasis: 320 }}>
          <SearchBar
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              setPage(1);
            }}
            placeholder="Cerca per nome o azienda"
          />
        </View>
        <View style={{ width: 220 }}>
          <Select
            label="Stato"
            options={STATUS_OPTIONS}
            value={status}
            onSelect={(v) => {
              setStatus(v);
              setPage(1);
            }}
          />
        </View>
        <View style={{ width: 220 }}>
          <Select
            label="Operatore"
            options={OWNER_OPTIONS}
            value={owner}
            onSelect={(v) => {
              setOwner(v);
              setPage(1);
            }}
          />
        </View>
        <Button
          mode="outlined"
          iconName="filter-variant"
          onPress={() => {
            setQuery("");
            setStatus("all");
            setOwner("all");
            setPage(1);
          }}
        >
          Azzera
        </Button>
        <Button iconName="plus">Nuovo contatto</Button>
      </View>

      {/* Table */}
      <View style={{ height: 25 * 40 + 48 + 8 }}>
        <DataGrid
          data={rows}
          columns={COLUMNS}
          density="dense"
          sortColumn={sort.id}
          sortDirection={sort.dir}
          onSort={(id, dir) => setSort({ id, dir })}
          emptyMessage="Nessun contatto"
        />
      </View>
      <View style={{ alignItems: "center" }}>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          showFirstLast
        />
      </View>

      <Divider />

      {/* Long form */}
      <Text
        style={[theme.typography.titleLarge, { color: theme.colors.onSurface }]}
      >
        Scheda contatto
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        <Field>
          <Input
            label="Nome"
            value={form.firstName}
            onChangeText={set("firstName")}
            required
          />
        </Field>
        <Field>
          <Input
            label="Cognome"
            value={form.lastName}
            onChangeText={set("lastName")}
            required
          />
        </Field>
        <Field>
          <Input
            label="Email"
            value={form.email}
            onChangeText={set("email")}
            leadingIcon="email-outline"
          />
        </Field>
        <Field>
          <Input
            label="Telefono"
            value={form.phone}
            onChangeText={set("phone")}
            leadingIcon="phone-outline"
          />
        </Field>
        <Field>
          <Input
            label="P. IVA"
            value={form.vat}
            onChangeText={set("vat")}
            maxLength={11}
            helperText="11 cifre"
          />
        </Field>
        <Field>
          <Input
            label="Azienda"
            value={form.company}
            onChangeText={set("company")}
          />
        </Field>
        <Field>
          <Input label="Ruolo" value={form.role} onChangeText={set("role")} />
        </Field>
        <Field>
          {/* GAP: not searchable, no groups. */}
          <Select
            label="Città"
            options={CITY_OPTIONS}
            value={city}
            onSelect={setCity}
            placeholder="Seleziona"
          />
        </Field>
        <Field basis={560}>
          <Input
            label="Indirizzo"
            value={form.address}
            onChangeText={set("address")}
          />
        </Field>
        <Field>
          <Input
            label="CAP"
            value={form.zip}
            onChangeText={set("zip")}
            error={form.zip && form.zip.length !== 5 ? "5 cifre" : undefined}
          />
        </Field>
        <Field basis={900}>
          <Input
            label="Note"
            value={form.notes}
            onChangeText={set("notes")}
            multiline
            numberOfLines={4}
          />
        </Field>
      </View>
      <Checkbox
        label="Consenso al trattamento dei dati"
        checked={consent}
        onValueChange={setConsent}
      />
      <View
        style={{ flexDirection: "row", gap: 12, justifyContent: "flex-end" }}
      >
        <Button mode="outlined">Annulla</Button>
        <Button>Salva</Button>
      </View>
    </ScrollView>
  );
}

export default function SpikeCrmDesktop() {
  return (
    <ThemeProvider initialPalette={palettes.databeasy}>
      <Screen />
    </ThemeProvider>
  );
}
