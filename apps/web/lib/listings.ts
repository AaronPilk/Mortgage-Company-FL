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

export function fixturesAllowed(): boolean {
  return env().NODE_ENV !== "production";
}
