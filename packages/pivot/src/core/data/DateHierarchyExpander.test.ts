import { expandHierarchies } from "./DateHierarchyExpander";

const rows = [{ callDate: "2026-11-25T10:30:00" }];

describe("expandHierarchies", () => {
  test("captions a date's parts '<field> (<part>)', in the localization's words", () => {
    const { metadata } = expandHierarchies(
      { callDate: { type: "date", caption: "Data chiamata" } },
      rows,
      { hierarchyParts: { year: "Anno", month: "Mese" } },
    );
    expect(metadata["callDate.Year"]?.caption).toBe("Data chiamata (Anno)");
    expect(metadata["callDate.Month"]?.caption).toBe("Data chiamata (Mese)");
    expect(metadata["callDate.Day"]?.caption).toBe("Data chiamata (Day)");
  });

  test("keeps the caption the metadata gives for a part", () => {
    const { metadata, rows: expanded } = expandHierarchies(
      {
        callDate: { type: "date", caption: "Data chiamata" },
        "callDate.Year": { type: "string", caption: "Anno" },
        "callDate.Day": { type: "string", caption: "Giorno" },
      },
      rows,
    );
    expect(metadata["callDate.Year"]).toMatchObject({
      caption: "Anno",
      subpart: "year",
    });
    expect(metadata["callDate.Day"]?.caption).toBe("Giorno");
    expect(metadata["callDate.Month"]?.caption).toBe("Data chiamata (Month)");
    expect(expanded[0]["callDate.Year"]).toBe("2026");
  });
});
