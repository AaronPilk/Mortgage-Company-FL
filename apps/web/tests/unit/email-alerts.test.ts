import { describe, expect, it } from "vitest";
import { DisabledListingProvider } from "@tract/integrations";
import type {
  ListingProvider,
  ListingStatus,
  ListingSummary,
  PropertyFactsPort,
  RateFeedPort,
  SearchPage
} from "@tract/integrations";
// Imported by relative path, not the package barrel: the email module is wired
// into @tract/integrations by the integrator, so the orchestration core is
// pulled straight from source here so this suite stands alone.
import {
  FixtureEmailPort,
  runEmailAlerts,
  type EmailAlertsDb,
  type EmailAlertsDbResult,
  type EmailAlertsDeps
} from "../../../../packages/integrations/src/email/index";

/**
 * Orchestration tests for the engagement email engine.
 *
 * The engine is exercised against a `FixtureEmailPort`, small rate/property port
 * doubles, and an in-memory database double that mirrors the reserve/settle
 * ledger contract of the two SECURITY DEFINER functions. Every consent,
 * suppression, idempotency, cap, and hold path is proven here rather than
 * against a live provider.
 */

const NOW = new Date("2026-08-25T12:00:00.000Z");
const TODAY = "2026-08-25";
const OLD = "2026-06-01";

type ProfileRow = {
  owner_user_id: string;
  address_line1: string;
  address_city: string;
  address_state: string;
  address_postal_code: string;
  notify_value_change: boolean;
  last_value_notified_on: string | null;
};
type SnapshotRow = {
  owner_user_id: string;
  captured_on: string;
  estimated_value_cents: number;
  value_low_cents: number | null;
  value_high_cents: number | null;
  source: string;
};
type WatchRow = {
  owner_user_id: string;
  term: string;
  target_rate_bp: number | null;
  notify_email: boolean;
};
type NotificationRow = {
  id: string;
  kind: string;
  dedupe_key: string;
  owner_user_id: string;
  recipient_email_normalized: string;
  status: string;
  requires_reconciliation: boolean;
  created_at: number;
  provider: string | null;
  provider_message_id: string | null;
  error_code: string | null;
};
type SavedSearchRow = {
  id: string;
  owner_user_id: string;
  search_params: string;
  summary: string;
  alerts_enabled: boolean;
  alert_watermark: string | null;
  alert_last_checked_at: string | null;
  alert_last_notified_at: string | null;
};

function propertyStub(newValueCents: number | null, provider = "fixture"): PropertyFactsPort {
  return {
    key: "test",
    async lookup() {
      if (newValueCents === null) return null;
      return {
        value: {
          normalizedAddress: { line1: "1 Test", city: "Tampa", state: "FL", postalCode: "33602" },
          marketValueCents: newValueCents
        },
        provenance: { provider, licenseClass: "internal", limitations: ["test double"] }
      };
    }
  };
}

function rateStub(thirtyBp: number | null, fifteenBp = 601): RateFeedPort {
  return {
    key: "test",
    async latest() {
      if (thirtyBp === null) return null;
      return {
        value: {
          thirtyYearFixedBp: thirtyBp,
          fifteenYearFixedBp: fifteenBp,
          asOfDate: "2026-08-21",
          thirtyYearHistoryBp: [thirtyBp]
        },
        provenance: { provider: "fixture", licenseClass: "public", limitations: ["test double"] }
      };
    }
  };
}

/** A listing provider double with a settable `key` so the dark-gate is testable. */
class FakeListingProvider implements ListingProvider {
  constructor(
    readonly key: string,
    private readonly items: ListingSummary[] = []
  ) {}
  async search(): Promise<SearchPage> {
    return { items: this.items, totalCount: this.items.length, dataAsOf: NOW.toISOString() };
  }
  async getByKey(): Promise<ListingSummary | null> {
    return null;
  }
  async dataAsOf(): Promise<string> {
    return NOW.toISOString();
  }
  async health(): Promise<{ ok: boolean; detail: string }> {
    return { ok: true, detail: "fake listing provider" };
  }
}

function listing(
  key: string,
  modificationTimestamp: string,
  status: ListingStatus = "active"
): ListingSummary {
  return {
    provider: "stellar",
    listingKey: key,
    standardStatus: status,
    address: { city: "Tampa", state: "FL" },
    attributionText: "Test MLS",
    modificationTimestamp,
    isFixture: false
  };
}

function savedSearchRow(
  id: string,
  owner: string,
  watermark: string | null,
  enabled = true
): SavedSearchRow {
  return {
    id,
    owner_user_id: owner,
    search_params: "q=Tampa",
    summary: "Tampa",
    alerts_enabled: enabled,
    alert_watermark: watermark,
    alert_last_checked_at: null,
    alert_last_notified_at: null
  };
}

/**
 * In-memory database double. `from(...)` serves the candidate reads and the
 * snapshot/profile writes; `rpc(...)` implements the reserve/settle ledger with
 * the same kill-switch, suppression, daily-cap, and retry-only semantics as the
 * SECURITY DEFINER functions.
 */
class FakeDb implements EmailAlertsDb {
  profiles: ProfileRow[] = [];
  snapshots: SnapshotRow[] = [];
  watches: WatchRow[] = [];
  savedSearches: SavedSearchRow[] = [];
  users = new Map<string, string>();
  suppressed = new Set<string>();
  notifications = new Map<string, NotificationRow>();
  killed = false;
  reserveCalls = 0;
  private counter = 0;

  constructor(private readonly now: Date) {}

  private tableArray(table: string): Record<string, unknown>[] {
    if (table === "home_profiles") return this.profiles as unknown as Record<string, unknown>[];
    if (table === "home_value_snapshots")
      return this.snapshots as unknown as Record<string, unknown>[];
    if (table === "rate_watches") return this.watches as unknown as Record<string, unknown>[];
    if (table === "saved_searches")
      return this.savedSearches as unknown as Record<string, unknown>[];
    throw new Error(`unexpected table ${table}`);
  }

  from(table: string): FakeQuery {
    return new FakeQuery(this, table);
  }

  execute(query: FakeQuery): EmailAlertsDbResult {
    const arr = this.tableArray(query.table);
    const matches = (row: Record<string, unknown>): boolean =>
      query.filters.every(([column, value]) => row[column] === value);

    if (query.op === "update") {
      for (const row of arr) if (matches(row)) Object.assign(row, query.values);
      return { data: null, error: null };
    }
    if (query.op === "upsert") {
      const values = query.values ?? {};
      if (query.table === "home_value_snapshots") {
        const existing = this.snapshots.find(
          (s) => s.owner_user_id === values.owner_user_id && s.captured_on === values.captured_on
        );
        if (existing !== undefined) Object.assign(existing, values);
        else this.snapshots.push(values as unknown as SnapshotRow);
      } else {
        arr.push({ ...values });
      }
      return { data: null, error: null };
    }
    // select
    let rows = arr.filter(matches);
    if (query.orderColumn !== null) {
      const column = query.orderColumn;
      rows = [...rows].sort((a, b) => {
        const av = String(a[column]);
        const bv = String(b[column]);
        return (av < bv ? -1 : av > bv ? 1 : 0) * (query.orderAscending ? 1 : -1);
      });
    }
    if (query.limitCount !== null) rows = rows.slice(0, query.limitCount);
    return { data: rows.map((row) => ({ ...row })), error: null };
  }

  async rpc(fn: string, args: Record<string, unknown>): Promise<EmailAlertsDbResult> {
    if (fn === "email_alert_reserve") return this.reserve(args);
    if (fn === "email_alert_settle") return this.settle(args);
    throw new Error(`unexpected rpc ${fn}`);
  }

  private reserve(args: Record<string, unknown>): EmailAlertsDbResult {
    this.reserveCalls += 1;
    const kind = String(args.p_kind);
    const ownerUserId = String(args.p_owner_user_id);
    const dedupeKey = String(args.p_dedupe_key);
    const dailyCap = args.p_daily_cap === null ? null : Number(args.p_daily_cap);
    const key = `${kind}:${dedupeKey}`;
    const skipped = (outcome: string): EmailAlertsDbResult => ({
      data: [{ notification_id: null, recipient_email: null, outcome }],
      error: null
    });

    if (this.killed) return skipped("skipped");

    const email = this.users.get(ownerUserId);
    if (email === undefined || email.trim() === "") return skipped("skipped");
    const normalized = email.trim().toLowerCase();

    if (this.suppressed.has(normalized)) {
      if (!this.notifications.has(key)) {
        this.counter += 1;
        this.notifications.set(key, {
          id: `n${this.counter}`,
          kind,
          dedupe_key: dedupeKey,
          owner_user_id: ownerUserId,
          recipient_email_normalized: normalized,
          status: "suppressed",
          requires_reconciliation: false,
          created_at: this.now.getTime(),
          provider: null,
          provider_message_id: null,
          error_code: null
        });
      }
      return skipped("suppressed");
    }

    const windowStart = this.now.getTime() - 24 * 60 * 60 * 1000;
    const recent = [...this.notifications.values()].filter(
      (n) => ["reserved", "sent", "sent_unknown"].includes(n.status) && n.created_at >= windowStart
    ).length;
    if (dailyCap !== null && recent >= dailyCap) return skipped("skipped");

    const existing = this.notifications.get(key);
    if (existing !== undefined && existing.status !== "failed") return skipped("skipped");

    if (existing !== undefined) {
      existing.status = "reserved";
      existing.error_code = null;
      return {
        data: [{ notification_id: existing.id, recipient_email: email, outcome: "reserved" }],
        error: null
      };
    }

    this.counter += 1;
    const id = `n${this.counter}`;
    this.notifications.set(key, {
      id,
      kind,
      dedupe_key: dedupeKey,
      owner_user_id: ownerUserId,
      recipient_email_normalized: normalized,
      status: "reserved",
      requires_reconciliation: false,
      created_at: this.now.getTime(),
      provider: null,
      provider_message_id: null,
      error_code: null
    });
    return {
      data: [{ notification_id: id, recipient_email: email, outcome: "reserved" }],
      error: null
    };
  }

  private settle(args: Record<string, unknown>): EmailAlertsDbResult {
    const id = String(args.p_notification_id);
    const outcome = String(args.p_outcome);
    const row = [...this.notifications.values()].find((n) => n.id === id);
    if (row === undefined || row.status !== "reserved") return { data: null, error: null };
    if (outcome === "sent") {
      row.status = "sent";
      row.provider = args.p_provider === null ? null : String(args.p_provider);
      row.provider_message_id =
        args.p_provider_message_id === null ? null : String(args.p_provider_message_id);
    } else if (outcome === "unknown") {
      row.status = "sent_unknown";
      row.requires_reconciliation = true;
      row.error_code = args.p_error_code === null ? null : String(args.p_error_code);
    } else {
      row.status = "failed";
      row.error_code = args.p_error_code === null ? null : String(args.p_error_code);
    }
    return { data: row.status, error: null };
  }
}

class FakeQuery implements PromiseLike<EmailAlertsDbResult> {
  filters: [string, unknown][] = [];
  orderColumn: string | null = null;
  orderAscending = true;
  limitCount: number | null = null;
  op: "select" | "update" | "upsert" = "select";
  values: Record<string, unknown> | null = null;

  constructor(
    private readonly db: FakeDb,
    readonly table: string
  ) {}

  select(_columns: string): FakeQuery {
    this.op = "select";
    return this;
  }
  eq(column: string, value: unknown): FakeQuery {
    this.filters.push([column, value]);
    return this;
  }
  order(column: string, options: { ascending: boolean }): FakeQuery {
    this.orderColumn = column;
    this.orderAscending = options.ascending;
    return this;
  }
  limit(count: number): FakeQuery {
    this.limitCount = count;
    return this;
  }
  update(values: Record<string, unknown>): FakeQuery {
    this.op = "update";
    this.values = values;
    return this;
  }
  upsert(
    values: Record<string, unknown>,
    _options?: { onConflict: string }
  ): Promise<EmailAlertsDbResult> {
    this.op = "upsert";
    this.values = values;
    return Promise.resolve(this.db.execute(this));
  }
  then<TResult1 = EmailAlertsDbResult, TResult2 = never>(
    onfulfilled?: ((value: EmailAlertsDbResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.db.execute(this)).then(onfulfilled, onrejected);
  }
}

function baseDeps(
  db: FakeDb,
  email: FixtureEmailPort,
  overrides: Partial<EmailAlertsDeps> = {}
): EmailAlertsDeps {
  return {
    supabase: db,
    email,
    rateFeed: rateStub(null),
    property: propertyStub(null),
    listings: new DisabledListingProvider(),
    now: NOW,
    runId: "run-1",
    maxPerRun: 50,
    dailyCap: 500,
    valueThresholdBp: 200,
    resnapshotIntervalDays: 1,
    savedSearchMaxMatches: 10,
    from: "alerts@tract.example",
    hashPepper: "test-pepper-0123456789",
    appUrl: "https://tract.example",
    ...overrides
  };
}

function homeProfile(owner: string, notify: boolean): ProfileRow {
  return {
    owner_user_id: owner,
    address_line1: "1 Bayshore",
    address_city: "Tampa",
    address_state: "FL",
    address_postal_code: "33606",
    notify_value_change: notify,
    last_value_notified_on: null
  };
}

function oldSnapshot(owner: string, valueCents: number): SnapshotRow {
  return {
    owner_user_id: owner,
    captured_on: OLD,
    estimated_value_cents: valueCents,
    value_low_cents: null,
    value_high_cents: null,
    source: "fixture"
  };
}

describe("runEmailAlerts — home value moves", () => {
  it("re-snapshots a stale home and sends when the estimate crosses the threshold", async () => {
    const db = new FakeDb(NOW);
    db.profiles = [homeProfile("u1", true)];
    db.snapshots = [oldSnapshot("u1", 40_000_000)];
    db.users.set("u1", "owner@example.com");
    const email = new FixtureEmailPort();

    const summary = await runEmailAlerts(
      baseDeps(db, email, { property: propertyStub(43_000_000) })
    );

    expect(summary.reSnapshotted).toBe(1);
    expect(summary.valueMovesSent).toBe(1);
    expect(email.sent).toHaveLength(1);
    // A fresh snapshot for today was written, and the "last alerted" marker set.
    expect(db.snapshots.some((s) => s.captured_on === TODAY)).toBe(true);
    expect(db.profiles[0]?.last_value_notified_on).toBe(TODAY);
    // The delivered copy carries the unsubscribe path and the required disclosure.
    const message = email.sent[0]?.message;
    expect(message?.text).toContain("/api/v1/email/unsubscribe");
    expect(message?.headers?.["List-Unsubscribe"]).toBeDefined();
    expect(message?.text).toContain("estimate, not an appraisal");
  });

  it("re-snapshots but does not send when the estimate has not crossed the threshold", async () => {
    const db = new FakeDb(NOW);
    db.profiles = [homeProfile("u1", true)];
    db.snapshots = [oldSnapshot("u1", 43_000_000)];
    db.users.set("u1", "owner@example.com");
    const email = new FixtureEmailPort();

    // A 1% move against a 2% threshold.
    const summary = await runEmailAlerts(
      baseDeps(db, email, { property: propertyStub(43_400_000) })
    );

    expect(summary.reSnapshotted).toBe(1);
    expect(summary.valueMovesSent).toBe(0);
    expect(email.sent).toHaveLength(0);
  });
});

describe("runEmailAlerts — rate thresholds", () => {
  it("sends when the term average reaches the watched level", async () => {
    const db = new FakeDb(NOW);
    db.watches = [
      { owner_user_id: "u2", term: "thirtyYearFixed", target_rate_bp: 700, notify_email: true }
    ];
    db.users.set("u2", "watcher@example.com");
    const email = new FixtureEmailPort();

    const summary = await runEmailAlerts(baseDeps(db, email, { rateFeed: rateStub(681) }));

    expect(summary.rateAlertsSent).toBe(1);
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0]?.message.text).toContain("national survey average, not a quote");
    expect(email.sent[0]?.message.text).toContain("/api/v1/email/unsubscribe");
  });

  it("does not send when the average is still above the watched level", async () => {
    const db = new FakeDb(NOW);
    db.watches = [
      { owner_user_id: "u2", term: "thirtyYearFixed", target_rate_bp: 600, notify_email: true }
    ];
    db.users.set("u2", "watcher@example.com");
    const email = new FixtureEmailPort();

    const summary = await runEmailAlerts(baseDeps(db, email, { rateFeed: rateStub(681) }));

    expect(summary.rateAlertsSent).toBe(0);
    expect(email.sent).toHaveLength(0);
  });

  it("never sends for a null target ('just tell me when it moves')", async () => {
    const db = new FakeDb(NOW);
    db.watches = [
      { owner_user_id: "u2", term: "thirtyYearFixed", target_rate_bp: null, notify_email: true }
    ];
    db.users.set("u2", "watcher@example.com");
    const email = new FixtureEmailPort();

    const summary = await runEmailAlerts(baseDeps(db, email, { rateFeed: rateStub(681) }));

    expect(summary.rateAlertsSent).toBe(0);
    expect(db.reserveCalls).toBe(0);
  });
});

describe("runEmailAlerts — consent, suppression, idempotency, caps, holds", () => {
  it("makes no reservation when the notify flags are off (consent gating)", async () => {
    const db = new FakeDb(NOW);
    db.profiles = [homeProfile("u1", false)];
    db.snapshots = [oldSnapshot("u1", 40_000_000)];
    db.watches = [
      { owner_user_id: "u2", term: "thirtyYearFixed", target_rate_bp: 700, notify_email: false }
    ];
    db.users.set("u1", "owner@example.com");
    db.users.set("u2", "watcher@example.com");
    const email = new FixtureEmailPort();

    const summary = await runEmailAlerts(
      baseDeps(db, email, { property: propertyStub(43_000_000), rateFeed: rateStub(681) })
    );

    expect(db.reserveCalls).toBe(0);
    expect(email.sent).toHaveLength(0);
    expect(summary.valueMovesSent + summary.rateAlertsSent).toBe(0);
  });

  it("records a suppressed status and sends nothing to a suppressed recipient", async () => {
    const db = new FakeDb(NOW);
    db.profiles = [homeProfile("u1", true)];
    db.snapshots = [oldSnapshot("u1", 40_000_000)];
    db.users.set("u1", "owner@example.com");
    db.suppressed.add("owner@example.com");
    const email = new FixtureEmailPort();

    const summary = await runEmailAlerts(
      baseDeps(db, email, { property: propertyStub(43_000_000) })
    );

    expect(summary.suppressed).toBe(1);
    expect(email.sent).toHaveLength(0);
    const notification = [...db.notifications.values()].find(
      (n) => n.owner_user_id === "u1" && n.kind === "home_value_move"
    );
    expect(notification?.status).toBe("suppressed");
  });

  it("sends once across two runs (idempotency)", async () => {
    const db = new FakeDb(NOW);
    db.profiles = [homeProfile("u1", true)];
    db.snapshots = [oldSnapshot("u1", 40_000_000)];
    db.users.set("u1", "owner@example.com");
    const email = new FixtureEmailPort();
    const deps = baseDeps(db, email, { property: propertyStub(43_000_000) });

    const first = await runEmailAlerts(deps);
    const second = await runEmailAlerts(deps);

    expect(first.valueMovesSent).toBe(1);
    // The second run finds today's snapshot fresh and skips before reserving again.
    expect(second.valueMovesSent).toBe(0);
    expect(email.sent).toHaveLength(1);
  });

  it("honors the per-run cap", async () => {
    const db = new FakeDb(NOW);
    db.profiles = [homeProfile("u1", true), homeProfile("u3", true)];
    db.snapshots = [oldSnapshot("u1", 40_000_000), oldSnapshot("u3", 40_000_000)];
    db.users.set("u1", "one@example.com");
    db.users.set("u3", "three@example.com");
    const email = new FixtureEmailPort();

    const summary = await runEmailAlerts(
      baseDeps(db, email, { property: propertyStub(43_000_000), maxPerRun: 1 })
    );

    expect(summary.valueMovesSent).toBe(1);
    expect(email.sent).toHaveLength(1);
  });

  it("honors the per-day cap enforced in the reserve gate", async () => {
    const db = new FakeDb(NOW);
    db.profiles = [homeProfile("u1", true), homeProfile("u3", true)];
    db.snapshots = [oldSnapshot("u1", 40_000_000), oldSnapshot("u3", 40_000_000)];
    db.users.set("u1", "one@example.com");
    db.users.set("u3", "three@example.com");
    const email = new FixtureEmailPort();

    const summary = await runEmailAlerts(
      baseDeps(db, email, { property: propertyStub(43_000_000), dailyCap: 1 })
    );

    expect(summary.valueMovesSent).toBe(1);
    expect(email.sent).toHaveLength(1);
  });

  it("holds an unknown outcome and never resends it", async () => {
    const db = new FakeDb(NOW);
    db.profiles = [homeProfile("u1", true)];
    db.snapshots = [oldSnapshot("u1", 40_000_000)];
    db.users.set("u1", "owner@example.com");
    const email = new FixtureEmailPort();
    email.failNext(1, "unknown");
    // interval 0 so the second run re-evaluates the same dedupe key and must be
    // blocked by the held reservation rather than by the freshness gate.
    const deps = baseDeps(db, email, {
      property: propertyStub(43_000_000),
      resnapshotIntervalDays: 0
    });

    const first = await runEmailAlerts(deps);
    expect(first.held).toBe(1);
    expect(email.sent).toHaveLength(0);
    const held = [...db.notifications.values()].find(
      (n) => n.owner_user_id === "u1" && n.kind === "home_value_move"
    );
    expect(held?.status).toBe("sent_unknown");
    expect(held?.requires_reconciliation).toBe(true);

    const second = await runEmailAlerts(deps);
    // The held row (status sent_unknown, not failed) is never re-reserved.
    expect(second.valueMovesSent).toBe(0);
    expect(email.sent).toHaveLength(0);
    expect(held?.status).toBe("sent_unknown");
  });
});

describe("runEmailAlerts — saved-search matches", () => {
  it("dark-gate: a fixture or disabled provider reserves and sends nothing", async () => {
    for (const key of ["fixture", "disabled"]) {
      const db = new FakeDb(NOW);
      db.savedSearches = [savedSearchRow("s1", "u9", "2026-08-01T00:00:00.000Z")];
      db.users.set("u9", "saver@example.com");
      const email = new FixtureEmailPort();
      const provider = new FakeListingProvider(key, [listing("L-NEW", "2026-08-25T00:00:00.000Z")]);

      const summary = await runEmailAlerts(baseDeps(db, email, { listings: provider }));

      expect(db.reserveCalls).toBe(0);
      expect(email.sent).toHaveLength(0);
      expect(summary.savedSearchAlertsSent).toBe(0);
    }
  });

  it("cold start seeds the watermark and sends nothing on the first run", async () => {
    const db = new FakeDb(NOW);
    db.savedSearches = [savedSearchRow("s1", "u9", null)];
    db.users.set("u9", "saver@example.com");
    const email = new FixtureEmailPort();
    const provider = new FakeListingProvider("stellar", [
      listing("L-NEW", "2026-08-25T00:00:00.000Z")
    ]);

    const summary = await runEmailAlerts(baseDeps(db, email, { listings: provider }));

    expect(db.reserveCalls).toBe(0);
    expect(email.sent).toHaveLength(0);
    expect(summary.savedSearchAlertsSent).toBe(0);
    // The baseline is now, so the existing backlog is never blasted on opt-in.
    expect(db.savedSearches[0]?.alert_watermark).toBe(NOW.toISOString());
  });

  it("sends one email for new matches and advances the watermark", async () => {
    const db = new FakeDb(NOW);
    db.savedSearches = [savedSearchRow("s1", "u9", "2026-08-01T00:00:00.000Z")];
    db.users.set("u9", "saver@example.com");
    const email = new FixtureEmailPort();
    const provider = new FakeListingProvider("stellar", [
      listing("L-1", "2026-08-20T00:00:00.000Z"),
      listing("L-2", "2026-08-24T00:00:00.000Z"),
      listing("L-OLD", "2026-07-15T00:00:00.000Z")
    ]);

    const summary = await runEmailAlerts(baseDeps(db, email, { listings: provider }));

    expect(summary.savedSearchAlertsSent).toBe(1);
    expect(email.sent).toHaveLength(1);
    // Watermark advanced to the newest match; last-notified recorded.
    expect(db.savedSearches[0]?.alert_watermark).toBe("2026-08-24T00:00:00.000Z");
    expect(db.savedSearches[0]?.alert_last_notified_at).toBe(NOW.toISOString());
    // The email carries the unsubscribe path, the header, the kind tag, and no
    // listing figure (only a match count, which is not a financial figure).
    const message = email.sent[0]?.message;
    expect(message?.text).toContain("/api/v1/email/unsubscribe");
    expect(message?.headers?.["List-Unsubscribe"]).toBeDefined();
    expect(message?.tags?.[0]).toEqual({ name: "kind", value: "saved_search_match" });
  });

  it("is idempotent across runs once the watermark has advanced", async () => {
    const db = new FakeDb(NOW);
    db.savedSearches = [savedSearchRow("s1", "u9", "2026-08-01T00:00:00.000Z")];
    db.users.set("u9", "saver@example.com");
    const email = new FixtureEmailPort();
    const provider = new FakeListingProvider("stellar", [
      listing("L-1", "2026-08-24T00:00:00.000Z")
    ]);
    const deps = baseDeps(db, email, { listings: provider });

    const first = await runEmailAlerts(deps);
    const second = await runEmailAlerts(deps);

    expect(first.savedSearchAlertsSent).toBe(1);
    // Nothing is newer than the advanced watermark, so the second run skips.
    expect(second.savedSearchAlertsSent).toBe(0);
    expect(email.sent).toHaveLength(1);
  });

  it("does not re-send the same batch when the watermark write was lost (dedupe)", async () => {
    const db = new FakeDb(NOW);
    db.savedSearches = [savedSearchRow("s1", "u9", "2026-08-01T00:00:00.000Z")];
    db.users.set("u9", "saver@example.com");
    const email = new FixtureEmailPort();
    const provider = new FakeListingProvider("stellar", [
      listing("L-1", "2026-08-24T00:00:00.000Z")
    ]);
    const deps = baseDeps(db, email, { listings: provider });

    await runEmailAlerts(deps);
    expect(email.sent).toHaveLength(1);
    // Simulate a crash between the send and the watermark write.
    const row = db.savedSearches[0];
    if (row !== undefined) row.alert_watermark = "2026-08-01T00:00:00.000Z";

    const second = await runEmailAlerts(deps);
    // Re-selection reproduces the same dedupe key, which collides on the 'sent'
    // row, so the reserve is skipped and no second email is sent.
    expect(second.savedSearchAlertsSent).toBe(0);
    expect(email.sent).toHaveLength(1);
  });

  it("holds an unknown outcome without advancing the watermark", async () => {
    const db = new FakeDb(NOW);
    db.savedSearches = [savedSearchRow("s1", "u9", "2026-08-01T00:00:00.000Z")];
    db.users.set("u9", "saver@example.com");
    const email = new FixtureEmailPort();
    email.failNext(1, "unknown");
    const provider = new FakeListingProvider("stellar", [
      listing("L-1", "2026-08-24T00:00:00.000Z")
    ]);
    const deps = baseDeps(db, email, { listings: provider });

    const first = await runEmailAlerts(deps);
    expect(first.held).toBe(1);
    expect(email.sent).toHaveLength(0);
    // Not sent → the watermark is left at its pre-run value.
    expect(db.savedSearches[0]?.alert_watermark).toBe("2026-08-01T00:00:00.000Z");
    const held = [...db.notifications.values()].find((n) => n.kind === "saved_search_match");
    expect(held?.status).toBe("sent_unknown");

    // The held row (sent_unknown, not failed) is never re-reserved, so the next
    // run re-selects the same batch and sends nothing until it is reconciled.
    const second = await runEmailAlerts(deps);
    expect(second.savedSearchAlertsSent).toBe(0);
    expect(email.sent).toHaveLength(0);
  });
});
