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

| Port                    | Candidate                     | Note                                                      |
| ----------------------- | ----------------------------- | --------------------------------------------------------- |
| Parcel                  | Regrid                        | Boundaries, identifiers, footprints, zoning where offered |
| Permit                  | Shovels                       | Coverage varies by jurisdiction                           |
| Property / deed / sales | ATTOM                         | Broad, endpoint-specific licensing                        |
| Flood                   | FEMA NFHL / OpenFEMA          | Official, free. Always show the map effective date        |
| Zoning                  | Regrid plus municipal sources | Always link to the official record                        |
| Comparable sales        | Licensed MLS or ATTOM         | Never an appraisal                                        |
| Long-term rental        | To be selected                |                                                           |
| Short-term rental       | AirDNA                        | Estimates only; regulation is municipal and changes       |
| Construction cost       | RSMeans / Gordian             | Likely a licensed import rather than a public API         |

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

Where a fact is unavailable, the report says so. A stated gap is more useful than
a plausible number nobody can trace.
