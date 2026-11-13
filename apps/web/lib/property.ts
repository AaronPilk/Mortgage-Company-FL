import "server-only";
import {
  type FloodPort,
  type PropertyFactsPort,
  AttomPropertyFactsPort,
  DisabledPropertyFactsPort,
  FemaFloodPort,
  FixtureFloodPort,
  FixturePropertyFactsPort
} from "@tract/integrations";
import { env, publicFeatures } from "./env";

/**
 * Property-facts provider selection.
 *
 * `disabled` is the default: no key, no lookup. `fixture` is the deterministic
 * double for development and tests. A live mode builds the ATTOM adapter from
 * the injected key. The selection mirrors `crm()` / `listings()` so the whole
 * platform turns providers on the same way.
 */

let instance: PropertyFactsPort | undefined;

export function propertyFacts(): PropertyFactsPort {
  if (instance !== undefined) return instance;
  const configuration = env();

  switch (configuration.ATTOM_MODE) {
    case "fixture":
      instance = new FixturePropertyFactsPort();
      break;
    case "sandbox":
    case "production": {
      const apiKey = configuration.ATTOM_API_KEY;
      if (apiKey === undefined) {
        instance = new DisabledPropertyFactsPort();
        break;
      }
      instance = new AttomPropertyFactsPort({ apiKey });
      break;
    }
    default:
      instance = new DisabledPropertyFactsPort();
  }
  return instance;
}

/**
 * Whether the home-lookup surface may serve a consumer right now.
 *
 * Mirrors `fixturesAllowed()` for listings: the feature flag and a non-disabled
 * ATTOM mode are necessary, and fixture property data is allowed only outside
 * production — invented facts must never publish (invariant 6).
 */
export function homeLookupAvailable(): boolean {
  if (!publicFeatures().homeLookup) return false;
  const configuration = env();
  const mode = configuration.ATTOM_MODE;
  if (mode === "sandbox" || mode === "production") return true;
  // Fixture property data always renders outside production, and in production
  // only behind the explicit sample-data switch — labelled in the response —
  // mirroring SHOW_SAMPLE_LISTINGS for the listing surface.
  return (
    mode === "fixture" &&
    (configuration.NODE_ENV !== "production" || configuration.SHOW_SAMPLE_PROPERTY_DATA)
  );
}

/**
 * Whether the homeowner value dashboard may bill a valuation right now. Same
 * ATTOM-mode + sample-data discipline as `homeLookupAvailable()`, gated on its
 * own feature flag: a live mode always serves; fixture value data serves only
 * outside production or behind the explicit sample switch (invariant 6).
 */
export function homeValueAvailable(): boolean {
  if (!publicFeatures().homeValue) return false;
  const configuration = env();
  const mode = configuration.ATTOM_MODE;
  if (mode === "sandbox" || mode === "production") return true;
  return (
    mode === "fixture" &&
    (configuration.NODE_ENV !== "production" || configuration.SHOW_SAMPLE_PROPERTY_DATA)
  );
}

/**
 * Whether the seller funnel may show an AVM figure right now.
 *
 * The "what's my home worth" funnel itself is gated on the sellerTools flag
 * alone (no external dependency) — it renders and captures a seller lead even
 * with ATTOM dark. The VALUE it shows, though, is a licensed automated
 * valuation, so it inherits the same ATTOM-mode discipline as
 * `homeValueAvailable()`: a live mode always serves; fixture value serves only
 * outside production or behind the explicit sample switch. When this returns
 * false the funnel shows no number and never fabricates one (invariant 6); the
 * lead capture is unaffected.
 */
export function sellerAvmAvailable(): boolean {
  if (!publicFeatures().sellerTools) return false;
  const configuration = env();
  const mode = configuration.ATTOM_MODE;
  if (mode === "sandbox" || mode === "production") return true;
  return (
    mode === "fixture" &&
    (configuration.NODE_ENV !== "production" || configuration.SHOW_SAMPLE_PROPERTY_DATA)
  );
}

/** Test seam so a route test can inject a double without touching the environment. */
export function __setPropertyFactsForTesting(port: PropertyFactsPort | undefined): void {
  instance = port;
}

let floodInstance: FloodPort | undefined;

export function floodProvider(): FloodPort {
  if (floodInstance !== undefined) return floodInstance;
  floodInstance = env().FLOOD_MODE === "fixture" ? new FixtureFloodPort() : new FemaFloodPort();
  return floodInstance;
}

/**
 * Whether a flood answer may be shown. Live FEMA is always fine; fixture flood
 * is allowed only outside production, because a wrong flood zone in front of a
 * real buyer is worse than none (invariant 6, applied to a safety-relevant fact).
 */
export function floodLookupAllowed(): boolean {
  const mode = env().FLOOD_MODE;
  if (mode === "sandbox" || mode === "production") return true;
  return mode === "fixture" && env().NODE_ENV !== "production";
}

export function __setFloodForTesting(port: FloodPort | undefined): void {
  floodInstance = port;
}
