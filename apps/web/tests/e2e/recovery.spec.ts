import { expect, test } from "@playwright/test";

test.describe("integrated recovery workflows", () => {
  test("renders the generated hero with a bounded image fallback", async ({ page }) => {
    await page.goto("/");
    const proof = page.getByTestId("hero-product-proof");
    await expect(proof).toContainText("Know the housing payment");
    expect(
      await proof.locator("img").evaluate((image: HTMLImageElement) => image.naturalWidth)
    ).toBeGreaterThan(0);

    await page.route("**/images/home/hero-florida-home*.webp", async (route) => {
      await route.fulfill({ status: 404, body: "missing responsive source in fallback test" });
    });
    await page.route("**/_next/image?*", async (route) => {
      const source = new URL(route.request().url()).searchParams.get("url");
      if (
        source === "/images/home/hero-florida-home.webp" ||
        source === "/images/home/hero-florida-home-1200.webp"
      ) {
        await route.fulfill({ status: 404, body: "missing in fallback test" });
        return;
      }
      await route.continue();
    });
    await page.reload();
    await expect(proof.locator('[data-media-state="fallback"]')).toContainText(
      "Generated hero preview unavailable"
    );
  });

  test("keeps the property marketplace visibly synthetic and non-indexable", async ({ page }) => {
    await page.goto("/properties");
    await expect(page.getByRole("note", { name: "Sample data notice" })).toContainText(
      "not active MLS listings"
    );
    await expect(page.getByText("18 sample properties match")).toBeVisible();
    await expect(page.getByText("Sample data — not a real listing").first()).toBeVisible();

    await page.goto("/properties/FX-TPA-0001");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Example Bay Dr");
    await expect(page.getByRole("note", { name: "Sample data notice" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    const structuredData = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(structuredData.join(" ")).not.toMatch(/RealEstateListing|Offer|Residence/);
  });

  test("shows the planner estimate before asking for contact details", async ({ page }) => {
    await page.goto("/plan");
    await expect(page.locator('input[name="email"]')).toHaveCount(0);
    await page.getByLabel("Buy a home to live in").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Your working estimate" })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toHaveCount(0);
    await expect(page.getByText("No credit pull").first()).toBeVisible();
  });

  test("shows a deterministic Vision result before the optional report form", async ({ page }) => {
    let submitted: Record<string, unknown> | undefined;
    await page.route("**/api/v1/vision/report-requests", async (route) => {
      submitted = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            receiptId: "00000000-0000-4000-8000-000000000410",
            reportId: "00000000-0000-4000-8000-000000000411",
            receivedAt: "2026-08-17T12:00:00.000Z",
            status: "draft"
          },
          meta: { requestId: "vision-e2e" }
        })
      });
    });
    await page.goto("/vision/start");
    await page.getByRole("button", { name: /Renovate an existing home/ }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.locator("#vision-price").fill("425000");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "See the result" }).click();
    await expect(page.getByText("No contact details needed")).toBeVisible();
    await expect(page.locator('input[name="email"]')).toHaveCount(0);
    await expect(page.getByText(/Produced by a deterministic model/)).toBeVisible();

    await page.getByRole("button", { name: "Get the full report" }).click();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.getByText("The preview above is yours and stays free.")).toBeVisible();
    await page.locator('input[name="firstName"]').fill("Dana");
    await page.locator('input[name="lastName"]').fill("Reyes");
    await page.locator('input[name="email"]').fill("dana@example.com");
    await page.locator('input[name="phone"]').fill("813-555-0147");
    await page.locator('input[name="privacyAccepted"]').check();
    await page.getByRole("button", { name: "Send me the full report" }).click();
    await expect(page.getByRole("heading", { name: "We have your scenario" })).toBeVisible();

    expect(submitted?.scenario).toMatchObject({
      analysisType: "existing_home_renovation",
      purchasePriceCents: 42_500_000
    });
    expect(submitted).not.toHaveProperty("result");
    expect(submitted).not.toHaveProperty("figures");
    expect(submitted).not.toHaveProperty("calculations");
  });

  test("keeps RendProp illustrative and fails closed at the real provider boundary", async ({
    page
  }) => {
    await page.goto("/rendprop/demo");
    await expect(page.getByText("Illustrative walkthrough").first()).toBeVisible();
    await expect(page.getByText(/No media provider is connected/).first()).toBeVisible();
    await page.getByRole("button", { name: /Choose transformations/ }).click();
    await page.getByRole("button", { name: "Attempt one job" }).click();
    await expect(page.getByText("provider_not_configured")).toBeVisible();
    await expect(page.getByText("Provider reached")).toBeVisible();
  });

  test("keeps the attributed sample tour labelled and mobile-safe", async ({ page }) => {
    await page.goto(
      "/tour/rendprop-coastal-demo?utm_source=rendprop_demo&utm_medium=onsite_qr&utm_campaign=agent_sample_tour"
    );
    await expect(page.getByText("TRACT sample workflow")).toBeVisible();
    await expect(page.getByText("Virtually staged", { exact: true })).toBeVisible();
    await expect(page.getByText("Floor-plan candidate · generated · not to scale")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
    ).toBeLessThanOrEqual(1);
  });

  test("keeps one submission id and all attribution touches across an exact retry", async ({
    page
  }) => {
    const payloads: Array<Record<string, unknown>> = [];
    await page.route("**/api/v1/leads", async (route) => {
      payloads.push(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          error: { code: "INTERNAL_ERROR", message: "Test retry response.", requestId: "test" }
        })
      });
    });
    await page.goto("/contact?utm_source=recovery-test");
    await page.locator('input[name="firstName"]').fill("Dana");
    await page.locator('input[name="lastName"]').fill("Reyes");
    await page.locator('input[name="email"]').fill("dana@example.com");
    await page.locator('input[name="phone"]').fill("813-555-0147");
    await page.locator('input[name="privacyAccepted"]').check();
    await page.getByRole("button", { name: "Request a call" }).click();
    await expect(page.locator('form [role="alert"]')).toContainText("Test retry response");
    await page.getByRole("button", { name: "Request a call" }).click();
    await expect.poll(() => payloads.length).toBe(2);

    expect(payloads[0]).toEqual(payloads[1]);
    expect(String(payloads[0]?.submissionId)).toMatch(/^[0-9a-f-]{36}$/i);
    expect(payloads[0]?.firstTouch).toMatchObject({
      landingPath: "/contact",
      utmSource: "recovery-test"
    });
    expect(payloads[0]?.lastTouch).toMatchObject({ landingPath: "/contact" });
    expect(payloads[0]?.conversionTouch).toMatchObject({ landingPath: "/contact" });
  });

  test("fails honestly when durable lead storage is unavailable", async ({ page }) => {
    await page.goto("/contact");
    await page.locator('input[name="firstName"]').fill("Dana");
    await page.locator('input[name="lastName"]').fill("Reyes");
    await page.locator('input[name="email"]').fill("dana@example.com");
    await page.locator('input[name="phone"]').fill("813-555-0147");
    await page.locator('input[name="privacyAccepted"]').check();
    await page.getByRole("button", { name: "Request a call" }).click();
    await expect(page.locator('form [role="alert"]')).toContainText("could not save");
    await expect(page.getByText("We have your request")).toHaveCount(0);
  });

  test("exposes calculator scenario actions without requiring an account", async ({ page }) => {
    await page.goto("/calculators/mortgage-payment");
    const actions = page.getByTestId("scenario-actions");
    await expect(actions.getByRole("button", { name: "Save this scenario" })).toBeVisible();
    await expect(actions.getByRole("button", { name: "Email me this breakdown" })).toBeVisible();
    await expect(actions.getByRole("button", { name: "Talk through these numbers" })).toBeVisible();
    await expect(actions.getByRole("button", { name: "Save to my account" })).toBeVisible();
  });
});

test.describe("recovery system boundaries", () => {
  test("rejects public outbox drains", async ({ request }) => {
    const post = await request.post("/api/v1/internal/outbox/drain");
    expect(post.status()).toBe(401);
    expect(await post.text()).not.toMatch(/token|secret|supabase|crm/i);

    const get = await request.get("/api/v1/internal/outbox/drain");
    expect(get.status()).toBe(405);
    expect(get.headers()["allow"]).toBe("POST");
  });

  test("rejects hostile Vision report requests and exposes no GET handler", async ({ request }) => {
    const rejected = await request.post("/api/v1/vision/report-requests", {
      headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
      data: {}
    });
    expect(rejected.status()).toBe(403);

    const get = await request.get("/api/v1/vision/report-requests");
    expect(get.status()).toBe(405);
    expect(get.headers()["allow"]).toBe("POST");
  });

  test("keeps public tools available when account Auth is unconfigured", async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("saved TRACT work");
    await expect(page.getByText(/account sign-in is not configured/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Use calculators without an account" })
    ).toBeVisible();
  });

  test("rejects cross-origin account mutations and exposes no GET mutation", async ({
    request
  }) => {
    const rejected = await request.post("/api/v1/account/scenarios", {
      headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
      data: {}
    });
    expect(rejected.status()).toBe(403);

    const get = await request.get("/api/v1/account/scenarios");
    expect(get.status()).toBe(405);
    expect(get.headers()["allow"] ?? "").not.toContain("GET");
  });
});
