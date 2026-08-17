"use client";

import { useEffect } from "react";
import {
  ATTRIBUTION_RETENTION_DAYS,
  FIRST_TOUCH_STORAGE_KEY,
  LAST_TOUCH_STORAGE_KEY,
  buildTouch
} from "@tract/analytics";

/**
 * First- and last-touch attribution.
 *
 * Only allow-listed parameters are stored, values are length-bounded, and the
 * referrer is reduced to its host. First touch is written once and never
 * overwritten; last touch is refreshed on every visit that carries parameters.
 *
 * This runs regardless of marketing-tag consent because it is first-party data
 * used to route and credit an inquiry the consumer chose to submit. Analytics
 * and advertising tags are separate and remain consent-gated.
 */
export function AttributionCapture() {
  useEffect(() => {
    try {
      const touch = buildTouch({
        url: new URL(window.location.href),
        referrer: document.referrer,
        occurredAt: new Date().toISOString()
      });

      const hasParams = Object.keys(touch.params).length > 0;
      const payload = JSON.stringify({ ...touch, expiresInDays: ATTRIBUTION_RETENTION_DAYS });

      if (window.localStorage.getItem(FIRST_TOUCH_STORAGE_KEY) === null) {
        window.localStorage.setItem(FIRST_TOUCH_STORAGE_KEY, payload);
      }
      if (hasParams || window.localStorage.getItem(LAST_TOUCH_STORAGE_KEY) === null) {
        window.localStorage.setItem(LAST_TOUCH_STORAGE_KEY, payload);
      }
    } catch {
      // Storage can be unavailable in private modes. Attribution is a
      // nice-to-have; it must never break the page or block a conversion.
    }
  }, []);

  return null;
}
