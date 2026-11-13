/**
 * Client-side referral memory.
 *
 * When a visitor arrives on /r/<agent-slug>, that slug is remembered here so a
 * lead they submit later — on any page, in a different session that day or
 * weeks on — still carries the referring agent. It mirrors the attribution
 * store next door: same localStorage discipline, same defensive try/catch, and
 * the same rule that a storage failure is silent and never blocks a form.
 *
 * What is stored is only an agent slug and when it was captured. The slug is
 * public (it is the profile URL), it is never trusted on its own — the server
 * re-checks it against the public directory before any attribution — and it is
 * not personal data. The 90-day horizon keeps a stale link from crediting an
 * agent for a visit that is no longer plausibly theirs.
 */

const REFERRAL_STORAGE_KEY = "tract.referral";

/** Ninety days. A referral older than this is treated as expired and ignored. */
const REFERRAL_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

/** Same shape the schema and the server resolver enforce. */
const AGENT_SLUG_PATTERN = /^[a-z0-9-]{1,80}$/;

type StoredReferral = {
  slug: string;
  storedAt: string;
};

function normalizeSlug(value: string): string | undefined {
  const slug = value.trim().toLowerCase();
  return AGENT_SLUG_PATTERN.test(slug) ? slug : undefined;
}

/**
 * Remember a referring agent slug. First write wins for the retention window:
 * if a live referral is already stored, an additional visit does not overwrite
 * it, so the agent who actually introduced the visitor keeps the credit rather
 * than the last link they happened to click. An invalid slug is ignored.
 */
export function storeReferral(rawSlug: string): void {
  const slug = normalizeSlug(rawSlug);
  if (slug === undefined) return;
  try {
    if (readReferralSlug() !== undefined) return;
    const record: StoredReferral = { slug, storedAt: new Date().toISOString() };
    window.localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* Private mode, disabled storage, or a quota error — a referral is a
       nice-to-have, never a reason to interrupt the visitor. */
  }
}

/**
 * The remembered slug, or undefined when there is none, it is malformed, or it
 * has aged out. Read defensively: anything unparseable clears to "no referral"
 * rather than throwing into a form submission.
 */
export function readReferralSlug(): string | undefined {
  try {
    const raw = window.localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (raw === null) return undefined;
    const parsed = JSON.parse(raw) as Partial<StoredReferral>;
    if (typeof parsed.slug !== "string" || typeof parsed.storedAt !== "string") return undefined;
    const slug = normalizeSlug(parsed.slug);
    if (slug === undefined) return undefined;
    const storedAt = Date.parse(parsed.storedAt);
    if (!Number.isFinite(storedAt) || Date.now() - storedAt > REFERRAL_MAX_AGE_MS) return undefined;
    return slug;
  } catch {
    return undefined;
  }
}
