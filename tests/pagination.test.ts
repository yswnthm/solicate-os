import { describe, expect, it } from "vitest";

import { decodeCursor, encodeCursor, keysetFilter, toKeyset } from "@/lib/pagination";

describe("pagination cursor", () => {
  const keys = { d: "2026-08-04", c: "2026-08-04T12:00:00.000Z", i: "6f0c2c0e-7b3d-4a6f-8e9c-1234567890ab" };

  it("round-trips a keyset through encode/decode", () => {
    const encoded = encodeCursor(keys);
    expect(encoded).not.toContain("|");
    expect(decodeCursor(encoded)).toEqual(keys);
  });

  it("returns null for empty, malformed, or tampered cursors", () => {
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor(undefined)).toBeNull();
    expect(decodeCursor("")).toBeNull();
    expect(decodeCursor("not-base64-!!")).toBeNull();
    expect(decodeCursor(Buffer.from("only-one-part", "utf8").toString("base64url"))).toBeNull();
  });

  it("builds the keyset predicate for DESC ordering", () => {
    expect(keysetFilter(keys)).toBe(
      "and(transaction_date.lt.2026-08-04)," +
        "and(transaction_date.eq.2026-08-04,created_at.lt.2026-08-04T12:00:00.000Z)," +
        "and(transaction_date.eq.2026-08-04,created_at.eq.2026-08-04T12:00:00.000Z,id.lt.6f0c2c0e-7b3d-4a6f-8e9c-1234567890ab)",
    );
  });

  it("normalizes raw row timestamps to a stable keyset", () => {
    const keyset = toKeyset({
      transaction_date: "2026-08-04",
      created_at: "2026-08-04T12:00:00+00:00",
      id: "6f0c2c0e-7b3d-4a6f-8e9c-1234567890ab",
    });
    expect(keyset).toEqual({
      d: "2026-08-04",
      c: "2026-08-04T12:00:00.000Z",
      i: "6f0c2c0e-7b3d-4a6f-8e9c-1234567890ab",
    });
  });

  it("keyset predicate only matches rows strictly before the cursor row", () => {
    // Simulate the rows a page returns and verify each candidate passes the
    // same comparison the SQL or() expresses.
    const before = (row: { d: string; c: string; i: string }) =>
      row.d < keys.d ||
      (row.d === keys.d && (row.c < keys.c || (row.c === keys.c && row.i < keys.i)));

    expect(before({ d: "2026-08-03", c: "2030-01-01T00:00:00.000Z", i: "z" })).toBe(true); // earlier date
    expect(before({ d: "2026-08-04", c: "2026-08-04T11:00:00.000Z", i: "z" })).toBe(true); // same date, earlier time
    expect(before({ d: "2026-08-04", c: "2026-08-04T12:00:00.000Z", i: "0" })).toBe(true); // full tie, lower id
    expect(before({ d: "2026-08-04", c: "2026-08-04T12:00:00.000Z", i: "6f0c2c0e-7b3d-4a6f-8e9c-1234567890ab" })).toBe(false); // itself
    expect(before({ d: "2026-08-05", c: "2020-01-01T00:00:00.000Z", i: "a" })).toBe(false); // later date
    expect(before({ d: "2026-08-04", c: "2026-08-04T13:00:00.000Z", i: "a" })).toBe(false); // same date, later time
    expect(before({ d: "2026-08-04", c: "2026-08-04T12:00:00.000Z", i: "z" })).toBe(false); // full tie, higher id
  });
});
