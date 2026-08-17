import { safeLandingPath } from "@tract/analytics";
import type { LeadAttributionTouch } from "@tract/schemas";

type StoredTouch = {
  landingPath?: string;
  referrerHost?: string;
  occurredAt?: string;
  params?: Record<string, string>;
};

export function readStoredTouch(key: string): StoredTouch {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? {} : (JSON.parse(raw) as StoredTouch);
  } catch {
    return {};
  }
}

export function attributionTouch(touch: StoredTouch, fallbackPath: string): LeadAttributionTouch {
  const params = touch.params ?? {};
  return {
    landingPath: safeLandingPath(touch.landingPath ?? fallbackPath),
    ...(touch.referrerHost === undefined ? {} : { referrerHost: touch.referrerHost }),
    occurredAt: touch.occurredAt ?? new Date().toISOString(),
    ...(params.utm_source === undefined ? {} : { utmSource: params.utm_source }),
    ...(params.utm_medium === undefined ? {} : { utmMedium: params.utm_medium }),
    ...(params.utm_campaign === undefined ? {} : { utmCampaign: params.utm_campaign }),
    ...(params.utm_content === undefined ? {} : { utmContent: params.utm_content }),
    ...(params.utm_term === undefined ? {} : { utmTerm: params.utm_term }),
    ...(params.gclid === undefined ? {} : { gclid: params.gclid }),
    ...(params.gbraid === undefined ? {} : { gbraid: params.gbraid }),
    ...(params.wbraid === undefined ? {} : { wbraid: params.wbraid }),
    ...(params.msclkid === undefined ? {} : { msclkid: params.msclkid }),
    ...(params.fbclid === undefined ? {} : { fbclid: params.fbclid })
  };
}

export function currentAttributionTouch(pathname: string): LeadAttributionTouch {
  const landingPath = safeLandingPath(pathname);
  return attributionTouch({ landingPath, occurredAt: new Date().toISOString() }, landingPath);
}
