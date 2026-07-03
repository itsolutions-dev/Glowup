import { parseFirestoreValue, flattenFirestoreFields } from "../firestore";

describe("parseFirestoreValue", () => {
  it("parses string values", () => {
    expect(parseFirestoreValue({ stringValue: "hello" })).toBe("hello");
  });

  it("parses integer values (returned as strings by the REST API)", () => {
    expect(parseFirestoreValue({ integerValue: "42" })).toBe(42);
  });

  it("parses boolean values", () => {
    expect(parseFirestoreValue({ booleanValue: true })).toBe(true);
  });

  it("parses null values", () => {
    expect(parseFirestoreValue({ nullValue: "NULL_VALUE" })).toBeNull();
  });

  it("parses timestamp values into Date", () => {
    const result = parseFirestoreValue({
      timestampValue: "2026-07-03T00:00:00Z",
    });
    expect(result).toBeInstanceOf(Date);
  });

  it("parses array values recursively", () => {
    expect(
      parseFirestoreValue({
        arrayValue: { values: [{ integerValue: "1" }, { stringValue: "a" }] },
      }),
    ).toEqual([1, "a"]);
  });

  it("parses map values without injecting an id", () => {
    expect(
      parseFirestoreValue({
        mapValue: { fields: { nested: { stringValue: "x" } } },
      }),
    ).toEqual({ nested: "x" });
  });
});

describe("flattenFirestoreFields", () => {
  it("extracts the document id from the resource name", () => {
    const result = flattenFirestoreFields(
      "projects/p/databases/(default)/documents/workorder/abc123",
      { title: { stringValue: "Fix door" }, priority: { integerValue: "2" } },
    );
    expect(result).toEqual({ id: "abc123", title: "Fix door", priority: 2 });
  });
});
