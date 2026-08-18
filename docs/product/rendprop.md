# RendProp

Agent-facing listing media. The production media service remains feature flagged
off and bounded so it cannot delay the mortgage launch. A synthetic,
browser-only fixture walkthrough is available at `/rendprop/demo` and publishes
only the stable noindex sample at `/tour/rendprop-coastal-demo`.

## Promise

A user with rights to capture a property uses a guided phone workflow to upload
video and photos. The system organizes rooms, derives a navigable media
experience, produces floor-plan candidates for review, enhances approved photos,
produces labelled cleanup or staging variants, and generates share pages, QR
codes, and lead capture.

## Claims we will not make

Not survey-grade. No measurement accuracy claim without a published benchmark. No
comparison to dedicated capture hardware until benchmarked. A floor plan derived
from ordinary video is a candidate for review, not a survey.

These limits are written down before the feature exists, on purpose. It is far
easier to hold a line set in advance than to retrofit one onto marketing copy
that already overpromised.

## Planned production capture states

```
created → consent_confirmed → uploading → upload_complete → validation
        → processing → quality_review → ready → published → archived
        → deletion_pending → deleted
```

## Pipeline

Independent, retryable stages: ingest and virus scan · transcode and metadata ·
frame sampling · quality assessment · scene and room segmentation ·
reconstruction (engine chosen after benchmark) · floor-plan candidate · cleanup
or staging variant · thumbnails and social exports · manifest assembly · quality
gate · publish.

No single model is assumed to do everything. Artifacts and lineage must be
tracked when the production pipeline is designed; the current fixture calls no
model or provider and creates no stored artifact.

## Disclosure

Virtual staging is labelled. Cleanup may remove movable clutter in a labelled
visualization; it may never remove damage, structural elements, utilities,
permanent features, or neighbouring conditions. Hiding a defect a buyer would
want to know about is not a product feature, and the pipeline is built so it
cannot be done silently.

## Rights and privacy

Rights are confirmed before processing. Capture guidance steers away from faces,
personal documents, and neighbouring property. Deletion propagates to originals,
derivatives, thumbnails, embeddings, and provider-held artifacts.

## Current fixture boundary and native follow-up

The web build carries a deterministic state machine for attestations, synthetic
fixture selection, room tagging, processing/failure/retry, review and local tour
handoff. It deliberately has no file input, camera permission, upload, Storage
bucket, signed URL, provider job or deletion claim. Camera guidance, resumable
background upload, deletion propagation and push notification belong in a later
reviewed web/native implementation — see ADR-001.
