import "server-only";
import { parseServerEnv, type ServerEnv } from "@tract/schemas";
import { serverFeatures, publicFeatureState } from "@tract/domain";

/**
 * Server environment. The `server-only` import makes it a build error to pull
 * this into a client component, which is the mechanism that keeps secrets out of
 * the browser bundle rather than a convention someone has to remember.
 */

let cached: ServerEnv | undefined;

export function env(): ServerEnv {
  cached ??= parseServerEnv(process.env as Record<string, string | undefined>);
  return cached;
}

export function features() {
  return serverFeatures(env());
}

export function publicFeatures() {
  return publicFeatureState(features());
}
