/**
 * Florida county reference data for the county mortgage pages.
 *
 * County pages exist only where they carry real, county-specific material — flood
 * and insurance reality, the statutory homestead/Save-Our-Homes mechanics, and
 * the county's own assistance office — not a city name swapped into a template.
 * Deliberately NOT asserted here: a precise millage or tax percentage. Those
 * change yearly and vary by source, so every page points to the county Property
 * Appraiser (the primary source) for the exact number instead of stating one as
 * fact (invariant 6). Data assembled August 2026; the county offices are the
 * authority and are linked on each page.
 */

export const COUNTY_AS_OF = "August 2026";

export type FloodExposure = "high-coastal" | "mixed" | "inland";

export type County = {
  slug: string;
  county: string;
  seat: string;
  region: string;
  cities: string[];
  floodExposure: FloodExposure;
  /** One county-specific paragraph on the flood and insurance reality. */
  floodNote: string;
  /** Property Appraiser office name and, where confirmed, its official site. */
  appraiserName: string;
  appraiserUrl?: string;
  /** One county-specific paragraph on the county's own down-payment assistance. */
  localAssistanceNote: string;
  localAssistanceUrl?: string;
  /**
   * The matching /resources/buying-home-* article slug, for an internal link.
   * Optional: most counties have no dedicated city-guide article, and the page
   * renders the link only when this is set, so it can never point at a 404.
   */
  cityResourceSlug?: string;
  metaDescription: string;
};

export const COUNTIES: County[] = [
  {
    slug: "hillsborough-county",
    county: "Hillsborough County",
    seat: "Tampa",
    region: "Tampa Bay",
    cities: ["Tampa", "Brandon", "Riverview", "Plant City"],
    floodExposure: "mixed",
    floodNote:
      "Hillsborough wraps Tampa Bay, so waterfront and low-lying neighborhoods (South Tampa, the Bayshore corridor, parts of Brandon and Riverview near the Alafia) carry real flood exposure, while much of the interior sits in lower-risk zones. Flood risk is set property by property against FEMA's current map, not by the county as a whole — a home a block inland can price very differently from one on the water.",
    appraiserName: "Hillsborough County Property Appraiser",
    appraiserUrl: "https://www.hcpafl.org/",
    localAssistanceNote:
      "On top of the statewide programs, the Housing Finance Authority of Hillsborough County runs its own down-payment help — including Home Sweet Home Hillsborough and an Affordable Income Subsidy Grant — as a 0% second mortgage toward down payment and closing costs for first-time buyers in the county. Amounts and income limits are set by the HFA and change, so confirm the current terms with them or a licensed officer.",
    localAssistanceUrl:
      "https://hcfl.gov/residents/human-services/affordable-housing-assistance/down-payment-assistance",
    cityResourceSlug: "buying-home-tampa",
    metaDescription:
      "Buying in Hillsborough County: the flood and insurance reality, how homestead and the assessment reset work, and the county's own down-payment help."
  },
  {
    slug: "pinellas-county",
    county: "Pinellas County",
    seat: "Clearwater",
    region: "Tampa Bay",
    cities: ["St. Petersburg", "Clearwater", "Largo", "Dunedin"],
    floodExposure: "high-coastal",
    floodNote:
      "Pinellas is a peninsula — water on three sides and the most densely built coastline in the state — so a large share of the county sits in a flood zone, and wind exposure is high. For many St. Petersburg and beach-community homes, flood insurance is not optional and the premium is a real part of the monthly cost. Get a flood determination and an actual insurance quote early, before you're under contract, because on the coast the carrying cost can move the deal more than the rate does.",
    appraiserName: "Pinellas County Property Appraiser",
    appraiserUrl: "https://www.pcpao.gov/",
    localAssistanceNote:
      "Beyond the statewide programs, Pinellas County runs its own first-time-homebuyer down-payment assistance through the county's housing program. Amounts, income limits, and funding availability are set by the county and change, so confirm the current terms with the county housing office or a licensed officer.",
    cityResourceSlug: "buying-home-st-petersburg",
    metaDescription:
      "Buying in Pinellas County: why flood and wind insurance drive the cost, how homestead works, and the county's first-time-buyer down-payment help."
  },
  {
    slug: "orange-county",
    county: "Orange County",
    seat: "Orlando",
    region: "Central Florida",
    cities: ["Orlando", "Winter Park", "Apopka", "Ocoee"],
    floodExposure: "inland",
    floodNote:
      "Orange County is inland, so it avoids storm-surge flooding — but it is lake country, and homes near the many lakes, ponds, and low drainage areas can still sit in a flood zone. Insurance is still Florida-priced (wind and roof age matter statewide), just usually without the coastal flood premium. Check the specific property against FEMA's current map rather than assuming an inland address is clear.",
    appraiserName: "Orange County Property Appraiser",
    appraiserUrl: "https://ocpafl.org/",
    localAssistanceNote:
      "In addition to the statewide programs, Orange County and the City of Orlando run their own down-payment assistance for income-eligible first-time buyers. Amounts and eligibility are set locally and change, so confirm the current terms with the county or city housing office or a licensed officer.",
    cityResourceSlug: "buying-home-orlando",
    metaDescription:
      "Buying in Orange County (Orlando): inland flood and insurance realities, how homestead works, and local first-time-buyer down-payment assistance."
  },
  {
    slug: "miami-dade-county",
    county: "Miami-Dade County",
    seat: "Miami",
    region: "South Florida",
    cities: ["Miami", "Hialeah", "Miami Beach", "Coral Gables"],
    floodExposure: "high-coastal",
    floodNote:
      "Miami-Dade is low, flat, and coastal, with a high water table — flood and wind exposure are among the highest in the country, and insurance is priced accordingly. Flood insurance is a routine part of the monthly cost for much of the county, and for condos the building's master wind and flood coverage matters as much as your own policy. Price insurance early; it frequently decides what a buyer can actually afford here.",
    appraiserName: "Miami-Dade County Property Appraiser",
    appraiserUrl: "https://www.miamidade.gov/pa/",
    localAssistanceNote:
      "On top of the statewide programs, Miami-Dade County runs its own homebuyer assistance through its housing department (Public Housing and Community Development). Amounts, income limits, and funding change, so confirm the current programs with the county housing office or a licensed officer.",
    cityResourceSlug: "buying-home-miami",
    metaDescription:
      "Buying in Miami-Dade County: why flood and wind insurance dominate the cost, how homestead works, and the county's homebuyer assistance."
  },
  {
    slug: "duval-county",
    county: "Duval County",
    seat: "Jacksonville",
    region: "Northeast Florida",
    cities: ["Jacksonville", "Jacksonville Beach", "Atlantic Beach", "Baldwin"],
    floodExposure: "mixed",
    floodNote:
      "Duval spans the St. Johns River and the Atlantic beaches, so exposure varies widely — riverfront, creek, and beach-side homes can carry real flood risk, while much of the interior is lower-risk. Jacksonville's footprint is large, so two homes a few miles apart can face very different flood and insurance costs. Check the specific property against FEMA's current map.",
    appraiserName: "Duval County Property Appraiser",
    localAssistanceNote:
      "Beyond the statewide programs, the City of Jacksonville / Duval County runs its own down-payment assistance for income-eligible first-time buyers through its housing office. Amounts and eligibility change, so confirm the current terms with the city housing office or a licensed officer.",
    cityResourceSlug: "buying-home-jacksonville",
    metaDescription:
      "Buying in Duval County (Jacksonville): river and beach flood exposure, how homestead works, and local first-time-buyer down-payment assistance."
  },
  {
    slug: "lee-county",
    county: "Lee County",
    seat: "Fort Myers",
    region: "Southwest Florida",
    cities: ["Cape Coral", "Fort Myers", "Bonita Springs", "Estero"],
    floodExposure: "high-coastal",
    floodNote:
      "Lee County took a direct hit from Hurricane Ian, and its Gulf coastline and canal communities (much of Cape Coral, the barrier islands, waterfront Fort Myers) carry high flood and wind exposure. Insurance — flood, wind, and increasingly the roof and elevation — is a large and rising part of the cost of owning here, and some homes now require a higher elevation or mitigation to insure at all. An actual quote on the specific property is essential before you commit.",
    appraiserName: "Lee County Property Appraiser",
    appraiserUrl: "https://www.leepa.org/",
    localAssistanceNote:
      "In addition to the statewide programs, Lee County runs its own down-payment assistance for income-eligible first-time buyers through the county's housing office. Amounts and funding change, so confirm the current terms with the county or a licensed officer.",
    cityResourceSlug: "buying-home-cape-coral",
    metaDescription:
      "Buying in Lee County (Cape Coral, Fort Myers): post-Ian flood and insurance realities, how homestead works, and local down-payment assistance."
  },
  {
    slug: "broward-county",
    county: "Broward County",
    seat: "Fort Lauderdale",
    region: "South Florida",
    cities: ["Fort Lauderdale", "Hollywood", "Pembroke Pines", "Coral Springs"],
    floodExposure: "high-coastal",
    floodNote:
      "Broward is low, flat, and built out to the Atlantic, with a high water table and a dense grid of canals, so flood and wind exposure run high across much of the county — the coastal and eastern neighborhoods especially. Flood insurance is a routine part of the monthly cost here, and for condos the building's master wind and flood coverage matters alongside your own policy. The far-western edge backs onto the Everglades and drains slowly. Price flood and wind on the specific property early, because on this coast the carrying cost can move a deal more than the rate does.",
    appraiserName: "Broward County Property Appraiser",
    appraiserUrl: "https://bcpa.net/",
    localAssistanceNote:
      "On top of the statewide programs, Broward County runs its own homebuyer purchase assistance for income-eligible first-time buyers through the county's housing office. The amounts, income limits, and funding availability are set by the county and change, so confirm the current terms with the county or a licensed officer before you count on them.",
    localAssistanceUrl: "https://www.broward.org/Housing/pages/homebuyer.aspx",
    metaDescription:
      "Buying in Broward County (Fort Lauderdale): why coastal flood and wind insurance drive the cost, how homestead works, and the county's homebuyer help."
  },
  {
    slug: "palm-beach-county",
    county: "Palm Beach County",
    seat: "West Palm Beach",
    region: "South Florida",
    cities: ["West Palm Beach", "Boca Raton", "Boynton Beach", "Delray Beach"],
    floodExposure: "mixed",
    floodNote:
      "Palm Beach County splits in two for flood purposes. The coastal strip — the barrier islands, the Intracoastal, and the older beachside neighborhoods from Boca to Jupiter — carries high flood and wind exposure, and flood insurance there is often not optional. The large western county (Wellington, Royal Palm Beach, and the Glades communities) sits inland and drains differently, so its risk is usually lower, though canal and lake frontage still matters. Two homes at the same price can carry very different insurance depending on which side of that line they sit on, so get a determination and a real quote on the exact property.",
    appraiserName: "Palm Beach County Property Appraiser",
    appraiserUrl: "https://pbcpao.gov/",
    localAssistanceNote:
      "Beyond the statewide programs, Palm Beach County's Department of Housing and Economic Development runs its own down-payment and purchase assistance for income-eligible buyers. The amounts, income limits, and funding availability are set by the county and change, so confirm the current terms with the county housing office or a licensed officer.",
    localAssistanceUrl: "https://discover.pbc.gov/HED/Pages/default.aspx",
    metaDescription:
      "Buying in Palm Beach County: coastal vs inland flood and insurance realities, how homestead resets after a sale, and the county's local buyer help."
  },
  {
    slug: "polk-county",
    county: "Polk County",
    seat: "Bartow",
    region: "Central Florida",
    cities: ["Lakeland", "Winter Haven", "Bartow", "Davenport"],
    floodExposure: "inland",
    floodNote:
      "Polk sits inland between Tampa and Orlando, well away from storm surge — but it is lake country, threaded with hundreds of lakes and low, wet flatwoods, so a home near a lake, pond, or drainage area can still fall in a flood zone. Insurance is still Florida-priced: wind and roof age drive the premium statewide even without the coastal flood component, and sinkhole history is a Central Florida underwriting question worth asking about. Check the specific parcel against FEMA's current map rather than assuming an inland address is clear.",
    appraiserName: "Polk County Property Appraiser",
    appraiserUrl: "https://www.polkflpa.gov/",
    localAssistanceNote:
      "In addition to the statewide programs, Polk County runs its own residential down-payment assistance for income-eligible first-time buyers through its Housing and Neighborhood Development office. The amounts, income limits, and funding availability are set by the county and change, so confirm the current terms with the county or a licensed officer.",
    localAssistanceUrl:
      "https://www.polkfl.gov/services/housing-and-neighborhood-development/residential-housing-programs/",
    metaDescription:
      "Buying in Polk County (Lakeland, Winter Haven): inland lake-country flood and insurance, how homestead works, and the county's down-payment help."
  },
  {
    slug: "brevard-county",
    county: "Brevard County",
    seat: "Titusville",
    region: "Space Coast",
    cities: ["Palm Bay", "Melbourne", "Titusville", "Cocoa"],
    floodExposure: "mixed",
    floodNote:
      "Brevard is a long, narrow county between the Indian River Lagoon and the Atlantic, so exposure depends heavily on where a home sits. The barrier island (Cocoa Beach, Satellite Beach, Melbourne Beach) and any lagoon or river frontage carry real flood and wind risk; much of the mainland along US-1 and inland Palm Bay sits in lower-risk zones. Wind coverage is a Space Coast reality regardless of the flood line. Get a flood determination and an actual insurance quote on the specific property, because a barrier-island address and a mainland one a few miles apart can price very differently.",
    appraiserName: "Brevard County Property Appraiser",
    appraiserUrl: "https://www.bcpao.us/",
    localAssistanceNote:
      "On top of the statewide programs, Brevard County runs its own purchase-assistance program that helps income-eligible buyers with down payment and closing costs. The amounts, income limits, and funding availability are set by the county and change, so confirm the current terms with the county Housing and Human Services office or a licensed officer.",
    localAssistanceUrl:
      "https://www.brevardfl.gov/HousingAndHumanServices/HousingPrograms/PurchaseAssistanceProgram",
    metaDescription:
      "Buying in Brevard County (Space Coast): barrier-island and lagoon flood exposure, how homestead works, and the county's purchase-assistance program."
  },
  {
    slug: "volusia-county",
    county: "Volusia County",
    seat: "DeLand",
    region: "Northeast Florida",
    cities: ["Daytona Beach", "Deltona", "DeLand", "New Smyrna Beach"],
    floodExposure: "mixed",
    floodNote:
      "Volusia runs from the Atlantic beaches across to the St. Johns River, so its flood picture is genuinely split. The beachside — Daytona Beach, New Smyrna, Ormond — and any river or lake frontage carry real flood and wind exposure; the inland west around DeLand and Deltona is generally lower risk, though the St. Johns and its lakes flood their own low ground. Wind coverage applies countywide. Check the specific property against FEMA's current map and get a real insurance quote, because beachside and inland Volusia can carry very different carrying costs.",
    appraiserName: "Volusia County Property Appraiser",
    appraiserUrl: "https://vcpa.vcgov.org/",
    localAssistanceNote:
      "Beyond the statewide programs, Volusia County runs affordable-housing and down-payment assistance for income-eligible buyers. Programs like these open, close, and pause as funding cycles, and the amounts and income limits are set by the county and change — so confirm the current status and terms with the county housing office or a licensed officer before you count on it.",
    localAssistanceUrl:
      "https://www.volusia.org/services/community-services/community-assistance/housing/affordable-housing-programs/",
    metaDescription:
      "Buying in Volusia County (Daytona, DeLand): coastal vs inland flood and insurance, how homestead works, and the county's affordable-housing help."
  },
  {
    slug: "pasco-county",
    county: "Pasco County",
    seat: "Dade City",
    region: "Tampa Bay",
    cities: ["New Port Richey", "Wesley Chapel", "Zephyrhills", "Land O' Lakes"],
    floodExposure: "mixed",
    floodNote:
      "Pasco spans the Gulf on its west side and rolling, sandy inland to the east, so exposure varies with geography. The coastal west — New Port Richey, Hudson, and the low waterfront and canal neighborhoods — carries real flood and wind risk, while the growing eastern county (Wesley Chapel, Land O' Lakes, Zephyrhills) sits higher and inland, though its lakes and wetlands still create pockets of flood zone. Wind and roof age drive the premium countywide. Get a flood determination and an actual quote on the exact property before you're under contract.",
    appraiserName: "Pasco County Property Appraiser",
    appraiserUrl: "https://pascopa.com/",
    localAssistanceNote:
      "In addition to the statewide programs, Pasco County runs its own down-payment assistance program for income-eligible first-time buyers through its Community Development office. The amounts, income limits, and funding availability are set by the county and change, so confirm the current terms with the county or a licensed officer.",
    localAssistanceUrl:
      "https://www.pascocountyfl.gov/services/community_development/programs/down_payment_assistance_program_(dpa).php",
    metaDescription:
      "Buying in Pasco County (New Port Richey, Wesley Chapel): Gulf-coast vs inland flood and insurance, how homestead works, and the county's DPA."
  },
  {
    slug: "seminole-county",
    county: "Seminole County",
    seat: "Sanford",
    region: "Central Florida",
    cities: ["Sanford", "Altamonte Springs", "Oviedo", "Lake Mary"],
    floodExposure: "inland",
    floodNote:
      "Seminole is an inland Orlando-metro county, so it is out of reach of storm surge — but it is shaped by water all the same. The St. Johns River forms its northern and eastern edge, the Wekiva runs its west, and lakes dot the middle, so riverfront, lakefront, and low-lying parcels can sit squarely in a flood zone. Away from those, much of the county is lower-risk. Insurance is still Florida-priced on wind and roof age. Check the specific property against FEMA's current map rather than assuming an inland, landlocked county is automatically clear.",
    appraiserName: "Seminole County Property Appraiser",
    appraiserUrl: "https://www.scpafl.org/",
    localAssistanceNote:
      "Beyond the statewide programs, Seminole County runs its own down-payment assistance through its Community Development programs for income-eligible first-time buyers. Demand often outruns funding, so a waitlist can close; the amounts and income limits are set by the county and change, so confirm the current status and terms with the county or a licensed officer.",
    localAssistanceUrl:
      "https://www.seminolecountyfl.gov/departments-services/community-services/community-development/community-development-programs",
    metaDescription:
      "Buying in Seminole County (Sanford): inland river and lake flood exposure, how homestead works, and the county's community-development buyer help."
  },
  {
    slug: "sarasota-county",
    county: "Sarasota County",
    seat: "Sarasota",
    region: "Southwest Florida",
    cities: ["Sarasota", "Venice", "North Port", "Osprey"],
    floodExposure: "high-coastal",
    floodNote:
      "Sarasota is a Gulf-coast county, and its barrier islands and keys — Siesta, Longboat, Casey Key — plus the bayfront and the many canal communities carry high flood and wind exposure. Away from the water, inland North Port and eastern Sarasota sit in lower-risk zones, though the Myakka and area creeks flood their own low ground. On the coast, flood insurance is frequently required and is a real part of the monthly cost; wind and roof age drive the premium everywhere. Price flood and wind on the exact property early — near the Gulf it can decide what you can actually afford.",
    appraiserName: "Sarasota County Property Appraiser",
    appraiserUrl: "https://www.sarasotapropertyappraiser.gov/",
    localAssistanceNote:
      "Beyond the statewide programs, Sarasota County and its cities have at times offered their own down-payment and housing assistance for income-eligible buyers, but the specific programs and their funding open and close over time. Because the amounts, limits, and availability are set locally and change, confirm what is currently offered — and its terms — with the county housing office or a licensed officer rather than assuming a program is open.",
    cityResourceSlug: "buying-home-sarasota",
    metaDescription:
      "Buying in Sarasota County: why Gulf-coast flood and wind insurance drive the cost, how homestead works, and where to confirm local buyer help."
  },
  {
    slug: "collier-county",
    county: "Collier County",
    seat: "Naples",
    region: "Southwest Florida",
    cities: ["Naples", "Marco Island", "Immokalee", "Golden Gate"],
    floodExposure: "high-coastal",
    floodNote:
      "Collier is Gulf-front and low along its developed western edge, so coastal Naples, Marco Island, and the canal and bayfront neighborhoods carry high flood and wind exposure — this stretch took a hard hit from Hurricane Ian's surge, and elevation and flood history now weigh heavily in what it costs to insure. Inland Golden Gate Estates and Immokalee sit higher and drier, though the vast eastern county is Everglades wetland. Flood insurance is a routine coastal cost here; get a determination and an actual quote on the specific property before you commit.",
    appraiserName: "Collier County Property Appraiser",
    appraiserUrl: "https://www.collierappraiser.com/",
    localAssistanceNote:
      "On top of the statewide programs, Collier County's Community and Human Services division runs homebuyer programs, including down-payment help, for income-eligible buyers. The amounts, income limits, and funding availability are set by the county and change, so confirm the current terms with the county or a licensed officer.",
    localAssistanceUrl:
      "https://www.collier.gov/Resident-Resources/Community-and-Human-Services-Division/Housing-Programs/Homebuyers",
    cityResourceSlug: "buying-home-naples",
    metaDescription:
      "Buying in Collier County (Naples): why coastal flood and wind insurance drive the cost, how homestead works, and the county's homebuyer programs."
  },
  {
    slug: "manatee-county",
    county: "Manatee County",
    seat: "Bradenton",
    region: "Southwest Florida",
    cities: ["Bradenton", "Lakewood Ranch", "Palmetto", "Ellenton"],
    floodExposure: "mixed",
    floodNote:
      "Manatee runs from the Gulf barrier islands across the Manatee River to fast-growing inland communities, so its flood picture is split. Anna Maria Island, the coastal and riverfront neighborhoods, and Palmetto's low ground near the river carry real flood and wind exposure; inland Lakewood Ranch and Parrish sit higher, though new development and area creeks still create flood-zone pockets. Wind and roof age price into the premium countywide. Check the exact property against FEMA's current map and get a real insurance quote, because coastal and inland Manatee carry very different costs.",
    appraiserName: "Manatee County Property Appraiser",
    appraiserUrl: "https://www.manateepao.gov/",
    localAssistanceNote:
      "Beyond the statewide programs, Manatee County's Community Development division runs down-payment and housing assistance for income-eligible buyers. The amounts, income limits, and funding availability are set by the county and change, so confirm the current terms with the county or a licensed officer before you count on them.",
    localAssistanceUrl:
      "https://www.mymanatee.org/departments/community-and-veterans-services-department/community-development-division",
    metaDescription:
      "Buying in Manatee County (Bradenton): coastal-island vs inland flood and insurance, how homestead works, and the county's community-development help."
  }
];

export function countyBySlug(slug: string): County | undefined {
  return COUNTIES.find((entry) => entry.slug === slug);
}
