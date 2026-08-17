# Listing data

## Status: blocked

No listing data agreement exists. `MLS_PROVIDER` is `fixture` in development and
must be `disabled` in production. `assertProductionReady` refuses a deployment
configured with fixtures, and the database independently refuses to mark a
fixture record published.

## What RESO is and is not

RESO defines standards for real-estate data transport and field naming. It does
not grant listing data or display rights. Those come from a local MLS or an
approved aggregator under contract.

## Path for the launch market

1. Stellar MLS is the primary Florida market data source. Evaluate its current
   data-delivery and API options first.
2. If access is granted through MLS Grid or Bridge, implement that adapter
   against real credentials and the actual documentation — not against a blog
   post.
3. Record the display agreement's requirements in provider configuration:
   attribution text, update frequency, permitted statuses, augmentation rules,
   registration, retention, and removal obligations.

## Implementation contract

`ListingProvider` in `packages/integrations/src/listings/port.ts`.

Non-negotiable properties of any adapter:

- `attributionText` is required on every record and rendered on every card. It is
  never dropped for layout.
- `modificationTimestamp` and `dataAsOf` are surfaced, so nobody mistakes a
  cached record for a live one.
- Status is explicit and only `active`, `coming_soon`, and `pending` are publicly
  displayable by default. Local rules may narrow this further.
- `recordsToUnpublish` drives prompt removal when a record vanishes from the
  provider or loses displayable status.
- `raw_payload_expires_at` makes raw retention contract-specific rather than
  indefinite.

## Absolutely not

- Scraping Zillow, Redfin, Realtor.com, or any portal.
- Treating a portal URL as permission to copy its content.
- Server-side fetching of a user-pasted URL. `resolvePastedLink` parses the host,
  asks the consumer to confirm an address, and rejects non-HTTP schemes and
  private address ranges. The address is then rehydrated from a licensed source.
- Claiming any single API contains every property.

## Indexation

Listing detail pages are indexable only once the display contract and content
quality support it. Filter and bounds permutations are never indexable — a
crawlable URL for every combination of price, beds, and map bounds is thin
content at scale.
