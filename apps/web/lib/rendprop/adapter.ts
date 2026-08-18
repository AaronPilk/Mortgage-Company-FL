/**
 * The media provider port, and the only adapter that exists today.
 *
 * NO PROVIDER IS CONFIGURED. `UnconfiguredMediaProvider` is the default and it
 * refuses every call. That is the whole design: the port, the job model, the
 * schema, the disclosure rules, and the spend controls are real and tested, and
 * the thing that would cost money is a stub that cannot be reached by accident.
 *
 * Following the repository's integration order — port, then disabled adapter,
 * then fixture adapter, then a real one — a real adapter is added by
 * implementing `MediaProvider`, registering a mode in the environment schema
 * that *requires* its credential, and classifying the data it handles. Nothing
 * in this file needs to change for that to happen.
 *
 * It refuses with a terminal error rather than a retryable one on purpose. A
 * missing provider is not a transient condition, and a queue that retries it
 * with backoff spends a week pretending the feature is coming back.
 */

import { RendPropProviderError } from "./jobs";
import type { RendPropTransformation } from "./pipeline";

export type MediaJobRequest = {
  readonly transformation: RendPropTransformation;
  readonly sourceStorageKey: string;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly idempotencyKey: string;
  readonly maxCostCents: number;
  readonly timeoutMs: number;
};

export type MediaJobResult = {
  readonly outputStorageKey: string;
  readonly provider: string;
  readonly modelKey: string;
  readonly actualCostCents: number;
  /** Copied verbatim into `rendprop_generated_assets.disclosure_label`. */
  readonly disclosureLabel: string;
  readonly safetyLabels: readonly string[];
};

export interface MediaProvider {
  readonly key: string;
  readonly configured: boolean;
  readonly supports: readonly RendPropTransformation[];
  estimateCostCents(request: MediaJobRequest): Promise<number>;
  execute(request: MediaJobRequest): Promise<MediaJobResult>;
}

export class UnconfiguredMediaProvider implements MediaProvider {
  readonly key = "unconfigured";
  readonly configured = false;
  readonly supports: readonly RendPropTransformation[] = [];

  async estimateCostCents(): Promise<number> {
    return 0;
  }

  async execute(): Promise<MediaJobResult> {
    throw new RendPropProviderError(
      "provider_not_configured",
      "No RendProp media provider is configured in this environment."
    );
  }
}

/**
 * The provider the application uses. There is exactly one, it is the disabled
 * one, and resolving it here rather than at each call site means no code path
 * can pick a different answer.
 */
export function resolveMediaProvider(): MediaProvider {
  return new UnconfiguredMediaProvider();
}

export type MediaProviderStatus = {
  readonly configured: boolean;
  readonly headline: string;
  readonly detail: string;
};

/** What the UI is allowed to say about the pipeline. It may not say "working". */
export function mediaProviderStatus(
  provider: MediaProvider = resolveMediaProvider()
): MediaProviderStatus {
  if (!provider.configured) {
    return {
      configured: false,
      headline: "No media provider is connected",
      detail:
        "The capture workflow, job queue, spend controls, disclosure rules, and share pages are built. The processing step is not connected to any provider, so nothing on this site can currently transform a walkthrough into listing media."
    };
  }
  return {
    configured: true,
    headline: "Media processing is connected",
    detail: "Processing runs asynchronously; results appear on the project when a job completes."
  };
}
