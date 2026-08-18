import { describe, expect, it } from "vitest";
import { ACCEPTED_ATTRIBUTION_PARAMS, parseAttributionParams } from "@tract/analytics";
import {
  RENDPROP_DEMO_TOUR_ATTRIBUTED_PATH,
  RENDPROP_DEMO_TOUR_PATH
} from "../../lib/rendprop-demo";

describe("RendProp demo attribution link", () => {
  it("uses the stable local tour and only bounded allow-listed attribution", () => {
    const url = new URL(RENDPROP_DEMO_TOUR_ATTRIBUTED_PATH, "https://tract.example");
    expect(url.pathname).toBe(RENDPROP_DEMO_TOUR_PATH);
    expect(
      [...url.searchParams.keys()].every((key) =>
        ACCEPTED_ATTRIBUTION_PARAMS.includes(key as never)
      )
    ).toBe(true);
    expect(parseAttributionParams(url.searchParams)).toEqual({
      utm_source: "rendprop_demo",
      utm_medium: "onsite_qr",
      utm_campaign: "agent_sample_tour"
    });
  });
});
