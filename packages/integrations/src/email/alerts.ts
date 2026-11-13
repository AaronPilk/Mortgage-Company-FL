import { createHmac } from "node:crypto";
import type { ListingProvider } from "../listings/port";
import {
  parseSavedSearchQuery,
  selectNewMatches,
  SAVED_SEARCH_FETCH_LIMIT
} from "../listings/saved-search";
import type { Address, PropertyFactsPort } from "../property/ports";
import type { RateFeedPort } from "../rates/ports";
import { assertEducationalCopy, type EmailMessage, type EmailPort } from "./ports";

/**
 * Engagement email alert engine — the portable core.
 *
 * This lives in `@tract/integrations` and is fully dependency-injected precisely
 * so the Cloudflare Worker's `scheduled` handler can import and run it without
 * pulling in any `apps/web` server module. It imports no Next, no `server-only`,
 * no environment: every collaborator — the database, the email port, the rate
 * feed, the property valuation port, the clock, the caps, and the secrets — is
 * passed in. The thin `apps/web` wrapper and the Worker both build the same
 * `deps` from their own environment and call `runEmailAlerts`.
 *
 * Two loops, both consent-gated and suppression-gated, both reserve-before-spend:
 *
 *  1. Home-value moves. For each owner who asked for value alerts and whose
 *     latest snapshot is stale, re-snapshot via the property port. If the new
 *     estimate moved at least the configured threshold, reserve a send under the
 *     ledger lock, send, and settle.
 *  2. Rate thresholds. Read the free market average once (no reservation — the
 *     survey feed costs nothing). For each rate watcher whose term average has
 *     reached the level they picked, reserve, send, settle.
 *
 * The ledger (invariant 8) is the pair of SECURITY DEFINER functions the
 * database exposes: `email_alert_reserve` gates and reserves under an advisory
 * lock and hands back the recipient's email only on a fresh reservation;
 * `email_alert_settle` records the terminal state. An unknown send outcome holds
 * the reservation forever (status `sent_unknown`) and is never resent.
 */

export type NotificationKind = "home_value_move" | "rate_threshold" | "saved_search_match";
export type RateWatchTerm = "thirtyYearFixed" | "fifteenYearFixed";

export type EmailAlertsSummary = {
  reSnapshotted: number;
  valueMovesSent: number;
  rateAlertsSent: number;
  savedSearchAlertsSent: number;
  suppressed: number;
  skipped: number;
  held: number;
  failed: number;
};

/** Minimal PostgREST surface the core uses, so the package needs no supabase-js dependency. */
export type EmailAlertsDbResult = { data: unknown; error: unknown };

export interface EmailAlertsQuery extends PromiseLike<EmailAlertsDbResult> {
  select(columns: string): EmailAlertsQuery;
  eq(column: string, value: unknown): EmailAlertsQuery;
  order(column: string, options: { ascending: boolean }): EmailAlertsQuery;
  limit(count: number): EmailAlertsQuery;
  update(values: Record<string, unknown>): EmailAlertsQuery;
  upsert(
    values: Record<string, unknown>,
    options?: { onConflict: string }
  ): PromiseLike<EmailAlertsDbResult>;
}

export interface EmailAlertsDb {
  from(table: string): EmailAlertsQuery;
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<EmailAlertsDbResult>;
}

export type EmailAlertsDeps = {
  supabase: EmailAlertsDb;
  email: EmailPort;
  rateFeed: RateFeedPort;
  property: PropertyFactsPort;
  now?: Date;
  runId: string;
  /** Ceiling on provider calls in a single run (a fresh reservation counts). */
  maxPerRun: number;
  /** Per-day ceiling, enforced inside the reserve function under the lock. */
  dailyCap: number;
  /** A move at or above this many basis points of the prior value is an alert (200 = 2%). */
  valueThresholdBp: number;
  /** Only re-snapshot a home whose latest snapshot is older than this many days. */
  resnapshotIntervalDays: number;
  /** Verified sender address (EMAIL_FROM). */
  from: string;
  /** HMAC secret for the unsubscribe token (HASH_PEPPER). */
  hashPepper: string;
  /** Absolute site origin, for the in-body links and the one-click unsubscribe URL. */
  appUrl: string;
  /**
   * Listing provider for the saved-search loop. A fixture or disabled key darkens
   * the loop entirely (invariant 6): a synthetic listing never becomes an email.
   */
  listings: ListingProvider;
  /** Max new matches emailed per saved search per run (batch cap + watermark step). */
  savedSearchMaxMatches: number;
};

/**
 * The unsubscribe token: an HMAC over the kind and the normalized email, keyed by
 * the platform pepper. It carries no session and needs no lookup — the
 * unsubscribe route recomputes it and compares in constant time — so a
 * one-click List-Unsubscribe works with no auth while remaining unforgeable.
 */
export function unsubscribeToken(
  emailNormalized: string,
  kind: NotificationKind,
  pepper: string
): string {
  return createHmac("sha256", pepper)
    .update(`${kind}:${emailNormalized.trim().toLowerCase()}`)
    .digest("hex");
}

function trimTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function unsubscribeUrlFor(
  base: string,
  kind: NotificationKind,
  email: string,
  token: string
): string {
  return `${trimTrailingSlash(base)}/api/v1/email/unsubscribe?kind=${kind}&email=${encodeURIComponent(email)}&token=${token}`;
}

function unsubscribeHeaders(url: string): Record<string, string> {
  // RFC 8058: a mail client can unsubscribe with a single POST to this URL.
  return {
    "List-Unsubscribe": `<${url}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
  };
}

/**
 * A home-value move alert. It states, qualitatively, that the automated estimate
 * moved and links to the on-site dashboard where the figure is shown with full
 * provenance — the email itself carries no number, so it can never read as a
 * value claim or a quote. The disclosure is the required "an estimate, not an
 * appraisal". `assertEducationalCopy` runs over the rendered output before send.
 */
export function buildValueMoveEmail(params: {
  to: string;
  from: string;
  pepper: string;
  appUrl: string;
  previousValueCents: number;
  newValueCents: number;
  city?: string;
}): EmailMessage {
  const token = unsubscribeToken(params.to, "home_value_move", params.pepper);
  const unsubscribeUrl = unsubscribeUrlFor(params.appUrl, "home_value_move", params.to, token);
  const dashboardUrl = `${trimTrailingSlash(params.appUrl)}/account`;
  const direction = params.newValueCents >= params.previousValueCents ? "risen" : "eased";
  const where =
    params.city === undefined || params.city.trim() === ""
      ? "your home"
      : `your home in ${params.city}`;
  const disclosure =
    "This is an estimate, not an appraisal, and it is not an offer of credit. Only a licensed appraisal establishes value.";
  const subject = "There is a change in your home value estimate";
  const intro = `The automated estimate for ${where} has ${direction} since we last checked.`;
  const cta = `See your updated estimate and equity view on your dashboard: ${dashboardUrl}`;

  const text = [
    intro,
    "",
    cta,
    "",
    disclosure,
    "",
    `Unsubscribe from home value alerts: ${unsubscribeUrl}`
  ].join("\n");
  const html = [
    `<p>${intro}</p>`,
    `<p><a href="${dashboardUrl}">See your updated estimate and equity view</a>.</p>`,
    `<p style="color:#555;font-size:12px">${disclosure}</p>`,
    `<p style="color:#888;font-size:12px"><a href="${unsubscribeUrl}">Unsubscribe from home value alerts</a>.</p>`
  ].join("\n");

  return {
    to: params.to,
    from: params.from,
    subject,
    html,
    text,
    headers: unsubscribeHeaders(unsubscribeUrl),
    tags: [{ name: "kind", value: "home_value_move" }]
  };
}

/**
 * A rate-threshold alert. It states that the national survey average reached the
 * level the watcher picked and links to the on-site rates surface. No figure is
 * printed — never a rate, never an APR, never "your rate" — so it cannot read as
 * an advertised rate or a quote. The disclosure is the required "a national
 * survey average, not a quote".
 */
export function buildRateThresholdEmail(params: {
  to: string;
  from: string;
  pepper: string;
  appUrl: string;
  term: RateWatchTerm;
}): EmailMessage {
  const token = unsubscribeToken(params.to, "rate_threshold", params.pepper);
  const unsubscribeUrl = unsubscribeUrlFor(params.appUrl, "rate_threshold", params.to, token);
  const ratesUrl = `${trimTrailingSlash(params.appUrl)}/mortgage-rates`;
  const termLabel = params.term === "thirtyYearFixed" ? "30-year fixed" : "15-year fixed";
  const disclosure =
    "This is a national survey average, not a quote, an offer, or a commitment to lend. Your own terms depend on your circumstances.";
  const subject = `The ${termLabel} average reached the level you are watching`;
  const intro = `The national ${termLabel} average has reached the level you asked us to watch for.`;
  const cta = `See the latest average and how it has been moving: ${ratesUrl}`;

  const text = [
    intro,
    "",
    cta,
    "",
    disclosure,
    "",
    `Unsubscribe from rate alerts: ${unsubscribeUrl}`
  ].join("\n");
  const html = [
    `<p>${intro}</p>`,
    `<p><a href="${ratesUrl}">See the latest average and how it has been moving</a>.</p>`,
    `<p style="color:#555;font-size:12px">${disclosure}</p>`,
    `<p style="color:#888;font-size:12px"><a href="${unsubscribeUrl}">Unsubscribe from rate alerts</a>.</p>`
  ].join("\n");

  return {
    to: params.to,
    from: params.from,
    subject,
    html,
    text,
    headers: unsubscribeHeaders(unsubscribeUrl),
    tags: [{ name: "kind", value: "rate_threshold" }]
  };
}

/**
 * A saved-search match alert. It states that new listings matched a search the
 * recipient saved and links to the on-site results page where every record shows
 * with full detail and attribution — the email itself carries no address and no
 * price, so it can never read as a listing claim or a quote. Only a count (which
 * is not a financial figure) appears. `assertEducationalCopy` runs over the
 * rendered output before send.
 */
export function buildSavedSearchEmail(params: {
  to: string;
  from: string;
  pepper: string;
  appUrl: string;
  /** Canonical /properties query string of the saved search (no leading "?"). */
  searchParams: string;
  matchCount: number;
}): EmailMessage {
  const token = unsubscribeToken(params.to, "saved_search_match", params.pepper);
  const unsubscribeUrl = unsubscribeUrlFor(params.appUrl, "saved_search_match", params.to, token);
  const path = params.searchParams === "" ? "/properties" : `/properties?${params.searchParams}`;
  const resultsUrl = `${trimTrailingSlash(params.appUrl)}${path}`;
  const disclosure =
    "Listings are shown with full detail and attribution on the site. This is not an offer of credit.";
  const count =
    params.matchCount === 1 ? "A new listing matches" : `${params.matchCount} new listings match`;
  const subject = "New listings match your saved search";
  const intro = `${count} a property search you saved.`;
  const cta = `See the newest matches: ${resultsUrl}`;

  const text = [
    intro,
    "",
    cta,
    "",
    disclosure,
    "",
    `Unsubscribe from saved-search alerts: ${unsubscribeUrl}`
  ].join("\n");
  const html = [
    `<p>${intro}</p>`,
    `<p><a href="${resultsUrl}">See the newest matches</a>.</p>`,
    `<p style="color:#555;font-size:12px">${disclosure}</p>`,
    `<p style="color:#888;font-size:12px"><a href="${unsubscribeUrl}">Unsubscribe from saved-search alerts</a>.</p>`
  ].join("\n");

  return {
    to: params.to,
    from: params.from,
    subject,
    html,
    text,
    headers: unsubscribeHeaders(unsubscribeUrl),
    tags: [{ name: "kind", value: "saved_search_match" }]
  };
}

/* ---------------------------------------------------------------- *
 * The run
 * ---------------------------------------------------------------- */

type Reservation =
  | { kind: "reserved"; notificationId: string; recipientEmail: string }
  | { kind: "suppressed" }
  | { kind: "skipped" };

type SendTag = "sent" | "failed" | "held";

function rowsOf(result: EmailAlertsDbResult): Record<string, unknown>[] {
  if (result.error !== null && result.error !== undefined) return [];
  return Array.isArray(result.data) ? (result.data as Record<string, unknown>[]) : [];
}

function isError(result: EmailAlertsDbResult): boolean {
  return result.error !== null && result.error !== undefined;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** True when a YYYY-MM-DD capture date is at least `days` old relative to `now`. */
function olderThanDays(capturedOn: string, now: Date, days: number): boolean {
  const captured = new Date(`${capturedOn}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(captured)) return true;
  return now.getTime() - captured >= days * 24 * 60 * 60 * 1000;
}

async function reserve(
  db: EmailAlertsDb,
  kind: NotificationKind,
  ownerUserId: string,
  dedupeKey: string,
  context: Record<string, unknown>,
  runId: string,
  dailyCap: number
): Promise<Reservation> {
  const result = await db.rpc("email_alert_reserve", {
    p_kind: kind,
    p_owner_user_id: ownerUserId,
    p_dedupe_key: dedupeKey,
    p_context: context,
    p_run_id: runId,
    p_daily_cap: dailyCap
  });
  const row = rowsOf(result)[0];
  if (row === undefined) return { kind: "skipped" };
  const outcome = asString(row.outcome);
  const notificationId = asString(row.notification_id);
  const recipientEmail = asString(row.recipient_email);
  if (outcome === "reserved" && notificationId !== null && recipientEmail !== null) {
    return { kind: "reserved", notificationId, recipientEmail };
  }
  if (outcome === "suppressed") return { kind: "suppressed" };
  return { kind: "skipped" };
}

async function settle(
  db: EmailAlertsDb,
  notificationId: string,
  outcome: "sent" | "failed_before_send" | "unknown",
  provider: string,
  providerMessageId: string | null,
  errorCode: string | null
): Promise<void> {
  await db.rpc("email_alert_settle", {
    p_notification_id: notificationId,
    p_outcome: outcome,
    p_provider: provider,
    p_provider_message_id: providerMessageId,
    p_error_code: errorCode
  });
}

/**
 * Screen the rendered copy, send, and settle. Copy that trips
 * `assertEducationalCopy` is never sent — the reservation is settled as a
 * pre-send failure (retryable once the template is fixed), not left dangling.
 * An unknown provider outcome holds the reservation (`held`) and is never resent.
 */
async function sendAndSettle(
  deps: EmailAlertsDeps,
  reservation: Extract<Reservation, { kind: "reserved" }>,
  message: EmailMessage,
  dedupeKey: string
): Promise<SendTag> {
  try {
    assertEducationalCopy(message.subject);
    assertEducationalCopy(message.text);
    assertEducationalCopy(message.html);
  } catch {
    await settle(
      deps.supabase,
      reservation.notificationId,
      "failed_before_send",
      deps.email.key,
      null,
      "prohibited_copy"
    );
    return "failed";
  }

  const outcome = await deps.email.send(message, dedupeKey);
  if (outcome.status === "sent") {
    await settle(
      deps.supabase,
      reservation.notificationId,
      "sent",
      outcome.provider,
      outcome.messageId,
      null
    );
    return "sent";
  }
  if (outcome.status === "unknown") {
    await settle(
      deps.supabase,
      reservation.notificationId,
      "unknown",
      outcome.provider,
      null,
      outcome.errorCode
    );
    return "held";
  }
  await settle(
    deps.supabase,
    reservation.notificationId,
    "failed_before_send",
    outcome.provider,
    null,
    outcome.errorCode
  );
  return "failed";
}

export async function runEmailAlerts(deps: EmailAlertsDeps): Promise<EmailAlertsSummary> {
  const now = deps.now ?? new Date();
  const summary: EmailAlertsSummary = {
    reSnapshotted: 0,
    valueMovesSent: 0,
    rateAlertsSent: 0,
    savedSearchAlertsSent: 0,
    suppressed: 0,
    skipped: 0,
    held: 0,
    failed: 0
  };
  let attemptsThisRun = 0;

  const tally = (tag: SendTag, kind: NotificationKind): void => {
    if (tag === "sent") {
      if (kind === "home_value_move") summary.valueMovesSent += 1;
      else if (kind === "rate_threshold") summary.rateAlertsSent += 1;
      else summary.savedSearchAlertsSent += 1;
    } else if (tag === "held") {
      summary.held += 1;
    } else {
      summary.failed += 1;
    }
  };

  /* ---- (1) home-value moves ---- */
  const profiles = rowsOf(
    await deps.supabase
      .from("home_profiles")
      .select("owner_user_id, address_line1, address_city, address_state, address_postal_code")
      .eq("notify_value_change", true)
  );

  for (const profile of profiles) {
    const ownerUserId = asString(profile.owner_user_id);
    if (ownerUserId === null) {
      summary.skipped += 1;
      continue;
    }

    const latest = rowsOf(
      await deps.supabase
        .from("home_value_snapshots")
        .select("captured_on, estimated_value_cents")
        .eq("owner_user_id", ownerUserId)
        .order("captured_on", { ascending: false })
        .limit(1)
    )[0];
    const previousCapturedOn = latest === undefined ? null : asString(latest.captured_on);
    const previousValueCents = latest === undefined ? null : asNumber(latest.estimated_value_cents);
    // No baseline snapshot, or the latest is newer than the re-snapshot interval:
    // nothing to compare against yet, so this is a skip, not a send.
    if (
      previousCapturedOn === null ||
      previousValueCents === null ||
      !olderThanDays(previousCapturedOn, now, deps.resnapshotIntervalDays)
    ) {
      summary.skipped += 1;
      continue;
    }

    const address: Address = {
      line1: asString(profile.address_line1) ?? "",
      city: asString(profile.address_city) ?? "",
      state: asString(profile.address_state) ?? "",
      postalCode: asString(profile.address_postal_code) ?? ""
    };
    const lookup = await deps.property.lookup(address);
    if (lookup === null) {
      summary.skipped += 1;
      continue;
    }
    const facts = lookup.value;
    const newValueCents =
      facts.marketValueCents ?? facts.assessedValueCents ?? facts.lastSalePriceCents ?? null;
    if (newValueCents === null) {
      summary.skipped += 1;
      continue;
    }

    const capturedOn = isoDate(now);
    const source = lookup.provenance.provider === "fixture" ? "fixture" : "attom";
    const write = await deps.supabase.from("home_value_snapshots").upsert(
      {
        owner_user_id: ownerUserId,
        captured_on: capturedOn,
        estimated_value_cents: newValueCents,
        value_low_cents: facts.marketValueLowCents ?? null,
        value_high_cents: facts.marketValueHighCents ?? null,
        source
      },
      { onConflict: "owner_user_id,captured_on" }
    );
    if (isError(write)) {
      summary.skipped += 1;
      continue;
    }
    summary.reSnapshotted += 1;

    // Threshold as an exact integer comparison — no financial figure is computed
    // or displayed here (invariant 1): |new - prev| * 10000 >= thresholdBp * prev.
    const deltaCents = Math.abs(newValueCents - previousValueCents);
    const crossed = deltaCents * 10_000 >= deps.valueThresholdBp * previousValueCents;
    if (!crossed) {
      summary.skipped += 1;
      continue;
    }
    if (attemptsThisRun >= deps.maxPerRun) {
      summary.skipped += 1;
      continue;
    }

    const dedupeKey = `home_value_move:${ownerUserId}:${capturedOn}`;
    const reservation = await reserve(
      deps.supabase,
      "home_value_move",
      ownerUserId,
      dedupeKey,
      {
        previous_value_cents: previousValueCents,
        new_value_cents: newValueCents,
        captured_on: capturedOn
      },
      deps.runId,
      deps.dailyCap
    );
    if (reservation.kind !== "reserved") {
      if (reservation.kind === "suppressed") summary.suppressed += 1;
      else summary.skipped += 1;
      continue;
    }
    attemptsThisRun += 1;

    const cityValue = asString(profile.address_city);
    const message = buildValueMoveEmail({
      to: reservation.recipientEmail,
      from: deps.from,
      pepper: deps.hashPepper,
      appUrl: deps.appUrl,
      previousValueCents,
      newValueCents,
      ...(cityValue === null ? {} : { city: cityValue })
    });
    const tag = await sendAndSettle(deps, reservation, message, dedupeKey);
    tally(tag, "home_value_move");
    if (tag === "sent") {
      // Best-effort marker for a "last alerted" display. The dedupe key, not this
      // column, is what enforces one-send; a failure here never causes a resend.
      await deps.supabase
        .from("home_profiles")
        .update({ last_value_notified_on: capturedOn })
        .eq("owner_user_id", ownerUserId);
    }
  }

  /* ---- (2) rate thresholds ---- */
  const rateSourced = await deps.rateFeed.latest();
  if (rateSourced !== null) {
    const rates = rateSourced.value;
    const watches = rowsOf(
      await deps.supabase
        .from("rate_watches")
        .select("owner_user_id, term, target_rate_bp")
        .eq("notify_email", true)
    );

    for (const watch of watches) {
      const ownerUserId = asString(watch.owner_user_id);
      const term = asString(watch.term);
      const targetBp = asNumber(watch.target_rate_bp);
      if (ownerUserId === null || (term !== "thirtyYearFixed" && term !== "fifteenYearFixed")) {
        summary.skipped += 1;
        continue;
      }
      // A null target means "just tell me when it moves" — there is no threshold
      // to cross, so a threshold alert never fires for it.
      if (targetBp === null) {
        summary.skipped += 1;
        continue;
      }
      const currentBp =
        term === "thirtyYearFixed" ? rates.thirtyYearFixedBp : rates.fifteenYearFixedBp;
      // Crossed = the average reached at or below the level they are watching for.
      if (currentBp > targetBp) {
        summary.skipped += 1;
        continue;
      }
      if (attemptsThisRun >= deps.maxPerRun) {
        summary.skipped += 1;
        continue;
      }

      const dedupeKey = `rate_threshold:${ownerUserId}:${term}:${rates.asOfDate}`;
      const reservation = await reserve(
        deps.supabase,
        "rate_threshold",
        ownerUserId,
        dedupeKey,
        { term, current_rate_bp: currentBp, target_rate_bp: targetBp, as_of_date: rates.asOfDate },
        deps.runId,
        deps.dailyCap
      );
      if (reservation.kind !== "reserved") {
        if (reservation.kind === "suppressed") summary.suppressed += 1;
        else summary.skipped += 1;
        continue;
      }
      attemptsThisRun += 1;

      const message = buildRateThresholdEmail({
        to: reservation.recipientEmail,
        from: deps.from,
        pepper: deps.hashPepper,
        appUrl: deps.appUrl,
        term
      });
      const tag = await sendAndSettle(deps, reservation, message, dedupeKey);
      tally(tag, "rate_threshold");
    }
  }

  /* ---- (3) saved-search listing matches ---- */
  // Dark-gate (invariant 6): a fixture or disabled provider can never publish a
  // listing, so the whole loop is skipped — nothing is queried, reserved, or
  // sent. This is why the feature ships dark today: there is no licensed feed.
  if (deps.listings.key !== "fixture" && deps.listings.key !== "disabled") {
    const searches = rowsOf(
      await deps.supabase
        .from("saved_searches")
        .select("id, owner_user_id, search_params, alert_watermark")
        .eq("alerts_enabled", true)
    );

    for (const search of searches) {
      const savedSearchId = asString(search.id);
      const ownerUserId = asString(search.owner_user_id);
      if (savedSearchId === null || ownerUserId === null) {
        summary.skipped += 1;
        continue;
      }
      const searchParams = asString(search.search_params) ?? "";
      const watermark = asString(search.alert_watermark);

      // Cold start: the first run after opt-in seeds the baseline to now() and
      // sends nothing, so a newly enabled search is never blasted with the whole
      // existing backlog. Only listings modified after this baseline can alert.
      if (watermark === null) {
        await deps.supabase
          .from("saved_searches")
          .update({
            alert_watermark: now.toISOString(),
            alert_last_checked_at: now.toISOString()
          })
          .eq("id", savedSearchId);
        summary.skipped += 1;
        continue;
      }

      // A provider outage on one search must never abort the run or advance a
      // watermark; the next tick simply retries this search.
      // Fetch the whole new-since-watermark set (SAVED_SEARCH_FETCH_LIMIT), not
      // just the email cap: selectNewMatches then drains it oldest-first and caps
      // the email, so a burst larger than the cap is delivered across runs with
      // nothing skipped. Fetching only the cap would truncate the oldest overflow
      // and the watermark would step past listings that were never fetched.
      const page = await deps.listings
        .search(parseSavedSearchQuery({ searchParams }, { limit: SAVED_SEARCH_FETCH_LIMIT }))
        .catch(() => null);
      if (page === null) {
        summary.skipped += 1;
        continue;
      }

      const { matches, newWatermark } = selectNewMatches(
        page.items,
        watermark,
        deps.savedSearchMaxMatches
      );

      // Record that we looked, regardless of whether anything was new.
      await deps.supabase
        .from("saved_searches")
        .update({ alert_last_checked_at: now.toISOString() })
        .eq("id", savedSearchId);

      if (matches.length === 0) {
        summary.skipped += 1;
        continue;
      }
      if (attemptsThisRun >= deps.maxPerRun) {
        summary.skipped += 1;
        continue;
      }

      // Deterministic per (search, batch): re-selection after a crash between the
      // send and the watermark write reproduces this exact key, so the ledger's
      // unique (kind, dedupe_key) collapses it to a single email.
      const dedupeKey = `saved_search_match:${savedSearchId}:${newWatermark}`;
      const reservation = await reserve(
        deps.supabase,
        "saved_search_match",
        ownerUserId,
        dedupeKey,
        {
          saved_search_id: savedSearchId,
          match_count: matches.length,
          new_watermark: newWatermark,
          listing_keys: matches.map((listing) => listing.listingKey)
        },
        deps.runId,
        deps.dailyCap
      );
      if (reservation.kind !== "reserved") {
        if (reservation.kind === "suppressed") summary.suppressed += 1;
        else summary.skipped += 1;
        continue;
      }
      attemptsThisRun += 1;

      const message = buildSavedSearchEmail({
        to: reservation.recipientEmail,
        from: deps.from,
        pepper: deps.hashPepper,
        appUrl: deps.appUrl,
        searchParams,
        matchCount: matches.length
      });
      const tag = await sendAndSettle(deps, reservation, message, dedupeKey);
      tally(tag, "saved_search_match");
      if (tag === "sent") {
        // Advance the watermark only on a confirmed send (invariant 8). A definite
        // failure leaves the ledger row 'failed' and the watermark unmoved, so the
        // batch is retried next run; an unknown outcome holds the reservation and
        // leaves the watermark, so it is never resent and awaits reconciliation.
        await deps.supabase
          .from("saved_searches")
          .update({
            alert_watermark: newWatermark,
            alert_last_notified_at: now.toISOString()
          })
          .eq("id", savedSearchId);
      }
    }
  }

  return summary;
}
