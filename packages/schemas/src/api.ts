import { z } from "zod";

/**
 * One envelope for every /api/v1 response. Public error messages must be useful
 * without leaking stack traces, provider messages, SQL, tokens, internal record
 * identifiers, or the fraud heuristics that produced a rejection.
 */

export const ApiErrorCodeSchema = z.enum([
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "BUDGET_EXCEEDED",
  "INTEGRATION_UNAVAILABLE",
  "INTERNAL_ERROR"
]);
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

export type ApiSuccess<T> = { ok: true; data: T; requestId: string };

export type ApiFailure = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: Record<string, string[]>;
    retryAfterSeconds?: number;
  };
  requestId: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export const HTTP_STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  BUDGET_EXCEEDED: 402,
  INTEGRATION_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500
};

/** Copy shown to consumers. Written once so no route improvises a message. */
export const PUBLIC_ERROR_MESSAGE: Record<ApiErrorCode, string> = {
  BAD_REQUEST: "Some of the details need another look.",
  UNAUTHORIZED: "Please sign in to continue.",
  FORBIDDEN: "You do not have access to that.",
  NOT_FOUND: "We could not find that.",
  CONFLICT: "That request conflicts with something already in progress.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  BUDGET_EXCEEDED: "This feature has reached its usage limit for now.",
  INTEGRATION_UNAVAILABLE:
    "We could not save that request because a required service is unavailable. Please try again later.",
  INTERNAL_ERROR: "Something went wrong on our side. Please try again."
};

export function apiSuccess<T>(data: T, requestId: string): ApiSuccess<T> {
  return { ok: true, data, requestId };
}

export function apiFailure(
  code: ApiErrorCode,
  requestId: string,
  extra: { message?: string; fields?: Record<string, string[]>; retryAfterSeconds?: number } = {}
): ApiFailure {
  return {
    ok: false,
    error: {
      code,
      message: extra.message ?? PUBLIC_ERROR_MESSAGE[code],
      ...(extra.fields === undefined ? {} : { fields: extra.fields }),
      ...(extra.retryAfterSeconds === undefined
        ? {}
        : { retryAfterSeconds: extra.retryAfterSeconds })
    },
    requestId
  };
}

/** Flatten a Zod error into per-field messages safe to return to the browser. */
export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length === 0 ? "_form" : issue.path.join(".");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
