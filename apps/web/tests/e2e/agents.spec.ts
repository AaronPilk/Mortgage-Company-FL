import { expect, test } from "@playwright/test";

/**
 * Agent directory surfaces.
 *
 * The two invariants these tests exist to hold:
 *  1. Sample profiles are labelled everywhere they render, the surface stays
 *     noindex while they do, and no structured data ever asserts a fixture is
 *     a real agent.
 *  2. TRACT controls the lead: an agent's phone or email never appears in the
 *     DOM — the consumer requests an introduction, which is a TRACT lead.
 */
test.describe("agent directory", () => {
  test("renders the directory with sample labelling and noindex while samples show", async ({
    page
  }) => {
    await page.goto("/agents");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Find a Florida real estate agent"
    );
    await expect(page.getByRole("note", { name: "Sample profiles notice" })).toContainText(
      "Sample profiles — not real agents."
    );
    await expect(page.getByText("Sample profile — not a real agent").first()).toBeVisible();
    await expect(page.getByText("Sample Agent — Jordan Rivera")).toBeVisible();
    // Every fixture is unverified, so the honest pending state must show and
    // no card may claim verification.
    await expect(page.getByText("License verification pending").first()).toBeVisible();
    await expect(page.getByText("License verified", { exact: true })).toHaveCount(0);

    // Noindex while sample profiles are displayed, and no RealEstateAgent
    // markup for fixtures — a crawler cannot read the banner.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    const structuredData = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(structuredData.join(" ")).not.toContain("RealEstateAgent");

    // The city filter is a plain GET form: the state is the URL.
    await page.locator("#agents-city").selectOption("Tampa");
    await page.getByRole("button", { name: "Filter" }).click();
    await expect(page).toHaveURL(/\/agents\?city=Tampa/);
    await expect(page.getByText(/agents serving Tampa/)).toBeVisible();
    await expect(page.getByText("Sample Agent — Priya Natarajan")).toBeVisible();
    await expect(page.getByText("Sample Agent — Caleb Osei")).toHaveCount(0);
  });

  test("shows the introduction form on a profile and never an agent email or phone", async ({
    page
  }) => {
    await page.goto("/agents/sample-jordan-rivera");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Sample Agent — Jordan Rivera"
    );
    await expect(page.getByRole("note", { name: "Sample profiles notice" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

    // The centerpiece: the introduction request, with the consumer's own
    // contact fields and the three unbundled consent checkboxes.
    await expect(
      page.getByRole("heading", { name: /Want to work with Jordan\? We.ll introduce you\./ })
    ).toBeVisible();
    const form = page.locator('form[data-form-id="agent-introduction"]');
    await expect(form.locator('input[name="firstName"]')).toBeVisible();
    await expect(form.locator('input[name="email"]')).toBeVisible();
    await expect(form.locator('input[name="phone"]')).toBeVisible();
    await expect(form.locator('input[name="privacyAccepted"]')).toHaveAttribute("required", "");
    await expect(form.locator('input[name="smsMarketing"]')).not.toHaveAttribute("required", "");
    await expect(form.locator('input[name="emailMarketing"]')).not.toHaveAttribute("required", "");

    // The agent's contact details are never in the DOM, by design: no mailto
    // or tel link anywhere, and no email-shaped text on the page.
    expect(await page.locator('a[href^="mailto:"], a[href^="tel:"]').count()).toBe(0);
    expect(await page.locator("body").innerText()).not.toMatch(/\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/i);

    // A sample profile page emits no RealEstateAgent node.
    const structuredData = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(structuredData.join(" ")).not.toContain("RealEstateAgent");

    // The honest license line: pending, never verified, for a fixture.
    await expect(
      page.getByText(/Florida license SL-SAMPLE-001 — verification pending/)
    ).toBeVisible();
    await expect(page.getByText(/verified against state records/)).toHaveCount(0);
  });

  test("posts the introduction request as an agent_introduction TRACT lead", async ({ page }) => {
    const payloads: Array<Record<string, unknown>> = [];
    await page.route("**/api/v1/leads", async (route) => {
      payloads.push(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            receiptId: "00000000-0000-4000-8000-000000000601",
            receivedAt: "2026-08-19T12:00:00.000Z",
            intent: "agent_introduction",
            nextStep: "human_follow_up"
          },
          requestId: "agents-intro-e2e"
        })
      });
    });

    await page.goto("/agents/sample-jordan-rivera");
    const form = page.locator('form[data-form-id="agent-introduction"]');
    await form.locator('input[name="firstName"]').fill("Dana");
    await form.locator('input[name="lastName"]').fill("Reyes");
    await form.locator('input[name="email"]').fill("dana@example.com");
    await form.locator('input[name="phone"]').fill("813-555-0147");
    await form.locator('input[name="privacyAccepted"]').check();
    await form.getByRole("button", { name: "Request an introduction" }).click();

    await expect(page.getByText("We have your request")).toBeVisible();
    await expect(page.getByText("personally make the introduction")).toBeVisible();

    expect(payloads.length).toBe(1);
    expect(payloads[0]).toMatchObject({
      intent: "agent_introduction",
      firstName: "Dana",
      lastName: "Reyes",
      email: "dana@example.com",
      phone: "813-555-0147",
      message: "Requested an introduction to agent sample-jordan-rivera (St. Petersburg, Tampa)",
      consent: {
        privacyAccepted: true,
        contactRequested: true,
        smsMarketing: false,
        emailMarketing: false
      }
    });
    expect(String(payloads[0]?.submissionId)).toMatch(/^[0-9a-f-]{36}$/i);
    expect(payloads[0]?.conversionTouch).toMatchObject({
      landingPath: "/agents/sample-jordan-rivera"
    });
  });

  test("join walks the double post: the consented lead first, then the application", async ({
    page
  }) => {
    const calls: Array<{ endpoint: "leads" | "join"; payload: Record<string, unknown> }> = [];
    await page.route("**/api/v1/leads", async (route) => {
      calls.push({
        endpoint: "leads",
        payload: route.request().postDataJSON() as Record<string, unknown>
      });
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            receiptId: "00000000-0000-4000-8000-000000000602",
            receivedAt: "2026-08-19T12:00:00.000Z",
            intent: "agent_partner",
            nextStep: "human_follow_up"
          },
          requestId: "agents-join-lead-e2e"
        })
      });
    });
    await page.route("**/api/v1/agents/join", async (route) => {
      calls.push({
        endpoint: "join",
        payload: route.request().postDataJSON() as Record<string, unknown>
      });
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            agentId: "00000000-0000-4000-8000-000000000603",
            slug: "avery-quinn",
            status: "pending_review"
          },
          requestId: "agents-join-e2e"
        })
      });
    });

    await page.goto("/agents/join");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Join the TRACT agent network"
    );
    const form = page.locator('form[data-form-id="agent-join"]');
    await form.locator('input[name="firstName"]').fill("Avery");
    await form.locator('input[name="lastName"]').fill("Quinn");
    await form.locator('input[name="email"]').fill("avery@example.com");
    await form.locator('input[name="phone"]').fill("727-555-0164");
    await form.locator('input[name="licenseNumber"]').fill("SL3514027");
    await form.locator('input[name="brokerage"]').fill("Quinn Coastal Realty");
    await form.locator('input[name="cities"]').fill("St. Petersburg, Tampa");
    await form.locator('textarea[name="bio"]').fill("Twelve years on the Pinellas coast.");
    // Two separate consents, both deliberate: contact and public display.
    await form.locator('input[name="privacyAccepted"]').check();
    await form.locator('input[name="displayConsent"]').check();
    await form.getByRole("button", { name: "Apply to join the directory" }).click();

    await expect(page.getByText("You’re in the queue")).toBeVisible();

    // Order is the contract: the first-party consented lead, then the profile.
    expect(calls.map((call) => call.endpoint)).toEqual(["leads", "join"]);
    expect(calls[0]?.payload).toMatchObject({
      intent: "agent_partner",
      firstName: "Avery",
      lastName: "Quinn",
      email: "avery@example.com",
      phone: "727-555-0164",
      message: "Joined the agent directory.",
      consent: { privacyAccepted: true, contactRequested: true }
    });
    expect(calls[1]?.payload).toMatchObject({
      firstName: "Avery",
      lastName: "Quinn",
      email: "avery@example.com",
      phone: "727-555-0164",
      licenseNumber: "SL3514027",
      brokerage: "Quinn Coastal Realty",
      cities: "St. Petersburg, Tampa",
      displayConsent: true
    });
    // The same submission id ties the pair for server-side idempotency.
    expect(String(calls[1]?.payload.submissionId)).toBe(String(calls[0]?.payload.submissionId));
    // The license rides only on the application, and no password exists
    // anywhere in this flow under any name.
    expect(calls[0]?.payload).not.toHaveProperty("licenseNumber");
    for (const call of calls) {
      expect(JSON.stringify(call.payload).toLowerCase()).not.toContain("password");
    }
  });
});
