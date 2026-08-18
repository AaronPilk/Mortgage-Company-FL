"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatUsd } from "@tract/mortgage-math";
import { Badge, Button, Card } from "@/components/ui";
import {
  ROOM_TAGS,
  TRANSFORMATION_CATALOGUE,
  estimatedCostCentsFor,
  requiresVisibleDisclosure,
  type RendPropTransformation,
  type RoomTag
} from "@/lib/rendprop/pipeline";
import {
  DEFAULT_BACKOFF,
  computeBackoffMs,
  executeRendPropJob,
  rendPropIdempotencyKey,
  type JobExecutionResult
} from "@/lib/rendprop/jobs";
import { resolveMediaProvider } from "@/lib/rendprop/adapter";
import { RENDPROP_UPLOAD_POLICY } from "@/lib/rendprop/uploads";
import { AlteredMedia, AlterationPolicyNote, OriginalMedia } from "./ai-label";
import { FloorPlanSketch, QrPlaceholder, RoomFrame } from "./frames";
import { SAMPLE_CAPTURE_GUIDANCE, SAMPLE_PROJECT, SAMPLE_SCENES, SAMPLE_TOUR } from "./sample";

/**
 * The RendProp walkthrough.
 *
 * Everything on this screen is illustrative and runs in this browser tab. There
 * is no project, no upload, no queue row, and no provider — the point is to make
 * the product legible, not to imply that it is running.
 *
 * Two things here are not illustrative, and they are the two worth trusting: the
 * idempotency keys are computed by the real `rendPropIdempotencyKey`, and the
 * "what the queue would do" panel calls the real `executeRendPropJob` against
 * the real unconfigured adapter. Its refusal is genuine.
 */

const STEPS = [
  "create",
  "details",
  "capture",
  "tagging",
  "transform",
  "review",
  "approve",
  "publish"
] as const;

type Step = (typeof STEPS)[number];

const STEP_LABELS: Readonly<Record<Step, string>> = {
  create: "Start a project",
  details: "Property details",
  capture: "Capture and upload",
  tagging: "Room tagging",
  transform: "Choose transformations",
  review: "Before and after",
  approve: "Approve each altered image",
  publish: "Publish and share"
};

const SAMPLE_PROJECT_ID = "00000000-0000-4000-8000-00000000d000";

type SelectionState = Record<string, RendPropTransformation[]>;

type DetailKey =
  | "addressLine1"
  | "city"
  | "stateCode"
  | "postalCode"
  | "bedrooms"
  | "bathrooms"
  | "livingAreaSqft";

export function RendPropDemo() {
  const [step, setStep] = useState<Step>("create");
  const [details, setDetails] = useState<Record<DetailKey, string>>({
    addressLine1: SAMPLE_PROJECT.addressLine1,
    city: SAMPLE_PROJECT.city,
    stateCode: SAMPLE_PROJECT.stateCode,
    postalCode: SAMPLE_PROJECT.postalCode,
    bedrooms: SAMPLE_PROJECT.bedrooms,
    bathrooms: SAMPLE_PROJECT.bathrooms,
    livingAreaSqft: SAMPLE_PROJECT.livingAreaSqft
  });
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [rooms, setRooms] = useState<Record<string, RoomTag>>(() =>
    Object.fromEntries(SAMPLE_SCENES.map((scene) => [scene.id, scene.suggestedRoom]))
  );
  const [confirmedRooms, setConfirmedRooms] = useState<string[]>([]);
  const [selection, setSelection] = useState<SelectionState>(() =>
    Object.fromEntries(SAMPLE_SCENES.map((scene) => [scene.id, [...scene.defaultTransformations]]))
  );
  const [approved, setApproved] = useState<string[]>([]);
  const [published, setPublished] = useState(false);
  const [dryRun, setDryRun] = useState<JobExecutionResult | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const stepIndex = STEPS.indexOf(step);
  const allUploaded = uploadedCount >= SAMPLE_SCENES.length;
  const allRoomsConfirmed = confirmedRooms.length === SAMPLE_SCENES.length;

  const alteredScenes = useMemo(
    () =>
      SAMPLE_SCENES.filter((scene) =>
        (selection[scene.id] ?? []).some((key) => requiresVisibleDisclosure(key))
      ),
    [selection]
  );
  const allApproved =
    alteredScenes.length > 0 && alteredScenes.every((scene) => approved.includes(scene.id));

  const queuedJobs = useMemo(
    () =>
      SAMPLE_SCENES.flatMap((scene) =>
        (selection[scene.id] ?? []).map((transformation) => ({
          sceneId: scene.id,
          clipName: scene.clipName,
          transformation,
          idempotencyKey: rendPropIdempotencyKey({
            projectId: SAMPLE_PROJECT_ID,
            sourceAssetId: scene.id,
            transformation,
            parameters: { room: rooms[scene.id] ?? scene.suggestedRoom }
          }),
          costCents: TRANSFORMATION_CATALOGUE[transformation].estimatedCostCents
        }))
      ),
    [selection, rooms]
  );

  const totalCostCents = useMemo(
    () => estimatedCostCentsFor(SAMPLE_SCENES.flatMap((scene) => selection[scene.id] ?? [])),
    [selection]
  );

  const toggleTransformation = (sceneId: string, key: RendPropTransformation): void => {
    setSelection((current) => {
      const existing = current[sceneId] ?? [];
      const next = existing.includes(key)
        ? existing.filter((entry) => entry !== key)
        : [...existing, key];
      return { ...current, [sceneId]: next };
    });
    setApproved((current) => current.filter((entry) => entry !== sceneId));
  };

  const runDryRun = async (): Promise<void> => {
    const provider = resolveMediaProvider();
    const first = queuedJobs[0];
    const result = await executeRendPropJob({
      jobId: "demo-job",
      idempotencyKey: first?.idempotencyKey ?? "demo",
      estimatedCostCents: first?.costCents ?? 0,
      maxCostCents: 500,
      attempt: 1,
      maxAttempts: 4,
      killSwitches: { global: false, feature: false, provider: false },
      // The quota an agent account would carry. Enabled here so the refusal you
      // see below is the provider's, not the quota's — otherwise the demo would
      // hide which gate actually stopped it.
      quota: { requestLimit: 5, costLimitCents: 2000, concurrencyLimit: 1, enabled: true },
      usage: { requestsInPeriod: 0, reservedCents: 0, chargedCents: 0, inFlight: 0 },
      reserve: async ({ estimatedCostCents }) => ({
        allowed: true,
        reservedCents: estimatedCostCents
      }),
      callProvider: async ({ idempotencyKey }) => {
        const result = await provider.execute({
          transformation: first?.transformation ?? "lighting_correction",
          sourceStorageKey: "rendprop/sample/originals/sample.mov",
          parameters: {},
          idempotencyKey,
          maxCostCents: 500,
          timeoutMs: 60_000
        });
        return {
          kind: "succeeded",
          actualCostCents: result.actualCostCents,
          outputKey: result.outputStorageKey
        };
      },
      nowMs: 0,
      random: () => 0.5
    });
    setDryRun(result);
  };

  return (
    <div>
      <div
        className="mb-8 rounded-2xl border p-5"
        style={{ borderColor: "var(--purple)", background: "var(--purple-subtle)" }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="warning">Illustrative walkthrough</Badge>
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Nothing on this page is a real project, a real upload, or a real result.
          </span>
        </div>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          No media provider is connected, so RendProp cannot currently process a walkthrough at all.
          Every visual below is a diagram drawn in your browser, every address is a reserved example
          value, and nothing you type here is sent anywhere or stored.
        </p>
      </div>

      <ol className="mb-8 flex flex-wrap gap-2" aria-label="Progress">
        {STEPS.map((entry, index) => {
          const state = index === stepIndex ? "current" : index < stepIndex ? "done" : "upcoming";
          return (
            <li key={entry}>
              <button
                type="button"
                onClick={() => setStep(entry)}
                aria-current={state === "current" ? "step" : undefined}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{
                  borderColor: state === "upcoming" ? "var(--border)" : "var(--purple)",
                  background: state === "current" ? "var(--purple-subtle)" : "transparent",
                  color: state === "upcoming" ? "var(--text-muted)" : "var(--purple)"
                }}
              >
                <span aria-hidden="true">{index + 1}</span>
                {STEP_LABELS[entry]}
              </button>
            </li>
          );
        })}
      </ol>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-bold outline-none sm:text-3xl"
        style={{ color: "var(--text)" }}
      >
        {STEP_LABELS[step]}
      </h2>

      {step === "create" && (
        <div className="mt-6 space-y-6">
          <p style={{ color: "var(--text-muted)" }}>
            A project holds one property: the original clips, the jobs that ran against them, every
            generated asset with its lineage, and the tour you eventually share. Originals are never
            overwritten — a derivative always points back to the frame it came from.
          </p>
          <Card>
            <h3 className="font-semibold" style={{ color: "var(--text)" }}>
              What a project records
            </h3>
            <ul
              className="mt-3 list-disc space-y-1.5 pl-5 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              <li>The property, and who confirmed the right to capture and publish it</li>
              <li>Every original clip and photo, immutable, with its checksum</li>
              <li>Every processing job, its cost, and how it ended</li>
              <li>Every generated asset, its source frame, and its disclosure label</li>
              <li>The tour, its share token, and when it was published or withdrawn</li>
            </ul>
          </Card>
          <Button type="button" onClick={() => setStep("details")}>
            Create the sample project
          </Button>
        </div>
      )}

      {step === "details" && (
        <div className="mt-6 space-y-6">
          <p style={{ color: "var(--text-muted)" }}>
            Pre-filled with a reserved example address. Edit anything — it stays in this tab.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <DemoField
              id="rendprop-address"
              label="Address"
              value={details.addressLine1}
              onChange={(value) => setDetails((current) => ({ ...current, addressLine1: value }))}
            />
            <DemoField
              id="rendprop-city"
              label="City"
              value={details.city}
              onChange={(value) => setDetails((current) => ({ ...current, city: value }))}
            />
            <DemoField
              id="rendprop-state"
              label="State"
              value={details.stateCode}
              onChange={(value) => setDetails((current) => ({ ...current, stateCode: value }))}
            />
            <DemoField
              id="rendprop-postal"
              label="Postal code"
              value={details.postalCode}
              onChange={(value) => setDetails((current) => ({ ...current, postalCode: value }))}
            />
            <DemoField
              id="rendprop-beds"
              label="Bedrooms"
              value={details.bedrooms}
              onChange={(value) => setDetails((current) => ({ ...current, bedrooms: value }))}
            />
            <DemoField
              id="rendprop-baths"
              label="Bathrooms"
              value={details.bathrooms}
              onChange={(value) => setDetails((current) => ({ ...current, bathrooms: value }))}
            />
          </div>

          <Card className="border-[var(--purple)]">
            <h3 className="font-semibold" style={{ color: "var(--text)" }}>
              Capture rights
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Nothing is uploaded, and no job can be queued, until this is confirmed. The database
              enforces it too: an enqueue against a project with no rights assertion returns
              nothing.
            </p>
            <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={rightsConfirmed}
                onChange={(event) => setRightsConfirmed(event.target.checked)}
                className="mt-1 h-4 w-4"
                style={{ accentColor: "var(--purple)" }}
              />
              <span style={{ color: "var(--text-muted)" }}>
                I have the right to capture this property and to publish media of it, and I am
                authorised to market it.
              </span>
            </label>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep("create")}>
              Back
            </Button>
            <Button type="button" disabled={!rightsConfirmed} onClick={() => setStep("capture")}>
              Continue
            </Button>
          </div>
          {!rightsConfirmed && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Confirm capture rights to continue.
            </p>
          )}
        </div>
      )}

      {step === "capture" && (
        <div className="mt-6 space-y-6">
          <p style={{ color: "var(--text-muted)" }}>
            You record on your phone and the file goes straight to storage over a short-lived signed
            URL that an authenticated request mints for you. There is no public upload endpoint — an
            open one is free storage for whoever finds it.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {SAMPLE_CAPTURE_GUIDANCE.map((entry) => (
              <Card key={entry.title}>
                <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                  {entry.title}
                </h3>
                <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                  {entry.body}
                </p>
              </Card>
            ))}
          </div>

          <Card>
            <h3 className="font-semibold" style={{ color: "var(--text)" }}>
              Upload limits
            </h3>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <DemoFact label="Accepted types" value="MP4, MOV, JPEG, PNG, WebP, HEIC" />
              <DemoFact
                label="Per clip"
                value={`${RENDPROP_UPLOAD_POLICY.maxVideoBytes / 1_073_741_824} GB`}
              />
              <DemoFact
                label="Per photo"
                value={`${RENDPROP_UPLOAD_POLICY.maxImageBytes / 1_048_576} MB`}
              />
              <DemoFact
                label="Signed URL lifetime"
                value={`${RENDPROP_UPLOAD_POLICY.signedUrlTtlSeconds / 60} minutes`}
              />
            </dl>
          </Card>

          <div className="space-y-3">
            {SAMPLE_SCENES.map((scene, index) => {
              const done = index < uploadedCount;
              return (
                <div
                  key={scene.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4"
                  style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                >
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text)" }}>
                      {scene.clipName}
                    </p>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      {scene.durationLabel} · {scene.byteSizeLabel} · video/quicktime
                    </p>
                  </div>
                  <Badge tone={done ? "success" : "neutral"}>{done ? "Uploaded" : "Waiting"}</Badge>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep("details")}>
              Back
            </Button>
            {!allUploaded && (
              <Button
                type="button"
                onClick={() =>
                  setUploadedCount((current) => Math.min(current + 1, SAMPLE_SCENES.length))
                }
              >
                Simulate the next upload
              </Button>
            )}
            {allUploaded && (
              <Button type="button" onClick={() => setStep("tagging")}>
                Continue to room tagging
              </Button>
            )}
          </div>
        </div>
      )}

      {step === "tagging" && (
        <div className="mt-6 space-y-6">
          <p style={{ color: "var(--text-muted)" }}>
            Each clip gets a proposed room. You confirm or change every one — a suggestion is never
            treated as confirmed, because a mislabelled room propagates into the floor plan, the
            tour order, and the listing copy.
          </p>

          <div className="space-y-3">
            {SAMPLE_SCENES.map((scene) => {
              const confirmed = confirmedRooms.includes(scene.id);
              return (
                <div
                  key={scene.id}
                  className="rounded-2xl border p-4"
                  style={{
                    borderColor: confirmed ? "var(--purple)" : "var(--border)",
                    background: "var(--surface)"
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold" style={{ color: "var(--text)" }}>
                        {scene.clipName}
                      </p>
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                        Suggested: {scene.suggestedRoom} · confidence {scene.confidenceLabel}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="sr-only" htmlFor={`room-${scene.id}`}>
                        Room for {scene.clipName}
                      </label>
                      <select
                        id={`room-${scene.id}`}
                        value={rooms[scene.id] ?? scene.suggestedRoom}
                        onChange={(event) => {
                          const value = event.target.value as RoomTag;
                          setRooms((current) => ({ ...current, [scene.id]: value }));
                          setConfirmedRooms((current) =>
                            current.filter((entry) => entry !== scene.id)
                          );
                        }}
                        className="min-h-[44px] rounded-xl border px-3 text-sm"
                        style={{
                          borderColor: "var(--border)",
                          background: "var(--bg)",
                          color: "var(--text)"
                        }}
                      >
                        {ROOM_TAGS.map((tag) => (
                          <option key={tag} value={tag}>
                            {tag}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant={confirmed ? "ghost" : "secondary"}
                        onClick={() =>
                          setConfirmedRooms((current) =>
                            current.includes(scene.id)
                              ? current.filter((entry) => entry !== scene.id)
                              : [...current, scene.id]
                          )
                        }
                      >
                        {confirmed ? "Confirmed" : "Confirm"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep("capture")}>
              Back
            </Button>
            <Button
              type="button"
              disabled={!allRoomsConfirmed}
              onClick={() => setStep("transform")}
            >
              Continue
            </Button>
          </div>
          {!allRoomsConfirmed && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Confirm every room before continuing. {confirmedRooms.length} of{" "}
              {SAMPLE_SCENES.length} confirmed.
            </p>
          )}
        </div>
      )}

      {step === "transform" && (
        <div className="mt-6 space-y-6">
          <p style={{ color: "var(--text-muted)" }}>
            Pick what runs on each clip. Anything that alters pixels carries a disclosure label from
            the moment it is selected — the label is a property of the transformation, not something
            a screen decides to show later.
          </p>

          <div className="space-y-4">
            {SAMPLE_SCENES.map((scene) => (
              <Card key={scene.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                    {scene.headline}
                  </h3>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {scene.clipName} · {rooms[scene.id] ?? scene.suggestedRoom}
                  </span>
                </div>
                <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                  {scene.note}
                </p>
                <div className="mt-4 space-y-2">
                  {scene.offeredTransformations.map((key) => {
                    const spec = TRANSFORMATION_CATALOGUE[key];
                    const checked = (selection[scene.id] ?? []).includes(key);
                    return (
                      <label
                        key={key}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm"
                        style={{
                          borderColor: checked ? "var(--purple)" : "var(--border)",
                          background: checked ? "var(--purple-subtle)" : "transparent"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTransformation(scene.id, key)}
                          className="mt-1 h-4 w-4"
                          style={{ accentColor: "var(--purple)" }}
                        />
                        <span>
                          <span className="font-semibold" style={{ color: "var(--text)" }}>
                            {spec.label}
                          </span>{" "}
                          <span style={{ color: "var(--text-muted)" }}>
                            — {spec.blurb} ({formatUsd(spec.estimatedCostCents, { cents: true })})
                          </span>
                          {requiresVisibleDisclosure(key) && (
                            <span className="mt-1 block text-xs" style={{ color: "var(--purple)" }}>
                              Labelled on output: “{spec.disclosureLabel}”
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <h3 className="font-semibold" style={{ color: "var(--text)" }}>
              What would be enqueued
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              The request inserts {queuedJobs.length} queued rows and returns. It does not process
              anything — media work cannot run inside a request handler, because the runtime kills a
              request that exceeds its CPU budget and the person gets nothing. A background worker
              drains the queue, and only the worker touches a provider.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-xs">
                <thead>
                  <tr style={{ color: "var(--text-muted)" }}>
                    <th className="py-2 pr-4 font-semibold">Clip</th>
                    <th className="py-2 pr-4 font-semibold">Transformation</th>
                    <th className="py-2 pr-4 font-semibold">Idempotency key</th>
                    <th className="py-2 font-semibold">Reserve</th>
                  </tr>
                </thead>
                <tbody>
                  {queuedJobs.map((job) => (
                    <tr
                      key={job.idempotencyKey}
                      className="border-t"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td className="py-2 pr-4" style={{ color: "var(--text-muted)" }}>
                        {job.clipName}
                      </td>
                      <td className="py-2 pr-4" style={{ color: "var(--text)" }}>
                        {TRANSFORMATION_CATALOGUE[job.transformation].label}
                      </td>
                      <td
                        className="py-2 pr-4 font-mono text-[0.65rem]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {job.idempotencyKey.slice(-28)}
                      </td>
                      <td className="py-2" style={{ color: "var(--text-muted)" }}>
                        {formatUsd(job.costCents, { cents: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
              Estimated reservation: {formatUsd(totalCostCents, { cents: true })}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Reserved by the worker immediately before the provider call, under a lock on the quota
              bucket. A queued job holds no budget — a job that sits in a queue for an hour must not
              starve the ones that are running.
            </p>
          </Card>

          <Card>
            <h3 className="font-semibold" style={{ color: "var(--text)" }}>
              Run the real job model against the real adapter
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              This button is not a simulation. It calls the shipped orchestrator with the shipped
              media adapter, in this tab.
            </p>
            <div className="mt-4">
              <Button type="button" variant="secondary" onClick={() => void runDryRun()}>
                Attempt one job
              </Button>
            </div>
            {dryRun !== null && (
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <DemoFact label="Resulting state" value={dryRun.state} />
                <DemoFact label="Provider reached" value={dryRun.providerCalled ? "yes" : "no"} />
                <DemoFact label="Error code" value={dryRun.errorCode ?? "none"} />
                <DemoFact label="Error class" value={dryRun.errorClass ?? "none"} />
                <DemoFact
                  label="Reservation"
                  value={
                    dryRun.settlement.requiresReconciliation
                      ? "HELD for reconciliation"
                      : dryRun.settlement.entries.length === 0
                        ? "nothing reserved"
                        : dryRun.settlement.entries
                            .map((entry) => `${entry.kind} ${entry.amountCents}c`)
                            .join(", ")
                  }
                />
                <DemoFact
                  label="Charged"
                  value={formatUsd(dryRun.settlement.netChargedCents, { cents: true })}
                />
              </dl>
            )}
            <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
              A retryable failure would come back in about{" "}
              {Math.round(computeBackoffMs(1, DEFAULT_BACKOFF, () => 0.5) / 1000)}s, then roughly
              double each attempt with jitter, to a ceiling of {DEFAULT_BACKOFF.maxDelayMs / 60_000}{" "}
              minutes.
            </p>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep("tagging")}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep("review")}>
              See illustrative results
            </Button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="mt-6 space-y-8">
          <p style={{ color: "var(--text-muted)" }}>
            What review would look like. The original is kept exactly as captured and is always one
            click away, because a disclosure nobody can check is not a disclosure.
          </p>

          {SAMPLE_SCENES.map((scene) => {
            const chosen = selection[scene.id] ?? [];
            const room = rooms[scene.id] ?? scene.suggestedRoom;
            return (
              <div key={scene.id}>
                <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                  {scene.headline}
                </h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <OriginalMedia>
                    <RoomFrame room={room} variant="raw" caption={scene.headline} />
                  </OriginalMedia>
                  {chosen.length === 0 ? (
                    <div
                      className="flex items-center justify-center rounded-2xl border p-6 text-sm"
                      style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                    >
                      No transformation selected — this scene ships as captured.
                    </div>
                  ) : (
                    <AlteredMedia transformations={chosen}>
                      <RoomFrame
                        room={room}
                        variant="processed"
                        staged={chosen.includes("virtual_staging")}
                        caption={scene.headline}
                      />
                    </AlteredMedia>
                  )}
                </div>
              </div>
            );
          })}

          <div>
            <h3 className="font-semibold" style={{ color: "var(--text)" }}>
              Floor plan
            </h3>
            <div className="mt-3 max-w-md">
              <AlteredMedia transformations={["floor_plan"]}>
                <FloorPlanSketch />
              </AlteredMedia>
            </div>
            <p className="mt-3 max-w-2xl text-sm" style={{ color: "var(--text-muted)" }}>
              Derived from ordinary video. It is a candidate for review, not a survey, and no
              measurement accuracy is claimed for it because none has been benchmarked.
            </p>
          </div>

          <AlterationPolicyNote />

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep("transform")}>
              Change transformations
            </Button>
            <Button type="button" onClick={() => setStep("approve")}>
              Continue to approval
            </Button>
          </div>
        </div>
      )}

      {step === "approve" && (
        <div className="mt-6 space-y-6">
          <p style={{ color: "var(--text-muted)" }}>
            Nothing altered reaches a tour unmarked and unapproved. Approval is recorded against
            your account with a timestamp; the label, the AI flag, and the lineage are frozen at
            creation and cannot be edited afterwards by anyone, including staff.
          </p>

          {alteredScenes.length === 0 && (
            <Card>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No altered imagery was selected, so there is nothing to approve. The tour would ship
                with unmodified frames only.
              </p>
            </Card>
          )}

          <div className="space-y-3">
            {alteredScenes.map((scene) => {
              const chosen = (selection[scene.id] ?? []).filter(requiresVisibleDisclosure);
              const isApproved = approved.includes(scene.id);
              return (
                <div
                  key={scene.id}
                  className="rounded-2xl border p-4"
                  style={{
                    borderColor: isApproved ? "var(--purple)" : "var(--border)",
                    background: "var(--surface)"
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="max-w-xl">
                      <p className="font-semibold" style={{ color: "var(--text)" }}>
                        {scene.headline}
                      </p>
                      <ul
                        className="mt-2 list-disc space-y-1 pl-5 text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {chosen.map((key) => (
                          <li key={key}>{TRANSFORMATION_CATALOGUE[key].disclosureLabel}</li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      type="button"
                      variant={isApproved ? "ghost" : "secondary"}
                      onClick={() =>
                        setApproved((current) =>
                          current.includes(scene.id)
                            ? current.filter((entry) => entry !== scene.id)
                            : [...current, scene.id]
                        )
                      }
                    >
                      {isApproved ? "Approved" : "Approve with these labels"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep("review")}>
              Back
            </Button>
            <Button
              type="button"
              disabled={alteredScenes.length > 0 && !allApproved}
              onClick={() => setStep("publish")}
            >
              Continue to publish
            </Button>
          </div>
          {alteredScenes.length > 0 && !allApproved && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Approve every altered image before publishing. {approved.length} of{" "}
              {alteredScenes.length} approved.
            </p>
          )}
        </div>
      )}

      {step === "publish" && (
        <div className="mt-6 space-y-6">
          <p style={{ color: "var(--text-muted)" }}>
            Publishing mints a high-entropy share token, stored as a hash so an unlisted property is
            not guessable from a sequential id. The public page reaches the tour through one
            server-side path that enforces publication, expiry, and withdrawal in a single place.
          </p>

          {!published ? (
            <Button type="button" onClick={() => setPublished(true)}>
              Publish the sample tour
            </Button>
          ) : (
            <>
              <Card>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="success">Published (illustrative)</Badge>
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {SAMPLE_PROJECT.city}, {SAMPLE_PROJECT.stateCode}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap items-start gap-6">
                  <div>
                    <QrPlaceholder seed={SAMPLE_TOUR.slug} />
                    <p className="mt-2 max-w-[8rem] text-xs" style={{ color: "var(--text-muted)" }}>
                      Illustrative pattern. It encodes nothing and will not scan.
                    </p>
                  </div>
                  <dl className="grid flex-1 gap-3 text-sm">
                    <DemoFact label="Share link" value={SAMPLE_TOUR.shareLabel} />
                    <DemoFact label="Attribution" value={SAMPLE_PROJECT.attributionText} />
                    <DemoFact label="Disclosure version" value={SAMPLE_TOUR.disclosureVersion} />
                    <DemoFact
                      label="Labelled scenes"
                      value={`${alteredScenes.length} of ${SAMPLE_SCENES.length}`}
                    />
                  </dl>
                </div>
              </Card>

              <Card>
                <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                  What a viewer sees
                </h3>
                <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                  Every altered scene carries its label in the layout, next to the image. The
                  disclosure travels with the media, not with the page — so it survives being
                  embedded, screenshotted, or forwarded.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {alteredScenes.slice(0, 2).map((scene) => (
                    <AlteredMedia
                      key={scene.id}
                      transformations={(selection[scene.id] ?? []).filter(
                        requiresVisibleDisclosure
                      )}
                    >
                      <RoomFrame
                        room={rooms[scene.id] ?? scene.suggestedRoom}
                        variant="processed"
                        staged={(selection[scene.id] ?? []).includes("virtual_staging")}
                        caption={scene.headline}
                      />
                    </AlteredMedia>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                  Withdrawal
                </h3>
                <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                  Unpublishing revokes the token immediately. Deletion propagates to originals,
                  derivatives, thumbnails, and anything a provider still holds — not just to the row
                  that made the tour visible.
                </p>
              </Card>
            </>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep("approve")}>
              Back
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStep("create");
                setPublished(false);
                setUploadedCount(0);
                setConfirmedRooms([]);
                setApproved([]);
                setRightsConfirmed(false);
                setDryRun(null);
              }}
            >
              Start the walkthrough again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function DemoField({
  id,
  label,
  value,
  onChange
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold" style={{ color: "var(--text)" }}>
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-[48px] w-full rounded-xl border px-3.5 text-sm"
        style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
      />
    </div>
  );
}

function DemoFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-sm" style={{ color: "var(--text)" }}>
        {value}
      </dd>
    </div>
  );
}
