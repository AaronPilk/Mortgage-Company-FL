import { describe, expect, it } from "vitest";
import { AD_SUPPRESSION_CHANNELS, leadAdSuppressed, type SuppressionDb } from "./suppression";

/**
 * The ad-share suppression check is the last gate before a lead's hashed
 * identifiers go to Meta. It must: block on a match (global 'all' or 'ads'),
 * pass when there is none, use exact-match columns (never a filter string), and
 * fail CLOSED — an unreadable table means the person's status is unknown, so the
 * safe answer is "suppressed, do not share".
 */

type Call = { table: string; channels: readonly string[]; column: string; value: string };

/** A fake Supabase-shaped client that records the query and returns a fixed result. */
function fakeDb(
  result: { data: unknown[] | null; error: unknown },
  calls: Call[] = []
): SuppressionDb {
  return {
    from(table: string) {
      return {
        select() {
          return {
            in(_channelCol: string, channels: readonly string[]) {
              return {
                eq(column: string, value: string) {
                  calls.push({ table, channels, column, value });
                  return { limit: () => Promise.resolve(result) };
                }
              };
            }
          };
        }
      };
    }
  };
}

describe("leadAdSuppressed", () => {
  it("blocks when a suppression row matches the email", async () => {
    const calls: Call[] = [];
    const db = fakeDb({ data: [{ id: "s1" }], error: null }, calls);
    expect(await leadAdSuppressed(db, "dana@example.com", "+18135550147")).toBe(true);
    // Email is checked first and short-circuits, so the phone is never queried.
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      table: "suppressions",
      column: "email_normalized",
      value: "dana@example.com"
    });
    expect(calls[0]?.channels).toEqual(AD_SUPPRESSION_CHANNELS);
  });

  it("blocks when only the phone matches", async () => {
    // First call (email) returns empty, second (phone) matches.
    let n = 0;
    const db: SuppressionDb = {
      from: () => ({
        select: () => ({
          in: () => ({
            eq: () => ({
              limit: () =>
                Promise.resolve(
                  n++ === 0 ? { data: [], error: null } : { data: [{ id: "s" }], error: null }
                )
            })
          })
        })
      })
    };
    expect(await leadAdSuppressed(db, "none@example.com", "+18135550147")).toBe(true);
  });

  it("passes when nothing matches", async () => {
    const db = fakeDb({ data: [], error: null });
    expect(await leadAdSuppressed(db, "dana@example.com", "+18135550147")).toBe(false);
  });

  it("fails closed on a query error (unknown status → suppressed)", async () => {
    const db = fakeDb({ data: null, error: { message: "boom" } });
    expect(await leadAdSuppressed(db, "dana@example.com", "+18135550147")).toBe(true);
  });

  it("returns false and never queries when there is no identifier", async () => {
    const calls: Call[] = [];
    const db = fakeDb({ data: [{ id: "s" }], error: null }, calls);
    expect(await leadAdSuppressed(db, undefined, undefined)).toBe(false);
    expect(await leadAdSuppressed(db, "", "")).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it("only checks the ad-relevant channels", () => {
    expect(AD_SUPPRESSION_CHANNELS).toEqual(["all", "ads"]);
    expect(AD_SUPPRESSION_CHANNELS).not.toContain("email");
  });
});
