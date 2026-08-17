# RendProp

Agent-facing listing media. Feature flagged off. Bounded so it cannot delay the
mortgage launch.

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

## Capture states

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

No single model is assumed to do everything. Artifacts and lineage are tracked.

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

## Native

The web build carries the shared contracts and a responsive upload prototype.
Camera guidance, resumable background upload, and push notification belong in the
later Expo client — see ADR-001.
