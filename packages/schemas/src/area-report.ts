import { z } from "zod";

/**
 * AI-written area-report contract.
 *
 * PROSE ONLY, by construction. There is deliberately not one numeric field: every
 * figure a reader sees on a county page (down-payment caps, flood posture) is
 * server-rendered from the sourced libraries, never authored by the model
 * (invariant 6). This schema is the FIRST line of defense — `.strict()` plus zero
 * number fields means a model that emits a numeric property fails validation and
 * the caller falls back to a deterministic template. `scrubReport` in
 * apps/web/lib/area-report.ts is the second line, catching a figure smuggled
 * inside a prose string.
 *
 * The shape mirrors the EXTRACTION_TOOL / ASSISTANT_TOOL convention: a Zod schema
 * that validates the returned tool call, and a JSON-schema tool definition the
 * provider is constrained to.
 */

export const AreaReportSchema = z
  .object({
    overview: z.string().trim().min(80).max(600),
    lifestyle: z.string().trim().min(60).max(500),
    buyingConsiderations: z.string().trim().min(80).max(600),
    neighborhoodsProse: z.string().trim().min(60).max(500),
    /** Optional short prose bullets. Still prose, still no numbers. */
    highlights: z.array(z.string().trim().min(20).max(160)).max(4).optional()
  })
  .strict();

export type AreaReport = z.infer<typeof AreaReportSchema>;

/**
 * Model output → AreaReport. Untrusted input: anything that is not exactly the
 * prose shape (a stray numeric field, a missing section, a truncated string)
 * fails, and the caller renders the deterministic template instead of partial
 * model JSON.
 */
export function parseAreaReport(output: unknown): { ok: true; value: AreaReport } | { ok: false } {
  const parsed = AreaReportSchema.safeParse(output);
  return parsed.success ? { ok: true, value: parsed.data } : { ok: false };
}

/**
 * The forced tool call the provider must fill. Every property is a string (or an
 * array of strings) with a length bound — there is no `integer` or `number`
 * anywhere, so the model cannot express a figure through the schema at all.
 */
export const AREA_REPORT_TOOL = {
  name: "area_report",
  description:
    "Record a short, plain-language narrative about what it is like to buy a home in this Florida " +
    "county. Prose only. Never include any number, dollar amount, percentage, price, rating, " +
    "ranking, score, or statistic — those are shown separately from verified data. Refer only to " +
    "the places and facts provided; never invent a neighborhood, school, or program.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["overview", "lifestyle", "buyingConsiderations", "neighborhoodsProse"],
    properties: {
      overview: { type: "string", minLength: 80, maxLength: 600 },
      lifestyle: { type: "string", minLength: 60, maxLength: 500 },
      buyingConsiderations: { type: "string", minLength: 80, maxLength: 600 },
      neighborhoodsProse: { type: "string", minLength: 60, maxLength: 500 },
      highlights: {
        type: "array",
        maxItems: 4,
        items: { type: "string", minLength: 20, maxLength: 160 }
      }
    }
  } as Record<string, unknown>
} as const;

/**
 * Request body for POST /api/v1/area-report. Only a county slug travels the wire:
 * the report is public county content, not a consumer's own words, so there is no
 * identity field. The route resolves the slug to a real county (and 400s an
 * unknown one), the same way the interpret route resolves listings — this schema
 * stays free of app-layer imports.
 */
export const AreaReportRequestSchema = z.object({
  county: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Not a county slug.")
    .max(40)
});

export type AreaReportRequest = z.infer<typeof AreaReportRequestSchema>;
