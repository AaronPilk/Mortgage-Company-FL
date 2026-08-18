import { z } from "zod";

/**
 * Natural-language property search interpretation.
 *
 * The request is one field of free text. It is search input, not a contact
 * form: no identifier, no PII field, and the raw text is never logged at info
 * level or echoed back into markup — the response restates the *parsed*
 * criteria, never the input.
 */

export const INTERPRET_QUERY_MAX_LENGTH = 300;

export const PropertyInterpretRequestSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "Describe what you are looking for.")
    .max(INTERPRET_QUERY_MAX_LENGTH, "Keep the description under 300 characters.")
});

export type PropertyInterpretRequest = z.infer<typeof PropertyInterpretRequestSchema>;

/**
 * How the criteria were produced. Rendered to the consumer, so it must be
 * honest: "ai" only when a model actually interpreted the text, "rules" when
 * the deterministic parser did. A rules result must never be labelled as AI.
 */
export const InterpretSourceSchema = z.enum(["ai", "rules"]);
export type InterpretSource = z.infer<typeof InterpretSourceSchema>;
