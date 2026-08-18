import { describe, expect, it } from "vitest";
import {
  NotificationPreferencesRequestSchema,
  PrivacyRequestSchema,
  SavePropertyRequestSchema,
  SaveScenarioRequestSchema
} from "./account";

describe("consumer account write schemas", () => {
  it("accepts bounded saved-property and preference writes", () => {
    expect(
      SavePropertyRequestSchema.parse({ listingKey: "FX-STP-0001", sourceMode: "fixture" })
    ).toEqual({ listingKey: "FX-STP-0001", sourceMode: "fixture" });
    expect(
      NotificationPreferencesRequestSchema.parse({
        reportReadyEmail: true,
        reportFailureEmail: false
      })
    ).toEqual({ reportReadyEmail: true, reportFailureEmail: false });
  });

  it("rejects unbounded listing identifiers and unsupported privacy actions", () => {
    expect(
      SavePropertyRequestSchema.safeParse({ listingKey: "../../private", sourceMode: "fixture" })
        .success
    ).toBe(false);
    expect(
      PrivacyRequestSchema.safeParse({
        requestId: "00000000-0000-4000-8000-000000000001",
        requestType: "erase_now"
      }).success
    ).toBe(false);
  });

  it("reuses the bounded planning snapshot contract for account scenarios", () => {
    expect(
      SaveScenarioRequestSchema.safeParse({
        saveId: "00000000-0000-4000-8000-000000000001",
        snapshot: {
          source: "mortgage_payment",
          version: "payment@1",
          calculationVersion: "mortgage-math@1",
          inputSnapshot: { priceDollars: 425000 },
          resultSnapshot: { totalMonthlyDollars: 3100 },
          summary: "Illustrative monthly payment scenario."
        }
      }).success
    ).toBe(true);
    expect(
      SaveScenarioRequestSchema.safeParse({
        saveId: "00000000-0000-4000-8000-000000000001",
        snapshot: {
          source: "mortgage_payment",
          version: "payment@1",
          calculationVersion: "mortgage-math@1",
          inputSnapshot: { socialSecurityNumber: "000-00-0000" },
          resultSnapshot: { totalMonthlyDollars: 3100 },
          summary: "Invalid sensitive snapshot."
        }
      }).success
    ).toBe(false);
  });
});
