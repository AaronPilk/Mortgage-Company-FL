import "server-only";
import {
  DisabledEmailPort,
  DisabledListingProvider,
  DisabledPropertyFactsPort,
  DisabledRateFeedPort,
  FixtureEmailPort,
  ResendEmailPort,
  runEmailAlerts,
  type EmailAlertsDb,
  type EmailAlertsSummary,
  type EmailPort
} from "@tract/integrations";
import { env, features } from "./env";
import { listings } from "./listings";
import { homeValueAvailable, propertyFacts } from "./property";
import { rateFeed, rateWatchAvailable } from "./rates";
import { SITE_URL } from "./site";
import { createServiceClient } from "./supabase";

/**
 * Engagement email — server wrapper.
 *
 * The portable engine lives in `@tract/integrations` so the Worker cron can run
 * it directly. This wrapper is the Next-side seam: it selects the email adapter
 * from `EMAIL_MODE` (mirroring `rateFeed()` / `propertyFacts()`), decides which
 * loops may run at all, and assembles the injected `deps` from the environment
 * and the service client. Every secret stays behind `server-only`.
 */

let instance: EmailPort | undefined;

export function emailProvider(): EmailPort {
  if (instance !== undefined) return instance;
  const configuration = env();
  switch (configuration.EMAIL_MODE) {
    case "fixture":
      instance = new FixtureEmailPort();
      break;
    case "sandbox":
    case "production": {
      const apiKey = configuration.RESEND_API_KEY;
      const from = configuration.EMAIL_FROM;
      instance =
        apiKey === undefined || from === undefined
          ? new DisabledEmailPort()
          : new ResendEmailPort({ apiKey, from });
      break;
    }
    default:
      instance = new DisabledEmailPort();
  }
  return instance;
}

/** True when the email transport can actually send (or is the dev fixture outside production). */
function emailModeUsable(): boolean {
  const mode = env().EMAIL_MODE;
  if (mode === "sandbox" || mode === "production") return true;
  return mode === "fixture" && env().NODE_ENV !== "production";
}

/**
 * Which engagement loops may run right now. Each requires the alerts feature, a
 * usable email transport, and its own source surface to be live. The
 * home-value/rate-watch availability checks already refuse fixture data in
 * production (invariant 6), so a fabricated value or rate can never be emailed.
 */
export function emailAlertsAvailable(): {
  homeValue: boolean;
  rateWatch: boolean;
  savedSearch: boolean;
} {
  if (!features().emailAlerts || !emailModeUsable()) {
    return { homeValue: false, rateWatch: false, savedSearch: false };
  }
  // Saved-search alerts need a licensed listing feed — never fixture or disabled —
  // so a synthetic listing can never become an email (invariant 6). The loop is
  // dark-gated on the provider key too; this is the belt to that suspenders.
  const provider = env().MLS_PROVIDER;
  const savedSearch =
    features().savedSearchAlerts && provider !== "disabled" && provider !== "fixture";
  return { homeValue: homeValueAvailable(), rateWatch: rateWatchAvailable(), savedSearch };
}

/**
 * Build the injected dependencies from the environment and the service client,
 * then run both loops. Returns null when no database is configured. A loop whose
 * surface is not available is fed a disabled provider, so it produces no sends —
 * fixture data never publishes as a real alert.
 */
export async function runEmailAlertsFromEnv(runId: string): Promise<EmailAlertsSummary | null> {
  const supabase = createServiceClient();
  if (supabase === null) return null;

  const configuration = env();
  const availability = emailAlertsAvailable();
  const property = availability.homeValue ? propertyFacts() : new DisabledPropertyFactsPort();
  const feed = availability.rateWatch ? rateFeed() : new DisabledRateFeedPort();
  // A disabled provider makes the saved-search loop a no-op via its dark-gate, so
  // fixture data never publishes as a real alert (mirrors the two loops above).
  const listingProvider = availability.savedSearch ? listings() : new DisabledListingProvider();

  return runEmailAlerts({
    supabase: supabase as unknown as EmailAlertsDb,
    email: emailProvider(),
    rateFeed: feed,
    property,
    listings: listingProvider,
    runId,
    maxPerRun: configuration.EMAIL_ALERTS_MAX_PER_RUN,
    dailyCap: configuration.EMAIL_ALERTS_DAILY_CAP,
    valueThresholdBp: configuration.HOME_VALUE_ALERT_THRESHOLD_BP,
    resnapshotIntervalDays: configuration.HOME_VALUE_RESNAPSHOT_INTERVAL_DAYS,
    savedSearchMaxMatches: configuration.SAVED_SEARCH_ALERT_MAX_MATCHES,
    from: configuration.EMAIL_FROM ?? "",
    hashPepper: configuration.HASH_PEPPER,
    appUrl: SITE_URL
  });
}

/** Test seam: inject a double and clear the cached provider. */
export function __setEmailProviderForTesting(port: EmailPort | undefined): void {
  instance = port;
}
