/**
 * Florida city reference data for the city-level mortgage pages.
 *
 * A city page exists only where it carries real, city-specific material a county
 * page does not already cover — the settlement's own geography and what it means
 * for flood and wind insurance, plus the questions a buyer there must research —
 * never a county paragraph with a city name dropped in. This is the earlier
 * "no city pages" decision honoured, not reversed: the bar is the county bar
 * (real local substance + a named reviewer), and a name-substitution page still
 * does not qualify. The unit test enforces that structurally.
 *
 * Deliberately NOT asserted here (invariant 6): any live market figure — median
 * price, days on market, inventory — and any tax rate. ATTOM is dark, so market
 * figures render only through the flag-gated MarketDataWidget, never as text in
 * this data. The exact tax number is deferred to the county Property Appraiser
 * (linked on the page via the parent county), exactly as the county pages do.
 * Down-payment help is intentionally NOT stated per city: a municipal program's
 * name, amount, and URL change and cannot be verified here, so every city falls
 * back to its parent county's already-sourced assistance. Data assembled August
 * 2026; sources are the county offices and FEMA, linked on the page.
 *
 * Pure data — no imports. apps/web/content/routes.ts pulls this in to generate
 * the city routes (the same way it generates glossary routes), so it must stay
 * dependency-free. The parent county is referenced by slug and resolved by the
 * caller with countyBySlug; this module never imports county-data.
 */

export const CITY_AS_OF = "August 2026";

/**
 * The single indexation switch for every city page. Ships false: the pages are
 * built but noindex, off the sitemap, until a named human reviewer verifies each
 * city's sources (docs/compliance/city-pages.md) and flips this to true. Used in
 * BOTH the route registry (indexable) and the page (noIndex is its negation), so
 * the two can never drift into a page that is in the sitemap yet renders
 * noindex, or the reverse.
 */
export const CITY_PAGES_INDEXABLE = false;

export type City = {
  /** URL segment under /florida-mortgage/[county]/. Kebab-case, stable once published. */
  slug: string;
  /** Display name, e.g. "St. Petersburg". */
  city: string;
  /** Foreign key into COUNTIES[].slug. The city-to-county coupling; must resolve. */
  countySlug: string;
  /** One paragraph on this city's settlement and geography. Stable, verifiable facts only. */
  localIntro: string;
  /**
   * This city's flood and wind reality, in one paragraph. Must differ from the
   * parent county's floodNote — the anti-template invariant the unit test checks.
   * Frames the risk; never states a premium, a rate, or any figure.
   */
  floodContext: string;
  /**
   * Questions a buyer here should research, framed as questions. Never answered
   * with an invented figure — a determination, a quote, or the appraiser settles
   * each one for the specific property.
   */
  researchQuestions: string[];
  /** Real, named local areas, for specificity. Optional and verifiable. */
  neighborhoods?: string[];
  /**
   * Existing /resources/buying-home-* deep-dive slug, where one exists. Optional:
   * the cross-link renders only when set, so it can never point at a 404. Mirrors
   * County.cityResourceSlug. Every value here must resolve to a registered route.
   */
  resourceSlug?: string;
  /** Optional title override for an unusually long name; the default template covers the rest. */
  metaTitle?: string;
  /** Authored, globally unique, 165 characters or fewer. Also the meta description. */
  metaDescription: string;
};

export const CITIES: City[] = [
  {
    slug: "miami",
    city: "Miami",
    countySlug: "miami-dade-county",
    localIntro:
      "Miami is the seat of Miami-Dade County, set low and flat on Biscayne Bay at the southeastern tip of the Florida peninsula. Its neighborhoods range from the high-rise core of Downtown and Brickell to older single-family areas like Coconut Grove and Coral Way, and a large share of the housing stock is condominium.",
    floodContext:
      "Miami sits low on Biscayne Bay with a high water table, so much of the city falls in a FEMA flood zone and flood insurance is frequently a required, routine part of the monthly cost rather than optional. For the many condo buildings, the association's master wind and flood coverage matters alongside a unit owner's own policy. Because two nearby addresses can sit on different sides of a flood-zone line, a determination and an actual quote on the specific home come first.",
    researchQuestions: [
      "Is the exact address in a FEMA flood zone on the current map, and what does an actual flood quote cost there?",
      "For a condo: what does the association's master policy cover, what is its deductible, and is a structural inspection or reserve study on file?",
      "What will the property tax be after the assessment resets toward the sale price — not the seller's homesteaded bill?",
      "Can a carrier write wind coverage at the home's roof age, or is the building on the association's master policy?"
    ],
    neighborhoods: ["Brickell", "Coconut Grove", "Little Havana", "Coral Way", "Edgewater"],
    resourceSlug: "buying-home-miami",
    metaDescription:
      "How the Miami market shapes financing a home: coastal flood and wind insurance, condo project review, homestead resets after a sale, and county down-payment help."
  },
  {
    slug: "hialeah",
    city: "Hialeah",
    countySlug: "miami-dade-county",
    localIntro:
      "Hialeah is a densely built city in northwest Miami-Dade County, inland of the coast and adjacent to Miami itself. One of Florida's larger cities by population, it has a housing stock that mixes single-family homes, townhomes, and condominiums.",
    floodContext:
      "Hialeah sits inland of the open bayfront, but it is low and flat with a high regional water table, so parts of the city still fall in a FEMA flood zone and drainage varies block to block. Wind coverage and roof age drive the premium here as everywhere in South Florida. Check the exact parcel against the current FEMA map and get a real insurance quote before you're under contract.",
    researchQuestions: [
      "Is the exact parcel in a FEMA flood zone on the current map, or does an inland address here still carry flood risk?",
      "Can a carrier write wind coverage at the home's roof age, and would a wind-mitigation inspection change the premium?",
      "What will the property tax be after the assessment resets toward the sale price rather than the seller's bill?",
      "If the home is a condo or in an HOA, what does the association cover and what are its dues and any assessments?"
    ],
    metaDescription:
      "Buying in Hialeah, FL: how South Florida flood and wind insurance and the homestead reset after a sale shape financing, plus Miami-Dade County down-payment help."
  },
  {
    slug: "fort-lauderdale",
    city: "Fort Lauderdale",
    countySlug: "broward-county",
    localIntro:
      "Fort Lauderdale is the seat of Broward County, on the Atlantic coast north of Miami. Known for its canals and the Intracoastal Waterway, the city ranges from beachfront and waterfront neighborhoods to inland residential areas.",
    floodContext:
      "Fort Lauderdale is laced with canals and the Intracoastal and fronts the Atlantic, so its coastal and waterfront neighborhoods carry real flood and wind exposure and flood insurance there is often not optional. Away from the water the risk eases, but the city's low elevation and dense drainage mean it varies parcel by parcel. A flood determination and an actual quote on the specific home is the first step.",
    researchQuestions: [
      "Is the exact address in a FEMA flood zone on the current map, and does it sit on or near a canal or the Intracoastal?",
      "What does an actual flood and wind quote cost on this specific property?",
      "What will the property tax be after the assessment resets toward the sale price, not the seller's homesteaded bill?",
      "For a condo or waterfront association: what does the master policy cover, and is a structural inspection on file?"
    ],
    neighborhoods: ["Las Olas", "Victoria Park", "Rio Vista", "Coral Ridge"],
    metaDescription:
      "Buying in Fort Lauderdale, FL: why its canals and coastline drive flood and wind insurance, how the homestead resets after a sale, and Broward County buyer help."
  },
  {
    slug: "hollywood",
    city: "Hollywood",
    countySlug: "broward-county",
    localIntro:
      "Hollywood sits on the Atlantic coast in southern Broward County, between Fort Lauderdale and the Miami-Dade line. It stretches from a barrier-island beach across the Intracoastal to inland neighborhoods, mixing older homes with newer development.",
    floodContext:
      "Hollywood runs from the Atlantic beach across the Intracoastal to inland neighborhoods, so its flood picture is split: beachside and waterfront homes carry high flood and wind exposure, while much of the interior sits in lower-risk zones. Elevation is low citywide, so the FEMA determination on the exact address — not the neighborhood in general — is what settles the cost.",
    researchQuestions: [
      "Is the exact address in a FEMA flood zone on the current map, and how close is it to the beach or Intracoastal?",
      "What does an actual flood and wind quote cost on this specific home?",
      "What will the property tax be after the assessment resets toward the sale price rather than the seller's bill?",
      "If it is a condo, what does the association's master policy cover and are its reserves and inspection current?"
    ],
    neighborhoods: ["Hollywood Beach", "Hollywood Lakes", "Emerald Hills"],
    metaDescription:
      "Buying in Hollywood, FL: coastal versus inland flood and wind insurance, how the homestead resets after a sale, and the down-payment help Broward County runs."
  },
  {
    slug: "west-palm-beach",
    city: "West Palm Beach",
    countySlug: "palm-beach-county",
    localIntro:
      "West Palm Beach is the seat of Palm Beach County, on the mainland across the Intracoastal from the island of Palm Beach. The city runs from its waterfront downtown to residential neighborhoods farther west.",
    floodContext:
      "West Palm Beach sits on the Intracoastal across from Palm Beach island, so its waterfront and older eastern neighborhoods carry real flood and wind exposure while parts of the city farther west sit higher and drain differently. Two homes at the same price can insure very differently depending on which side of that line they fall on, so get a determination and a real quote on the exact property.",
    researchQuestions: [
      "Is the exact address in a FEMA flood zone on the current map, and is it east or west of the Intracoastal corridor?",
      "What does an actual flood and wind quote cost on this specific property?",
      "What will the property tax be after the assessment resets toward the sale price, not the seller's homesteaded bill?",
      "For a condo or waterfront association: what does the master policy cover and is a structural inspection on file?"
    ],
    neighborhoods: ["Flamingo Park", "El Cid", "Northwood"],
    metaDescription:
      "Buying in West Palm Beach, FL: coastal versus inland flood and wind insurance, how the homestead resets after a sale, and Palm Beach County down-payment help."
  },
  {
    slug: "tampa",
    city: "Tampa",
    countySlug: "hillsborough-county",
    localIntro:
      "Tampa is the seat of Hillsborough County, on the eastern shore of Tampa Bay on Florida's Gulf coast. Its neighborhoods span the waterfront of South Tampa, the urban core, and growing areas to the north and east.",
    floodContext:
      "Tampa hugs the eastern shore of the bay, and its low, waterfront stretches — South Tampa, Davis Islands, and the Bayshore corridor among them — sit in flood zones where coverage is often required, while the higher interior is lower risk. Elevation can change over just a few blocks, so the flood determination and quote on the exact address, not the neighborhood, decide the cost.",
    researchQuestions: [
      "Is the exact address in a FEMA flood zone on the current map, and how far is it from the bay or a low waterfront stretch?",
      "What does an actual flood and wind quote cost on this specific home?",
      "What will the property tax be after the assessment resets toward the sale price rather than the seller's bill?",
      "Can a carrier write wind coverage at the home's roof age, and would a wind-mitigation inspection lower the premium?"
    ],
    neighborhoods: ["South Tampa", "Hyde Park", "Seminole Heights", "Davis Islands", "Ybor City"],
    resourceSlug: "buying-home-tampa",
    metaDescription:
      "Buying in Tampa, FL: why bayfront flood and wind insurance drive the cost, how the homestead resets after a sale, and the down-payment help Hillsborough County runs."
  },
  {
    slug: "st-petersburg",
    city: "St. Petersburg",
    countySlug: "pinellas-county",
    localIntro:
      "St. Petersburg sits on a peninsula in Pinellas County, with Tampa Bay to the east and the Gulf approaches to the west — water on three sides. Its neighborhoods range from a dense, walkable downtown to low-lying coastal areas.",
    floodContext:
      "St. Petersburg sits on a peninsula with water on three sides, so a large share of the city — the downtown waterfront, the barrier-island approaches, and the many low coastal neighborhoods — falls in a flood zone where flood insurance is a routine, sometimes decisive, cost. Wind exposure is high citywide. Price flood and wind on the exact home early, because near the water the carrying cost can move a deal more than the rate does.",
    researchQuestions: [
      "Is the exact address in a FEMA flood zone on the current map, and how close is it to the bay, the Gulf approaches, or a canal?",
      "What does an actual flood and wind quote cost on this specific home?",
      "What will the property tax be after the assessment resets toward the sale price, not the seller's homesteaded bill?",
      "Can a carrier write wind coverage at the home's roof age, and would a wind-mitigation inspection change the premium?"
    ],
    neighborhoods: ["Old Northeast", "Kenwood", "Snell Isle", "Downtown"],
    resourceSlug: "buying-home-st-petersburg",
    metaDescription:
      "Buying in St. Petersburg, FL: why peninsula flood and wind insurance drive the cost, how the homestead resets after a sale, and Pinellas County buyer help."
  },
  {
    slug: "orlando",
    city: "Orlando",
    countySlug: "orange-county",
    localIntro:
      "Orlando is the seat of Orange County, in inland Central Florida well away from the coast. It is lake country, with many lakes and ponds threaded through its neighborhoods, from the urban core out to the surrounding suburbs.",
    floodContext:
      "Orlando is inland and out of reach of storm surge, but it is lake country — homes near its many lakes, ponds, and low drainage areas can still sit in a flood zone. Insurance is still Florida-priced on wind and roof age, usually without a coastal flood premium. Check the specific property against the current FEMA map rather than assuming an inland address is clear.",
    researchQuestions: [
      "Is the exact parcel near a lake, pond, or low drainage area that puts it in a FEMA flood zone on the current map?",
      "Can a carrier write wind coverage at the home's roof age, and would a wind-mitigation inspection lower the premium?",
      "What will the property tax be after the assessment resets toward the sale price rather than the seller's bill?",
      "Is the home in a community development district, and what is that assessment on top of county property tax?"
    ],
    neighborhoods: ["College Park", "Baldwin Park", "Lake Nona", "Downtown"],
    resourceSlug: "buying-home-orlando",
    metaDescription:
      "Buying in Orlando, FL: inland lake-country flood risk, wind and roof insurance, how the homestead resets after a sale, and Orange County down-payment help."
  },
  {
    slug: "jacksonville",
    city: "Jacksonville",
    countySlug: "duval-county",
    localIntro:
      "Jacksonville is the seat of Duval County in Northeast Florida and one of the largest U.S. cities by land area. The St. Johns River winds through it and the Atlantic beaches lie to the east, so its neighborhoods vary widely from riverfront to inland to beachside.",
    floodContext:
      "Jacksonville is geographically vast and shaped by water — the St. Johns winding through the middle, tidal creeks, and the Atlantic beaches to the east. Riverfront, creekside, and beach neighborhoods can carry real flood exposure while inland areas are often lower risk, so within one city two homes a few miles apart can price very differently. Start with a determination and a quote on the exact address.",
    researchQuestions: [
      "Is the exact address in a FEMA flood zone on the current map, and is it near the river, a tidal creek, or the beach?",
      "What does an actual flood and wind quote cost on this specific home?",
      "What will the property tax be after the assessment resets toward the sale price, not the seller's homesteaded bill?",
      "Can a carrier write wind coverage at the home's roof age, and would a wind-mitigation inspection change the premium?"
    ],
    neighborhoods: ["Riverside", "San Marco", "Avondale", "Springfield"],
    resourceSlug: "buying-home-jacksonville",
    metaDescription:
      "Buying in Jacksonville, FL: river and beach flood exposure, wind and roof insurance, how the homestead resets after a sale, and Duval County down-payment help."
  },
  {
    slug: "cape-coral",
    city: "Cape Coral",
    countySlug: "lee-county",
    localIntro:
      "Cape Coral is a planned city in Lee County on Florida's Gulf coast, laid out around an extensive network of canals, so much of the city is waterfront or a short distance from it. Its housing is largely single-family, spread across a large, still-growing footprint.",
    floodContext:
      "Cape Coral is threaded with canals, so much of its buildable land is on or near the water. That geography puts a large share of the city in a FEMA flood zone, where flood insurance is a routine and sometimes large part of the monthly cost, and where a canal or Gulf-access lot insures differently from a dry inland one. A flood determination and an actual flood and wind quote on the exact parcel come first.",
    researchQuestions: [
      "Is the lot Gulf-access, on a freshwater canal, or dry, and what FEMA flood zone is the exact parcel in on the current map?",
      "What does an actual flood and wind quote cost on this specific parcel, and does the roof age let a carrier write coverage?",
      "What will the property tax be after the assessment resets toward the sale price rather than the seller's bill?",
      "Is the home in a community development district, and what is that assessment on top of county property tax?"
    ],
    resourceSlug: "buying-home-cape-coral",
    metaDescription:
      "Buying in Cape Coral, FL: why its canal geography drives flood insurance, the wind and roof questions to ask, the homestead reset, and Lee County buyer help."
  },
  {
    slug: "lakeland",
    city: "Lakeland",
    countySlug: "polk-county",
    localIntro:
      "Lakeland is the largest city in Polk County, inland in Central Florida between Tampa and Orlando. True to its name it is dotted with lakes, and its neighborhoods range from a historic core to newer suburban development.",
    floodContext:
      "Lakeland sits inland between Tampa and Orlando, well away from storm surge, but it is dotted with lakes, so a home near a lake, pond, or low drainage area can still fall in a flood zone. Wind and roof age drive the premium as they do statewide, even without a coastal flood component. Check the exact parcel against the current FEMA map rather than assuming an inland address is clear.",
    researchQuestions: [
      "Is the exact parcel near a lake, pond, or low drainage area that puts it in a FEMA flood zone on the current map?",
      "Can a carrier write wind coverage at the home's roof age, and would a wind-mitigation inspection lower the premium?",
      "What will the property tax be after the assessment resets toward the sale price rather than the seller's bill?",
      "Is the home in a community development district, and what is that assessment on top of county property tax?"
    ],
    neighborhoods: ["Lake Morton", "Dixieland", "Lake Hollingsworth"],
    metaDescription:
      "Buying in Lakeland, FL: inland lake-country flood risk, wind and roof insurance, how the homestead resets after a sale, and the buyer help Polk County runs."
  },
  {
    slug: "sarasota",
    city: "Sarasota",
    countySlug: "sarasota-county",
    localIntro:
      "Sarasota is the seat of Sarasota County on Florida's Gulf coast, known for its bayfront downtown and nearby barrier islands. Its neighborhoods run from the water's edge to inland residential areas.",
    floodContext:
      "Sarasota fronts the Gulf and its bay, so the barrier islands and keys, the bayfront, and the city's canal neighborhoods carry high flood and wind exposure, while areas farther inland sit in lower-risk zones. Near the water flood insurance is frequently required and is a real part of the monthly cost, so price flood and wind on the exact home early.",
    researchQuestions: [
      "Is the exact address in a FEMA flood zone on the current map, and how close is it to the bay, a key, or a canal?",
      "What does an actual flood and wind quote cost on this specific home?",
      "What will the property tax be after the assessment resets toward the sale price, not the seller's homesteaded bill?",
      "For a condo or waterfront association: what does the master policy cover and is a structural inspection on file?"
    ],
    neighborhoods: ["Laurel Park", "Gillespie Park", "Downtown"],
    resourceSlug: "buying-home-sarasota",
    metaDescription:
      "Buying in Sarasota, FL: why Gulf-coast flood and wind insurance drive the cost, how the homestead resets after a sale, and Sarasota County down-payment help."
  }
];

export function cityBySlug(slug: string): City | undefined {
  return CITIES.find((entry) => entry.slug === slug);
}

/**
 * Resolve for the nested route: BOTH segments must match. A real city slug
 * requested under the wrong county — /florida-mortgage/orange-county/miami —
 * returns undefined, so the page 404s instead of serving the city under a county
 * it is not in.
 */
export function cityByCountyAndSlug(countySlug: string, citySlug: string): City | undefined {
  return CITIES.find((entry) => entry.countySlug === countySlug && entry.slug === citySlug);
}

/** Cities in a county, in array order — powers the county-page "cities in" block. */
export function citiesByCounty(countySlug: string): City[] {
  return CITIES.filter((entry) => entry.countySlug === countySlug);
}
