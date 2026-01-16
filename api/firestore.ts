// Basic value types
export interface FirestoreStringValue {
  stringValue: string;
}

interface FirestoreIntegerValue {
  integerValue: string; // Firestore returns numbers as strings for integerValue
}

export interface FirestoreBooleanValue {
  booleanValue: boolean;
}

export interface FirestoreDoubleValue {
  doubleValue: number;
}

export interface FirestoreTimestampValue {
  timestampValue: string; // ISO 8601 string
}

export interface FirestoreNullValue {
  nullValue: "NULL_VALUE";
}

export interface FirestoreBytesValue {
  bytesValue: string; // Base64 encoded string
}

export interface FirestoreReferenceValue {
  referenceValue: string; // Path to another document
}

export interface FirestoreGeoPointValue {
  geoPointValue: {
    latitude: number;
    longitude: number;
  };
}

// Recursive type for MapValue
export interface FirestoreMapValue {
  mapValue: {
    fields: FirestoreFields;
  };
}

// Recursive type for ArrayValue
export interface FirestoreArrayValue {
  arrayValue: {
    values: FirestoreValue[];
  };
}

export type FirestoreValue =
  | FirestoreStringValue
  | FirestoreIntegerValue
  | FirestoreBooleanValue
  | FirestoreDoubleValue
  | FirestoreTimestampValue
  | FirestoreNullValue
  | FirestoreBytesValue
  | FirestoreReferenceValue
  | FirestoreGeoPointValue
  | FirestoreMapValue
  | FirestoreArrayValue;

// Type for the 'fields' object within a Firestore document
export interface FirestoreFields {
  [key: string]: FirestoreValue;
}

// Full Firestore Document structure from the REST API
export interface FirestoreDocument {
  name: string; // projects/{projectId}/databases/{databaseId}/documents/{documentPath}
  fields: FirestoreFields;
  createTime: string;
  updateTime: string;
}

// --- Flattened Data Interface (for your application) ---
export interface FlattenedDocument {
  [key: string]: any; // Use 'any' or more specific types if your data structure is known
}

/**
 * Recursively flattens a Firestore value object into its native JavaScript type.
 * @param firestoreValue The Firestore value object (e.g., { stringValue: "hello" })
 * @returns The flattened JavaScript value.
 */
export function parseFirestoreValue(firestoreValue: FirestoreValue): any {
  if ("stringValue" in firestoreValue) {
    return firestoreValue.stringValue;
  }
  if ("integerValue" in firestoreValue) {
    return parseInt(firestoreValue.integerValue, 10);
  }
  if ("booleanValue" in firestoreValue) {
    return firestoreValue.booleanValue;
  }
  if ("doubleValue" in firestoreValue) {
    return firestoreValue.doubleValue;
  }
  if ("timestampValue" in firestoreValue) {
    return new Date(firestoreValue.timestampValue);
  }
  if ("nullValue" in firestoreValue) {
    return null;
  }
  if ("bytesValue" in firestoreValue) {
    // You might want to decode base64 if needed, for simplicity returning as string
    return firestoreValue.bytesValue;
  }
  if ("referenceValue" in firestoreValue) {
    return firestoreValue.referenceValue;
  }
  if ("geoPointValue" in firestoreValue) {
    return firestoreValue.geoPointValue;
  }
  if ("mapValue" in firestoreValue) {
    return flattenFirestoreFields(firestoreValue.mapValue.fields);
  }
  if ("arrayValue" in firestoreValue) {
    return (firestoreValue.arrayValue.values || []).map(parseFirestoreValue);
  }
  return undefined; // Should not happen with exhaustive type checking
}

export function flattenFirestoreFields(
  name: string,
  fields: FirestoreFields,
): FlattenedDocument {
  const flattened: FlattenedDocument = {};
  flattened["id"] = name.split("/").pop(); // Extract document ID from the full name
  for (const key in fields) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      flattened[key] = parseFirestoreValue(fields[key]);
    }
  }
  return flattened;
}
