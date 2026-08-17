/**
 * Test-only stand-in for the `server-only` package.
 *
 * In the application, importing `server-only` from a client component is a build
 * error — that is the mechanism keeping secrets out of the browser bundle. Under
 * Vitest there is no bundler to enforce it and no client boundary to cross, so
 * the import resolves here instead of the server modules being softened to suit
 * the test runner.
 */
export {};
