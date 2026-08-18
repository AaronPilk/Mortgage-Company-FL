import "server-only";
import {
  DisabledListingProvider,
  FixtureListingProvider,
  type ListingProvider
} from "@tract/integrations";
import { env } from "./env";

/**
 * Listing provider selection.
 *
 * A contracted provider (Stellar, MLS Grid, Bridge) is implemented only against
 * real credentials and the actual display agreement. Until then the choice is
 * fixtures in development or nothing at all — never a scraped or invented feed.
 */
export function listings(): ListingProvider {
  switch (env().MLS_PROVIDER) {
    case "fixture":
      return new FixtureListingProvider();
    case "stellar":
    case "bridge":
    case "mlsgrid":
      // Blocked: requires an executed data agreement, credentials, and a
      // documented display contract. See docs/integrations/mls.md.
      return new DisabledListingProvider();
    default:
      return new DisabledListingProvider();
  }
}

/**
 * Read-only access to the explicitly labelled local sample catalogue. Account
 * validation uses this even when the runtime listing provider is disabled so a
 * previously saved sample key can still be identified without weakening the
 * production fixture display gate.
 */
export function demoListings(): ListingProvider {
  return new FixtureListingProvider();
}

/**
 * Whether sample listings may be rendered.
 *
 * Outside production the answer is always yes. In production it takes a second,
 * deliberate opt-in — `SHOW_SAMPLE_LISTINGS=true` on top of
 * `MLS_PROVIDER=fixture`. Two independent switches, because the failure this
 * guards against is not "someone decided to show sample data", it is "sample
 * data shipped because nobody noticed the provider was still on its default".
 *
 * The opt-in exists because sample listings are a deliberate pre-MLS product
 * decision (docs/handoff/DECISIONS.md). It is safe to turn on only because the
 * listing surfaces label every record as sample data in the UI, stay noindex,
 * and emit no listing structured data. If any of those three stop being true,
 * this switch has to go back to being unconditional.
 */
export function fixturesAllowed(): boolean {
  if (env().NODE_ENV !== "production") return true;
  return env().MLS_PROVIDER === "fixture" && env().SHOW_SAMPLE_LISTINGS === true;
}
