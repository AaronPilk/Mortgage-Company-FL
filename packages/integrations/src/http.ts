/**
 * The fetch every adapter calls.
 *
 * On Cloudflare Workers the global `fetch` is a method of the global object and
 * refuses to run with any other `this`: `this.fetchImpl(url)` on an adapter
 * instance throws `TypeError: Illegal invocation`. Node tolerates it, which is
 * why unit tests and `next start` never saw it, and the request path on
 * OpenNext wraps fetch in a way that happened to tolerate it too. The scheduled
 * outbox drain does not, so every CRM delivery died there with that error
 * (integration_outbox, 2026-08-24 and 2026-11-16).
 *
 * Adapters take an injected `fetchImpl` for tests and fall back to this, which
 * always calls fetch as a free function.
 */
export function defaultFetch(impl: typeof fetch | undefined): typeof fetch {
  if (impl !== undefined) return impl;
  return (input, init) => fetch(input, init);
}
