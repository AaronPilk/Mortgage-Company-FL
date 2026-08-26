# Property data

## Status: fixtures only

Every provider is contract-gated. The fixture implementations exist so the Vision
pipeline can be developed and tested, and every fixture value carries a
limitation stating in plain language that it is not real.

## Why separate ports

Parcel, permit, flood, zoning, school, comparable-sale, rental, short-term
rental, and construction-cost data have different rights, refresh cadences,
geographic coverage, and — most importantly — different limits on what they
establish.

Collapsing them into one "property API" hides exactly the caveats that keep the
product honest. A flood zone without a map effective date is not an answer. A
zoning code without a link to the jurisdiction is not an opinion anyone should
act on.

## Provenance is mandatory

`sourced()` throws if a provider supplies no limitations. That is deliberate: a
value with no stated limits cannot enter a report, because a report must be
reconstructable from the exact facts and assumptions used at generation time.

```ts
type Provenance = {
  provider: string;
  sourceReference?: string;
  observedAt?: string;
  effectiveAt?: string;
  expiresAt?: string;
  confidence?: number;
  licenseClass: "public" | "display" | "internal" | "restricted";
  limitations: string[]; // never empty
};
```

## Candidate providers

Subject to contract, coverage verification, and current availability.

| Port                    | Candidate                     | Note                                                                                    |
| ----------------------- | ----------------------------- | --------------------------------------------------------------------------------------- |
| Parcel                  | Regrid                        | Boundaries, identifiers, footprints, zoning where offered                               |
| Permit                  | Shovels                       | Coverage varies by jurisdiction                                                         |
| Property / deed / sales | ATTOM                         | Implemented as the PropertyFacts port (home lookup). Broad, endpoint-specific licensing |
| Flood                   | FEMA NFHL / OpenFEMA          | Official, free. Always show the map effective date                                      |
| Zoning                  | Regrid plus municipal sources | Always link to the official record                                                      |
| Comparable sales        | Licensed MLS or ATTOM         | Never an appraisal                                                                      |
| Long-term rental        | To be selected                |                                                                                         |
| Short-term rental       | AirDNA                        | Estimates only; regulation is municipal and changes                                     |
| Construction cost       | RSMeans / Gordian             | Likely a licensed import rather than a public API                                       |

## Home lookup (ATTOM property facts)

The `PropertyFactsPort` answers an address with the physical characteristics, the
public tax assessment, the last recorded sale, and an automated value estimate —
the inputs a buyer needs to run the numbers on a home they found on a listing
site. It never fetches a listing page: a pasted link is parsed for the address it
already carries (`parseListingLink`), and ATTOM answers the address.

Modes (`ATTOM_MODE`, mirroring `GHL_MODE`):

- `disabled` (default) — no lookup; the home-lookup surface is dark.
- `fixture` — deterministic sample record for development and tests. It reaches a
  consumer in production only behind `SHOW_SAMPLE_PROPERTY_DATA=true` (the same
  two-switch shape as `SHOW_SAMPLE_LISTINGS`), and is always labelled as sample
  data in the response.
- `sandbox` / `production` — the real ATTOM adapter; requires `ATTOM_API_KEY`, so
  the environment fails to parse in a live mode without it.

The derived public flag (`homeLookup`) also requires a non-disabled mode, so
fixture facts cannot publish just because `FEATURE_HOME_LOOKUP` was left on. The
adapter reads `property/detail` for characteristics, assessment, tax, and last
sale, and best-effort `attomavm/detail` for the value estimate; an AVM miss never
sinks the lookup. Field paths follow ATTOM's documentation and should be verified
against a live response when the key is provisioned.

## Required framing in any output

- **Flood** — show the map or dataset effective date. State that this is not a
  flood determination; only a lender-ordered determination or FEMA's current map
  governs.
- **Zoning** — name the jurisdiction, link the official record, and state that it
  requires confirmation. Never present it as a zoning opinion.
- **Schools** — boundaries change and assignment is not guaranteed by proximity.
- **Comparable sales** — show the methodology and the range. It is not an
  appraisal and does not establish value.
- **Construction cost** — show the location factor, the cost data date, the
  exclusions, and a contingency. It is not a contractor bid.
- **Short-term rental** — show seasonality and a regulatory warning. Municipal
  rules change and can eliminate a strategy entirely.
- **Property facts / automated value (ATTOM)** — an automated value estimate is
  not an appraisal and does not establish what a lender will lend, and none of
  these figures is a list price. The price a home is offered at comes from the
  seller's listing, which is why the home-lookup UI seeds the price from the
  estimate but asks the buyer to replace it with the price they actually saw.

Where a fact is unavailable, the report says so. A stated gap is more useful than
a plausible number nobody can trace.

## Homeowner value dashboard (reuses the ATTOM AVM)

The signed-in homeowner value dashboard (`/account`, behind `FEATURE_HOME_VALUE`)
reuses the same `PropertyFactsPort` — no new provider. A homeowner's own address
drives the AVM; the value and range are written to `home_value_snapshots` (one
row per UTC day) and the home to `home_profiles`, both RLS-scoped to the owner.
The mortgage balance is a figure the owner types, used only to show estimated
equity — never an application, a credit pull, or a document (invariant 2). The
same framing applies: the value is an estimate, not an appraisal or an offer, and
the equity figure and any refi/HELOC prompt are marketing, never a credit
decision — no "you qualify", no rate, no approval.

v1 is user-initiated: each estimate the owner requests writes at most one
snapshot per day, guarded by the same-origin + auth account gate and a per-user
rate limit (the same posture as `/api/v1/property-lookup`). The automated daily
re-snapshot — which bills the provider with no user present — is a later pass and
must reserve spend before the call (invariant 8), so it is deliberately not part
of this version.
