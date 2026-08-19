import type { AgentPublic } from "@tract/schemas";

/**
 * SAMPLE AGENT PROFILES.
 *
 * Every profile here is invented, following the same conventions as the sample
 * listing fixtures (invariant 6: a fixture may not be presented as real):
 *
 *  - Displayed names carry the "Sample Agent — " prefix so a reader can never
 *    mistake one for a person.
 *  - The brokerage is the reserved "Example Realty Group" — no real brokerage
 *    operates under a name a fixture is allowed to use.
 *  - License numbers use the reserved SL-SAMPLE-NNN shape, which is not a valid
 *    Florida license format, and every fixture is `licenseVerified: false`
 *    because nothing about an invented profile has been verified.
 *  - Bios describe what a real bio would say and label themselves illustrative.
 *  - No fixture carries an email or phone — by design no agent surface ever
 *    displays agent contact details, so the data shape cannot leak them.
 *
 * The contract is enforced by tests/unit/sample-agents-contract.test.ts.
 */

export type SampleAgent = AgentPublic & { readonly isSample: true };

export const SAMPLE_BROKERAGE = "Example Realty Group";

/** Reserved fake license shape. Not a valid Florida license number format. */
export const SAMPLE_LICENSE_PATTERN = /^SL-SAMPLE-\d{3}$/;

export const SAMPLE_NAME_PREFIX = "Sample Agent — ";

const sample = (input: {
  n: number;
  slug: string;
  firstName: string;
  lastName: string;
  cities: string;
  bio: string;
}): SampleAgent => ({
  isSample: true,
  // A fixture is an invention, never a public record: it cannot be unclaimed
  // and carries no county, because those two fields mean "imported from the
  // state license roll" and no sample was.
  unclaimed: false,
  county: null,
  id: `sample-agent-${String(input.n).padStart(3, "0")}`,
  slug: input.slug,
  firstName: input.firstName,
  lastName: input.lastName,
  brokerage: SAMPLE_BROKERAGE,
  cities: input.cities,
  bio: `Illustrative sample bio. ${input.bio}`,
  licenseNumber: `SL-SAMPLE-${String(input.n).padStart(3, "0")}`,
  licenseVerified: false
});

export const SAMPLE_AGENTS: readonly SampleAgent[] = [
  sample({
    n: 1,
    slug: "sample-jordan-rivera",
    firstName: "Jordan",
    lastName: "Rivera",
    cities: "St. Petersburg, Tampa",
    bio: "A real profile would describe a decade of waterfront and bungalow-district work across Pinellas, with flood-zone and insurance questions answered before they stall a contract."
  }),
  sample({
    n: 2,
    slug: "sample-priya-natarajan",
    firstName: "Priya",
    lastName: "Natarajan",
    cities: "Tampa",
    bio: "A real profile would describe first-time-buyer work in Seminole Heights and Carrollwood, and a habit of walking clients through inspection reports line by line."
  }),
  sample({
    n: 3,
    slug: "sample-marcus-dupree",
    firstName: "Marcus",
    lastName: "Dupree",
    cities: "Orlando",
    bio: "A real profile would describe relocation and new-construction experience around Lake Nona, including how builder contracts differ from resale offers."
  }),
  sample({
    n: 4,
    slug: "sample-elena-vasquez",
    firstName: "Elena",
    lastName: "Vasquez",
    cities: "Orlando, Sarasota",
    bio: "A real profile would describe condo and townhome expertise, with a working knowledge of association budgets and the questions a condo review will ask."
  }),
  sample({
    n: 5,
    slug: "sample-caleb-osei",
    firstName: "Caleb",
    lastName: "Osei",
    cities: "Sarasota",
    bio: "A real profile would describe downsizing and second-home work along the Gulf side, and patient timelines for sellers coordinating two closings."
  }),
  sample({
    n: 6,
    slug: "sample-amelia-strand",
    firstName: "Amelia",
    lastName: "Strand",
    cities: "Miami",
    bio: "A real profile would describe bilingual service across Miami neighborhoods and experience keeping appraisal and insurance timelines on track in dense markets."
  }),
  sample({
    n: 7,
    slug: "sample-dmitri-kovac",
    firstName: "Dmitri",
    lastName: "Kovac",
    cities: "Miami, Jacksonville",
    bio: "A real profile would describe investor-focused work — duplexes and small multifamily — with rent-roll realism instead of brochure numbers."
  }),
  sample({
    n: 8,
    slug: "sample-harper-mcallister",
    firstName: "Harper",
    lastName: "McAllister",
    cities: "Jacksonville",
    bio: "A real profile would describe military relocation experience near the Jacksonville bases and a straight answer on what a VA offer needs to compete."
  }),
  sample({
    n: 9,
    slug: "sample-noor-haddad",
    firstName: "Noor",
    lastName: "Haddad",
    cities: "St. Petersburg",
    bio: "A real profile would describe historic-district work in the Old Northeast, and how to read a four-point inspection on a 1920s house without panic."
  })
];

/** "Sample Agent — Jordan Rivera": the prefix is part of every rendered name. */
export function sampleDisplayName(agent: SampleAgent): string {
  return `${SAMPLE_NAME_PREFIX}${agent.firstName} ${agent.lastName}`;
}

export function sampleAgentBySlug(slug: string): SampleAgent | undefined {
  return SAMPLE_AGENTS.find((agent) => agent.slug === slug);
}

/** Split the comma-separated `cities` field into displayable names. */
export function cityList(cities: string): string[] {
  return cities
    .split(",")
    .map((city) => city.trim())
    .filter((city) => city.length > 0);
}

export function sampleAgentsForCity(city: string): SampleAgent[] {
  const wanted = city.trim().toLowerCase();
  if (wanted === "") return [...SAMPLE_AGENTS];
  return SAMPLE_AGENTS.filter((agent) =>
    cityList(agent.cities).some((entry) => entry.toLowerCase() === wanted)
  );
}
