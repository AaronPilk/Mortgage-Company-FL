"use client";

import { useState } from "react";
import { Badge, Button, ButtonLink, Card, Section, SectionHeading } from "@/components/ui";
import { SITE_URL } from "@/lib/site";
import type { ReferralBucket, ReferralSummary, ReferralTimelineEntry } from "@/lib/agent-referrals";

/**
 * The partner dashboard surface — presentational only.
 *
 * Everything it renders comes from the agent's own first name and slug plus the
 * coarse, self-scoped figures the server already fetched. There is deliberately
 * no consumer identity to render: no name, email, phone, message, or intent is
 * ever passed to this component, so none can leak through it. The three buckets
 * are pipeline stages, never a credit decision (invariant 6).
 *
 * Relative times are computed against a single `now` captured at mount so they
 * stay stable across re-renders, and the spans that show them carry
 * `suppressHydrationWarning` — the server and the browser can differ by the
 * sub-second render gap, which is meaningless at this granularity.
 */

const BUCKET_LABEL: Record<ReferralBucket, string> = {
  new: "New",
  working: "Working",
  closed: "Closed"
};

const BUCKET_TONE: Record<ReferralBucket, "purple" | "neutral"> = {
  new: "purple",
  working: "neutral",
  closed: "neutral"
};

export function ReferralDashboard({
  agentFirstName,
  slug,
  summary,
  timeline
}: {
  agentFirstName: string;
  slug: string;
  summary: ReferralSummary;
  timeline: ReferralTimelineEntry[];
}) {
  const [now] = useState(() => Date.now());
  const [copyState, setCopyState] = useState<"idle" | "copied" | "unavailable">("idle");

  const shareUrl = `${SITE_URL}/r/${slug}`;
  const hasReferrals = summary.total > 0;

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
    } catch {
      setCopyState("unavailable");
    }
  }

  const tiles: { key: string; label: string; value: number; hint: string; accent: boolean }[] = [
    {
      key: "total",
      label: "Total referrals",
      value: summary.total,
      hint: "Everyone your link has sent to TRACT",
      accent: true
    },
    {
      key: "new",
      label: "New",
      value: summary.new,
      hint: "Arrived, not yet worked",
      accent: false
    },
    {
      key: "working",
      label: "Working",
      value: summary.working,
      hint: "A loan officer is in touch",
      accent: false
    },
    {
      key: "closed",
      label: "Closed",
      value: summary.closed,
      hint: "This referral has wrapped up",
      accent: false
    }
  ];

  return (
    <Section width="wide">
      <div className="mb-2">
        <ButtonLink href="/account" variant="ghost" className="px-0 text-sm">
          ← Account
        </ButtonLink>
      </div>

      <SectionHeading
        as="h1"
        eyebrow="For agents"
        title={`${agentFirstName}, here's what your link drove`}
        description="Counts and coarse stages for the people your referral link sent to TRACT. To protect their privacy you'll never see a name, email, phone, or message here — only the shape of the pipeline."
      />

      <Card className="mb-6">
        <h2 className="text-xl font-bold text-[var(--text)]">Your referral link</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Share it anywhere. Anyone who starts with TRACT through it is credited to you — and you
          keep the real-estate relationship.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <code
            className="flex-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm"
            style={{ color: "var(--text)" }}
          >
            {shareUrl}
          </code>
          <Button type="button" variant="secondary" onClick={copyShareLink}>
            {copyState === "copied" ? "Copied!" : "Copy link"}
          </Button>
        </div>
        <p className="mt-2 min-h-5 text-xs text-[var(--text-muted)]" role="status">
          {copyState === "copied"
            ? "Link copied to your clipboard."
            : copyState === "unavailable"
              ? "Clipboard access is unavailable; select the link above to copy it."
              : "Your personal link, tied to your approved profile."}
        </p>
      </Card>

      {hasReferrals ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map((tile) => (
              <Card key={tile.key}>
                <p className="text-sm font-semibold text-[var(--text-muted)]">{tile.label}</p>
                <p
                  className="mt-2 text-4xl font-bold tabular-nums"
                  style={{ color: tile.accent ? "var(--purple)" : "var(--text)" }}
                >
                  {tile.value}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{tile.hint}</p>
              </Card>
            ))}
          </div>

          <Card>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-bold text-[var(--text)]">Recent activity</h2>
              {summary.lastReferralAt !== null && (
                <span
                  className="text-xs text-[var(--text-muted)]"
                  title={formatMoment(summary.lastReferralAt)}
                  suppressHydrationWarning
                >
                  Last referral {formatRelative(summary.lastReferralAt, now)}
                </span>
              )}
            </div>

            {timeline.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--text-muted)]">
                No dated activity to show yet.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {timeline.map((entry, index) => (
                  <li
                    key={`${entry.referredOn}-${entry.bucket}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3 first:border-0 first:pt-0"
                  >
                    <div className="flex items-center gap-3">
                      <Badge tone={BUCKET_TONE[entry.bucket]}>{BUCKET_LABEL[entry.bucket]}</Badge>
                      <span className="text-sm text-[var(--text-muted)]" suppressHydrationWarning>
                        {formatDayRelative(entry.referredOn, now)}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatDay(entry.referredOn)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      ) : (
        <Card>
          <h2 className="text-xl font-bold text-[var(--text)]">No referrals yet</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Share your link above. The moment someone starts with TRACT through it, you&rsquo;ll see
            them here as a count and a coarse stage — new, working, or closed. You&rsquo;ll never
            see their name or contact details; that stays private to TRACT.
          </p>
        </Card>
      )}

      <p className="mt-6 text-xs text-[var(--text-muted)]">
        These are coarse pipeline stages, not credit decisions or outcomes — &ldquo;closed&rdquo;
        only means the referral wrapped up. TRACT never shares a referred consumer&rsquo;s identity,
        and nothing here is an application.
      </p>
    </Section>
  );
}

/** Relative time from a full ISO timestamp, down to the minute. */
function formatRelative(value: string, now: number): string {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const diff = now - then;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return plural(Math.floor(diff / minute), "minute");
  if (diff < day) return plural(Math.floor(diff / hour), "hour");
  return daysAgo(Math.floor(diff / day));
}

/**
 * Relative time for a date-only value (YYYY-MM-DD), at whole-day granularity.
 * Both sides are anchored to UTC midnight so the answer does not drift with the
 * viewer's timezone or invent an hour the data never carried.
 */
function formatDayRelative(dateOnly: string, now: number): string {
  const then = Date.parse(`${dateOnly}T00:00:00Z`);
  if (Number.isNaN(then)) return "";
  const day = 86_400_000;
  const startOfTodayUtc = Math.floor(now / day) * day;
  const days = Math.round((startOfTodayUtc - then) / day);
  if (days <= 0) return "today";
  return daysAgo(days);
}

function daysAgo(days: number): string {
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return plural(Math.floor(days / 7), "week");
  if (days < 365) return plural(Math.floor(days / 30), "month");
  return plural(Math.floor(days / 365), "year");
}

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
}

/** The referral day, shown in UTC so it matches the stored date exactly. */
function formatDay(dateOnly: string): string {
  const parsed = Date.parse(`${dateOnly}T00:00:00Z`);
  if (Number.isNaN(parsed)) return dateOnly;
  return new Date(parsed).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" });
}

function formatMoment(value: string): string {
  const parsed = new Date(value).getTime();
  if (Number.isNaN(parsed)) return value;
  // Day-level only: the recency signal never resolves to the minute a consumer's
  // referral landed (it is served as a date to begin with).
  return new Date(parsed).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" });
}
