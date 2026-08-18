import type { Article } from "./types";

/**
 * Local cluster: Florida places.
 *
 * These are process guides, not market reports. Each article explains what
 * financing a home in a particular place involves — flood zone verification,
 * county property tax mechanics, wind and flood insurance structure, condo or
 * canal or CDD considerations where the place genuinely has them. No article
 * states a price, premium, tax rate, or market condition as a current fact;
 * anything that changes points at its primary source instead.
 */
export const LOCAL_ARTICLES: Article[] = [
  {
    slug: "buying-home-st-petersburg",
    category: "local",
    title: "Buying a Home in St. Petersburg, FL: Financing Guide",
    description:
      "What financing a St. Petersburg home involves: flood zone checks on a peninsula city, Pinellas County property tax mechanics, wind coverage, and condo review.",
    h1: "Buying a home in St. Petersburg: what the financing process actually involves",
    answerSummary:
      "St. Petersburg sits on a peninsula in Pinellas County, bordered by Tampa Bay and the Gulf, so financing starts with the parcel's FEMA flood zone, which drives whether flood insurance is mandatory. Expect wind coverage underwriting, a Pinellas County property tax reassessment at sale, and — for the city's substantial condo stock — a lender review of the association's budget, insurance, and reserves before the loan clears.",
    sections: [
      {
        heading: "Start with the map, not the listing",
        paragraphs: [
          "St. Petersburg occupies the southern tip of the Pinellas peninsula, with Tampa Bay to the east and south and the Gulf beaches a short causeway away. That geography is the first underwriting fact about any property here. Before falling in love with a house, look up its flood zone on the FEMA Flood Map Service Center — the official, address-searchable source for flood hazard maps. If the parcel sits in a Special Flood Hazard Area (zones beginning with A or V), a lender making a federally backed loan must require flood insurance, and that premium becomes part of the monthly payment you qualify against.",
          "Two homes a few blocks apart can sit in different zones and carry very different insurance obligations. Neither is a better home; they are different financing problems. A zone X property still faces flood risk — much of Florida's flood damage happens outside mapped high-risk zones — so many buyers carry coverage voluntarily even where no lender requires it."
        ]
      },
      {
        heading: "Wind coverage and the age of the housing stock",
        paragraphs: [
          "St. Petersburg has neighborhoods of housing built across many decades, and a home's age, roof condition, and construction details matter to Florida property insurers in a way buyers from other states rarely expect. Insurers commonly ask about roof age and shape, opening protection, and how the roof is attached to the walls. A wind mitigation inspection documents those features, and Florida law entitles homeowners to premium credits for verified mitigation features — the inspection often pays for itself.",
          "Homeowners policies in Florida typically carry a separate hurricane deductible calculated as a percentage of the dwelling coverage rather than a flat dollar amount. Get insurance quotes early — during the inspection period, not the week of closing — because the quote shapes both your escrow payment and your debt-to-income calculation. The Florida Department of Financial Services publishes consumer guidance on how these policies are structured."
        ]
      },
      {
        heading: "Pinellas County property taxes reset at purchase",
        paragraphs: [
          "Florida property taxes are administered county by county, and Pinellas County will reassess the home at just value after you buy it. The seller's tax bill is close to meaningless as a predictor of yours: a long-time owner with homestead protection has had annual assessment growth capped under Save Our Homes, and that accumulated cap benefit does not transfer to you. Lenders and careful buyers estimate the post-sale tax bill from the purchase price, not from the current bill.",
          "If the home will be your primary residence, file for the homestead exemption with the Pinellas County Property Appraiser after closing — it reduces your taxable value and starts your own assessment cap. The Florida Department of Revenue explains the exemption, the filing process, and the deadlines, which run early in the calendar year; confirm the current cutoff with the county."
        ]
      },
      {
        heading: "Condos: the building gets underwritten too",
        paragraphs: [
          "Downtown St. Petersburg and the waterfront carry a substantial condo inventory, from mid-century buildings to new towers. Financing a condo means the lender evaluates the project, not just you: the association's budget and reserves, its insurance coverage, the share of units that are owner-occupied, any litigation, and any major deferred maintenance. A personally strong borrower can still see a loan stall on a project-level finding.",
          "Ask for the association's budget, meeting minutes, and any recent engineering or reserve studies during your inspection period. Florida's post-2021 condominium safety framework added structural inspection and reserve requirements for older multi-story buildings, so the documentation exists — reading it early tells you what the lender will find later."
        ]
      },
      {
        heading: "How TRACT fits in",
        paragraphs: [
          "TRACT is a mortgage broker: we arrange financing through wholesale lenders and do not make, approve, or price loans ourselves. For a St. Petersburg purchase that matters because different lenders treat flood zones, insurance costs, and condo projects differently — a file that stalls at one lender can be structured for another. The process runs: preapproval, offer, flood and insurance verification during inspection, project review if a condo, then appraisal and closing."
        ],
        bullets: [
          "Look up the flood zone at the FEMA Flood Map Service Center before making an offer.",
          "Order wind mitigation and four-point inspections alongside the general inspection on older homes.",
          "Budget property taxes from the purchase price, not the seller's bill.",
          "For condos, request association budgets, reserves, and inspection reports early."
        ]
      }
    ],
    faqs: [
      {
        question: "Is flood insurance always required in St. Petersburg?",
        answer:
          "No. It is mandatory only when the property sits in a FEMA Special Flood Hazard Area and the loan is federally backed. Check the parcel's zone on the FEMA Flood Map Service Center. Many owners outside high-risk zones still buy coverage voluntarily, because flooding is not confined to mapped zones and standard homeowners policies exclude flood damage."
      },
      {
        question: "Why will my property tax bill differ from the seller's?",
        answer:
          "Pinellas County reassesses a home at just value when it sells. A long-time owner's assessed value was likely held down by Florida's Save Our Homes cap, which does not transfer. Your bill is recalculated from the new assessment, so estimate from your purchase price and file for your own homestead exemption if the home is your primary residence."
      },
      {
        question: "What can stop a condo loan in St. Petersburg?",
        answer:
          "Project-level issues: inadequate association reserves or insurance, significant deferred maintenance flagged in structural inspections, pending litigation, or too few owner-occupied units. Lenders review the building alongside the borrower. Requesting association documents during the inspection period surfaces these issues while you can still negotiate or exit."
      },
      {
        question: "Does TRACT decide whether my loan is approved?",
        answer:
          "No. TRACT is a broker — we arrange loans through wholesale lenders, and the lender makes the credit decision. Our role is matching the file to a lender whose guidelines fit it, which is especially useful where flood zones, insurance costs, or condo project findings complicate a file."
      }
    ],
    sources: [
      {
        publisher: "FEMA",
        title: "Flood Map Service Center",
        url: "https://msc.fema.gov/portal/home"
      },
      {
        publisher: "Florida Department of Revenue",
        title: "Property Tax Information for Taxpayers",
        url: "https://floridarevenue.com/property/Pages/Taxpayers.aspx"
      },
      {
        publisher: "Florida Department of Financial Services",
        title: "Division of Consumer Services",
        url: "https://www.myfloridacfo.com/division/consumers/"
      },
      {
        publisher: "U.S. Census Bureau",
        title: "QuickFacts: St. Petersburg city, Florida",
        url: "https://www.census.gov/quickfacts/stpetersburgcityflorida"
      }
    ],
    related: [
      { href: "/mortgage/condo", label: "Condo financing" },
      { href: "/calculators/mortgage-payment", label: "Mortgage payment calculator" },
      { href: "/resources/florida-coastal-vs-inland", label: "Coastal vs. inland Florida costs" },
      { href: "/locations/florida", label: "TRACT in Florida" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "buying-home-tampa",
    category: "local",
    title: "Buying a Home in Tampa, FL: Mortgage Process Guide",
    description:
      "Financing a Tampa home: bay-front flood zones versus inland suburbs, CDD fees in master-planned communities, Hillsborough County taxes, and wind coverage.",
    h1: "Buying a home in Tampa: flood maps, CDD fees, and the Hillsborough tax reset",
    answerSummary:
      "Tampa, the seat of Hillsborough County, spans bay-front neighborhoods and inland suburbs, so financing questions change street by street. Buyers verify the FEMA flood zone, price wind coverage into the escrow, and expect a property tax reassessment at sale. In the newer master-planned communities around the city, Community Development District assessments ride on the tax bill and count in qualifying, so read the bill's line items before offering.",
    sections: [
      {
        heading: "One city, two financing geographies",
        paragraphs: [
          "Tampa sits on Tampa Bay in Hillsborough County, and its housing splits roughly into two financing profiles. Near the bay and the Hillsborough River, parcels are more likely to fall in FEMA Special Flood Hazard Areas, where a federally backed loan requires flood insurance. Farther inland and in the suburban corridors, mapped flood risk generally recedes but never disappears — low-lying pockets and areas near creeks and wetlands carry zones of their own.",
          "The practical rule: pull the parcel's flood zone from the FEMA Flood Map Service Center before you offer, and get a flood insurance quote during inspection if the zone requires or suggests one. The flood determination the lender orders later should confirm what you already know, not surprise you."
        ]
      },
      {
        heading: "CDD assessments in master-planned communities",
        paragraphs: [
          "Much of the newer construction in and around Tampa sits inside Community Development Districts — special-purpose districts that financed the community's roads, utilities, and amenities with bonds, repaid through annual assessments on each home. The assessment appears on the property tax bill and typically has two parts: a debt portion that retires the bonds and an operations-and-maintenance portion that continues indefinitely.",
          "For financing, CDD assessments matter twice. They raise the monthly escrow, and they count in your debt-to-income calculation, so two identically priced homes — one in a CDD, one not — support different loan amounts. Ask the seller or the district for the current assessment, whether the debt portion has been paid down or can be paid off, and how many years remain on the bonds."
        ]
      },
      {
        heading: "Hillsborough County property taxes after the sale",
        paragraphs: [
          "Like every Florida county, Hillsborough reassesses a property at just value following a change of ownership. The Save Our Homes cap that limited the previous owner's annual assessment growth resets at sale, so the listing's advertised tax figure describes the seller's situation, not yours. Underwriters estimate your escrow from the expected post-sale assessment.",
          "If the home becomes your primary residence, file for the homestead exemption with the Hillsborough County Property Appraiser. The Florida Department of Revenue documents the exemption and the early-year filing deadline. Homestead status both reduces taxable value and begins your own capped-assessment history — the mechanism that makes long tenure in Florida progressively cheaper than the first year."
        ]
      },
      {
        heading: "Wind coverage and the insurance timeline",
        paragraphs: [
          "Every Tampa homeowner buys wind coverage in some form, and Florida policies are structured differently from most states: a separate hurricane deductible expressed as a percentage of dwelling coverage, underwriting attention to roof age and construction, and statutory premium credits for verified wind mitigation features. A wind mitigation inspection is inexpensive relative to the credits it can document.",
          "Start insurance shopping when your offer is accepted, not when the lender asks for a binder. If a named storm approaches during your closing window, insurers commonly suspend new binding until it passes — a timing risk that catches buyers who wait. The Florida Department of Financial Services publishes consumer guidance on policy structure and shopping."
        ]
      },
      {
        heading: "Putting the pieces together",
        paragraphs: [
          "TRACT arranges Tampa purchase financing through wholesale lenders; we do not make or approve loans. What we add is structure: flood zone and CDD facts gathered before the offer, insurance quotes during inspection, and a lender match that fits the property's actual profile — bay-front with mandatory flood coverage, or an inland CDD community where the assessment drives the qualifying math."
        ],
        bullets: [
          "Verify the flood zone on the FEMA Flood Map Service Center for every candidate property.",
          "In CDD communities, get the assessment amount and bond payoff status in writing.",
          "Estimate taxes from your purchase price; the seller's capped bill will not survive the sale.",
          "Quote insurance during inspection — named-storm binding suspensions can freeze late shoppers."
        ]
      }
    ],
    faqs: [
      {
        question: "What is a CDD fee and does it affect how much home I can finance?",
        answer:
          "A Community Development District assessment repays the bonds that built a community's infrastructure and funds its ongoing maintenance. It appears on the property tax bill, raises your escrow, and counts in the debt-to-income calculation, so a CDD home supports a somewhat smaller loan than an identical non-CDD home at the same price."
      },
      {
        question: "Do inland Tampa suburbs still need flood insurance?",
        answer:
          "Sometimes. Mandatory coverage depends on the FEMA flood zone, not distance from the bay — inland parcels near rivers, creeks, and wetlands can sit in Special Flood Hazard Areas. And a low-risk zone means lower mapped risk, not none; standard homeowners policies exclude flood, so many inland owners carry a policy voluntarily."
      },
      {
        question: "Why do Tampa property taxes rise after a home sells?",
        answer:
          "Florida reassesses property at just value on a change of ownership, and the previous owner's Save Our Homes assessment cap resets. The buyer starts from the new assessment. Filing for homestead exemption on a primary residence reduces taxable value and starts a new cap going forward, per the Florida Department of Revenue."
      },
      {
        question: "Is a wind mitigation inspection worth ordering on a Tampa resale home?",
        answer:
          "Usually, yes. Florida law entitles homeowners to insurance premium credits for verified mitigation features such as roof attachment methods and opening protection, and the inspection is the document that proves them. On an older Tampa home the credits it documents commonly outweigh its modest cost many times over."
      }
    ],
    sources: [
      {
        publisher: "FEMA",
        title: "Flood Map Service Center",
        url: "https://msc.fema.gov/portal/home"
      },
      {
        publisher: "Florida Department of Revenue",
        title: "Property Tax Information for Taxpayers",
        url: "https://floridarevenue.com/property/Pages/Taxpayers.aspx"
      },
      {
        publisher: "U.S. Census Bureau",
        title: "QuickFacts: Tampa city, Florida",
        url: "https://www.census.gov/quickfacts/tampacityflorida"
      },
      {
        publisher: "Florida Department of Financial Services",
        title: "Division of Consumer Services",
        url: "https://www.myfloridacfo.com/division/consumers/"
      }
    ],
    related: [
      { href: "/calculators/affordability", label: "Affordability calculator" },
      { href: "/mortgage/purchase", label: "Purchase loans" },
      { href: "/resources/buying-home-st-petersburg", label: "Buying in St. Petersburg" },
      { href: "/resources/florida-coastal-vs-inland", label: "Coastal vs. inland Florida costs" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "buying-home-sarasota",
    category: "local",
    title: "Buying a Home in Sarasota, FL: Financing Guide",
    description:
      "Financing a Sarasota home: barrier island versus mainland flood profiles, condo project review, Sarasota County tax reassessment, and wind insurance structure.",
    h1: "Buying a home in Sarasota: island, mainland, and what each means for the loan",
    answerSummary:
      "Sarasota, on Florida's Gulf coast in Sarasota County, offers barrier-island condos and homes, coastal mainland neighborhoods, and inland communities east of the interstate — three distinct financing profiles. The barrier islands concentrate Special Flood Hazard Areas and condo project review; inland parcels shift the cost question toward taxes and wind coverage. Every purchase involves a FEMA flood zone check, insurance quotes during inspection, and a county reassessment at sale.",
    sections: [
      {
        heading: "Geography is the underwriting outline",
        paragraphs: [
          "Sarasota faces the Gulf of Mexico across a chain of barrier islands, with the mainland city on Sarasota Bay and newer communities stretching inland to the east. Where a property sits on that west-to-east line predicts most of its financing questions. Island and bayfront parcels are more likely to fall in FEMA Special Flood Hazard Areas — including velocity zones subject to wave action — where flood insurance is mandatory on federally backed loans and elevation details influence the premium.",
          "Inland, mapped flood risk generally diminishes, though creeks and low-lying areas keep some parcels in higher-risk zones. The FEMA Flood Map Service Center resolves the question by address, and checking it before the offer costs nothing. FloodSmart, the National Flood Insurance Program's consumer site, explains what the zone letters mean and how coverage works."
        ]
      },
      {
        heading: "Condos on the islands: two underwritings in one",
        paragraphs: [
          "A meaningful share of Sarasota's coastal inventory is condominium — on the islands and along the bayfront. A condo loan is underwritten twice: once for the borrower, once for the project. Lenders review the association's budget and reserves, its master insurance policy including wind and flood coverage, owner-occupancy levels, litigation, and structural condition documentation. Florida's condominium safety laws require milestone structural inspections and reserve studies for older multi-story buildings, and lenders read those findings.",
          "Buyers should request association documents in the inspection period: budget, reserve study, recent minutes, and any engineering reports. A special assessment being discussed in the minutes today is a line item on your ownership costs tomorrow — and possibly a project-eligibility question for the lender."
        ]
      },
      {
        heading: "Sarasota County taxes and the homestead decision",
        paragraphs: [
          "Sarasota County reassesses property at just value when it changes hands, so the seller's tax bill — often suppressed by years of Save Our Homes caps — is not your forecast. Estimate from the purchase price. If the home will be your primary residence, file for homestead exemption with the county property appraiser; the Florida Department of Revenue documents the exemption and its early-year deadline.",
          "Sarasota also draws many second-home buyers, and the tax mechanics differ for them: no homestead exemption, no Save Our Homes cap, and a different assessment growth limitation. Second-home and investment financing also carry different lender requirements than primary residences, so state the intended occupancy accurately from the first conversation — it shapes the loan."
        ]
      },
      {
        heading: "Wind coverage from island to interstate",
        paragraphs: [
          "Wind underwriting applies across Sarasota, coastal or not. Florida homeowners policies typically carry a percentage-based hurricane deductible, and insurers price on roof age, construction, and documented mitigation features — a wind mitigation inspection converts construction details into statutory premium credits. Coastal properties may face fewer willing private insurers; Citizens Property Insurance Corporation exists as the state-created insurer for property owners unable to find private coverage.",
          "Quote early. Insurance cost feeds the escrow, the escrow feeds the qualifying payment, and a surprise quote late in the contract period is a genuinely avoidable way to lose a deposit."
        ]
      },
      {
        heading: "The process, in order",
        paragraphs: [
          "TRACT arranges Sarasota financing through wholesale lenders — we broker, we do not lend or approve. A clean sequence: preapproval with occupancy stated accurately; offer; flood zone verification and insurance quotes during inspection; condo project documents if applicable; appraisal; closing with taxes estimated at post-sale assessment. Each step exists to surface the island-versus-mainland cost differences while you can still act on them."
        ],
        bullets: [
          "Check the FEMA flood zone by address before offering; islands often mean A or V zones.",
          "For condos, request budget, reserves, minutes, and structural reports immediately.",
          "Second home or primary? The answer changes taxes, insurance, and loan terms.",
          "Get wind and flood quotes during inspection, not at the closing table."
        ]
      }
    ],
    faqs: [
      {
        question: "Is financing different on Sarasota's barrier islands than on the mainland?",
        answer:
          "The loan programs are the same, but the inputs differ. Island parcels more often sit in Special Flood Hazard Areas, making flood insurance mandatory and elevation relevant, and much island inventory is condo, adding project review. That typically means higher insurance escrows and more documentation, which affects the qualifying payment."
      },
      {
        question: "Do second-home buyers in Sarasota get the homestead exemption?",
        answer:
          "No. The homestead exemption and Save Our Homes cap apply only to a Florida primary residence. Second homes are assessed without them, under a different growth limitation, so carrying costs run higher for comparable properties. Lenders also apply different requirements to second-home loans, so declare occupancy accurately from the start."
      },
      {
        question: "What flood zone facts should I confirm before buying in Sarasota?",
        answer:
          "The parcel's zone on the FEMA Flood Map Service Center, whether that zone makes flood insurance mandatory for a federally backed loan, whether an elevation certificate exists for the structure, and an actual premium quote. FloodSmart explains zone designations. Confirm all four during the inspection period."
      },
      {
        question: "What if private insurers decline a coastal Sarasota property?",
        answer:
          "Citizens Property Insurance Corporation, the state-created insurer of last resort, exists for Florida property owners unable to find private coverage. Eligibility follows its rules rather than the private market's, and a wind mitigation inspection still helps document the risk. Build extra shopping time into the contract for thinly insured coastal profiles."
      }
    ],
    sources: [
      {
        publisher: "FEMA",
        title: "Flood Map Service Center",
        url: "https://msc.fema.gov/portal/home"
      },
      {
        publisher: "FloodSmart / National Flood Insurance Program",
        title: "Flood Map Zones Explained",
        url: "https://www.floodsmart.gov/flood-map-zone"
      },
      {
        publisher: "Florida Department of Revenue",
        title: "Property Tax Exemptions and Additional Benefits",
        url: "https://floridarevenue.com/property/Pages/Taxpayers_Exemptions.aspx"
      },
      {
        publisher: "U.S. Census Bureau",
        title: "QuickFacts: Sarasota city, Florida",
        url: "https://www.census.gov/quickfacts/sarasotacityflorida"
      }
    ],
    related: [
      { href: "/mortgage/condo", label: "Condo financing" },
      { href: "/calculators/mortgage-payment", label: "Mortgage payment calculator" },
      { href: "/resources/florida-coastal-vs-inland", label: "Coastal vs. inland Florida costs" },
      { href: "/plan", label: "Build your buying plan" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "buying-home-orlando",
    category: "local",
    title: "Buying a Home in Orlando, FL: Mortgage Process Guide",
    description:
      "Financing an Orlando home: inland flood zones around lakes and wetlands, CDD fees in master-planned communities, HOA review, and Orange County tax mechanics.",
    h1: "Buying a home in Orlando: inland does not mean paperwork-free",
    answerSummary:
      "Orlando, the seat of Orange County, is inland — no storm surge exposure — but financing still runs through the same Florida checkpoints: a FEMA flood zone check, since lakes and wetlands put some parcels in high-risk zones; wind coverage underwriting; and a property tax reassessment at sale. The region's signature wrinkle is the Community Development District assessment common in master-planned communities, which rides the tax bill and counts in qualifying.",
    sections: [
      {
        heading: "Inland flood zones are real zones",
        paragraphs: [
          "Orlando's distance from the coast removes storm surge from the picture, but not flood risk. Central Florida is laced with lakes and wetlands, and parcels near them can fall in FEMA Special Flood Hazard Areas where federally backed loans require flood insurance. The FEMA Flood Map Service Center answers the question by address in a minute, and it belongs in your pre-offer routine even though the ocean is an hour away.",
          "Properties in low-risk zones face no mandate, but standard homeowners policies exclude flood damage everywhere, and heavy-rain flooding does not consult the map. Voluntary coverage in a low-risk zone is a personal decision; the point is to make it deliberately rather than assume inland equals dry."
        ]
      },
      {
        heading: "CDD country: read the tax bill's line items",
        paragraphs: [
          "The master-planned communities that dominate new construction around Orlando were largely financed through Community Development Districts. A CDD sells bonds to build the community's roads, utilities, ponds, and amenities, then levies an annual assessment on each home — a debt portion until the bonds retire and an operations portion that continues. Both appear on the property tax bill.",
          "In qualifying terms, the CDD assessment behaves like extra property tax: it raises the escrow and enters the debt-to-income calculation. Before offering, get the current assessment, ask whether the debt portion has been prepaid on this lot, and note that assessments can differ between neighboring communities and even between phases of the same community."
        ]
      },
      {
        heading: "HOAs, amenities, and what lenders check",
        paragraphs: [
          "Alongside CDDs, most Orlando-area communities carry homeowners associations whose dues fund gates, pools, and maintenance. Lenders count HOA dues in the qualifying payment and, for attached housing and condos, review the association itself — budget, reserves, insurance, owner-occupancy. Orlando's tourism economy also means some communities near the attraction corridors are zoned and marketed for short-term rental; a home there may be treated by lenders as an investment property or resort-style project rather than a standard primary residence, which changes the available programs.",
          "State your actual intended use plainly. Primary residence, second home, and investment financing carry different requirements, and the community's character can constrain which is realistic."
        ]
      },
      {
        heading: "Orange County taxes and the homestead filing",
        paragraphs: [
          "Orange County reassesses a home at just value after purchase, resetting the previous owner's Save Our Homes cap. Estimate your bill from the purchase price plus the CDD and any other non-ad-valorem assessments — the listing's tax history describes the seller's costs, not yours. If the home is your primary residence, file for the homestead exemption with the Orange County Property Appraiser; the Florida Department of Revenue documents the exemption, the residency requirement, and the early-year deadline.",
          "Wind coverage completes the cost picture. Inland location moderates the exposure conversation, but Florida policies still typically carry hurricane deductibles and insurers still price roof age and mitigation features, so a wind mitigation inspection remains worthwhile on resale homes."
        ]
      },
      {
        heading: "Sequence for an Orlando purchase",
        paragraphs: [
          "TRACT arranges Orlando-area loans as a broker — wholesale lenders make and price the credit decision. The productive order: preapproval with occupancy declared; offer with CDD and HOA figures in hand; flood zone check and insurance quotes during inspection; association review if attached housing; appraisal; closing with the escrow built on post-sale taxes plus assessments. Nothing on that list is exotic, but each item is a number that changes what you can borrow."
        ],
        bullets: [
          "Check the FEMA flood zone even inland — lakes and wetlands create A zones.",
          "Get the CDD assessment and bond status in writing before offering.",
          "Count HOA dues and CDD assessments in your own affordability math.",
          "Near tourist corridors, confirm how lenders classify the community before assuming standard financing."
        ]
      }
    ],
    faqs: [
      {
        question: "Does an inland Orlando home need flood insurance?",
        answer:
          "Only if the parcel sits in a FEMA Special Flood Hazard Area and the loan is federally backed — and around Orlando's lakes and wetlands, some parcels do. Check the address on the FEMA Flood Map Service Center. Outside mandatory zones, coverage is optional but worth a deliberate decision, since homeowners policies exclude flood."
      },
      {
        question: "How is a CDD fee different from an HOA fee?",
        answer:
          "A CDD assessment is a governmental levy on the property tax bill, largely repaying infrastructure bonds; an HOA fee is a private association charge for community operations. Many Orlando-area homes carry both. Lenders count both in qualifying, but the CDD runs with the land through the tax bill regardless of the association."
      },
      {
        question: "Will my Orange County taxes match the seller's?",
        answer:
          "Almost certainly not. Florida reassesses at just value on sale, and the seller's Save Our Homes cap resets. Your bill is built from the new assessment plus non-ad-valorem items like CDD assessments. File for homestead exemption on a primary residence to reduce taxable value and start your own cap."
      },
      {
        question: "Can a CDD assessment be paid off early?",
        answer:
          "Often the debt portion can — some owners prepay the bond share, which removes that line from future tax bills, while the operations-and-maintenance portion continues for the life of the district. Ask the district whether this lot's bond share was prepaid; the answer changes your escrow and qualifying math."
      }
    ],
    sources: [
      {
        publisher: "FEMA",
        title: "Flood Map Service Center",
        url: "https://msc.fema.gov/portal/home"
      },
      {
        publisher: "Florida Department of Revenue",
        title: "Property Tax Information for Taxpayers",
        url: "https://floridarevenue.com/property/Pages/Taxpayers.aspx"
      },
      {
        publisher: "U.S. Census Bureau",
        title: "QuickFacts: Orlando city, Florida",
        url: "https://www.census.gov/quickfacts/orlandocityflorida"
      }
    ],
    related: [
      { href: "/calculators/debt-to-income", label: "Debt-to-income calculator" },
      { href: "/mortgage/first-time-home-buyers", label: "First-time buyer loans" },
      { href: "/resources/buying-home-tampa", label: "Buying in Tampa" },
      { href: "/contact", label: "Talk to TRACT" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "buying-home-jacksonville",
    category: "local",
    title: "Buying a Home in Jacksonville, FL: Financing Guide",
    description:
      "Financing a Jacksonville home: river and coastal flood zones across a vast consolidated county, VA loans near the naval bases, and Duval County tax mechanics.",
    h1: "Buying a home in Jacksonville: a county-sized city with river, coast, and everything between",
    answerSummary:
      "Jacksonville's consolidated city-county government makes it coextensive with most of Duval County, spanning Atlantic-adjacent neighborhoods, the St. Johns River corridor, and broad inland suburbs. Financing therefore starts with the parcel's FEMA flood zone, which varies enormously across that footprint. Expect wind coverage underwriting, a Duval County reassessment at sale with homestead filing afterward, and — given the area's naval installations — frequent use of VA financing.",
    sections: [
      {
        heading: "A flood map that spans river, marsh, and ocean",
        paragraphs: [
          "Jacksonville is unusual among Florida cities: its 1968 consolidation with Duval County produced a municipality with one of the largest land areas of any U.S. city, and the St. Johns River runs directly through it before meeting the Atlantic. That footprint contains riverfront bluffs, tidal creeks and marsh, beach-adjacent communities to the east, and inland neighborhoods far from any of it.",
          "So the flood question has no citywide answer. A riverfront parcel, a home near a tidal creek, and an inland suburban lot can carry entirely different FEMA designations. Look up each candidate address on the FEMA Flood Map Service Center; where the zone begins with A or V, flood insurance is mandatory on federally backed loans and the premium joins the escrow you qualify against. FloodSmart explains what the designations mean."
        ]
      },
      {
        heading: "VA financing in a Navy town",
        paragraphs: [
          "Naval Station Mayport and Naval Air Station Jacksonville anchor a large military and veteran population in the area, and VA financing is correspondingly common. VA loans allow qualified veterans, service members, and eligible surviving spouses to buy with no down payment and no monthly mortgage insurance, subject to the VA funding fee and the program's occupancy and appraisal requirements.",
          "VA loans work on riverfront and beach-area properties like any others — the flood insurance mandate in Special Flood Hazard Areas applies to VA loans too, and the VA appraisal includes its own minimum property requirements. TRACT arranges VA loans through participating lenders; eligibility is established with a Certificate of Eligibility, which we can help request."
        ]
      },
      {
        heading: "Duval County taxes: reassessment, then homestead",
        paragraphs: [
          "Duval County reassesses property at just value on a change of ownership, which resets the prior owner's Save Our Homes cap. Budget from the purchase price rather than the seller's bill. After closing on a primary residence, file for the homestead exemption with the Duval County Property Appraiser — the Florida Department of Revenue documents the exemption, additional exemptions for veterans and others, and the early-year filing deadline.",
          "Veterans should look specifically at the additional property tax exemptions Florida provides for certain disabled veterans; the Department of Revenue's exemptions page outlines them. These are separate from the VA loan benefit and claimed through the county."
        ]
      },
      {
        heading: "Wind, water, and older housing stock",
        paragraphs: [
          "Jacksonville's insurance underwriting follows the statewide pattern: hurricane deductibles expressed as a percentage of dwelling coverage, pricing sensitive to roof age and construction, and premium credits for documented wind mitigation features. The city's historic neighborhoods include housing that is a century old, where insurers commonly want four-point inspections covering roof, electrical, plumbing, and HVAC before writing coverage.",
          "Waterfront ownership adds its own diligence: docks and bulkheads on the river and Intracoastal are the owner's to maintain, appraisers note their condition, and insurance for them is a separate conversation. None of this blocks financing; all of it belongs in the inspection period rather than the week of closing."
        ]
      },
      {
        heading: "Running the process across a huge map",
        paragraphs: [
          "TRACT is a broker — we arrange Jacksonville loans through wholesale lenders and do not make credit decisions. The sequence: preapproval (with VA eligibility confirmed if applicable), offer, flood zone verification and insurance quotes in inspection, four-point and wind mitigation inspections on older homes, appraisal, closing with taxes estimated post-sale. The city's size means the same budget meets very different cost structures in different quadrants; the checklist is how you compare them honestly."
        ],
        bullets: [
          "Check every candidate address on the FEMA Flood Map Service Center — zones vary block to block near water.",
          "VA-eligible buyers: confirm the Certificate of Eligibility at preapproval, not at contract.",
          "File Duval homestead after closing; veterans should review additional exemptions.",
          "Budget dock and bulkhead upkeep on riverfront parcels — appraisers and insurers both look."
        ]
      }
    ],
    faqs: [
      {
        question: "Is Jacksonville coastal or inland for insurance purposes?",
        answer:
          "Both, which is why parcel-level facts beat generalizations. The city-county spans beach-adjacent neighborhoods, the tidal St. Johns River corridor, and deep inland suburbs. Flood insurance requirements follow the FEMA zone of the specific parcel, and wind underwriting applies everywhere in Florida, so verify each address individually."
      },
      {
        question: "Can I use a VA loan on a home in a flood zone?",
        answer:
          "Yes. VA loans work in Special Flood Hazard Areas; the standard mandate applies — flood insurance must be in place and maintained, and the premium counts in your qualifying payment. The VA appraisal also applies its minimum property requirements, so significant water-related deterioration can surface there."
      },
      {
        question: "What tax breaks exist for Jacksonville homeowners?",
        answer:
          "A primary residence qualifies for Florida's homestead exemption and the Save Our Homes assessment cap, filed with the Duval County Property Appraiser. Florida law adds further exemptions for certain veterans, seniors, and others; the Florida Department of Revenue's exemptions page lists them and the county confirms eligibility and deadlines."
      },
      {
        question: "What inspections do insurers expect on older Jacksonville homes?",
        answer:
          "For housing of significant age — common in Jacksonville's historic neighborhoods — insurers routinely ask for a four-point inspection covering roof, electrical, plumbing, and HVAC before writing coverage, and a wind mitigation inspection documents features that earn statutory premium credits. Ordering both alongside the general inspection keeps the insurance timeline off your closing's critical path."
      }
    ],
    sources: [
      {
        publisher: "FEMA",
        title: "Flood Map Service Center",
        url: "https://msc.fema.gov/portal/home"
      },
      {
        publisher: "Florida Department of Revenue",
        title: "Property Tax Exemptions and Additional Benefits",
        url: "https://floridarevenue.com/property/Pages/Taxpayers_Exemptions.aspx"
      },
      {
        publisher: "U.S. Census Bureau",
        title: "QuickFacts: Jacksonville city, Florida",
        url: "https://www.census.gov/quickfacts/jacksonvillecityflorida"
      },
      {
        publisher: "FloodSmart / National Flood Insurance Program",
        title: "Flood Map Zones Explained",
        url: "https://www.floodsmart.gov/flood-map-zone"
      }
    ],
    related: [
      { href: "/mortgage/va", label: "VA loans" },
      { href: "/calculators/mortgage-payment", label: "Mortgage payment calculator" },
      { href: "/resources/florida-coastal-vs-inland", label: "Coastal vs. inland Florida costs" },
      { href: "/locations/florida", label: "TRACT in Florida" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "buying-home-miami",
    category: "local",
    title: "Buying a Home in Miami, FL: Mortgage & Condo Guide",
    description:
      "Financing a Miami home: condo project review in a vertical market, coastal flood zones, Miami-Dade tax reassessment, and how insurance shapes the payment.",
    h1: "Buying a home in Miami: where the building is underwritten as hard as the buyer",
    answerSummary:
      "Miami, the seat of Miami-Dade County, is Florida's most vertical housing market, so condo project review sits at the center of most purchases: lenders examine the association's budget, reserves, insurance, and structural inspection reports alongside the borrower. Coastal parcels demand a FEMA flood zone check that often makes flood insurance mandatory, taxes reset at sale under county reassessment, and insurance quotes belong early in the contract period.",
    sections: [
      {
        heading: "A condo-first market changes the order of diligence",
        paragraphs: [
          "In much of Florida the condo questions are a special case; in Miami they are the main case. Financing a unit means the lender underwrites the project: association budget and reserve funding, the master insurance policy including windstorm and — where required — flood coverage, owner-occupancy mix, pending litigation, and structural condition. Florida's post-2021 condominium safety framework requires milestone structural inspections and structural integrity reserve studies for older buildings three stories and taller, and those reports are exactly what lenders and insurers read.",
          "Some buildings do not fit standard agency guidelines — because of reserve findings, insurance gaps, hotel-style operations, or commercial space. Units there are not unfinanceable, but they route to different loan products with different terms. Knowing which kind of building you are offering on, before you offer, is the single highest-value piece of diligence in a Miami purchase."
        ]
      },
      {
        heading: "The flood map meets the ocean",
        paragraphs: [
          "Miami's coastal geography puts many parcels — and many condo towers — in FEMA Special Flood Hazard Areas, where federally backed loans require flood insurance. For condos, the association's master flood policy may satisfy part of the requirement, with the lender checking coverage adequacy at the project level; for houses, the buyer carries the policy directly. Either way, the parcel's zone is public: the FEMA Flood Map Service Center resolves it by address.",
          "FloodSmart, the National Flood Insurance Program's consumer site, explains zone designations and coverage mechanics. Inland Miami-Dade neighborhoods can sit in lower-risk zones, but the exclusion of flood from standard homeowners policies applies everywhere, so treat the coverage decision as deliberate rather than automatic in either direction."
        ]
      },
      {
        heading: "Miami-Dade taxes: reassessment, homestead, and non-resident buyers",
        paragraphs: [
          "Miami-Dade County reassesses property at just value when it sells, resetting the prior owner's Save Our Homes cap — so estimate taxes from your purchase price, not the listing's tax history. Primary residents should file for the homestead exemption with the county property appraiser after closing; the Florida Department of Revenue documents the exemption and its early-year deadline.",
          "Miami also draws many second-home and international buyers, and the mechanics differ for them: no homestead exemption or cap, and different loan programs — second-home, investment, and foreign-national lending each carry their own requirements. TRACT arranges financing across these categories through wholesale lenders; the essential input is an accurate statement of how the property will actually be used."
        ]
      },
      {
        heading: "Insurance, assessments, and the real monthly cost",
        paragraphs: [
          "For a Miami condo, the visible costs are the mortgage payment, taxes, and the association fee — but the association fee is itself a financial instrument, funding the master insurance policy and the reserves that keep special assessments rare. A building whose insurance costs rise or whose reserves fall short passes that reality to owners as higher fees or one-time assessments. Reading the budget and reserve study during your inspection period is reading your own future costs.",
          "For houses, standard Florida structure applies: hurricane deductibles as a percentage of dwelling coverage, underwriting attention to roof and mitigation features, credits for wind mitigation inspections, and the Florida Department of Financial Services as the consumer reference. Quote early enough that the number can still change your decision."
        ]
      },
      {
        heading: "Sequencing a Miami purchase",
        paragraphs: [
          "The order that works: preapproval with occupancy and buyer profile stated accurately; building-level screening before the offer where possible; offer; association documents, flood zone verification, and insurance quotes during the contingency period; project review and appraisal; closing. TRACT is a broker — wholesale lenders make and price the credit decision — and in Miami our leverage is knowing which lenders accept which building profiles, which shortens the distance between offer and clear-to-close."
        ],
        bullets: [
          "Screen the building before the unit: budget, reserves, insurance, inspection reports.",
          "Verify the flood zone by address; for condos, ask how the master policy handles flood.",
          "Estimate taxes from purchase price; homestead only applies to a primary residence.",
          "Second-home, investment, and foreign-national purchases each use different programs — say which you are."
        ]
      }
    ],
    faqs: [
      {
        question: "Why do Miami condo loans take extra review?",
        answer:
          "Because the lender underwrites the project as well as the borrower: association budget and reserves, master insurance including wind and flood, owner-occupancy, litigation, and structural inspection findings under Florida's condo-safety laws. Buildings outside standard guidelines route to different products with different terms, so building screening belongs before the offer."
      },
      {
        question: "Does the condo association's insurance cover my flood requirement?",
        answer:
          "Sometimes partially. In Special Flood Hazard Areas, lenders check that the association's master flood coverage is adequate at the project level; depending on the building and the loan, a supplemental unit-owner policy may still be needed. The parcel's zone comes from the FEMA Flood Map Service Center, and the answer is confirmed during project review."
      },
      {
        question: "I'm buying a Miami property as a second home. What changes?",
        answer:
          "Three things: no Florida homestead exemption or Save Our Homes cap, so taxes run on the full assessment; second-home loan programs with their own requirements; and insurance underwriting unchanged. The purchase process is the same otherwise. State the occupancy accurately at preapproval — it determines the available programs."
      },
      {
        question: "Does TRACT lend in Miami?",
        answer:
          "TRACT arranges loans; we are a broker, not a lender. Wholesale lending partners make, approve, and price the loans. In a project-review-heavy market like Miami, brokerage means matching the building and buyer profile to a lender whose guidelines fit — which is often the difference between a stalled file and a closed one."
      }
    ],
    sources: [
      {
        publisher: "FEMA",
        title: "Flood Map Service Center",
        url: "https://msc.fema.gov/portal/home"
      },
      {
        publisher: "Florida Department of Revenue",
        title: "Property Tax Information for Taxpayers",
        url: "https://floridarevenue.com/property/Pages/Taxpayers.aspx"
      },
      {
        publisher: "U.S. Census Bureau",
        title: "QuickFacts: Miami city, Florida",
        url: "https://www.census.gov/quickfacts/miamicityflorida"
      },
      {
        publisher: "Florida Department of Financial Services",
        title: "Division of Consumer Services",
        url: "https://www.myfloridacfo.com/division/consumers/"
      }
    ],
    related: [
      { href: "/mortgage/condo", label: "Condo financing" },
      { href: "/mortgage/jumbo", label: "Jumbo loans" },
      { href: "/calculators/affordability", label: "Affordability calculator" },
      { href: "/resources/florida-coastal-vs-inland", label: "Coastal vs. inland Florida costs" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "buying-home-cape-coral",
    category: "local",
    title: "Buying a Home in Cape Coral, FL: Canal-Front Financing",
    description:
      "Financing a Cape Coral home: the canal system's effect on flood zones and insurance, seawall diligence, Lee County taxes, and utility assessments to check.",
    h1: "Buying a home in Cape Coral: what an extensive canal city means for your loan",
    answerSummary:
      "Cape Coral, in Lee County on Florida's Gulf coast, was built around an extensive network of man-made canals, so waterfront diligence is mainstream here rather than a luxury niche. Financing involves a FEMA flood zone check — much of the city carries mapped flood risk — seawall condition review, wind and flood insurance quotes early in the contract, Lee County reassessment at sale, and attention to any utility or other municipal assessments on the tax bill.",
    sections: [
      {
        heading: "A city organized around canals",
        paragraphs: [
          "Cape Coral was platted in the mid-twentieth century as a waterfront community, and its man-made canal network — among the most extensive of any city — is the defining physical fact of the housing stock. Canals differ in kind: some offer boat access toward the Gulf, others are freshwater canals serving drainage and irrigation. The distinction matters to buyers for use and to underwriting for water exposure, and listings usually advertise it; verify rather than assume.",
          "Water on so many lots means the FEMA flood zone check is not optional diligence here — it is the first fact about the property. Use the FEMA Flood Map Service Center to pull the parcel's zone. In Special Flood Hazard Areas, federally backed loans require flood insurance, and the premium becomes part of the escrow you qualify against. FloodSmart explains the zone letters and how National Flood Insurance Program coverage works."
        ]
      },
      {
        heading: "Seawalls: the inspection item unique to canal living",
        paragraphs: [
          "On a canal lot, the seawall is a structural asset the owner maintains, and its condition belongs in your inspection period alongside the roof and the HVAC. Appraisers note visible seawall deterioration; insurers and lenders react to damage that threatens the structure or the lot. A dedicated seawall or marine inspection is a modest cost against the repair bill an undisclosed failure represents.",
          "Ask the seller for any seawall repair history and permits. Docks and boat lifts, where present, are additional owner-maintained structures with their own insurance conversation. None of this is a reason to avoid canal-front property — it is the standard diligence that makes the purchase priceable."
        ]
      },
      {
        heading: "Lee County taxes and assessments on the bill",
        paragraphs: [
          "Lee County reassesses property at just value when it changes hands, resetting the seller's Save Our Homes cap, so project your taxes from the purchase price. Primary residents should file for the homestead exemption with the Lee County Property Appraiser after closing; the Florida Department of Revenue documents the exemption and the early-year filing deadline.",
          "Cape Coral tax bills can also carry non-ad-valorem assessments — municipal charges for items such as utility expansion where city water and sewer reached formerly well-and-septic areas. Some properties still use wells and septic systems. Ask for the full tax bill with all line items, whether any assessment balance can be or was prepaid, and — on well-and-septic lots — factor the systems into inspection."
        ]
      },
      {
        heading: "Insurance: wind and flood as a package",
        paragraphs: [
          "Cape Coral buyers typically price three coverages together: homeowners with its percentage-based hurricane deductible, flood where the zone requires or prudence suggests it, and any watercraft or dock coverage. Insurers underwrite roof age and construction closely, wind mitigation inspections convert construction features into statutory premium credits, and Citizens Property Insurance Corporation stands as the state-created insurer for owners who cannot find private coverage.",
          "Quote all of it during the inspection period. The combined insurance cost feeds the escrow and the debt-to-income calculation, and on canal-front property it is routinely the number that decides whether the payment fits."
        ]
      },
      {
        heading: "The Cape Coral sequence",
        paragraphs: [
          "TRACT arranges Cape Coral financing as a broker through wholesale lenders; the lender makes the credit decision. The order that protects you: preapproval; offer with canal type and assessment facts confirmed; flood zone verification, seawall inspection, and full insurance quotes during the contingency period; appraisal; closing with taxes estimated at post-sale assessment plus line-item charges. Waterfront everywhere else is a special case — here it is the standard case, and the process above is simply how the city is bought."
        ],
        bullets: [
          "Pull the FEMA flood zone first; assume nothing from the street address.",
          "Inspect the seawall and get its repair history in writing.",
          "Read the full Lee County tax bill, including utility and other assessments.",
          "Quote wind, flood, and dock coverage together before contingencies expire."
        ]
      }
    ],
    faqs: [
      {
        question: "Do all Cape Coral homes require flood insurance?",
        answer:
          "No — the requirement follows the parcel's FEMA zone, not the city limits. Federally backed loans require coverage in Special Flood Hazard Areas, and Cape Coral's canal-laced geography puts many parcels there, but zones vary. Check the address on the FEMA Flood Map Service Center and quote the premium during inspection."
      },
      {
        question: "Who is responsible for the seawall on a canal lot?",
        answer:
          "Generally the property owner maintains the seawall on their lot, which is why its condition belongs in your inspection period. Appraisers note visible deterioration and significant failures can affect insurability and the loan. A marine or seawall inspection plus the seller's repair and permit history is the standard diligence."
      },
      {
        question: "What are the extra line items on a Cape Coral tax bill?",
        answer:
          "Beyond ad-valorem taxes, bills can carry non-ad-valorem assessments — commonly municipal utility expansion charges in areas converted from well and septic to city water and sewer. Amounts and payoff status vary by property. Request the complete bill and ask whether balances were prepaid, because these charges join your escrow."
      },
      {
        question: "Does it matter for financing whether a canal is gulf-access or freshwater?",
        answer:
          "The loan program does not change, but the facts around it can: canal type affects use, value, and the water exposure insurers and appraisers evaluate, and flood zones are determined parcel by parcel either way. Verify the canal type independently rather than relying on the listing, and pull the FEMA zone regardless."
      }
    ],
    sources: [
      {
        publisher: "FEMA",
        title: "Flood Map Service Center",
        url: "https://msc.fema.gov/portal/home"
      },
      {
        publisher: "FloodSmart / National Flood Insurance Program",
        title: "Official Site of the National Flood Insurance Program",
        url: "https://www.floodsmart.gov/"
      },
      {
        publisher: "Florida Department of Revenue",
        title: "Property Tax Information for Taxpayers",
        url: "https://floridarevenue.com/property/Pages/Taxpayers.aspx"
      },
      {
        publisher: "U.S. Census Bureau",
        title: "QuickFacts: Cape Coral city, Florida",
        url: "https://www.census.gov/quickfacts/capecoralcityflorida"
      }
    ],
    related: [
      { href: "/calculators/mortgage-payment", label: "Mortgage payment calculator" },
      { href: "/mortgage/purchase", label: "Purchase loans" },
      { href: "/resources/florida-coastal-vs-inland", label: "Coastal vs. inland Florida costs" },
      { href: "/plan", label: "Build your buying plan" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "buying-home-naples",
    category: "local",
    title: "Buying a Home in Naples, FL: Financing Guide",
    description:
      "Financing a Naples home: coastal flood and wind diligence, condo and club community fee review, jumbo loans above conforming limits, and Collier County taxes.",
    h1: "Buying a home in Naples: coastal diligence, community fees, and the conforming-limit question",
    answerSummary:
      "Naples, on the Gulf coast in Collier County, combines beachfront and near-coast neighborhoods with gated golf and club communities inland — each with distinct financing diligence. Every purchase involves a FEMA flood zone check and early wind and flood insurance quotes; condo and club communities add association and mandatory-fee review that feeds the qualifying math; and purchases above the conforming loan limit, published annually by FHFA, use jumbo financing with its own documentation standards.",
    sections: [
      {
        heading: "Coastal Naples: the flood and wind baseline",
        paragraphs: [
          "Naples fronts the Gulf of Mexico, and its coastal geography concentrates FEMA Special Flood Hazard Areas — including velocity zones subject to wave action — along the beach and the bays. In those zones, federally backed loans require flood insurance, elevation details influence premiums, and an existing elevation certificate is worth asking the seller for. The FEMA Flood Map Service Center resolves any address's zone; FloodSmart explains what the designations mean.",
          "Wind underwriting follows the statewide Florida pattern: hurricane deductibles as a percentage of dwelling coverage, insurer attention to roof age and construction, and statutory credits for documented mitigation features. Coastal addresses can face a thinner set of willing private insurers, with Citizens Property Insurance Corporation as the state-created coverage of last resort. Quote both coverages during the inspection period — on the coast they are payment-shaping numbers."
        ]
      },
      {
        heading: "Condos and club communities: fee structures lenders read",
        paragraphs: [
          "Naples inventory runs heavily to condominiums near the water and to gated communities organized around golf and club amenities inland. Condos bring project review — association budget, reserves, master insurance, structural inspection reports under Florida's condo-safety framework, owner-occupancy, and litigation all get read by the lender before the unit loan clears.",
          "Club communities add a wrinkle that surprises out-of-area buyers: some carry mandatory membership or amenity fees separate from HOA dues, sometimes with one-time initiation components. Recurring mandatory fees enter the qualifying payment like any other obligation, so collect the full fee schedule in writing before offering. Two similar homes in different communities can carry meaningfully different monthly obligations for reasons invisible in the listing photos."
        ]
      },
      {
        heading: "When the loan is jumbo",
        paragraphs: [
          "Fannie Mae and Freddie Mac can only purchase loans up to the conforming loan limit, a figure the Federal Housing Finance Agency recalculates annually by county. Purchases financed above that limit use jumbo loans, which are common in Naples and follow lender-specific rather than agency guidelines: typically fuller documentation, reserve requirements measured in months of payments, and independent appraisal scrutiny — check FHFA's published values for the applicable limit rather than assuming.",
          "Jumbo lending is a lender-by-lender landscape, which is where brokerage earns its keep: TRACT arranges jumbo financing through multiple wholesale lenders whose guidelines differ on documentation, reserves, and property types. We do not make or approve loans; we match the file to a lender whose rules fit it."
        ]
      },
      {
        heading: "Collier County taxes and residency choices",
        paragraphs: [
          "Collier County reassesses property at just value on sale, resetting the seller's Save Our Homes cap — the familiar Florida rule with familiar consequences: estimate from your purchase price, and file for the homestead exemption with the county property appraiser if the home is your primary residence. The Florida Department of Revenue documents the exemption and the early-year deadline.",
          "Naples attracts many seasonal residents, and the primary-versus-second-home decision has layered effects: homestead exemption and assessment cap only for a primary residence, different loan programs and requirements for second homes, and residency declarations that should be consistent across your tax filings, driver license, and loan application. Decide what the property truly is, then document it consistently."
        ]
      },
      {
        heading: "A Naples purchase, in order",
        paragraphs: [
          "The working sequence: preapproval sized against the conforming limit question; offer with the community's full fee schedule in hand; flood zone verification, elevation certificate request, and wind and flood quotes during inspection; association project review for condos; appraisal; closing with Collier taxes estimated post-sale. Each item exists because it changes either the payment or the loan's eligibility — and all of them are cheapest to learn early."
        ],
        bullets: [
          "Pull the FEMA zone and ask for an existing elevation certificate on coastal parcels.",
          "Collect mandatory club and association fees in writing; they count in qualifying.",
          "Check FHFA's published conforming loan limit to know whether the loan is jumbo.",
          "Keep residency declarations consistent across tax, license, and loan documents."
        ]
      }
    ],
    faqs: [
      {
        question: "What makes a Naples loan jumbo?",
        answer:
          "A loan amount above the conforming loan limit that FHFA publishes annually by county. Above that line, Fannie Mae and Freddie Mac cannot purchase the loan, so jumbo lenders apply their own guidelines — generally fuller documentation and reserve requirements. Check FHFA's published values for the applicable figure rather than relying on a remembered number."
      },
      {
        question: "Do club membership fees affect my mortgage qualification?",
        answer:
          "Recurring mandatory fees do — lenders count obligatory community charges in your qualifying payment alongside taxes, insurance, and HOA dues. Optional memberships generally do not. Naples club communities structure fees differently, sometimes with initiation components, so get the schedule in writing and confirm which parts are mandatory before offering."
      },
      {
        question: "How do I check flood requirements for a Naples address?",
        answer:
          "Look the parcel up on the FEMA Flood Map Service Center. Zones beginning with A or V are Special Flood Hazard Areas where federally backed loans require flood insurance; velocity zones near the beach add wave-action considerations and make elevation certificates especially valuable. FloodSmart explains the designations and coverage mechanics."
      },
      {
        question: "Should I ask for an elevation certificate on a coastal Naples purchase?",
        answer:
          "Yes, if one exists — it documents how the structure sits relative to expected flood levels, which is the variable that most moves flood insurance pricing in high-risk coastal zones. Sellers of elevated or newer construction often have one. If none exists, a surveyor can prepare one, so price that step into diligence."
      }
    ],
    sources: [
      {
        publisher: "FEMA",
        title: "Flood Map Service Center",
        url: "https://msc.fema.gov/portal/home"
      },
      {
        publisher: "Federal Housing Finance Agency",
        title: "Conforming Loan Limit (CLL) Values",
        url: "https://www.fhfa.gov/data/conforming-loan-limit-cll-values"
      },
      {
        publisher: "Florida Department of Revenue",
        title: "Property Tax Exemptions and Additional Benefits",
        url: "https://floridarevenue.com/property/Pages/Taxpayers_Exemptions.aspx"
      },
      {
        publisher: "U.S. Census Bureau",
        title: "QuickFacts: Naples city, Florida",
        url: "https://www.census.gov/quickfacts/naplescityflorida"
      }
    ],
    related: [
      { href: "/mortgage/jumbo", label: "Jumbo loans" },
      { href: "/mortgage/condo", label: "Condo financing" },
      { href: "/calculators/affordability", label: "Affordability calculator" },
      { href: "/resources/buying-home-sarasota", label: "Buying in Sarasota" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "florida-coastal-vs-inland",
    category: "local",
    title: "Coastal vs. Inland Florida: Insurance & Flood Rules",
    description:
      "How coastal exposure changes a Florida mortgage structurally: mandatory flood insurance in FEMA zones, wind underwriting, escrow effects, and inland realities.",
    h1: "Coastal versus inland Florida: how exposure changes the structure of your mortgage costs",
    answerSummary:
      "Coastal exposure changes a Florida mortgage through two structural channels: flood requirements and wind underwriting. In FEMA Special Flood Hazard Areas — concentrated near the coasts but present inland — federally backed loans require flood insurance, and the premium joins the escrowed payment you qualify against. Coastal parcels also face tighter wind insurance markets. Inland reduces these pressures but eliminates neither, since flood zones follow water, not distance from a beach.",
    sections: [
      {
        heading: "The mandatory purchase rule: where flood insurance stops being optional",
        paragraphs: [
          "The pivotal structural fact is federal: when a property lies in a FEMA-designated Special Flood Hazard Area and the mortgage is federally backed or made by a federally regulated lender, flood insurance is required — not recommended, required — for the life of the loan. The designation is parcel-specific and public: the FEMA Flood Map Service Center returns any address's zone.",
          "Zone letters carry the logic. Zones beginning with A mark high-risk areas; V zones add coastal wave action and are the most demanding to insure; zones B, C, and X mark moderate and lower mapped risk with no federal mandate. FloodSmart, the National Flood Insurance Program's consumer site, documents the designations. The coastal-inland pattern is real but leaky in both directions: barrier islands and bayfronts concentrate A and V zones, while inland rivers, lakes, and wetlands generate A zones far from any beach."
        ]
      },
      {
        heading: "How the requirement flows into the payment you qualify for",
        paragraphs: [
          "A required flood premium is not a side cost; it is escrowed with taxes and homeowners insurance and becomes part of the housing payment your debt-to-income ratio is measured against. Two identical borrowers buying identically priced homes — one in an X zone, one in an A zone — can qualify for different loan amounts purely because the flood premium consumes qualifying capacity.",
          "Elevation is the variable that moves coastal flood pricing most: how the structure sits relative to expected flood levels. An elevation certificate documents this, and on coastal purchases it is worth asking whether the seller has one. Inland buyers in low-risk zones face no mandate but should decide about coverage deliberately — standard homeowners policies exclude flood damage everywhere in Florida, and voluntary policies in lower-risk zones are how many owners close that gap."
        ]
      },
      {
        heading: "Wind: priced everywhere, tighter at the coast",
        paragraphs: [
          "Unlike flood, wind exposure is priced into homeowners insurance statewide — every Florida policy conversation involves hurricane deductibles, typically calculated as a percentage of dwelling coverage rather than a flat amount. What changes coastward is market structure: fewer private insurers may be willing to write a given coastal risk, underwriting of roof age and construction tightens, and more buyers encounter Citizens Property Insurance Corporation, the state-created insurer of last resort for owners who cannot find private coverage.",
          "Florida law requires insurers to credit premiums for verified wind mitigation features — roof attachment methods, opening protection, roof shape — documented through a wind mitigation inspection. The inspection matters inland too, but on the coast, where premiums are structurally higher, the credits are worth proportionally more. The Florida Department of Financial Services publishes consumer guidance on policy structure and shopping."
        ]
      },
      {
        heading: "The inland ledger: what you escape and what you keep",
        paragraphs: [
          "Moving inland structurally removes storm surge exposure and V-zone insurance mechanics, generally thins out mandatory flood territory, and usually widens the set of willing wind insurers. It does not remove: hurricane-force wind exposure, which crosses the entire peninsula; hurricane deductibles; flood zones along inland water; or the flood exclusion in homeowners policies during heavy-rain events.",
          "Property taxes are coastal-agnostic in structure — every Florida county reassesses at just value on sale, homestead exemptions and the Save Our Homes cap work identically statewide, per the Florida Department of Revenue. What differs is composition: coastal carrying costs weight toward insurance, inland costs weight toward taxes and, in newer master-planned areas, CDD assessments. Comparing a coastal and an inland home by price alone compares the wrong numbers; compare the full escrowed payment."
        ]
      },
      {
        heading: "A structural comparison checklist",
        paragraphs: [
          "TRACT arranges financing for both profiles through wholesale lenders — we broker rather than lend — and the comparison we help buyers run is structural, not predictive. No premium or tax figure here is stable enough to print; every one of them is quotable within days for a specific address, which is the only version worth relying on."
        ],
        bullets: [
          "Pull the FEMA zone for every candidate address: A or V means mandatory flood insurance on federally backed loans.",
          "Quote wind and flood together during inspection; the sum feeds the qualifying payment.",
          "Ask coastal sellers for elevation certificates and mitigation inspection reports.",
          "Inland, read the tax bill for CDD and other assessments that replace coastal insurance weight.",
          "Compare homes by full escrowed payment, never by price alone."
        ]
      }
    ],
    faqs: [
      {
        question: "Is flood insurance ever required inland in Florida?",
        answer:
          "Yes. The mandate follows FEMA Special Flood Hazard Areas, which exist along inland rivers, lakes, and wetlands as well as coasts. Any federally backed loan on a parcel in such a zone requires flood coverage regardless of distance from salt water. The FEMA Flood Map Service Center gives the parcel-level answer."
      },
      {
        question: "What is the difference between an A zone and a V zone?",
        answer:
          "Both are high-risk Special Flood Hazard Areas where the mandatory purchase requirement applies. V zones, found along coasts, add expected wave action, which brings tougher construction and insurance considerations than A zones. X, B, and C zones carry lower mapped risk and no federal mandate. FloodSmart documents the designations."
      },
      {
        question: "Do hurricane deductibles apply to inland Florida homes?",
        answer:
          "Yes. Percentage-based hurricane deductibles are a statewide feature of Florida homeowners policies, not a coastal one, because hurricane wind crosses the entire state. Coastal exposure changes the market around the policy — fewer willing insurers, tighter underwriting — more than the deductible structure itself."
      },
      {
        question: "Are property taxes structured differently on the coast?",
        answer:
          "No — reassessment at sale, homestead exemption, and the Save Our Homes cap work identically in every Florida county. What differs between coastal and inland ownership is cost composition: insurance typically weighs heavier on the coast, while inland master-planned communities often add CDD assessments. The comparison that matters is the full escrowed payment."
      }
    ],
    sources: [
      {
        publisher: "FEMA",
        title: "Flood Map Service Center",
        url: "https://msc.fema.gov/portal/home"
      },
      {
        publisher: "FloodSmart / National Flood Insurance Program",
        title: "Flood Map Zones Explained",
        url: "https://www.floodsmart.gov/flood-map-zone"
      },
      {
        publisher: "Citizens Property Insurance Corporation",
        title: "Florida's State-Created Property Insurer",
        url: "https://www.citizensfla.com/"
      },
      {
        publisher: "Florida Department of Financial Services",
        title: "Division of Consumer Services",
        url: "https://www.myfloridacfo.com/division/consumers/"
      },
      {
        publisher: "Florida Department of Revenue",
        title: "Property Tax Information for Taxpayers",
        url: "https://floridarevenue.com/property/Pages/Taxpayers.aspx"
      }
    ],
    related: [
      { href: "/calculators/mortgage-payment", label: "Mortgage payment calculator" },
      { href: "/resources/buying-home-cape-coral", label: "Buying in Cape Coral" },
      { href: "/resources/buying-home-orlando", label: "Buying in Orlando" },
      { href: "/locations/florida", label: "TRACT in Florida" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "relocating-to-florida-mortgage",
    category: "local",
    title: "Relocating to Florida: The Out-of-State Mortgage Guide",
    description:
      "The out-of-state buyer's Florida mortgage process: remote closings, why no income tax does not mean low carrying costs, insurance timing, and homestead rules.",
    h1: "Relocating to Florida: how the mortgage works when you are buying from another state",
    answerSummary:
      "Out-of-state buyers can complete a Florida purchase almost entirely remotely: applications and disclosures are electronic, Florida permits remote online notarization, and mail-away closings are routine. The traps are financial, not logistical — Florida has no state income tax, but property taxes reset at sale and wind and flood insurance are substantial, so carrying costs need address-level quotes. Start insurance early, and plan homestead filing around establishing residency.",
    sections: [
      {
        heading: "The remote process, step by step",
        paragraphs: [
          "Nothing in a Florida mortgage requires you to live in Florida while it happens. Application, income and asset documentation, disclosures, and signatures run electronically; the appraisal and inspections happen locally without you; and closing itself can be handled by mail-away packages with a notary in your current state or — since Florida law authorizes remote online notarization — by a fully online signing where the transaction's participants support it. The Consumer Financial Protection Bureau's home-buying resources walk through the standard process stages, all of which survive distance intact.",
          "What distance actually strains is diligence. You cannot walk the street on a whim, so the inspection period does more work: general inspection, wind mitigation inspection, four-point inspection on older homes, and — this being Florida — a flood zone check on the FEMA Flood Map Service Center for every candidate address before you offer."
        ]
      },
      {
        heading: "No income tax is not low carrying cost",
        paragraphs: [
          "Florida's lack of a state personal income tax is often the relocating household's headline math — and it is real — but it answers an income question, not a housing-cost question. The housing ledger has its own entries. Florida property is reassessed at just value when it sells, so the seller's tax bill, suppressed by years of Save Our Homes caps, tells you almost nothing about yours; estimate from your purchase price using the county property appraiser's tools, per the Florida Department of Revenue's guidance.",
          "Then add insurance. Florida homeowners policies carry percentage-based hurricane deductibles and underwriting sensitive to roof age and construction; coastal or flood-zone addresses add flood premiums that are mandatory on federally backed loans in Special Flood Hazard Areas. A budget imported from a state where insurance was an afterthought will misprice Florida by the size of these lines. Compare full escrowed payments, not list prices."
        ]
      },
      {
        heading: "Insurance timing: the part relocators most often get wrong",
        paragraphs: [
          "In many states, homeowners insurance is a phone call the week before closing. In Florida it is a shopping process: insurers differ in appetite by construction type, roof age, and location, quotes require inspection documentation to finalize, and the bound policy must be in place before the lender funds. Start at offer acceptance, not at the clear-to-close.",
          "Hurricane season adds a hard deadline mechanism: when a named storm approaches Florida, insurers commonly suspend new policy binding until it passes. A closing scheduled during a suspension can slip through no fault of anyone in the transaction. Buying earlier in the contract period is the hedge. The Florida Department of Financial Services publishes consumer guidance on shopping and policy structure, and Citizens Property Insurance Corporation exists as the state-created insurer for risks the private market declines."
        ]
      },
      {
        heading: "Residency, homestead, and getting the sequel right",
        paragraphs: [
          "Florida's homestead exemption reduces the taxable value of a primary residence and starts the Save Our Homes cap on assessment growth — but it belongs only to owners who make the home their permanent residence, and it is claimed by filing with the county property appraiser early in the calendar year, per the Florida Department of Revenue. A relocating buyer who closes late in the year wants the move, the driver license, and the filing sequenced deliberately; confirm the current deadline and evidence requirements with the county.",
          "Occupancy also matters on the loan itself. A primary-residence mortgage generally expects you to move in within a defined period after closing; if the honest plan is to relocate later and use the home seasonally first, that is a second-home loan with different terms. State the real plan at preapproval — it determines the program, and misstating occupancy is fraud, not optimization."
        ]
      },
      {
        heading: "Working the purchase from a distance",
        paragraphs: [
          "TRACT arranges Florida financing as a broker — wholesale lenders make, approve, and price the loans — and remote buyers are a routine part of our work rather than an exception. The sequence that keeps a long-distance file smooth: preapproval with occupancy and timeline stated plainly; address-level flood zone checks before each offer; a thorough local inspection slate; insurance shopping opened at contract; a closing method chosen early (mail-away or remote online notarization); and homestead filing calendared for after the move."
        ],
        bullets: [
          "Verify each address's flood zone on the FEMA Flood Map Service Center before offering.",
          "Open insurance shopping at offer acceptance; named-storm binding suspensions punish late starts.",
          "Budget from post-sale reassessed taxes plus quoted insurance, never from the listing's figures.",
          "Choose the closing method — mail-away or remote online notarization — with your closing agent early.",
          "File for homestead with the county property appraiser once the home is your permanent residence."
        ]
      }
    ],
    faqs: [
      {
        question: "Can I close on a Florida home without traveling there?",
        answer:
          "Usually, yes. Mail-away closings with a notary in your current state are routine, and Florida law authorizes remote online notarization, enabling fully electronic signings where the lender, title agent, and document set support it. Coordinate the method with your closing agent early so the right documents are prepared."
      },
      {
        question: "Why did my Florida payment estimate come in higher than the listing suggested?",
        answer:
          "Two structural reasons: property taxes are reassessed at just value when you buy, erasing the seller's capped assessment, and Florida insurance — wind, plus flood where the FEMA zone requires it — is a larger escrow line than most states'. The listing reflects the seller's history; your payment reflects the reset."
      },
      {
        question: "When should I start shopping for insurance on a Florida purchase?",
        answer:
          "At offer acceptance. Florida quotes often need inspection documentation, insurer appetite varies by roof age and construction, and a bound policy must exist before funding. During hurricane season, insurers commonly suspend new binding while a named storm approaches, so early shopping is also schedule protection for your closing date."
      },
      {
        question: "Do I get Florida's homestead exemption as soon as I buy?",
        answer:
          "No — it requires the home to be your permanent residence and a filing with the county property appraiser, made early in the calendar year per Florida Department of Revenue guidance. Relocators who close late in a year should sequence the move, residency evidence, and filing deliberately, confirming deadlines with the county."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "Buying a House: Tools and Resources",
        url: "https://www.consumerfinance.gov/owning-a-home/"
      },
      {
        publisher: "Florida Department of Revenue",
        title: "Property Tax Exemptions and Additional Benefits",
        url: "https://floridarevenue.com/property/Pages/Taxpayers_Exemptions.aspx"
      },
      {
        publisher: "FEMA",
        title: "Flood Map Service Center",
        url: "https://msc.fema.gov/portal/home"
      },
      {
        publisher: "Florida Department of Financial Services",
        title: "Division of Consumer Services",
        url: "https://www.myfloridacfo.com/division/consumers/"
      }
    ],
    related: [
      { href: "/plan", label: "Build your buying plan" },
      { href: "/calculators/rent-vs-buy", label: "Rent vs. buy calculator" },
      { href: "/resources/florida-coastal-vs-inland", label: "Coastal vs. inland Florida costs" },
      { href: "/mortgage/purchase", label: "Purchase loans" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  }
];
