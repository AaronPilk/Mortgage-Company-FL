import { describe, expect, it } from "vitest";
import {
  RENDPROP_DEMO_SESSION_KEY,
  canBeginRendPropCapture,
  canQueueRendPropFixture,
  createRendPropDemoState,
  rendPropDemoReducer
} from "./rendprop";

describe("RendProp fixture workflow", () => {
  it("will not begin capture before both rights and privacy are confirmed", () => {
    let state = createRendPropDemoState();
    state = rendPropDemoReducer(state, { type: "set_rights", checked: true });
    expect(canBeginRendPropCapture(state)).toBe(false);
    expect(rendPropDemoReducer(state, { type: "begin_capture" }).phase).toBe("attestation");

    state = rendPropDemoReducer(state, { type: "set_privacy", checked: true });
    expect(canBeginRendPropCapture(state)).toBe(true);
    expect(rendPropDemoReducer(state, { type: "begin_capture" }).phase).toBe("capture");
  });

  it("requires a synthetic fixture, room tag and permitted transformation before queueing", () => {
    let state = createRendPropDemoState();
    state = { ...state, rightsConfirmed: true, privacyConfirmed: true };
    state = rendPropDemoReducer(state, { type: "begin_capture" });
    expect(canQueueRendPropFixture(state)).toBe(false);

    state = rendPropDemoReducer(state, { type: "select_fixture" });
    state = rendPropDemoReducer(state, { type: "toggle_room", room: "living_room" });
    state = rendPropDemoReducer(state, {
      type: "choose_transformation",
      transformation: "virtual_staging"
    });
    expect(canQueueRendPropFixture(state)).toBe(true);
    expect(rendPropDemoReducer(state, { type: "queue" }).processingStatus).toBe("queued");
  });

  it("retries the exact fixture without changing its stable session key", () => {
    let state = createRendPropDemoState();
    state = {
      ...state,
      phase: "processing",
      rightsConfirmed: true,
      privacyConfirmed: true,
      fixtureSelected: true,
      roomTags: ["living_room"],
      transformation: "cleanup",
      processingStatus: "queued"
    };
    state = rendPropDemoReducer(state, { type: "begin_processing" });
    state = rendPropDemoReducer(state, { type: "simulate_failure" });
    expect(state.processingStatus).toBe("failed");
    expect(state.failureCode).toBe("fixture_render_interrupted");

    state = rendPropDemoReducer(state, { type: "retry" });
    expect(state.processingStatus).toBe("processing");
    expect(state.retryCount).toBe(1);
    expect(state.sessionKey).toBe(RENDPROP_DEMO_SESSION_KEY);

    state = rendPropDemoReducer(state, { type: "complete" });
    state = rendPropDemoReducer(state, { type: "publish" });
    expect(state.phase).toBe("published");
    expect(state.sessionKey).toBe(RENDPROP_DEMO_SESSION_KEY);
  });
});
