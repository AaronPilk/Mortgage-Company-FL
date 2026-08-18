/**
 * Deterministic state for the fixture-only RendProp walkthrough.
 *
 * This is intentionally a browser state machine, not a media job abstraction.
 * It accepts no file, signed URL, provider response or property address. The
 * stable fixture key makes an exact retry observable without implying that a
 * remote job or durable upload exists.
 */

export const RENDPROP_DEMO_SESSION_KEY = "RP-DEMO-COASTAL-001";

export type RendPropDemoPhase = "attestation" | "capture" | "processing" | "review" | "published";

export type RendPropProcessingStatus = "not_started" | "queued" | "processing" | "failed" | "ready";

export type RendPropRoomTag = "living_room" | "kitchen";
export type RendPropTransformation = "cleanup" | "virtual_staging";

export type RendPropDemoState = {
  sessionKey: typeof RENDPROP_DEMO_SESSION_KEY;
  phase: RendPropDemoPhase;
  rightsConfirmed: boolean;
  privacyConfirmed: boolean;
  fixtureSelected: boolean;
  roomTags: RendPropRoomTag[];
  transformation?: RendPropTransformation;
  processingStatus: RendPropProcessingStatus;
  retryCount: number;
  failureCode?: "fixture_render_interrupted";
};

export type RendPropDemoEvent =
  | { type: "set_rights"; checked: boolean }
  | { type: "set_privacy"; checked: boolean }
  | { type: "begin_capture" }
  | { type: "select_fixture" }
  | { type: "toggle_room"; room: RendPropRoomTag }
  | { type: "choose_transformation"; transformation: RendPropTransformation }
  | { type: "queue" }
  | { type: "begin_processing" }
  | { type: "simulate_failure" }
  | { type: "retry" }
  | { type: "complete" }
  | { type: "publish" }
  | { type: "reset" };

export function createRendPropDemoState(): RendPropDemoState {
  return {
    sessionKey: RENDPROP_DEMO_SESSION_KEY,
    phase: "attestation",
    rightsConfirmed: false,
    privacyConfirmed: false,
    fixtureSelected: false,
    roomTags: [],
    processingStatus: "not_started",
    retryCount: 0
  };
}

export function canBeginRendPropCapture(state: RendPropDemoState): boolean {
  return state.rightsConfirmed && state.privacyConfirmed;
}

export function canQueueRendPropFixture(state: RendPropDemoState): boolean {
  return (
    state.phase === "capture" &&
    state.fixtureSelected &&
    state.roomTags.length > 0 &&
    state.transformation !== undefined
  );
}

function unchanged(state: RendPropDemoState): RendPropDemoState {
  return state;
}

function withoutFailure(state: RendPropDemoState): RendPropDemoState {
  const next = { ...state };
  delete next.failureCode;
  return next;
}

export function rendPropDemoReducer(
  state: RendPropDemoState,
  event: RendPropDemoEvent
): RendPropDemoState {
  switch (event.type) {
    case "set_rights":
      return state.phase === "attestation" ? { ...state, rightsConfirmed: event.checked } : state;
    case "set_privacy":
      return state.phase === "attestation" ? { ...state, privacyConfirmed: event.checked } : state;
    case "begin_capture":
      return state.phase === "attestation" && canBeginRendPropCapture(state)
        ? { ...state, phase: "capture" }
        : unchanged(state);
    case "select_fixture":
      return state.phase === "capture" ? { ...state, fixtureSelected: true } : unchanged(state);
    case "toggle_room": {
      if (state.phase !== "capture") return unchanged(state);
      const selected = state.roomTags.includes(event.room);
      return {
        ...state,
        roomTags: selected
          ? state.roomTags.filter((room) => room !== event.room)
          : [...state.roomTags, event.room]
      };
    }
    case "choose_transformation":
      return state.phase === "capture"
        ? { ...state, transformation: event.transformation }
        : unchanged(state);
    case "queue":
      return canQueueRendPropFixture(state)
        ? { ...state, phase: "processing", processingStatus: "queued" }
        : unchanged(state);
    case "begin_processing":
      return state.phase === "processing" && state.processingStatus === "queued"
        ? { ...state, processingStatus: "processing" }
        : unchanged(state);
    case "simulate_failure":
      return state.phase === "processing" && state.processingStatus === "processing"
        ? {
            ...state,
            processingStatus: "failed",
            failureCode: "fixture_render_interrupted"
          }
        : unchanged(state);
    case "retry":
      return state.phase === "processing" && state.processingStatus === "failed"
        ? {
            ...withoutFailure(state),
            processingStatus: "processing",
            retryCount: state.retryCount + 1
          }
        : unchanged(state);
    case "complete":
      return state.phase === "processing" && state.processingStatus === "processing"
        ? { ...withoutFailure(state), phase: "review", processingStatus: "ready" }
        : unchanged(state);
    case "publish":
      return state.phase === "review" && state.processingStatus === "ready"
        ? { ...state, phase: "published" }
        : unchanged(state);
    case "reset":
      return createRendPropDemoState();
  }
}
