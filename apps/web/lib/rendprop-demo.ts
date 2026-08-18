export const RENDPROP_DEMO_TOUR_PATH = "/tour/rendprop-coastal-demo";

/**
 * A real local link for the on-page QR demonstration. Only the attribution
 * vocabulary already accepted by `@tract/analytics` is used, and values are
 * stable, non-personal and well below their schema bounds.
 */
export const RENDPROP_DEMO_TOUR_ATTRIBUTED_PATH =
  `${RENDPROP_DEMO_TOUR_PATH}?` +
  new URLSearchParams({
    utm_source: "rendprop_demo",
    utm_medium: "onsite_qr",
    utm_campaign: "agent_sample_tour"
  }).toString();

export const RENDPROP_DEMO_AGENT_ATTRIBUTION = "TRACT sample workflow";
