const value = process.env.NEXT_PUBLIC_SITE_URL;
function fail(reason) {
  console.error(`\ncf:build refused: ${reason}\n`);
  console.error("NEXT_PUBLIC_SITE_URL must be the URL this deployment will actually serve.");
  console.error("Canonicals, og:url, JSON-LD, robots.txt, and sitemap.xml are baked from it.\n");
  console.error("  NEXT_PUBLIC_SITE_URL=https://your-domain.example pnpm cf:build\n");
  process.exit(1);
}
if (value === undefined || value.trim() === "") fail("NEXT_PUBLIC_SITE_URL is not set");
let url;
try { url = new URL(value); } catch { fail(`not a valid URL: ${value}`); }
if (url.protocol !== "https:") fail(`must be https, got: ${value}`);
if (/^(localhost|127\.|0\.0\.0\.0|\[?::1)/i.test(url.hostname)) fail(`points at a local host: ${value}`);
console.log(`cf:build: canonical origin is ${url.origin}`);
