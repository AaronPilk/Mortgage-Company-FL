import "server-only";
import {
  type CrmPort,
  DisabledCrmAdapter,
  FixtureCrmAdapter,
  GhlCrmAdapter
} from "@tract/integrations";
import { env } from "./env";

/**
 * CRM selection.
 *
 * Field and pipeline identifiers are configuration, loaded from the environment
 * as JSON so a GoHighLevel rebuild is a deployment variable change rather than a
 * code change. A parse failure falls back to an empty map, which means fields
 * are simply not transmitted — never that an unmapped value is guessed.
 */

let instance: CrmPort | undefined;

function parseMap<T>(raw: string | undefined, fallback: T): T {
  if (raw === undefined || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function crm(): CrmPort {
  if (instance !== undefined) return instance;
  const configuration = env();

  switch (configuration.GHL_MODE) {
    case "fixture":
      instance = new FixtureCrmAdapter();
      break;
    case "sandbox":
    case "production": {
      const token = configuration.GHL_PRIVATE_INTEGRATION_TOKEN;
      const locationId = configuration.GHL_LOCATION_ID;
      if (token === undefined || locationId === undefined) {
        instance = new DisabledCrmAdapter();
        break;
      }
      instance = new GhlCrmAdapter({
        baseUrl: configuration.GHL_API_BASE_URL,
        apiVersion: configuration.GHL_API_VERSION,
        token,
        locationId,
        customFieldMap: parseMap<Record<string, string>>(process.env.GHL_CUSTOM_FIELD_MAP, {}),
        pipelineMap: parseMap(process.env.GHL_PIPELINE_MAP, {})
      });
      break;
    }
    default:
      instance = new DisabledCrmAdapter();
  }
  return instance;
}

/** Test seam so a route test can inject a double without touching the environment. */
export function __setCrmForTesting(port: CrmPort | undefined): void {
  instance = port;
}
