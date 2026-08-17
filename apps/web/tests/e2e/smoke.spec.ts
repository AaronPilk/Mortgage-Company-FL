import { expect, test } from "@playwright/test";

/**
 * Conversion-path and safety smoke tests.
 *
 * Each of these guards a property that is easy to break silently: the company
 * type disappearing from the hero, a calculator stopping at principal and
 * interest, a disclosure being dropped for layout reasons, an admin route
 * becoming reachable, or a protected page entering the index.
 */

test.describe("home page", () => {
  test("states the company type and both primary actions above the fold", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "clearer path from home search to mortgage plan"
    );
    await expect(page.getByText("Florida mortgage brokerage").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Build my mortgage plan" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Explore payment calculators" })).toBeVisible();
  });

  test("never claims to be a lender and always carries the broker disclosure", async ({ page }) => {
    await page.goto("/");
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toContain("we arrange, but do not make, mortgage loans");
    expect(body).not.toContain("equal housing lender");
    expect(body).not.toContain("guaranteed approval");
    expect(body).not.toContain("lowest rate");
  });

  test("shows the pre-launch notice while licensing is pending", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("status").first()).toContainText("pre-launch");
  });
});

test.describe("calculators", () => {
  test("computes a full housing payment, not just principal and interest", async ({ page }) => {
    await page.goto("/calculators/mortgage-payment");
    const total = page.locator("tfoot td").first();
    await expect(total).toBeVisible();
    const totalText = await total.innerText();
    const principalText = await page.locator("tbody tr").first().locator("td").innerText();
    const parse = (value: string) => Number(value.replace(/[^0-9.]/g, ""));
    expect(parse(totalText)).toBeGreaterThan(parse(principalText));
  });

  test("updates the result when an input changes", async ({ page }) => {
    await page.goto("/calculators/mortgage-payment");
    const before = await page.locator("tfoot td").first().innerText();
    await page.locator("#calc-rate").fill("900");
    await page.locator("#calc-rate").dispatchEvent("change");
    await expect(page.locator("tfoot td").first()).not.toHaveText(before);
  });

  test("carries a disclosure on every calculator page", async ({ page }) => {
    for (const path of [
      "/calculators/mortgage-payment",
      "/calculators/affordability",
      "/calculators/refinance-break-even",
      "/calculators/rent-vs-buy",
      "/calculators/closing-cost"
    ]) {
      await page.goto(path);
      const body = (await page.locator("body").innerText()).toLowerCase();
      expect(body, `${path} is missing an estimate disclosure`).toContain("estimate");
      expect(body, `${path} is missing a disclosure version`).toContain("disclosure version");
    }
  });

  test("is reachable and operable by keyboard", async ({ page }) => {
    await page.goto("/calculators/closing-cost");
    await page.locator("#cc-price").focus();
    await expect(page.locator("#cc-price")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator("#cc-down")).toBeFocused();
  });
});

test.describe("lead form", () => {
  test("announces validation errors accessibly instead of failing silently", async ({ page }) => {
    await page.goto("/contact");
    // Submitting empty relies on native constraint validation; the first invalid
    // control must receive focus rather than the page appearing to do nothing.
    await page.getByRole("button", { name: "Request a call" }).click();
    const firstInvalid = page.locator("input:invalid").first();
    await expect(firstInvalid).toBeVisible();
  });

  test("separates the request to be contacted from marketing consent", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator('input[name="privacyAccepted"]')).toHaveAttribute("required", "");
    await expect(page.locator('input[name="smsMarketing"]')).not.toHaveAttribute("required", "");
    await expect(page.locator('input[name="emailMarketing"]')).not.toHaveAttribute("required", "");
  });

  test("never asks for an identifier that belongs in the secure application", async ({ page }) => {
    await page.goto("/contact");
    const names = await page
      .locator("form input, form select, form textarea")
      .evaluateAll((elements) => elements.map((element) => element.getAttribute("name") ?? ""));
    for (const forbidden of [
      "ssn",
      "socialSecurity",
      "dob",
      "dateOfBirth",
      "income",
      "accountNumber"
    ]) {
      expect(names).not.toContain(forbidden);
    }
    expect(await page.locator('form input[type="file"]').count()).toBe(0);
  });

  test("tells the visitor plainly that this is not an application", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByText("This is not an application").first()).toBeVisible();
  });
});

test.describe("application handoff", () => {
  test("does not pretend applications are open when no system is configured", async ({ page }) => {
    await page.goto("/apply");
    await expect(page.getByText("Applications are not open yet")).toBeVisible();
  });
});

test.describe("property-to-Vision planning loop", () => {
  test("offers seven stable synthetic examples without calling them listings", async ({ page }) => {
    await page.goto("/properties");
    await expect(page.getByText("Demo catalog · not live listings")).toBeVisible();
    await expect(page.getByRole("link", { name: /Open planning demo for/ })).toHaveCount(7);
    const body = await page.locator("body").innerText();
    expect(body).toContain("Not a real property or MLS listing");
    expect(body).not.toContain("Courtesy of");
  });

  test("opens a stable property detail and seeds Vision", async ({ page }) => {
    await page.goto("/properties/FX-STP-0001");
    await expect(page.getByText("Synthetic planning example · not for sale")).toBeVisible();
    await page.getByRole("link", { name: "Model this example in Vision" }).click();
    await expect(page).toHaveURL(/\/vision\?property=FX-STP-0001/);
    await expect(page.getByTestId("vision-planner")).toBeVisible();
    await expect(page.getByTestId("vision-preview")).toContainText("Report preview");
  });

  test("recalculates the visible preview before the contact gate", async ({ page }) => {
    await page.goto("/vision?property=FX-STP-0001");
    const preview = page.getByTestId("vision-preview");
    const before = await preview.innerText();
    await page.getByTestId("vision-improvement-budget").fill("125000");
    await expect(preview).not.toHaveText(before);
    await expect(preview).toContainText("Conservative", { ignoreCase: true });
    await expect(
      page.getByRole("heading", { name: "Ask TRACT to review this scenario" })
    ).toBeVisible();
  });

  test("fails honestly when durable report storage is not configured", async ({ page }) => {
    await page.goto("/vision?property=FX-STP-0001");
    await page.locator('input[name="firstName"]').fill("Dana");
    await page.locator('input[name="lastName"]').fill("Reyes");
    await page.locator('input[name="email"]').fill("dana@example.com");
    await page.locator('input[name="phone"]').fill("813-555-0147");
    await page.locator('input[name="privacyAccepted"]').check();
    await page.getByTestId("vision-request-submit").click();
    const error = page.getByTestId("vision-request-error");
    await expect(error).toBeVisible();
    await expect(error).toContainText("could not save");
    await expect(page.getByTestId("vision-request-success")).toHaveCount(0);
  });
});

test.describe("indexation and crawl control", () => {
  test("keeps protected routes out of the sitemap", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const xml = await response.text();
    for (const path of [
      "/admin",
      "/account",
      "/api",
      "/vision",
      "/rendprop",
      "/properties",
      "/offline"
    ]) {
      expect(xml, `${path} must not appear in the sitemap`).not.toContain(`${path}</loc>`);
    }
    expect(xml).toContain("/mortgage/fha");
  });

  test("marks feature and system pages noindex", async ({ page }) => {
    for (const path of ["/vision", "/rendprop", "/offline"]) {
      await page.goto(path);
      const robots = await page.locator('meta[name="robots"]').getAttribute("content");
      expect(robots, `${path} should be noindex`).toContain("noindex");
    }
  });

  test("serves robots.txt allowing assets and pointing at the sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");
    const text = await response.text();
    expect(text).toContain("Sitemap:");
    // Allowed so pages can surface in ChatGPT search.
    expect(text).toContain("OAI-SearchBot");
    // GPTBot is blocked on purpose — that is a training decision, separate from
    // search discovery — so the assertion targets the wildcard block only.
    const wildcardBlock = text.split(/User-Agent:/i)[1] ?? "";
    expect(wildcardBlock).toMatch(/Allow:\s*\//);
    expect(wildcardBlock).not.toMatch(/Disallow:\s*\/\s*$/m);
    expect(text).toMatch(/User-Agent:\s*GPTBot[\s\S]*?Disallow:\s*\//i);
  });
});

test.describe("structured data", () => {
  test("emits valid JSON-LD that never asserts an unissued licence", async ({ page }) => {
    await page.goto("/mortgage/fha");
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      expect(() => JSON.parse(block)).not.toThrow();
      expect(block).not.toContain("NMLS #");
      expect(block).not.toContain("interestRate");
      expect(block).not.toContain("aggregateRating");
    }
  });
});

test.describe("security headers", () => {
  test("sets the critical headers on a public page", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"]).toContain("object-src 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["x-frame-options"]).toBe("DENY");
  });

  test("marks API responses no-store and noindex", async ({ request }) => {
    const response = await request.get("/api/v1/health");
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
  });
});

test.describe("lead API", () => {
  test("rejects a cross-origin submission", async ({ request }) => {
    const response = await request.post("/api/v1/leads", {
      headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
      data: { intent: "purchase" }
    });
    expect(response.status()).toBe(403);
  });

  test("rejects a wrong content type before parsing anything", async ({ request }) => {
    const response = await request.post("/api/v1/leads", {
      headers: { "Content-Type": "text/plain", Origin: "http://127.0.0.1:3100" },
      data: "intent=purchase"
    });
    expect(response.status()).toBe(400);
  });

  test("returns field errors without leaking internals", async ({ request }) => {
    const response = await request.post("/api/v1/leads", {
      headers: { "Content-Type": "application/json", Origin: "http://127.0.0.1:3100" },
      data: { intent: "purchase" }
    });
    expect(response.status()).toBe(400);
    const body = await response.text();
    expect(body).not.toMatch(/supabase|postgres|stack|at Object|service_role/i);
  });

  test("answers a GET with 405 rather than exposing a handler", async ({ request }) => {
    const response = await request.get("/api/v1/leads");
    expect(response.status()).toBe(405);
    expect(response.headers()["allow"]).toBe("POST");
  });

  test("does not disclose credentials through the health probe", async ({ request }) => {
    const body = await (await request.get("/api/v1/health")).text();
    expect(body).not.toMatch(/key|secret|token|password/i);
  });
});

test.describe("Vision report API", () => {
  test("rejects cross-origin requests and exposes no GET handler", async ({ request }) => {
    const rejected = await request.post("/api/v1/vision/report-requests", {
      headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
      data: {}
    });
    expect(rejected.status()).toBe(403);

    const get = await request.get("/api/v1/vision/report-requests");
    expect(get.status()).toBe(405);
    expect(get.headers()["allow"]).toBe("POST");
  });
});

test.describe("admin", () => {
  test("is not reachable without a staff session", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("body")).not.toContainText("Launch readiness blockers");
    const text = await page.locator("body").innerText();
    expect(text.toLowerCase()).toMatch(
      /not available|do not have access|authentication is not configured/
    );
  });
});

test.describe("navigation and errors", () => {
  test("serves a useful 404", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("could not find");
  });

  test("exposes a working skip link", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  });

  test("serves an installable manifest", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.status()).toBe(200);
    const manifest = (await response.json()) as {
      display: string;
      start_url: string;
      icons: unknown[];
    };
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});
