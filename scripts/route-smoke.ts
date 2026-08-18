import { ROUTE_REGISTRY } from "../apps/web/content/routes";

type Failure = { route: string; reason: string };

async function main(): Promise<void> {
  const baseUrl = new URL(process.argv[2] ?? "http://127.0.0.1:8787");
  const repeats = [
    "/",
    "/properties",
    "/calculators/affordability",
    "/vision",
    "/mortgage/fha",
    "/api/v1/health",
    "/properties/FX-STP-0001"
  ];
  const routes = [...ROUTE_REGISTRY.map((entry) => entry.path), "/api/v1/health", ...repeats];

  if (routes.length !== 50) {
    throw new Error(`Route smoke contract expected 50 requests, received ${routes.length}`);
  }

  const failures: Failure[] = [];
  let totalMilliseconds = 0;
  let maximumMilliseconds = 0;

  for (const [index, route] of routes.entries()) {
    const url = new URL(route, baseUrl);
    const started = performance.now();

    try {
      const response = await fetch(url, {
        headers: {
          Accept: route.startsWith("/api/") ? "application/json" : "text/html",
          "Cache-Control": "no-cache"
        },
        redirect: "follow",
        signal: AbortSignal.timeout(15_000)
      });
      const body = await response.text();
      const elapsed = performance.now() - started;
      totalMilliseconds += elapsed;
      maximumMilliseconds = Math.max(maximumMilliseconds, elapsed);

      const resourceLimitPage = /error\s*(?:code\s*)?1102|worker exceeded resource limits/i.test(
        body
      );
      if (!response.ok || resourceLimitPage) {
        failures.push({
          route,
          reason: resourceLimitPage ? "Cloudflare Error 1102" : `HTTP ${response.status}`
        });
      }

      console.log(
        `${String(index + 1).padStart(2, "0")} ${route.padEnd(38)} ${response.status} ${elapsed.toFixed(1)}ms`
      );
    } catch (error) {
      const elapsed = performance.now() - started;
      totalMilliseconds += elapsed;
      maximumMilliseconds = Math.max(maximumMilliseconds, elapsed);
      failures.push({
        route,
        reason: error instanceof Error ? error.message : "unknown request failure"
      });
      console.log(`${String(index + 1).padStart(2, "0")} ${route.padEnd(38)} ERR`);
    }
  }

  console.log(
    `route smoke: ${routes.length} requests, ${failures.length} failures, ` +
      `${(totalMilliseconds / routes.length).toFixed(1)}ms average, ` +
      `${maximumMilliseconds.toFixed(1)}ms maximum`
  );

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`  ${failure.route}: ${failure.reason}`);
    }
    process.exitCode = 1;
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "route smoke failed");
  process.exitCode = 1;
});
