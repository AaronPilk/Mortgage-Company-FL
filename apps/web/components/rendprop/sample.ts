/**
 * Illustrative sample state for the walkthrough at /rendprop/demo.
 *
 * Everything here is synthetic and uses reserved example values. It is not a
 * fixture that could be mistaken for a real project, it is never written
 * anywhere, and every screen that renders it says so.
 */

import type { RendPropTransformation, RoomTag } from "@/lib/rendprop/pipeline";

export type SampleScene = {
  readonly id: string;
  readonly clipName: string;
  readonly durationLabel: string;
  readonly byteSizeLabel: string;
  /** What room tagging would propose. The agent confirms or overrides it. */
  readonly suggestedRoom: RoomTag;
  readonly confidenceLabel: string;
  readonly headline: string;
  readonly note: string;
  /** Transformations that make sense for this scene, pre-ticked in the demo. */
  readonly defaultTransformations: readonly RendPropTransformation[];
  readonly offeredTransformations: readonly RendPropTransformation[];
  readonly staged: boolean;
};

export const SAMPLE_PROJECT = {
  title: "SAMPLE — 1200 Example Bay Dr",
  addressLine1: "1200 Example Bay Dr",
  city: "Tampa",
  stateCode: "FL",
  postalCode: "33602",
  propertyType: "single_family",
  bedrooms: "3",
  bathrooms: "2",
  livingAreaSqft: "1840",
  attributionText: "Captured and listed by Example Brokerage.",
  agentName: "A. Sample, Example Brokerage"
} as const;

export const SAMPLE_SCENES: readonly SampleScene[] = [
  {
    id: "scene-exterior",
    clipName: "IMG_0412.mov",
    durationLabel: "0:41",
    byteSizeLabel: "182 MB",
    suggestedRoom: "exterior",
    confidenceLabel: "high",
    headline: "Front elevation",
    note: "Overcast capture. Exposure correction only — nothing is added or removed outside.",
    defaultTransformations: ["lighting_correction", "still_enhancement"],
    offeredTransformations: ["lighting_correction", "still_enhancement"],
    staged: false
  },
  {
    id: "scene-living",
    clipName: "IMG_0413.mov",
    durationLabel: "1:12",
    byteSizeLabel: "341 MB",
    suggestedRoom: "living",
    confidenceLabel: "high",
    headline: "Living room, unfurnished",
    note: "Empty room. Staging adds furniture that does not exist and is labelled on every frame.",
    defaultTransformations: ["lighting_correction", "virtual_staging", "still_enhancement"],
    offeredTransformations: [
      "lighting_correction",
      "virtual_staging",
      "still_enhancement",
      "clutter_cleanup"
    ],
    staged: true
  },
  {
    id: "scene-kitchen",
    clipName: "IMG_0414.mov",
    durationLabel: "0:58",
    byteSizeLabel: "266 MB",
    suggestedRoom: "kitchen",
    confidenceLabel: "medium",
    headline: "Kitchen, occupied",
    note: "Worktop clutter and a bin. Movable items only — appliances and fixtures stay.",
    defaultTransformations: ["clutter_cleanup", "lighting_correction"],
    offeredTransformations: ["clutter_cleanup", "lighting_correction", "still_enhancement"],
    staged: false
  },
  {
    id: "scene-bedroom",
    clipName: "IMG_0415.mov",
    durationLabel: "0:47",
    byteSizeLabel: "214 MB",
    suggestedRoom: "bedroom",
    confidenceLabel: "medium",
    headline: "Primary bedroom",
    note: "Tagging proposed 'bedroom' at medium confidence. Confirm it before anything runs.",
    defaultTransformations: ["lighting_correction", "virtual_staging"],
    offeredTransformations: ["lighting_correction", "virtual_staging", "clutter_cleanup"],
    staged: true
  },
  {
    id: "scene-bathroom",
    clipName: "IMG_0416.mov",
    durationLabel: "0:29",
    byteSizeLabel: "128 MB",
    suggestedRoom: "bathroom",
    confidenceLabel: "high",
    headline: "Main bathroom",
    note: "Small room, mixed lighting. Correction only.",
    defaultTransformations: ["lighting_correction"],
    offeredTransformations: ["lighting_correction", "clutter_cleanup", "still_enhancement"],
    staged: false
  }
];

export const SAMPLE_CAPTURE_GUIDANCE: readonly { title: string; body: string }[] = [
  {
    title: "One continuous pass per floor",
    body: "Walk it the way a buyer would. Doorway, then the room, then back out. Short clips per room beat one long take."
  },
  {
    title: "Waist height, slow pan",
    body: "Hold the phone level at waist height and turn from the hips. Fast pans produce frames nothing can recover."
  },
  {
    title: "Keep people and documents out of shot",
    body: "Faces, post, screens, calendars, and children's belongings. If it identifies somebody, do not film it."
  },
  {
    title: "Do not film the neighbours",
    body: "Point the camera at the property you have rights to. A neighbouring window is not part of this listing."
  },
  {
    title: "Lights on, blinds open",
    body: "Correction can balance a room. It cannot invent detail that the sensor never recorded."
  }
];

export const SAMPLE_TOUR = {
  slug: "sample-tour-1200-example-bay",
  shareLabel: "tract.example/t/SAMPLE-not-a-real-link",
  viewsLabel: "0",
  disclosureVersion: "rendprop-disclosure@0.1.0"
} as const;
