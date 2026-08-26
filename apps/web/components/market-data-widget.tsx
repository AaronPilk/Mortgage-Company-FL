import Link from "next/link";
import { Card, FeatureStatus } from "@/components/ui";
import { publicFeatures } from "@/lib/env";
import {
  MARKET_DATA_METRICS,
  marketDataPendingBody,
  marketDataPendingHeading
} from "@/lib/market-data";

/**
 * City market-data widget.
 *
 * Flag-gated and dark today. The city pages themselves are static, evergreen
 * content that always renders; live market figures (median price, days on market,
 * inventory) belong only here, behind the derived `marketData` public flag. That
 * flag is `features.marketData && attom !== "disabled"`, so a fabricated figure
 * can never publish: when it is off — the permanent state today, since
 * FEATURE_MARKET_DATA defaults off — the widget shows a pending state with no
 * numbers, never a fixture (invariant 6).
 */

/**
 * The dark/pending state. No flag import, so it is pure and presentational and
 * the node test can render its copy directly. It states no value — the metric
 * chips are labels, and the body names the metrics without a figure.
 */
export function MarketDataPending({ cityName }: { cityName: string }) {
  return (
    <Card className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[var(--text)]">
          {marketDataPendingHeading(cityName)}
        </h2>
        <FeatureStatus label="Live data" status="coming_soon" />
      </div>
      <p className="mt-3 text-sm text-[var(--text-muted)]">{marketDataPendingBody(cityName)}</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {MARKET_DATA_METRICS.map((metric) => (
          <li
            key={metric}
            className="rounded-full border px-3 py-1 text-xs font-medium text-[var(--text-muted)]"
            style={{ borderColor: "var(--border)" }}
          >
            {metric}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/calculators/affordability"
          className="text-sm font-semibold underline"
          style={{ color: "var(--purple)" }}
        >
          Run the affordability calculator
        </Link>
        <Link
          href="/home-lookup"
          className="text-sm font-semibold underline"
          style={{ color: "var(--purple)" }}
        >
          Look up a specific home
        </Link>
      </div>
    </Card>
  );
}

/**
 * The gate. Reads the derived public flag and chooses the state. `publicFeatures`
 * is server-only, so this is a server component — the city page that renders it
 * is an async server component, so that composes cleanly.
 */
export function MarketDataWidget({ cityName }: { cityName: string }) {
  const live = publicFeatures().marketData;
  if (!live) return <MarketDataPending cityName={cityName} />;

  // FUTURE (ATTOM port). Unreachable in production until FEATURE_MARKET_DATA=true
  // AND ATTOM_MODE is live — the derived `marketData` flag already requires
  // attom !== "disabled". When built, this branch must read licensed figures from
  // the ATTOM adapter in packages/integrations (the same integration behind
  // /home-lookup and /home-value), render each with an "as of" date and a
  // "Source: ATTOM" attribution, and never emit a fixture. Built as a dark no-op
  // now, so it falls back to the pending state rather than inventing a number.
  return <MarketDataPending cityName={cityName} />;
}
