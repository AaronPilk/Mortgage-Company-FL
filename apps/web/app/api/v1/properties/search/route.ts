import { type NextRequest, NextResponse } from "next/server";
import {
  HTTP_STATUS_BY_CODE,
  type ApiErrorCode,
  apiFailure,
  apiSuccess,
  fieldErrors
} from "@tract/schemas";
import type { ListingSummary } from "@tract/integrations";
import {
  PAGE_SIZE,
  PropertySearchQuerySchema,
  toProviderInput
} from "@/components/properties/criteria";
import { env, publicFeatures } from "@/lib/env";
import { fixturesAllowed, listings } from "@/lib/listings";
import { log } from "@/lib/logger";
import { rateLimitStore } from "@/lib/rate-limit";
import { buildRequestContext } from "@/lib/request-context";

/**
 * Property search over the listing provider port.
 *
 * A read endpoint, so there is no origin check and no bot challenge — but it is
 * still an unauthenticated door onto a provider, so it is rate limited before
 * any work happens and the query string is validated against the same schema
 * the page uses. A caller and a reader therefore cannot disagree about what a
 * set of parameters means.
 *
 * `sampleData` is a first-class field in the response, not a footnote. Any
 * consumer of this endpoint has to be able to tell that these records are
 * invented without reading documentation, for the same reason the page carries
 * a banner.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Generous for a browser, tight enough that scraping the endpoint is pointless. */
const PROPERTY_SEARCH_RATE_LIMIT = { windowMs: 60 * 1000, limit: 30 } as const;

const MAX_LIMIT = 50;

type ListingPayload = {
  listingKey: string;
  provider: string;
  status: ListingSummary["standardStatus"];
  listPriceCents: number | null;
  address: {
    line1: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
  };
  bedrooms: number | null;
  bathrooms: number | null;
  livingAreaSqft: number | null;
  lotSizeSqft: number | null;
  yearBuilt: number | null;
  daysOnMarket: number | null;
  propertyType: string | null;
  monthlyHoaFeeCents: number | null;
  annualTaxAmountCents: number | null;
  description: string | null;
  attributionText: string;
  modificationTimestamp: string | null;
  isSampleData: boolean;
  detailPath: string;
};

export type PropertySearchResponse = {
  results: ListingPayload[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  dataAsOf: string;
  sampleData: {
    containsSampleData: boolean;
    notice: string;
  };
};

const SAMPLE_DATA_NOTICE =
  "These records are illustrative sample properties, not active MLS listings. The addresses use reserved example street names and the details are invented. Do not present them as real listings.";

/**
 * The payload is built field by field rather than by spreading the record.
 * Spreading would silently publish whatever a future provider adds to the port,
 * including fields a display agreement does not permit us to syndicate.
 */
function toPayload(listing: ListingSummary): ListingPayload {
  return {
    listingKey: listing.listingKey,
    provider: listing.provider,
    status: listing.standardStatus,
    listPriceCents: listing.listPriceCents ?? null,
    address: {
      line1: listing.address.line1 ?? null,
      city: listing.address.city ?? null,
      state: listing.address.state ?? null,
      postalCode: listing.address.postalCode ?? null
    },
    bedrooms: listing.bedrooms ?? null,
    bathrooms: listing.bathrooms ?? null,
    livingAreaSqft: listing.livingAreaSqft ?? null,
    lotSizeSqft: listing.lotSizeSqft ?? null,
    yearBuilt: listing.yearBuilt ?? null,
    daysOnMarket: listing.daysOnMarket ?? null,
    propertyType: listing.propertyType ?? null,
    monthlyHoaFeeCents: listing.monthlyHoaFeeCents ?? null,
    annualTaxAmountCents: listing.annualTaxAmountCents ?? null,
    description: listing.description ?? null,
    attributionText: listing.attributionText,
    modificationTimestamp: listing.modificationTimestamp ?? null,
    isSampleData: listing.isFixture,
    detailPath: `/properties/${encodeURIComponent(listing.listingKey)}`
  };
}

function fail(
  code: ApiErrorCode,
  requestId: string,
  extra: { fields?: Record<string, string[]>; retryAfterSeconds?: number } = {}
): NextResponse {
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (extra.retryAfterSeconds !== undefined) {
    headers["Retry-After"] = String(extra.retryAfterSeconds);
  }
  return NextResponse.json(apiFailure(code, requestId, extra), {
    status: HTTP_STATUS_BY_CODE[code],
    headers
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const context = buildRequestContext(request.headers, env().HASH_PEPPER);
  const route = "/api/v1/properties/search";

  const finish = (outcome: string, response: NextResponse): NextResponse => {
    log.info("property search endpoint", {
      requestId: context.requestId,
      route,
      outcome,
      durationMs: Date.now() - startedAt,
      userAgentFamily: context.userAgentFamily
    });
    return response;
  };

  // 1. Rate limit first, before parsing or touching the provider.
  const decision = await rateLimitStore.hit(
    `properties:search:${context.ipPrefixHash ?? "unknown"}`,
    PROPERTY_SEARCH_RATE_LIMIT.windowMs,
    PROPERTY_SEARCH_RATE_LIMIT.limit
  );
  if (!decision.allowed) {
    return finish(
      "rate_limited",
      fail("RATE_LIMITED", context.requestId, { retryAfterSeconds: decision.retryAfterSeconds })
    );
  }

  // 2. Validate. Unknown parameters are dropped by the schema rather than
  // reaching the provider.
  const raw: Record<string, string | string[]> = {};
  for (const key of new Set(request.nextUrl.searchParams.keys())) {
    raw[key] = request.nextUrl.searchParams.getAll(key);
  }

  const parsed = PropertySearchQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return finish(
      "rejected_validation",
      fail("BAD_REQUEST", context.requestId, { fields: fieldErrors(parsed.error) })
    );
  }

  const requestedSize = Number.parseInt(request.nextUrl.searchParams.get("pageSize") ?? "", 10);
  const pageSize =
    Number.isFinite(requestedSize) && requestedSize > 0
      ? Math.min(requestedSize, MAX_LIMIT)
      : PAGE_SIZE;

  // 3. Provider availability. A fixture provider outside development is treated
  // as unavailable rather than served: invented records must not be published.
  const provider = listings();
  if (!publicFeatures().propertySearch || provider.key === "disabled" || !fixturesAllowed()) {
    return finish("provider_unavailable", fail("INTEGRATION_UNAVAILABLE", context.requestId));
  }

  // 4. Query. Any provider fault is reported as a generic unavailability; no
  // provider message, URL, or stack reaches the caller.
  try {
    const page = await provider.search(toProviderInput(parsed.data, { pageSize }));
    const results = page.items.map(toPayload);

    const body: PropertySearchResponse = {
      results,
      totalCount: page.totalCount,
      page: parsed.data.page,
      pageSize,
      hasMore: page.nextCursor !== undefined,
      dataAsOf: page.dataAsOf,
      sampleData: {
        containsSampleData: results.some((result) => result.isSampleData),
        notice: SAMPLE_DATA_NOTICE
      }
    };

    return finish(
      "ok",
      NextResponse.json(apiSuccess(body, context.requestId), {
        headers: { "Cache-Control": "no-store" }
      })
    );
  } catch (error) {
    log.error("property search provider failed", {
      requestId: context.requestId,
      route,
      errorName: error instanceof Error ? error.name : "unknown"
    });
    return finish("provider_error", fail("INTEGRATION_UNAVAILABLE", context.requestId));
  }
}
