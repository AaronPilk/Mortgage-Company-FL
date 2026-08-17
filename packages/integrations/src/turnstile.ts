/**
 * Cloudflare Turnstile server-side verification.
 *
 * A client-side widget proves nothing on its own — the token must be validated
 * server-side against the secret, and the result must never be cached or reused.
 */

export type TurnstileMode = "disabled" | "fixture" | "sandbox" | "production";

export type TurnstileResult =
  | { ok: true; mode: TurnstileMode }
  | { ok: false; mode: TurnstileMode; reason: "missing_token" | "rejected" | "unavailable" };

export type TurnstileConfig = {
  mode: TurnstileMode;
  secretKey?: string;
  verifyUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

/** Tokens the fixture adapter treats as failures, so tests can exercise both paths. */
export const FIXTURE_FAILING_TOKEN = "fixture-fail";

export async function verifyTurnstile(
  token: string | undefined,
  remoteIp: string | undefined,
  config: TurnstileConfig
): Promise<TurnstileResult> {
  if (config.mode === "disabled") return { ok: true, mode: "disabled" };

  if (token === undefined || token === "") {
    return { ok: false, mode: config.mode, reason: "missing_token" };
  }

  if (config.mode === "fixture") {
    return token === FIXTURE_FAILING_TOKEN
      ? { ok: false, mode: "fixture", reason: "rejected" }
      : { ok: true, mode: "fixture" };
  }

  if (config.secretKey === undefined) {
    return { ok: false, mode: config.mode, reason: "unavailable" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs ?? 5_000);
  try {
    const body = new URLSearchParams({ secret: config.secretKey, response: token });
    if (remoteIp !== undefined) body.set("remoteip", remoteIp);

    const response = await (config.fetchImpl ?? fetch)(
      config.verifyUrl ?? "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: controller.signal
      }
    );
    if (!response.ok) return { ok: false, mode: config.mode, reason: "unavailable" };
    const data = (await response.json()) as { success?: boolean };
    return data.success === true
      ? { ok: true, mode: config.mode }
      : { ok: false, mode: config.mode, reason: "rejected" };
  } catch {
    return { ok: false, mode: config.mode, reason: "unavailable" };
  } finally {
    clearTimeout(timeout);
  }
}
