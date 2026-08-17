# TRACT Vision

A conversion-supporting property planning workspace. Feature flagged off; it
requires both `FEATURE_VISION` and a configured AI provider.

## What it is not

Not an appraisal, a construction bid, a zoning opinion, an investment
recommendation, or automated underwriting.

## Pipeline

```
draft → property_resolved → facts_loaded → assumptions_confirmed
      → deterministic_analysis_complete → optional_media_job_queued
      → report_assembling → review_or_quality_gate → ready
      → superseded_or_expired
```

Each transition has preconditions. The model may not invent a missing input to
advance the state silently.

## The separation that matters

Sourced facts, user assumptions, deterministic calculations, and model narrative
are stored in four distinct places and snapshotted per report version. That is
what makes a published report reconstructable exactly as generated.

A `model_inference` assumption cannot silently drive a financial figure —
`requiresUserConfirmation` gates it, and a database constraint backs that up.

## Deterministic first

AI may summarize sourced facts, help structure a stated goal, generate clarifying
questions, classify photos, draft narrative around computed numbers, generate
clearly-labelled conceptual imagery, and identify missing evidence.

AI is never the arithmetic engine. Every financial output comes from versioned,
tested functions.

## Reports

Nineteen sections, from executive orientation through limitations. Never a single
good-deal or bad-deal verdict. If a summary indicator is used it must derive from
displayed assumptions, show sensitivity, avoid investment-advice language, and
offer an uncertain state.

Public reports use high-entropy expiring tokens stored as hashes, return only
approved fields through a `security definer` function that enforces expiry and
revocation, and are revocable. Sequential identifiers would make them guessable.

## Generated imagery

Labelled "Concept visualization", with source media, transformation, provider,
model key, seed where available, rights status, and timestamp recorded. Cleanup
may remove movable clutter. It may not remove damage, structural elements,
utilities, permanent features, or neighbouring conditions.
