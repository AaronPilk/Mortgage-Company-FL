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

export const NotificationPreferencesRequestSchema = z.object({
  reportReadyEmail: z.boolean(),
  reportFailureEmail: z.boolean()
});

export const PrivacyRequestSchema = z.object({
  requestId: z.string().uuid(),
  requestType: z.enum(["export", "delete"])
});
