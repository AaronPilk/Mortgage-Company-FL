/**
 * Ad-share suppression check for the Meta Conversions dispatch.
 *
 * Before a lead's hashed identifiers are sent to Meta, the drain asks this: has
 * the person opted out of having their data shared with an ad platform? A match
 * on either the global 'all' opt-out or the dedicated do-not-sell/share 'ads'
 * channel blocks the send. Email and phone are matched separately with `.eq()`
 * (never interpolated into a filter string), so a crafted value can't widen the
 * query.
 *
 * It FAILS CLOSED: if the suppression table can't be read, the person's status
 * is unknown, so the conversion is skipped rather than sent. Meta CAPI is a
 * best-effort optimization signal — never sharing on doubt is the safe default,
 * and a re-drain retries once the lookup recovers.
 */

/** The suppression channels that block an ad-platform send: a global opt-out, or do-not-sell/share. */
export const AD_SUPPRESSION_CHANNELS = ["all", "ads"] as const;

type SuppressionQueryResult = { data: unknown[] | null; error: unknown };

/** The minimal slice of a Supabase-like client this check needs. */
export type SuppressionDb = {
  from(table: string): {
    select(columns: string): {
      in(
        column: string,
        values: readonly string[]
      ): {
        eq(
          column: string,
          value: string
        ): {
          limit(count: number): PromiseLike<SuppressionQueryResult>;
        };
      };
    };
  };
};

async function channelHit(db: SuppressionDb, column: string, value: string): Promise<boolean> {
  try {
    const { data, error } = await db
      .from("suppressions")
      .select("id")
      .in("channel", AD_SUPPRESSION_CHANNELS)
      .eq(column, value)
      .limit(1);
    // Fail closed: an unreadable suppression table means unknown status, so treat
    // the lead as suppressed and do not share.
    if (error !== null && error !== undefined) return true;
    return Array.isArray(data) && data.length > 0;
  } catch {
    return true;
  }
}

/**
 * True when the lead has opted out of ad-platform data sharing (global 'all' or
 * 'ads'), on either their email or phone. Absent identifiers are skipped; a
 * lookup error is treated as suppressed.
 */
export async function leadAdSuppressed(
  db: SuppressionDb,
  emailNormalized: string | undefined | null,
  phoneE164: string | undefined | null
): Promise<boolean> {
  if (typeof emailNormalized === "string" && emailNormalized !== "") {
    if (await channelHit(db, "email_normalized", emailNormalized)) return true;
  }
  if (typeof phoneE164 === "string" && phoneE164 !== "") {
    if (await channelHit(db, "phone_e164", phoneE164)) return true;
  }
  return false;
}
