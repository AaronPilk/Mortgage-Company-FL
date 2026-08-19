import { expect, test } from "@playwright/test";

test.describe("integrated recovery workflows", () => {
  test("renders the generated hero with a bounded image fallback", async ({ page }) => {
    await page.goto("/");
    const proof = page.getByTestId("hero-product-proof");
    await expect(proof).toContainText("Honest answers about your Florida mortgage");
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

    // Accounts are an invitation here, never a gate: the signed-out nudges are
    // present, dismissible, and nothing about the search stops working.
    await expect(page.getByText("to save searches and homes.")).toBeVisible();
    await page.getByRole("button", { name: "Dismiss account suggestion" }).click();
    await expect(page.getByText("to save searches and homes.")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Save this search" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save property" }).first()).toBeVisible();

    // The natural-language search is an account feature outright: signed out,
    // submitting the bar opens the account dialog instead of running any
    // search, and the pill under it says so plainly. The dialog carries the
    // email + password form and closes cleanly from the keyboard. Creating an
    // account is the default; sign-in is one toggle away, and the reset path
    // hangs off sign-in.
    await page.locator("#ai-property-query").fill("3 bed in st pete");
    await page.getByRole("button", { name: "Search properties" }).click();
    const dialogFromBar = page.getByRole("dialog", { name: "Unlock AI search" });
    await expect(dialogFromBar).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialogFromBar).toHaveCount(0);

    const unlock = page.getByRole("button", { name: "AI search requires a free account" });
    await expect(unlock).toBeVisible();
    await unlock.click();
    const dialog = page.getByRole("dialog", { name: "Unlock AI search" });
    await expect(dialog).toBeVisible();
    // Create mode is a full consented lead capture: name, email, phone,
    // password, and the same three unbundled consent checkboxes as every lead
    // form — the required contact consent and the two optional marketing
    // channels — plus the Turnstile container the lead endpoint requires.
    await expect(dialog.getByLabel("First name")).toBeVisible();
    await expect(dialog.getByLabel("Last name")).toBeVisible();
    await expect(dialog.getByLabel("Email address")).toBeVisible();
    await expect(dialog.getByLabel("Phone")).toBeVisible();
    await expect(dialog.getByLabel("Password")).toBeVisible();
    await expect(dialog.locator('input[name="privacyAccepted"]')).toHaveAttribute("required", "");
    await expect(dialog.locator('input[name="smsMarketing"]')).not.toHaveAttribute("required", "");
    await expect(dialog.locator('input[name="emailMarketing"]')).not.toHaveAttribute(
      "required",
      ""
    );
    await expect(dialog.getByTestId("account-turnstile")).toBeAttached();
    await expect(dialog.getByRole("button", { name: "Create my account" })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "terms of use" })).toBeVisible();
    // Two privacy links on purpose: the consent disclosure's and the standing
    // terms line's. Exact match separates them.
    await expect(dialog.getByRole("link", { name: "Privacy policy", exact: true })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "privacy policy", exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Sign in", exact: true }).click();
    // Sign-in stays email + password only; the lead-capture fields are
    // create-mode furniture.
    await expect(dialog.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
    await expect(dialog.getByLabel("First name")).toHaveCount(0);
    await expect(dialog.getByLabel("Phone")).toHaveCount(0);
    await expect(dialog.locator('input[name="privacyAccepted"]')).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: "Forgot password?" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Create an account" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);

    // The signed-out save path opens the same dialog, named for its benefit.
    await page.getByRole("button", { name: "Save this search" }).click();
    const saveDialog = page.getByRole("dialog", { name: "Save this search" });
    await expect(saveDialog).toBeVisible();
    await expect(saveDialog.getByLabel("Email address")).toBeVisible();
    await expect(saveDialog.getByLabel("Password")).toBeVisible();
    await expect(saveDialog.getByRole("button", { name: "Create my account" })).toBeVisible();
    await saveDialog.getByRole("button", { name: "Close dialog" }).click();
    await expect(saveDialog).toHaveCount(0);

    await page.goto("/properties/FX-TPA-0001");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Example Bay Dr");
    await expect(page.getByRole("note", { name: "Sample data notice" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    const structuredData = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(structuredData.join(" ")).not.toMatch(/RealEstateListing|Offer|Residence/);
  });

  test("gates the planner behind sign-up, captures the early lead, and confirms contact at the end", async ({
    page
  }) => {
    const payloads: Array<Record<string, unknown>> = [];
    await page.route("**/api/v1/leads", async (route) => {
      payloads.push(route.request().postDataJSON() as Record<string, unknown>);
      // The first gate attempt fails so the test proves the failure is
      // recoverable in place: the error summary takes focus, and an unchanged
      // retry posts the same submissionId (Turnstile, when configured, is
      // reset for a fresh single-use token — see resetTurnstile in
      // planner.tsx; the e2e build runs without a widget).
      if (payloads.length === 1) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            ok: false,
            error: { code: "INTERNAL_ERROR", message: "Gate retry test response.", requestId: "t" }
          })
        });
        return;
      }
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            receiptId:
              payloads.length === 2
                ? "00000000-0000-4000-8000-000000000501"
                : "00000000-0000-4000-8000-000000000502",
            receivedAt: "2026-08-18T12:00:00.000Z",
            intent: "purchase",
            nextStep: "human_follow_up"
          },
          requestId: "planner-gate-e2e"
        })
      });
    });

    // The gate comes before any planner question: name, email, phone, and the
    // separate consent checkboxes, with the marketing opt-ins left unchecked to
    // prove they are not a condition of proceeding.
    await page.goto("/plan");
    await expect(page.getByRole("heading", { name: "Sign up to start planning" })).toBeVisible();
    await expect(page.getByLabel("Buy a home to live in")).toHaveCount(0);
    await page.locator('input[name="firstName"]').fill("Dana");
    await page.locator('input[name="lastName"]').fill("Reyes");
    await page.locator('input[name="email"]').fill("dana@example.com");
    await page.locator('input[name="phone"]').fill("813-555-0147");
    await page.locator('input[name="privacyAccepted"]').check();
    await page.getByRole("button", { name: "Start planning" }).click();

    // The rejection is announced AND focused — the summary renders for the
    // first time on this failure, which is exactly the case a pre-commit
    // microtask used to miss.
    const gateAlert = page.locator('form [role="alert"]');
    await expect(gateAlert).toContainText("Gate retry test response.");
    await expect(gateAlert).toBeFocused();

    // An unchanged retry succeeds and reuses the same submissionId, so the
    // server-side idempotency dedupe holds across the failure.
    await page.getByRole("button", { name: "Start planning" }).click();
    await expect.poll(() => payloads.length).toBe(2);
    expect(payloads[1]).toEqual(payloads[0]);

    // The abandonment-safe lead posts before any planner answer.
    expect(payloads[1]).toMatchObject({
      intent: "general",
      firstName: "Dana",
      email: "dana@example.com",
      message: "Planner started — full answers may follow."
    });
    expect(payloads[1]).not.toHaveProperty("planner");
    expect(payloads[1]?.consent).toMatchObject({
      privacyAccepted: true,
      smsMarketing: false,
      emailMarketing: false
    });

    // The planner unlocks and the estimate still appears before the final
    // contact step, which is now a review of what the gate collected.
    await page.getByLabel("Buy a home to live in").check();
    await page.getByLabel("Within 30 days").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Your working estimate" })).toBeVisible();
    await expect(page.getByText("No credit pull").first()).toBeVisible();

    await page.getByLabel("Single family", { exact: true }).check();
    await page.getByLabel("I am actively looking").check();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByLabel("Where you think your credit sits").selectOption("680_719");
    await page.getByLabel("How you are paid").selectOption("w2");
    await page.getByLabel("Gross monthly household income").selectOption("8k_12k");
    await page.getByLabel("Other monthly obligations").selectOption("under_500");
    await page.getByRole("button", { name: "Continue" }).click();

    // Review, not re-entry: the gate's answers are prefilled and editable.
    await expect(
      page.getByRole("heading", { name: "Confirm who we should get back to" })
    ).toBeVisible();
    await expect(page.locator('input[name="email"]')).toHaveValue("dana@example.com");
    await expect(page.locator('input[name="phone"]')).toHaveValue("813-555-0147");
    await expect(page.locator('input[name="privacyAccepted"]')).toBeChecked();

    await page.getByRole("button", { name: "Send my plan" }).click();
    await expect(page.getByRole("heading", { name: "We have your plan" })).toBeVisible();

    // The second, richer lead carries the full planner payload, exactly as the
    // pre-gate planner submitted it.
    await expect.poll(() => payloads.length).toBe(3);
    expect(payloads[2]).toMatchObject({ intent: "purchase", email: "dana@example.com" });
    expect(payloads[2]?.planner).toMatchObject({
      goal: "purchase",
      propertyType: "single_family",
      propertyStage: "actively_looking",
      creditBand: "680_719",
      employment: "w2",
      incomeBand: "8k_12k",
      monthlyDebtBand: "under_500",
      timing: "within_30_days"
    });
    expect(String(payloads[2]?.submissionId)).not.toBe(String(payloads[1]?.submissionId));
  });

  test("account creation posts the consented lead first and stops on a validation rejection", async ({
    page
  }) => {
    // The first-party write is authoritative: creating an account posts the
    // person to /api/v1/leads BEFORE Supabase Auth is ever called. The lead
    // POST is interceptable; auth.signUp is not — so this walk stops at the
    // lead rejection, which also proves a validation failure blocks account
    // creation instead of creating an account around bad contact data.
    const payloads: Array<Record<string, unknown>> = [];
    await page.route("**/api/v1/leads", async (route) => {
      payloads.push(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Please check the highlighted fields.",
            fields: { phone: ["Enter a phone number we can reach you at."] },
            requestId: "account-create-e2e"
          }
        })
      });
    });
    // Any escape past the rejection toward Supabase Auth is a test failure,
    // never a real network sign-up.
    const authCalls: string[] = [];
    await page.route("**/auth/v1/**", async (route) => {
      authCalls.push(route.request().url());
      await route.abort();
    });

    await page.goto("/account");
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("First name").fill("Dana");
    await page.getByLabel("Last name").fill("Reyes");
    await page.getByLabel("Email address").fill("dana@example.com");
    await page.getByLabel("Phone").fill("813-555-0147");
    await page.getByLabel("Password", { exact: false }).first().fill("a-long-password");
    await page.locator('input[name="privacyAccepted"]').check();
    // One optional channel on, one off: the checkboxes must map through
    // independently, not as a bundle.
    await page.locator('input[name="emailMarketing"]').check();
    await page.getByRole("button", { name: "Create my account" }).click();

    // The rejection surfaces in the form's alert styling with the field detail.
    const alert = page.locator('form [role="alert"]');
    await expect(alert).toContainText("Please check the highlighted fields.");
    await expect(alert).toContainText("Enter a phone number we can reach you at.");

    expect(payloads.length).toBe(1);
    expect(payloads[0]).toMatchObject({
      intent: "general",
      firstName: "Dana",
      lastName: "Reyes",
      email: "dana@example.com",
      phone: "813-555-0147",
      message: "Created a TRACT account.",
      consent: {
        privacyAccepted: true,
        contactRequested: true,
        smsMarketing: false,
        emailMarketing: true
      }
    });
    expect(String(payloads[0]?.submissionId)).toMatch(/^[0-9a-f-]{36}$/i);
    expect(payloads[0]?.firstTouch).toMatchObject({ landingPath: "/account" });
    expect(payloads[0]?.conversionTouch).toMatchObject({ landingPath: "/account" });
    // The password never rides on the lead, under any name.
    expect(JSON.stringify(payloads[0])).not.toContain("a-long-password");
    // The walk stopped at the lead: Supabase Auth was never reached.
    expect(authCalls).toEqual([]);
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

  test("keeps public tools available on /account in every auth state", async ({ page }) => {
    /*
      The durable invariant is the escape hatch: whatever state Supabase Auth is
      in — unconfigured (no keys in the build) or configured (the committed
      .env.production now carries them) — a signed-out visitor always gets the
      page, an explanation of the state they are in, and a way to use the
      public tools. The original assertion pinned the unconfigured notice
      specifically, which made the test describe the build environment rather
      than the boundary it exists to protect.
    */
    await page.goto("/account");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("saved TRACT work");
    await expect(
      page
        .getByText(/account sign-in is not configured/i)
        .or(page.getByText(/sign in with your email and password/i))
        .first()
    ).toBeVisible();
    // The header's account affordance reflects the signed-out state: a quiet
    // "Sign in" link pointing here, in both the desktop cluster and the
    // mobile nav.
    const headerAccountLinks = page.locator('header a[data-nav="account"]');
    expect(await headerAccountLinks.count()).toBe(2);
    for (const link of await headerAccountLinks.all()) {
      await expect(link).toHaveAttribute("href", "/account");
      await expect(link).toHaveText("Sign in");
    }
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
