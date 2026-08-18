"use client";

import { useReducer } from "react";
import {
  canBeginRendPropCapture,
  canQueueRendPropFixture,
  createRendPropDemoState,
  rendPropDemoReducer,
  type RendPropDemoPhase
} from "@tract/domain";
import { AssetImage } from "@/components/asset-image";
import { Badge, Button, ButtonLink, Card } from "@/components/ui";
import { RENDPROP_DEMO_TOUR_ATTRIBUTED_PATH } from "@/lib/rendprop-demo";

const PHASES: Array<{ key: RendPropDemoPhase; label: string }> = [
  { key: "attestation", label: "Rights" },
  { key: "capture", label: "Sample capture" },
  { key: "processing", label: "Processing" },
  { key: "review", label: "Review" },
  { key: "published", label: "Sample tour" }
];

const OUTPUTS = [
  {
    src: "/images/rendprop/living-room-original.webp",
    label: "Original synthetic fixture",
    alt: "Synthetic original living room with ordinary movable clutter"
  },
  {
    src: "/images/rendprop/living-room-cleanup-concept.webp",
    label: "Cleanup visualization",
    alt: "Cleanup visualization of the synthetic living room"
  },
  {
    src: "/images/rendprop/living-room-staged-concept.webp",
    label: "Virtually staged",
    alt: "Virtually staged version of the synthetic living room"
  },
  {
    src: "/images/rendprop/kitchen-enhanced.webp",
    label: "Enhanced synthetic fixture",
    alt: "Exposure-corrected synthetic kitchen retaining its visible wall scuff"
  },
  {
    src: "/images/rendprop/sample-floor-plan.webp",
    label: "Floor-plan candidate",
    alt: "Generated sample floor-plan candidate without dimensions or scale"
  }
] as const;

function phaseIndex(phase: RendPropDemoPhase): number {
  return PHASES.findIndex((entry) => entry.key === phase);
}

export function RendPropDemoWorkflow() {
  const [state, dispatch] = useReducer(rendPropDemoReducer, undefined, createRendPropDemoState);
  const currentIndex = phaseIndex(state.phase);

  return (
    <div data-testid="rendprop-demo-workflow">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="RendProp sample progress">
          {PHASES.map((phase, index) => {
            const complete = index < currentIndex;
            const current = index === currentIndex;
            return (
              <li
                key={phase.key}
                aria-current={current ? "step" : undefined}
                className={`rounded-xl border px-3 py-3 text-sm ${
                  current
                    ? "border-[var(--purple)] bg-[var(--purple-subtle)] text-[var(--purple)]"
                    : complete
                      ? "border-success/40 bg-success/5 text-[var(--text)]"
                      : "border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)]"
                }`}
              >
                <span className="block text-xs font-bold">
                  {complete ? "Complete" : `0${index + 1}`}
                </span>
                <span className="mt-1 block font-semibold">{phase.label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {state.phase === "attestation" && (
        <Card className="mt-6" dataTestId="rendprop-attestation">
          <Badge tone="warning">Required before the sample starts</Badge>
          <h2 className="mt-4 text-2xl font-bold">Confirm the media boundaries</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            These attestations are recorded only in this browser state. No media, address or
            attestation is uploaded or saved.
          </p>
          <fieldset className="mt-6 space-y-4">
            <legend className="sr-only">Fixture rights and privacy attestations</legend>
            <label className="flex gap-3 rounded-xl border border-[var(--border)] p-4 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 accent-[var(--purple)]"
                checked={state.rightsConfirmed}
                onChange={(event) =>
                  dispatch({ type: "set_rights", checked: event.currentTarget.checked })
                }
              />
              <span>
                <strong className="block text-[var(--text)]">Media rights</strong>I would use only
                media I own or am authorized to alter and publish. For this demo, I understand that
                TRACT supplies the synthetic fixture.
              </span>
            </label>
            <label className="flex gap-3 rounded-xl border border-[var(--border)] p-4 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 accent-[var(--purple)]"
                checked={state.privacyConfirmed}
                onChange={(event) =>
                  dispatch({ type: "set_privacy", checked: event.currentTarget.checked })
                }
              />
              <span>
                <strong className="block text-[var(--text)]">Privacy review</strong>I would remove
                faces, documents, family photos, access codes and other personal or
                security-sensitive material before capture.
              </span>
            </label>
          </fieldset>
          <div className="mt-6">
            <Button
              type="button"
              disabled={!canBeginRendPropCapture(state)}
              onClick={() => dispatch({ type: "begin_capture" })}
            >
              Continue to synthetic capture
            </Button>
          </div>
        </Card>
      )}

      {state.phase === "capture" && (
        <div
          className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"
          data-testid="rendprop-capture-step"
        >
          <Card className="overflow-hidden p-0">
            <div className="aspect-[8/5] overflow-hidden bg-[var(--surface-2)]">
              <AssetImage
                src="/images/rendprop/phone-capture.webp"
                alt="Agent using a phone to frame a synthetic living room capture"
                width={1440}
                height={900}
                sizes="(max-width: 1024px) 100vw, 45vw"
                fallbackLabel="Synthetic capture fixture unavailable"
              />
            </div>
            <div className="border-t border-[var(--border)] p-5">
              <Badge tone="neutral">Generated fixture · no camera access</Badge>
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                The framing guide asks for steady, overlapping room views. This sample selects a
                bundled generated fixture; it does not open a camera or file picker.
              </p>
            </div>
          </Card>
          <Card>
            <h2 className="text-2xl font-bold">Prepare the sample capture</h2>
            <div className="mt-5 rounded-xl border border-[var(--border)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Coastal-room fixture set</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Synthetic living room and kitchen · no address or person
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => dispatch({ type: "select_fixture" })}
                >
                  {state.fixtureSelected ? "Sample selected" : "Use synthetic sample"}
                </Button>
              </div>
            </div>

            <fieldset className="mt-5">
              <legend className="font-semibold">Tag included rooms</legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {[
                  ["living_room", "Living room"],
                  ["kitchen", "Kitchen"]
                ].map(([room, label]) => (
                  <label
                    key={room}
                    className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={state.roomTags.includes(room as "living_room" | "kitchen")}
                      onChange={() =>
                        dispatch({ type: "toggle_room", room: room as "living_room" | "kitchen" })
                      }
                      className="size-4 accent-[var(--purple)]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-5">
              <legend className="font-semibold">Primary permitted transformation</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {[
                  ["cleanup", "Cleanup visualization", "Remove only ordinary movable clutter."],
                  [
                    "virtual_staging",
                    "Virtual staging",
                    "Replace furniture while preserving the room shell."
                  ]
                ].map(([value, label, description]) => (
                  <label
                    key={value}
                    className="rounded-xl border border-[var(--border)] p-4 text-sm"
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <input
                        type="radio"
                        name="rendprop-mode"
                        value={value}
                        checked={state.transformation === value}
                        onChange={() =>
                          dispatch({
                            type: "choose_transformation",
                            transformation: value as "cleanup" | "virtual_staging"
                          })
                        }
                        className="size-4 accent-[var(--purple)]"
                      />
                      {label}
                    </span>
                    <span className="mt-2 block text-[var(--text-muted)]">{description}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-6">
              <Button
                type="button"
                disabled={!canQueueRendPropFixture(state)}
                onClick={() => dispatch({ type: "queue" })}
              >
                Queue fixture processing
              </Button>
            </div>
          </Card>
        </div>
      )}

      {state.phase === "processing" && (
        <Card className="mt-6" dataTestId="rendprop-processing-step">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge
                tone={
                  state.processingStatus === "failed"
                    ? "warning"
                    : state.processingStatus === "processing"
                      ? "purple"
                      : "neutral"
                }
              >
                Sample status: {state.processingStatus.replaceAll("_", " ")}
              </Badge>
              <h2 className="mt-4 text-2xl font-bold">Deterministic local processing</h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
                Buttons advance a fixed fixture state. No provider, model, upload, queue or paid
                service is called.
              </p>
            </div>
            <span className="rounded-lg bg-[var(--surface-2)] px-3 py-2 font-mono text-xs text-[var(--text-muted)]">
              {state.sessionKey}
            </span>
          </div>

          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["Source", "Received"],
                ["Alteration", state.processingStatus],
                [
                  "Floor plan",
                  state.processingStatus === "queued" ? "waiting" : state.processingStatus
                ],
                ["Tour package", state.processingStatus === "failed" ? "blocked" : "waiting"]
              ] as Array<readonly [string, string]>
            ).map(([label, value]) => (
              <li
                key={label}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4"
              >
                <p className="text-xs text-[var(--text-muted)]">{label}</p>
                <p className="mt-1 font-semibold capitalize">{value.replaceAll("_", " ")}</p>
              </li>
            ))}
          </ol>

          {state.processingStatus === "failed" && (
            <div role="alert" className="mt-6 rounded-xl border border-warning/40 bg-warning/5 p-4">
              <p className="font-semibold text-warning">Recoverable sample interruption</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                The fixture stopped before derived assets were marked ready. Retry keeps the same
                session and inputs; it does not create a second lead, media job or provider call.
              </p>
              <p className="mt-2 font-mono text-xs text-[var(--text-muted)]">
                fixture_render_interrupted · retry {state.retryCount}
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {state.processingStatus === "queued" && (
              <Button type="button" onClick={() => dispatch({ type: "begin_processing" })}>
                Begin fixture processing
              </Button>
            )}
            {state.processingStatus === "processing" && (
              <>
                <Button type="button" onClick={() => dispatch({ type: "complete" })}>
                  Complete deterministic processing
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => dispatch({ type: "simulate_failure" })}
                >
                  Preview recoverable failure
                </Button>
              </>
            )}
            {state.processingStatus === "failed" && (
              <Button type="button" onClick={() => dispatch({ type: "retry" })}>
                Retry the same sample
              </Button>
            )}
          </div>
        </Card>
      )}

      {(state.phase === "review" || state.phase === "published") && (
        <div className="mt-6" data-testid="rendprop-review-step">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge tone={state.phase === "published" ? "success" : "purple"}>
                {state.phase === "published" ? "Sample tour ready" : "Fixture outputs ready"}
              </Badge>
              <h2 className="mt-4 text-2xl font-bold">Review every disclosed output</h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                The chosen primary mode was {state.transformation?.replaceAll("_", " ")}. The full
                precomputed comparison set is shown so original and altered media never separate.
              </p>
            </div>
            <span className="font-mono text-xs text-[var(--text-muted)]">
              {state.sessionKey} · {state.retryCount} retries
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OUTPUTS.map((output) => (
              <Card key={output.src} className="overflow-hidden p-0">
                <figure className="relative">
                  <div className="aspect-[8/5] overflow-hidden bg-[var(--surface-2)]">
                    <AssetImage
                      src={output.src}
                      alt={output.alt}
                      width={1440}
                      height={900}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className={output.label === "Floor-plan candidate" ? "object-contain" : ""}
                      fallbackLabel={`${output.label} unavailable`}
                    />
                  </div>
                  <figcaption className="absolute left-3 top-3 rounded-full bg-black/80 px-3 py-1.5 text-xs font-semibold text-white">
                    {output.label}
                  </figcaption>
                </figure>
              </Card>
            ))}
          </div>

          <p className="mt-5 rounded-xl border border-warning/40 bg-warning/5 p-4 text-sm text-[var(--text-muted)]">
            The floor-plan candidate has no verified dimensions or scale. It is not a survey,
            appraisal, inspection, construction drawing or representation of condition.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {state.phase === "review" ? (
              <Button type="button" onClick={() => dispatch({ type: "publish" })}>
                Prepare the local sample tour
              </Button>
            ) : (
              <ButtonLink href={RENDPROP_DEMO_TOUR_ATTRIBUTED_PATH} data-cta="rendprop-sample-tour">
                Open attributed sample tour
              </ButtonLink>
            )}
            <Button type="button" variant="secondary" onClick={() => dispatch({ type: "reset" })}>
              Reset sample
            </Button>
          </div>
          {state.phase === "published" && (
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              This action reveals a stable local route; it does not publish user media or make a
              production service available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
