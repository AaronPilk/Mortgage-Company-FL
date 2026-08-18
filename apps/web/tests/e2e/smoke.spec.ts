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
  test("states the company type and leads with the funnel form", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Honest answers about your Florida mortgage"
    );
    await expect(page.getByText("Florida mortgage brokerage").first()).toBeVisible();
    // The page exists to convert paid intent traffic, so the form shares the
    // hero with the message rather than living behind a /contact link.
    const hero = page.getByTestId("hero-product-proof");
    const form = hero.locator('form[data-form-id="home-hero"]');
    await expect(form).toBeVisible();
    await expect(form.getByText("Step 1 of 4", { exact: true })).toBeVisible();
    await expect(form.getByRole("heading", { name: "What are you trying to do?" })).toBeVisible();
  });

  test("walks one question per screen to the contact step and back", async ({ page }) => {
    await page.goto("/");
    const form = page.locator('form[data-form-id="home-hero"]');

    // The choice cards are real radio inputs (visually hidden), and clicking a
    // card auto-advances — no Continue click between questions.
    expect(await form.locator('input[type="radio"][name="intent"]').count()).toBe(4);
    await form.getByText("Buy a home", { exact: true }).click();
    await expect(form.getByText("Step 2 of 4", { exact: true })).toBeVisible();
    await expect(
      form.getByRole("heading", { name: "When are you hoping to do it?" })
    ).toBeVisible();

    await form.getByText("Within 3 months", { exact: true }).click();
    await expect(form.getByText("Step 3 of 4", { exact: true })).toBeVisible();
    // Credit is a self-reported band with an explicit "Not sure" escape hatch.
    await expect(form.getByText("Not sure", { exact: true })).toBeVisible();
    await form.getByText("Not sure", { exact: true }).click();
    await expect(form.getByText("Step 4 of 4", { exact: true })).toBeVisible();

    // The final screen collects contact details, separate consents, and submit.
    await expect(form.locator('input[name="firstName"]')).toBeVisible();
    await expect(form.locator('input[name="privacyAccepted"]')).toHaveAttribute("required", "");
    await expect(form.locator('input[name="smsMarketing"]')).not.toHaveAttribute("required", "");
    await expect(form.locator('input[name="emailMarketing"]')).not.toHaveAttribute("required", "");
    await expect(form.getByRole("button", { name: "Request a call" })).toBeVisible();

    // Back returns to the previous question without losing the flow.
    await form.getByRole("button", { name: "Back" }).click();
    await expect(form.getByText("Step 3 of 4", { exact: true })).toBeVisible();
  });

  test("picking Sell my home drops the credit question and shortens the funnel", async ({
    page
  }) => {
    await page.goto("/");
    const form = page.locator('form[data-form-id="home-hero"]');

    // Connection framing only: TRACT does not list homes, and the option's
    // sub-copy claims nothing beyond ownership and readiness to sell.
    await expect(form.getByText("I own and I'm ready to sell", { exact: true })).toBeVisible();
    await form.getByText("Sell my home", { exact: true }).click();

    // Three steps, not four — a seller is never asked for a credit band.
    await expect(form.getByText("Step 2 of 3", { exact: true })).toBeVisible();
    await form.getByText("Within 3 months", { exact: true }).click();
    await expect(form.getByText("Step 3 of 3", { exact: true })).toBeVisible();
    await expect(form.locator('input[name="firstName"]')).toBeVisible();
    expect(await form.locator('input[type="radio"][name="creditBand"]').count()).toBe(0);
  });

  test("keeps the homepage form a marketing form, not an application", async ({ page }) => {
    await page.goto("/");
    const form = page.locator('form[data-form-id="home-hero"]');
    const collectedNames: string[] = [];
    const collectNames = async () => {
      const names = await form
        .locator("input, select, textarea")
        .evaluateAll((elements) => elements.map((element) => element.getAttribute("name") ?? ""));
      collectedNames.push(...names);
      expect(await form.locator('input[type="file"]').count()).toBe(0);
      // The "not an application" framing must be visible on every step.
      await expect(form.getByText("This is not an application").first()).toBeVisible();
    };

    await collectNames();
    await form.getByText("Refinance", { exact: true }).click();
    await expect(form.getByText("Step 2 of 4", { exact: true })).toBeVisible();
    await collectNames();
    await form.getByText("Just researching", { exact: true }).click();
    await expect(form.getByText("Step 3 of 4", { exact: true })).toBeVisible();
    await collectNames();
    await form.getByText("Not sure", { exact: true }).click();
    await expect(form.getByText("Step 4 of 4", { exact: true })).toBeVisible();
    await collectNames();

    for (const forbidden of [
      "ssn",
      "socialSecurity",
      "dob",
      "dateOfBirth",
      "income",
      "accountNumber"
    ]) {
      expect(collectedNames).not.toContain(forbidden);
    }
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

test.describe("talk chooser and campaign landings", () => {
  test("the header CTA routes to the chooser, which routes each audience", async ({ page }) => {
    await page.goto("/");
    // Both Talk to us entry points — header and the mobile bar — go to /talk.
    await expect(page.locator('[data-cta="header-consultation"]')).toHaveAttribute("href", "/talk");
    await expect(page.locator('[data-cta="mobile-bar-contact"]')).toHaveAttribute("href", "/talk");

    await page.goto("/talk");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "What brings you to TRACT?"
    );
    for (const [label, href] of [
      ["Buying a home", "/get-started/purchase"],
      ["Selling a home", "/get-started/sell"],
      ["I'm a real estate agent", "/partners/real-estate-agents"],
      ["I'm an investor", "/get-started/investment"]
    ] as const) {
      // Scoped to main: the footer links program pages under similar names.
      await expect(
        page.locator("main").getByRole("link", { name: new RegExp(label) })
      ).toHaveAttribute("href", href);
    }
  });

  test("a campaign page presets the intent and opens on the timing question", async ({ page }) => {
    // The heloc visitor already told the ad what they want, so the goal
    // question is gone and the funnel is one step shorter.
    await page.goto("/get-started/heloc");
    const form = page.locator('form[data-form-id="campaign-heloc"]');
    await expect(form).toBeVisible();
    await expect(form.getByText("Step 1 of 3", { exact: true })).toBeVisible();
    await expect(
      form.getByRole("heading", { name: "When are you hoping to access your equity?" })
    ).toBeVisible();
    expect(await form.locator('input[type="radio"][name="intent"]').count()).toBe(0);
    // Education framing, never an application, on the page itself.
    await expect(form.getByText("This is not an application").first()).toBeVisible();
  });

  test("the sell funnel skips credit and keeps the handoff framing honest", async ({ page }) => {
    await page.goto("/get-started/sell");
    const body = (await page.locator("body").innerText()).toLowerCase();
    // TRACT does not list homes; the page must say so, and never imply it does.
    expect(body).toContain("don't list homes");

    const form = page.locator('form[data-form-id="campaign-sell"]');
    await expect(form.getByText("Step 1 of 2", { exact: true })).toBeVisible();
    await expect(
      form.getByRole("heading", { name: "When are you looking to sell?" })
    ).toBeVisible();
    await form.getByText("Within 3 months", { exact: true }).click();
    // Straight to contact — a seller is never asked for a credit band.
    await expect(form.getByText("Step 2 of 2", { exact: true })).toBeVisible();
    await expect(form.locator('input[name="firstName"]')).toBeVisible();
    expect(await form.locator('input[type="radio"][name="creditBand"]').count()).toBe(0);
  });

  test("campaign pages and the chooser stay out of the index", async ({ page }) => {
    for (const path of ["/talk", "/get-started/purchase", "/get-started/sell"]) {
      await page.goto(path);
      const robots = page.locator('meta[name="robots"]');
      await expect(robots).toHaveAttribute("content", /noindex/);
    }
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
