import { z } from "zod";
import { PlanningSnapshotSchema } from "./lead";

/** Bounded writes available to an authenticated consumer account. */
export const SavePropertyRequestSchema = z.object({
  listingKey: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[A-Z0-9-]+$/),
  sourceMode: z.enum(["fixture", "live"])
});

export const SaveScenarioRequestSchema = z.object({
  saveId: z.string().uuid(),
  snapshot: PlanningSnapshotSchema
});

/**
 * A saved property search. The payload is the raw query string of the current
 * /properties URL; the server re-parses it with the same schema the search
 * page uses and stores only the canonical serialization, so a hostile string
 * cannot become stored state.
 */
export const SaveSearchRequestSchema = z.object({
  saveId: z.string().uuid(),
  search: z.string().max(512)
});

/**
 * Toggle whether a saved search emails the owner when new listings match it. The
 * write targets one owned row (RLS plus a column-scoped grant limit it to the
 * alerts_enabled column); the watermark baseline is seeded server-side by the
 * alert loop, never by the browser.
 */
export const SavedSearchAlertRequestSchema = z.object({
  saveId: z.string().uuid(),
  alertsEnabled: z.boolean()
});

export const NotificationPreferencesRequestSchema = z.object({
  reportReadyEmail: z.boolean(),
  reportFailureEmail: z.boolean()
});

export const PrivacyRequestSchema = z.object({
  requestId: z.string().uuid(),
  requestType: z.enum(["export", "delete"])
});

/**
 * Saved affordability profile: the estimate inputs a signed-in visitor keeps so
 * the site can personalise "what can I afford". Whole-dollar figures the visitor
 * typed into an estimate and a self-selected credit bucket — never an
 * application, a pulled score, or documentation.
 */
export const AffordabilityProfileSchema = z.object({
  annualIncome: z.number().int().min(0).max(100_000_000),
  downPayment: z.number().int().min(0).max(100_000_000),
  monthlyDebts: z.number().int().min(0).max(1_000_000),
  creditBand: z.enum(["excellent", "good", "fair", "building"])
});
export type AffordabilityProfileInput = z.infer<typeof AffordabilityProfileSchema>;

/**
 * Homeowner value dashboard.
 *
 * A homeowner's own address plus the mortgage balance they estimate they still
 * owe — self-entered planning figures, never an application, a credit pull, or a
 * government identifier. The address drives an automated valuation (AVM); the
 * balance only powers the estimated-equity figure. `HomeValueLookupSchema`
 * carries both for the look-up-and-save write (which can bill the valuation
 * provider); `HomeBalanceSchema` updates just the balance with no provider call.
 */
const HomeAddressSchema = z.object({
  line1: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(120),
  state: z
    .string()
    .trim()
    .length(2)
    .transform((s) => s.toUpperCase()),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/)
});

export const HomeValueLookupSchema = z.object({
  address: HomeAddressSchema,
  estimatedBalance: z.number().int().min(0).max(100_000_000)
});
export type HomeValueLookupInput = z.infer<typeof HomeValueLookupSchema>;

export const HomeBalanceSchema = z.object({
  estimatedBalance: z.number().int().min(0).max(100_000_000),
  /** Optional self-entered current mortgage rate (percentage) — powers the refi signal, never a quote. */
  currentRatePercent: z.number().min(0).max(50).optional()
});
export type HomeBalanceInput = z.infer<typeof HomeBalanceSchema>;

/**
 * Rate watch: which market average a signed-in visitor is tracking and whether
 * they want an email when it moves. The optional target is the visitor's own
 * aspiration (a percentage they'd like to see) — never a rate we quote or offer.
 */
export const RateWatchSchema = z.object({
  term: z.enum(["thirtyYearFixed", "fifteenYearFixed"]),
  targetRatePercent: z.number().min(0).max(20).optional(),
  notifyEmail: z.boolean()
});
export type RateWatchInput = z.infer<typeof RateWatchSchema>;
