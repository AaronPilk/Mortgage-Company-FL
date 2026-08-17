import "server-only";
import { redact } from "@tract/domain";

/**
 * Structured logging with mandatory redaction.
 *
 * Everything passing through here is redacted first. There is no "raw" escape
 * hatch, because the one place someone adds it is the place a phone number ends
 * up in an error tracker.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = {
  requestId?: string;
  route?: string;
  outcome?: string;
  durationMs?: number;
  adapter?: string;
  jobId?: string;
  errorCode?: string;
  actorKind?: string;
  [key: string]: unknown;
};

function emit(level: LogLevel, message: string, fields: LogFields): void {
  const line = JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(redact(fields) as Record<string, unknown>)
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (message: string, fields: LogFields = {}) => emit("debug", message, fields),
  info: (message: string, fields: LogFields = {}) => emit("info", message, fields),
  warn: (message: string, fields: LogFields = {}) => emit("warn", message, fields),
  error: (message: string, fields: LogFields = {}) => emit("error", message, fields)
};
