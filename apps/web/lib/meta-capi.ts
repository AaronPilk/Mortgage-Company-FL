import "server-only";
import {
  type MetaCapiPort,
  DisabledMetaCapiAdapter,
  FixtureMetaCapiAdapter,
  RealMetaCapiAdapter
} from "@tract/integrations";
import { env } from "./env";
import { SITE_URL, isPreLaunch } from "./site";

/**
 * Meta Conversions API selection.
 *
 * Mirrors the CRM factory: a memoized instance chosen from the environment mode.
 * A live mode with the pixel id and access token present builds the real
 * adapter; a live mode missing either credential falls back to Disabled rather
 * than guessing — the same fail-safe posture as the CRM. Everything else is
 * Disabled, so the feature is dark until it is explicitly configured.
 *
 * LICENSING INTERLOCK: sending hashed identifiers to Meta is paid-advertising
 * infrastructure, and the company rule (lib/site.ts) is that paid mortgage
 * advertising stays off until the business is licensed. So while isPreLaunch()
 * is true, a live mode still resolves to Disabled — a single env flip cannot put
 * real consumer identifiers on an ad platform before licensing and the
 * advertising-review gate clear. Fixture stays available for development.
 */

let instance: MetaCapiPort | undefined;

export function metaCapi(): MetaCapiPort {
  if (instance !== undefined) return instance;
  const configuration = env();

  switch (configuration.META_CAPI_MODE) {
    case "fixture":
      instance = new FixtureMetaCapiAdapter();
      break;
    case "sandbox":
    case "production": {
      const pixelId = configuration.META_PIXEL_ID;
      const accessToken = configuration.META_CAPI_ACCESS_TOKEN;
      // Hard interlock: no real send unless BOTH the code-level licensing signal
      // (isPreLaunch is false) AND the explicit operational clearance
      // (META_CAPI_LIVE_CLEARED) say go — plus the credentials. A live mode alone
      // never turns Meta on. The worker path gates on the same env clearance.
      if (
        isPreLaunch() ||
        !configuration.META_CAPI_LIVE_CLEARED ||
        pixelId === undefined ||
        accessToken === undefined
      ) {
        instance = new DisabledMetaCapiAdapter();
        break;
      }
      instance = new RealMetaCapiAdapter({
        pixelId,
        accessToken,
        siteBaseUrl: SITE_URL,
        ...(configuration.META_CAPI_TEST_EVENT_CODE === undefined
          ? {}
          : { testEventCode: configuration.META_CAPI_TEST_EVENT_CODE })
      });
      break;
    }
    default:
      instance = new DisabledMetaCapiAdapter();
  }
  return instance;
}

/** Test seam so a route test can inject a double without touching the environment. */
export function __setMetaCapiForTesting(port: MetaCapiPort | undefined): void {
  instance = port;
}
