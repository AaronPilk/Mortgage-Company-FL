/**
 * Mortgage and Florida home-buying glossary.
 *
 * Typed data, not markdown, so the hub and term pages can guarantee structure
 * and the unit test can assert it: unique slugs and terms, bounded lengths, and
 * — the load-bearing one — every internal "related" link resolving to a route
 * that is actually registered.
 *
 * Two editorial rules bind every entry, both flowing from invariant 6 (nothing
 * claims an unestablished fact):
 *
 *  - No mutable figure is stated as a current fact. A rate, a premium, a tax
 *    percentage, or a program limit changes, so a term that touches one points
 *    at the primary source (the county Property Appraiser for Florida tax
 *    numbers) instead of quoting it. The millage-rate entry is the clearest
 *    case: it defines the concept and defers the number.
 *  - Broker-accurate voice. TRACT arranges loans; it does not make them, approve
 *    them, insure them, or set their prices. Definitions describe how a thing
 *    generally works, never what a reader qualifies for.
 */

export const GLOSSARY_AS_OF = "August 2026";

export type GlossaryCategory =
  "basics" | "costs" | "insurance-florida" | "taxes-florida" | "process" | "credit" | "programs";

export const GLOSSARY_CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  basics: "Mortgage basics",
  costs: "Costs & fees",
  "insurance-florida": "Florida insurance",
  "taxes-florida": "Florida property taxes",
  process: "The loan process",
  credit: "Credit & qualifying",
  programs: "Loan programs"
};

/** The order categories are presented in on the hub. */
export const GLOSSARY_CATEGORY_ORDER: GlossaryCategory[] = [
  "basics",
  "costs",
  "insurance-florida",
  "taxes-florida",
  "process",
  "credit",
  "programs"
];

export type GlossaryTerm = {
  /** URL segment under /mortgage-glossary/. Kebab-case, stable once published. */
  slug: string;
  /** The term itself. 48 characters or fewer, so "What is <term>?" stays ≤ 60. */
  term: string;
  /** Other names a reader might search for, surfaced for context and search. */
  aliases?: string[];
  category: GlossaryCategory;
  /** One-line definition. 165 characters or fewer; also the meta description. */
  short: string;
  /** The full definition, one string per paragraph, rendered in <Prose>. */
  body: string[];
  /** Internal links. Every href must resolve to an already-registered route. */
  related: { href: string; label: string }[];
};

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // ---------------------------------------------------------------- basics
  {
    slug: "principal",
    term: "Principal",
    category: "basics",
    short:
      "Principal is the amount you borrow — the loan balance itself, before interest. Each mortgage payment splits between paying principal down and paying interest.",
    body: [
      "Principal is the money you actually borrow to buy a home: the loan amount, separate from the interest a lender charges for lending it. On the day your loan funds, the principal is the full balance you owe.",
      "On a standard fixed-rate loan, every monthly payment is divided between interest (the cost of borrowing) and principal (paying the balance down). Early on, most of the payment is interest and only a little reduces principal; over the years that ratio steadily flips. That schedule is called amortization.",
      "Paying extra toward principal shrinks the balance faster and lowers the total interest paid over the life of the loan. Principal is only one part of a monthly housing payment — property taxes and insurance usually ride along too, which is what PITI describes."
    ],
    related: [
      { href: "/resources/amortization-explained", label: "How amortization works" },
      { href: "/resources/what-is-piti", label: "What PITI includes" },
      { href: "/calculators/amortization", label: "Amortization calculator" }
    ]
  },
  {
    slug: "apr",
    term: "APR (annual percentage rate)",
    aliases: ["Annual percentage rate"],
    category: "basics",
    short:
      "APR expresses a loan's yearly cost including certain fees, not just the interest rate. It's built to compare offers — but only fairly between similar loan types.",
    body: [
      "The interest rate is the cost of borrowing the principal. The APR, or annual percentage rate, folds the rate together with certain required loan costs — points and some lender fees — into a single yearly figure. Because it captures more than the rate alone, the APR is usually higher than the note rate.",
      "APR exists so borrowers can compare offers on a more even footing than headline rate allows. It works best comparing two loans of the same type and term; across very different structures it can mislead, because the fees each one bundles in differ.",
      "APR is disclosed on your Loan Estimate and Closing Disclosure. It is a comparison tool, not a rate quote or a promise — the rate and fees you're actually offered depend on your full profile and the lender."
    ],
    related: [
      { href: "/resources/apr-vs-interest-rate", label: "APR vs. interest rate" },
      { href: "/resources/discount-points-explained", label: "Discount points" },
      { href: "/resources/loan-estimate-explained", label: "Reading a Loan Estimate" }
    ]
  },
  {
    slug: "amortization",
    term: "Amortization",
    category: "basics",
    short:
      "Amortization is the schedule that pays a loan off over time in level payments. Early payments are mostly interest; later ones are mostly principal.",
    body: [
      "Amortization is the process of paying a loan off through regular, level payments over a set term. Each payment covers the interest due for that period first, and whatever is left reduces the principal balance.",
      "Because interest is charged on the remaining balance, the early years of a long mortgage are interest-heavy and build equity slowly; as the balance falls, more of each identical payment goes to principal. An amortization schedule lays this out payment by payment.",
      "Understanding the curve is what makes extra principal payments and refinance timing make sense: paying down principal early removes interest that would otherwise compound across the full remaining term."
    ],
    related: [
      { href: "/resources/amortization-explained", label: "Amortization, explained" },
      { href: "/calculators/amortization", label: "Amortization calculator" },
      { href: "/calculators/mortgage-payment", label: "Payment calculator" }
    ]
  },
  {
    slug: "piti",
    term: "PITI",
    aliases: ["Principal, interest, taxes, insurance"],
    category: "basics",
    short:
      "PITI is principal, interest, taxes, and insurance — the four parts of a monthly mortgage payment. In Florida the taxes-and-insurance share can be large.",
    body: [
      "PITI is shorthand for the four pieces of a normal monthly mortgage payment: Principal and Interest (the loan itself) plus Taxes and Insurance (property taxes and homeowners insurance, usually collected into an escrow account).",
      "Quoting only principal and interest understates the real cost of owning, and in Florida the gap can be wide: property insurance and, on the coast, flood insurance can rival or exceed the loan portion of the payment. A realistic budget uses all four.",
      "Lenders qualify borrowers against the full PITI, not just principal and interest, which is why an insurance quote and a tax estimate matter before you make an offer."
    ],
    related: [
      { href: "/resources/what-is-piti", label: "What PITI includes" },
      { href: "/resources/escrow-accounts-florida", label: "Escrow accounts in Florida" },
      { href: "/calculators/mortgage-payment", label: "Estimate a payment" }
    ]
  },
  {
    slug: "loan-to-value",
    term: "Loan-to-value (LTV)",
    aliases: ["LTV"],
    category: "basics",
    short:
      "LTV is your loan amount as a share of the home's value. A lower LTV — a bigger down payment — means less risk to the lender and often no mortgage insurance.",
    body: [
      "Loan-to-value compares the size of your loan to the appraised value or purchase price of the home, whichever the program uses. A larger down payment produces a lower LTV, and a lower LTV is less risk from the lender's point of view.",
      "LTV drives several things at once: whether mortgage insurance is required, which programs you can use, and often the pricing you're offered. On a conventional loan, reaching a low enough LTV is what eventually lets private mortgage insurance come off.",
      "LTV changes over time as you pay principal down and as the home's value moves, which is why it matters for refinancing and for removing mortgage insurance later."
    ],
    related: [
      { href: "/resources/ltv-explained", label: "LTV, explained" },
      { href: "/resources/down-payment-how-much", label: "How much down payment" },
      { href: "/resources/pmi-vs-mip", label: "PMI vs. MIP" }
    ]
  },
  {
    slug: "fixed-rate-mortgage",
    term: "Fixed-rate mortgage",
    category: "basics",
    short:
      "A fixed-rate mortgage keeps the same interest rate — and the same principal-and-interest payment — for the entire term, so it never changes with the market.",
    body: [
      "In a fixed-rate mortgage, the interest rate is set at closing and does not change for the life of the loan. The principal-and-interest portion of your payment is the same in the last year as in the first.",
      "The trade-off is predictability versus a potentially lower starting rate. A fixed rate protects you if market rates rise, but you don't automatically benefit if they fall — capturing a lower rate later means refinancing.",
      "Taxes and insurance can still move a fixed-rate borrower's total payment year to year, because those are collected through escrow and are outside the loan's fixed rate."
    ],
    related: [
      { href: "/resources/fixed-vs-arm", label: "Fixed vs. ARM" },
      { href: "/mortgage/conventional", label: "Conventional loans" },
      { href: "/calculators/mortgage-payment", label: "Payment calculator" }
    ]
  },
  {
    slug: "adjustable-rate-mortgage",
    term: "Adjustable-rate mortgage (ARM)",
    aliases: ["ARM"],
    category: "basics",
    short:
      "An ARM starts with a fixed rate for a set number of years, then adjusts periodically against an index. The early rate can be lower, but later payments can rise.",
    body: [
      "An adjustable-rate mortgage carries a fixed rate for an initial period — a handful of years — and then adjusts on a schedule, moving up or down with a published index plus a set margin, within caps that limit each change.",
      "The appeal is a lower starting rate than a comparable fixed loan. The risk is that once the fixed period ends, the rate and payment can climb, so an ARM suits a borrower whose plans or expectations fit the fixed window.",
      "Reading an ARM means reading its caps and its index: how much the rate can move at the first adjustment, at each one after, and over the life of the loan."
    ],
    related: [
      { href: "/resources/fixed-vs-arm", label: "Fixed vs. ARM" },
      { href: "/resources/rate-lock-explained", label: "How rate locks work" },
      { href: "/calculators/mortgage-payment", label: "Payment calculator" }
    ]
  },
  {
    slug: "escrow-account",
    term: "Escrow account (impound)",
    aliases: ["Impound account"],
    category: "basics",
    short:
      "An escrow account collects part of each monthly payment to pay your property taxes and insurance when they come due, spreading big annual bills out.",
    body: [
      "Many mortgages include an escrow (or impound) account. Each month you pay a slice of the year's property taxes and insurance premiums along with your principal and interest, and the servicer holds that money and pays those bills when they're due.",
      "Escrow smooths large, irregular bills into a level monthly amount and assures the lender that taxes and insurance — which protect the collateral — actually get paid. Once a year the servicer reviews the account and adjusts the monthly amount if taxes or premiums changed.",
      "In Florida, where insurance premiums can move sharply, an escrow adjustment is the usual reason a fixed-rate borrower's total payment changes from one year to the next."
    ],
    related: [
      { href: "/resources/escrow-accounts-florida", label: "Escrow accounts in Florida" },
      { href: "/resources/what-is-piti", label: "What PITI includes" },
      {
        href: "/resources/florida-homeowners-insurance-mortgage",
        label: "Florida homeowners insurance"
      }
    ]
  },

  // ---------------------------------------------------------------- costs
  {
    slug: "down-payment",
    term: "Down payment",
    category: "costs",
    short:
      "The down payment is the cash you put toward the purchase price up front. The rest is your loan. How much you need depends on the loan program, not one fixed rule.",
    body: [
      "The down payment is the portion of the purchase price you pay yourself at closing; the mortgage covers the rest. It sets your starting loan-to-value and, with it, your equity on day one.",
      "There is no single required amount — it depends on the loan program and your profile. Some government-backed programs allow very low or no down payment for eligible buyers, while other loans expect more. A larger down payment lowers the loan balance and can remove the need for mortgage insurance.",
      "Down payment funds can sometimes come from gifts or assistance programs, each with its own documentation rules. In Florida, statewide and county programs exist specifically to help with this hurdle."
    ],
    related: [
      { href: "/resources/down-payment-how-much", label: "How much to put down" },
      { href: "/florida-down-payment-assistance", label: "Florida down payment assistance" },
      { href: "/resources/gift-funds-rules", label: "Gift funds rules" }
    ]
  },
  {
    slug: "closing-costs",
    term: "Closing costs",
    category: "costs",
    short:
      "Closing costs are the one-time fees to set up a loan and transfer a home — lender fees, title, appraisal, recording, and prepaids — all paid at closing.",
    body: [
      "Closing costs are the collection of one-time charges that finalize a purchase and a loan: lender fees such as origination, third-party costs such as the appraisal and title work, government recording and transfer charges, and prepaid items that fund your escrow account.",
      "They are separate from the down payment and are itemized on your Loan Estimate up front and your Closing Disclosure at the end. Comparing the two documents line by line is how you catch a cost that drifted.",
      "Who pays which cost is partly negotiable in the purchase contract, and some costs vary by county in Florida, so an estimate for your specific transaction is worth more than a rule of thumb."
    ],
    related: [
      { href: "/calculators/closing-cost", label: "Closing cost calculator" },
      { href: "/resources/loan-estimate-explained", label: "Reading a Loan Estimate" },
      { href: "/resources/title-insurance-florida", label: "Title insurance in Florida" }
    ]
  },
  {
    slug: "discount-points",
    term: "Discount points",
    aliases: ["Mortgage points", "Points"],
    category: "costs",
    short:
      "Discount points are an optional upfront fee that lowers your interest rate. Whether paying them pays off depends mostly on how long you keep the loan.",
    body: [
      "Discount points let you pay money at closing in exchange for a lower interest rate — buying down the rate. One point equals one percent of the loan amount, and each point lowers the rate by an amount the lender sets.",
      "Points are a break-even calculation, not a discount in the everyday sense. You pay more now for a smaller payment later, so the question is how long you keep the loan: stay past the break-even point and the buydown pays off; sell or refinance before it and it usually doesn't.",
      "Points are optional and are disclosed on your Loan Estimate, where they roll into the APR. Whether they make sense is specific to your rate, your cost, and your timeline."
    ],
    related: [
      { href: "/resources/discount-points-explained", label: "Discount points, explained" },
      { href: "/resources/apr-vs-interest-rate", label: "APR vs. interest rate" },
      { href: "/calculators/refinance-break-even", label: "Break-even calculator" }
    ]
  },
  {
    slug: "pmi",
    term: "Private mortgage insurance (PMI)",
    aliases: ["PMI"],
    category: "costs",
    short:
      "PMI protects the lender when a conventional loan's down payment is small. You pay it, it can usually be removed later, and it isn't the same as FHA MIP.",
    body: [
      "Private mortgage insurance is required on most conventional loans when the down payment is below a threshold set by the loan's guidelines. It protects the lender against loss, not the borrower, but the borrower pays the premium.",
      "PMI is temporary in a way FHA's mortgage insurance often isn't: as you pay the balance down and equity builds, you can generally request cancellation at one equity level and it must be removed automatically at another. That difference is a key reason to compare conventional and FHA.",
      "The cost of PMI depends on your down payment, credit, and the loan, and it is quoted to you as part of the offer rather than being a fixed figure."
    ],
    related: [
      { href: "/resources/pmi-vs-mip", label: "PMI vs. MIP" },
      { href: "/resources/remove-pmi", label: "How to remove PMI" },
      { href: "/resources/ltv-explained", label: "LTV, explained" }
    ]
  },
  {
    slug: "origination-fee",
    term: "Origination fee",
    category: "costs",
    short:
      "An origination fee is what a lender charges to process and underwrite your loan. It appears on your Loan Estimate and is part of comparing one offer against another.",
    body: [
      "An origination fee is the lender's charge for creating the loan — taking the application, underwriting, and funding it. It appears in the lender-fee section of your Loan Estimate.",
      "Origination charges vary between lenders and can sometimes be traded against the interest rate: a lower fee with a slightly higher rate, or the reverse. Comparing the whole picture — fee plus rate — matters more than either number alone.",
      "Because a mortgage broker arranges loans across lenders rather than lending directly, understanding how a given offer is priced is part of what the comparison is for."
    ],
    related: [
      { href: "/resources/loan-estimate-explained", label: "Reading a Loan Estimate" },
      { href: "/resources/how-mortgage-brokers-work", label: "How mortgage brokers work" },
      { href: "/calculators/closing-cost", label: "Closing cost calculator" }
    ]
  },
  {
    slug: "prepaids",
    term: "Prepaid items",
    aliases: ["Prepaids"],
    category: "costs",
    short:
      "Prepaids are amounts collected at closing to fund your escrow account and cover the first interest, taxes, and insurance before regular payments begin.",
    body: [
      "Prepaid items are costs collected at closing that aren't fees for a service but money set aside for expenses you'd owe anyway: the first year of homeowners insurance, a cushion of property taxes to seed the escrow account, and interest for the days between closing and your first payment.",
      "Because they fund your own future bills, prepaids aren't really a charge in the way an origination fee is — but they're real cash you need at the table, so they belong in your cash-to-close estimate.",
      "The exact amounts depend on your closing date and your insurance and tax figures, which is why they can shift between the Loan Estimate and the final Closing Disclosure."
    ],
    related: [
      { href: "/resources/escrow-accounts-florida", label: "Escrow accounts in Florida" },
      { href: "/resources/closing-disclosure-explained", label: "The Closing Disclosure" },
      { href: "/calculators/closing-cost", label: "Closing cost calculator" }
    ]
  },
  {
    slug: "earnest-money",
    term: "Earnest money",
    category: "costs",
    short:
      "Earnest money is a good-faith deposit made when your offer is accepted, held in escrow and applied to your costs at closing. It shows a seller you're serious.",
    body: [
      "Earnest money is a deposit a buyer puts down when a purchase contract is signed, showing the seller a genuine commitment. It's held by a neutral third party — often a title company or broker's escrow account — not paid to the seller directly.",
      "At closing, earnest money is credited toward your down payment and closing costs, so it isn't an extra cost, just an earlier one. If the deal falls through, whether you get it back depends on the contract's contingencies.",
      "In Florida the amount and the contingencies are set in the contract, so understanding those terms before you sign is what protects the deposit."
    ],
    related: [
      { href: "/resources/earnest-money-florida", label: "Earnest money in Florida" },
      { href: "/resources/closing-timeline-florida", label: "The closing timeline" },
      { href: "/mortgage/purchase", label: "Buying a home" }
    ]
  },

  // -------------------------------------------------------- insurance-florida
  {
    slug: "flood-insurance",
    term: "Flood insurance",
    category: "insurance-florida",
    short:
      "Flood insurance is a separate policy from homeowners insurance. Whether a lender requires it depends on the property's flood zone on FEMA's current map.",
    body: [
      "Standard homeowners insurance does not cover flood damage; that requires a separate flood policy, written through the federal National Flood Insurance Program or a private insurer. In Florida this distinction is central rather than academic.",
      "Whether a lender requires flood insurance comes down to a flood-zone determination against FEMA's current map for the specific parcel — not the county or neighborhood in general. Two homes a block apart can land on different sides of a flood-zone line and carry very different costs.",
      "Because the premium can be a large part of the monthly payment near the coast, getting a determination and an actual quote on the exact property early — before you're under contract — is one of the most important Florida-specific steps."
    ],
    related: [
      { href: "/resources/flood-zones-flood-insurance", label: "Flood zones & flood insurance" },
      {
        href: "/resources/florida-homeowners-insurance-mortgage",
        label: "Florida homeowners insurance"
      },
      { href: "/florida-mortgage/pinellas-county", label: "Buying in Pinellas County" }
    ]
  },
  {
    slug: "wind-mitigation",
    term: "Wind mitigation inspection",
    category: "insurance-florida",
    short:
      "A wind mitigation inspection documents roof and construction features that resist hurricane wind. In Florida it can qualify a home for insurance premium credits.",
    body: [
      "A wind mitigation inspection records the features of a home that help it stand up to hurricane-force wind — roof shape, roof-to-wall connections, roof covering, and opening protection among them.",
      "Florida insurers use the report to apply premium credits: a home with stronger wind-resistant features generally costs less to insure than one without. On an older home, ordering the inspection can meaningfully change the insurance quote.",
      "It's distinct from the four-point inspection insurers may also require. Together they shape whether — and at what price — a Florida home can be covered."
    ],
    related: [
      { href: "/resources/wind-mitigation-inspection", label: "Wind mitigation inspection" },
      { href: "/resources/roof-age-insurance-mortgage", label: "Roof age & insurance" },
      {
        href: "/resources/florida-homeowners-insurance-mortgage",
        label: "Florida homeowners insurance"
      }
    ]
  },
  {
    slug: "four-point-inspection",
    term: "Four-point inspection",
    category: "insurance-florida",
    short:
      "A four-point inspection reports on a home's roof, electrical, plumbing, and HVAC. Florida insurers often require one on older homes before they'll write a policy.",
    body: [
      "A four-point inspection is a focused look at four systems — roof, electrical, plumbing, and heating/cooling — to gauge their age and condition. It's narrower than a full home inspection and serves the insurer rather than the buyer.",
      "Florida carriers commonly require a four-point on homes past a certain age before they'll issue or renew a policy, because those four systems drive the biggest claims. A poor result can limit coverage options or require repairs first.",
      "Because insurability affects whether a loan can close, the four-point matters to financing, not just to insurance — an uninsurable home is generally unmortgageable."
    ],
    related: [
      { href: "/resources/four-point-inspection", label: "The four-point inspection" },
      { href: "/resources/roof-age-insurance-mortgage", label: "Roof age & insurance" },
      { href: "/resources/citizens-property-insurance", label: "Citizens Property Insurance" }
    ]
  },
  {
    slug: "citizens-insurance",
    term: "Citizens Property Insurance",
    category: "insurance-florida",
    short:
      "Citizens is Florida's state-created insurer of last resort for homeowners who can't find private coverage. Its eligibility and rules are set by the state.",
    body: [
      "Citizens Property Insurance Corporation is a state-created, not-for-profit insurer that exists to cover Florida homeowners who can't obtain coverage from private carriers, or can't obtain it at comparable cost.",
      "Eligibility rules, coverage limits, and the requirement to move to a private policy when a comparable one becomes available are all set by state law and change over time, so the current terms come from Citizens and the state, not a rule of thumb.",
      "For buyers in higher-risk areas, whether a home is Citizens-eligible can be part of the insurability picture that determines what it costs to own — and whether a loan can close."
    ],
    related: [
      { href: "/resources/citizens-property-insurance", label: "Citizens Property Insurance" },
      {
        href: "/resources/florida-homeowners-insurance-mortgage",
        label: "Florida homeowners insurance"
      },
      { href: "/resources/wind-mitigation-inspection", label: "Wind mitigation credits" }
    ]
  },
  {
    slug: "ho-6-policy",
    term: "HO-6 condo policy",
    aliases: ["HO-6", "Condo unit policy"],
    category: "insurance-florida",
    short:
      "An HO-6 is a condo unit owner's insurance policy, covering what's inside your walls. It sits alongside the association's master policy, and lenders often require it.",
    body: [
      "An HO-6 policy insures a condominium unit owner's interior — typically the walls in, fixtures, and personal property — plus liability. It complements the condo association's master policy, which covers the building and common areas.",
      "Lenders financing a condo commonly require an HO-6 so the gap between the master policy and the unit owner's responsibility is covered. What the master policy includes varies by association, which is what determines how much HO-6 coverage you need.",
      "In Florida, master policies and their deductibles are a live issue, so reviewing the association's coverage is part of doing condo diligence before you buy."
    ],
    related: [
      { href: "/resources/condo-master-insurance-h06", label: "Condo master insurance & HO-6" },
      { href: "/mortgage/condo", label: "Condo financing" },
      { href: "/resources/condo-financing-florida", label: "Financing a Florida condo" }
    ]
  },

  // --------------------------------------------------------- taxes-florida
  {
    slug: "homestead-exemption",
    term: "Homestead exemption",
    category: "taxes-florida",
    short:
      "Florida's homestead exemption reduces the taxable value of a primary residence and unlocks the Save Our Homes assessment cap. The exact amounts are set by state law.",
    body: [
      "Florida's homestead exemption lowers the assessed value used to calculate property tax on an owner's primary residence, and it's the gateway to the Save Our Homes cap that limits future assessment increases.",
      "It applies only to a permanent primary residence, not a second home or an investment property, and it's claimed with the county Property Appraiser. The exemption amounts and the rules are set by state law and can change, so the current figures come from the state and the appraiser rather than from a page like this.",
      "For a buyer, the most important practical point is that a seller's tax bill — often reflecting years of homestead protection — is usually a poor guide to what the same home will cost you after the assessment resets."
    ],
    related: [
      { href: "/resources/homestead-exemption-florida", label: "The homestead exemption" },
      { href: "/resources/florida-property-taxes-reset", label: "How taxes reset after a sale" },
      { href: "/florida-mortgage/hillsborough-county", label: "Buying in Hillsborough County" }
    ]
  },
  {
    slug: "save-our-homes",
    term: "Save Our Homes cap",
    aliases: ["SOH"],
    category: "taxes-florida",
    short:
      "Save Our Homes is a Florida constitutional cap on how much a homesteaded property's assessed value can rise each year, holding long-term owners' taxes down.",
    body: [
      "Save Our Homes is a Florida constitutional provision that caps the annual increase in the assessed value of a homesteaded property, regardless of how fast its market value climbs. Over years, this can open a wide gap between a home's market value and its capped assessed value.",
      "That gap is why a long-time owner's tax bill can be far below what a new buyer will pay: when the home sells, the assessment generally resets toward market value and the accumulated cap benefit is lost.",
      "The specific cap percentage and mechanics are set in the state constitution and statutes; the county Property Appraiser applies them to a given parcel and is the source for the current figures."
    ],
    related: [
      { href: "/resources/homestead-exemption-florida", label: "The homestead exemption" },
      { href: "/resources/florida-property-taxes-reset", label: "How taxes reset after a sale" },
      { href: "/florida-mortgage/orange-county", label: "Buying in Orange County" }
    ]
  },
  {
    slug: "millage-rate",
    term: "Millage rate",
    aliases: ["Mill rate", "Millage"],
    category: "taxes-florida",
    short:
      "A millage rate is the property-tax rate per $1,000 of taxable value. Rates are set yearly by local authorities — confirm the current figure with the Appraiser.",
    body: [
      "Property tax is calculated by applying a millage rate to a property's taxable value. A mill is one dollar of tax for every $1,000 of taxable value, and a parcel's total rate is the sum of the millages levied by the county, the school board, the city, and any special districts that cover it.",
      "Because each of those bodies sets its rate during an annual budget cycle, the millage that applies to a given home changes over time and varies from place to place. For that reason this glossary does not quote a rate: the authoritative, current number for a specific property comes from the county Property Appraiser.",
      "When you estimate a Florida payment, pair the rate question with the assessment question. The seller's current bill is often a poor guide to yours, because the assessed value resets toward market value after a sale — so budget from the reset and confirm both the rate and any exemptions with the appraiser for the county."
    ],
    related: [
      { href: "/resources/florida-property-taxes-reset", label: "How taxes reset after a sale" },
      { href: "/resources/homestead-exemption-florida", label: "The homestead exemption" },
      { href: "/florida-mortgage/miami-dade-county", label: "Buying in Miami-Dade County" }
    ]
  },
  {
    slug: "portability",
    term: "Homestead portability",
    aliases: ["Portability"],
    category: "taxes-florida",
    short:
      "Portability lets a Florida homeowner move accumulated Save Our Homes savings from an old homestead to a new one, lowering the new home's taxable value.",
    body: [
      "Portability is the Florida rule that lets a homeowner transfer some or all of the Save Our Homes assessment benefit built up on a previous homestead to a new homestead, softening the tax jump that a move would otherwise bring.",
      "It applies when you give up one Florida homestead and establish another within the timeframe the state sets, and the transferable amount is capped by law. Whether and how much applies to your situation is determined by the county Property Appraiser.",
      "For a buyer moving within Florida, portability can materially change the tax estimate on the new home, so it's worth raising with the appraiser rather than assuming the new assessment starts from scratch."
    ],
    related: [
      { href: "/resources/homestead-exemption-florida", label: "The homestead exemption" },
      { href: "/resources/florida-property-taxes-reset", label: "How taxes reset after a sale" },
      { href: "/florida-mortgage/pinellas-county", label: "Buying in Pinellas County" }
    ]
  },
  {
    slug: "cdd-fee",
    term: "CDD fee",
    aliases: ["Community Development District"],
    category: "taxes-florida",
    short:
      "A Community Development District fee funds infrastructure in many newer Florida communities. It's billed with your property taxes and is separate from any HOA dues.",
    body: [
      "A Community Development District, or CDD, is a special-purpose local government that finances the roads, water, and amenities in many newer Florida developments. Homeowners in the district repay that cost through a CDD assessment.",
      "The assessment usually appears on the annual property-tax bill and is separate from homeowners-association dues, which cover ongoing services. A community can have both, and together they add to the true monthly cost of owning there.",
      "Because a CDD assessment can run for years and varies by community, it belongs in your budget from the start — and it's collected through the tax bill, so it flows through escrow like the rest of your taxes."
    ],
    related: [
      { href: "/resources/cdd-fees-explained", label: "CDD fees, explained" },
      { href: "/resources/escrow-accounts-florida", label: "Escrow accounts in Florida" },
      { href: "/resources/what-is-piti", label: "What PITI includes" }
    ]
  },

  // ---------------------------------------------------------------- process
  {
    slug: "preapproval",
    term: "Preapproval",
    category: "process",
    short:
      "A preapproval is a lender's conditional review of your finances estimating what you may borrow. It's stronger than a prequalification but isn't final approval.",
    body: [
      "A preapproval is a lender's assessment, based on documented income, assets, and a credit check, of how much you may be able to borrow and on what general terms. It carries more weight with sellers than a quick prequalification because it rests on verified information.",
      "It is still conditional. A preapproval isn't a commitment to lend or a guarantee of a specific rate; the loan must still clear full underwriting, the property must appraise and be insurable, and the conditions must be met.",
      "For a buyer, a preapproval mainly does two things: it sharpens your price range and it makes an offer credible. Both are reasons to get one before shopping seriously."
    ],
    related: [
      {
        href: "/resources/preapproval-vs-prequalification",
        label: "Preapproval vs. prequalification"
      },
      { href: "/mortgage/first-time-home-buyers", label: "First-time buyer guide" },
      { href: "/resources/mortgage-credit-inquiries", label: "Credit inquiries" }
    ]
  },
  {
    slug: "loan-estimate",
    term: "Loan Estimate",
    aliases: ["LE"],
    category: "process",
    short:
      "The Loan Estimate is a standardized three-page form a lender must send after you apply. It lays out the rate, payment, and closing costs so you can compare offers.",
    body: [
      "The Loan Estimate is a federally standardized disclosure a lender must provide within three business days of your application. Its fixed format — the same layout at every lender — is what makes offers genuinely comparable.",
      "It shows the loan amount, interest rate, projected monthly payment, and an itemized estimate of closing costs and cash to close, along with whether key terms can change. Reading two side by side is the cleanest way to compare lenders.",
      "Later, the Closing Disclosure restates these numbers in final form; comparing the two catches anything that moved between application and closing."
    ],
    related: [
      { href: "/resources/loan-estimate-explained", label: "Reading a Loan Estimate" },
      { href: "/resources/closing-disclosure-explained", label: "The Closing Disclosure" },
      { href: "/calculators/closing-cost", label: "Closing cost calculator" }
    ]
  },
  {
    slug: "closing-disclosure",
    term: "Closing Disclosure",
    aliases: ["CD"],
    category: "process",
    short:
      "The Closing Disclosure is the final statement of your loan's terms and costs, provided at least three business days before closing so you can review it.",
    body: [
      "The Closing Disclosure is the five-page form that states your loan's final terms — rate, monthly payment, and every closing cost — in the same structure as the Loan Estimate you received earlier.",
      "Federal rules require you to have it at least three business days before closing. That window exists so you can compare it against your Loan Estimate and question anything that changed before you sign.",
      "Certain changes can reset that three-day clock, so reviewing the document promptly keeps your closing on schedule."
    ],
    related: [
      { href: "/resources/closing-disclosure-explained", label: "The Closing Disclosure" },
      { href: "/resources/loan-estimate-explained", label: "Reading a Loan Estimate" },
      { href: "/resources/closing-timeline-florida", label: "The closing timeline" }
    ]
  },
  {
    slug: "underwriting",
    term: "Underwriting",
    category: "process",
    short:
      "Underwriting is the lender's detailed review of your income, assets, credit, and the property, deciding whether — and on what conditions — the loan can be approved.",
    body: [
      "Underwriting is where a loan is actually decided. An underwriter verifies the income, assets, and credit behind your application and confirms the property supports the loan through the appraisal and, in Florida, its insurability.",
      "Approvals usually come with conditions — documents or explanations the underwriter needs before final sign-off. Clearing conditions promptly is the main thing that keeps a file moving toward closing.",
      "Because underwriting weighs the whole picture, a single number like a credit score doesn't decide it; income stability, reserves, the property, and the program all factor in."
    ],
    related: [
      { href: "/resources/underwriting-conditions", label: "Underwriting conditions" },
      { href: "/resources/home-appraisal-explained", label: "The home appraisal" },
      { href: "/mortgage/first-time-home-buyers", label: "First-time buyer guide" }
    ]
  },
  {
    slug: "appraisal",
    term: "Home appraisal",
    aliases: ["Appraisal"],
    category: "process",
    short:
      "An appraisal is an independent estimate of a home's market value, ordered by the lender to confirm the home is worth roughly what you're paying.",
    body: [
      "A home appraisal is an independent professional's opinion of a property's market value, based on its condition and comparable recent sales. The lender orders it to make sure the collateral supports the loan amount.",
      "The appraised value interacts with your loan-to-value: if a home appraises below the contract price, the loan is sized against the lower figure, which can require a larger down payment or a renegotiation.",
      "The appraisal serves the loan, not the buyer's inspection needs — it isn't a substitute for a home inspection, which looks at condition in far more detail."
    ],
    related: [
      { href: "/resources/home-appraisal-explained", label: "The home appraisal" },
      { href: "/resources/ltv-explained", label: "LTV, explained" },
      { href: "/resources/underwriting-conditions", label: "Underwriting conditions" }
    ]
  },
  {
    slug: "rate-lock",
    term: "Rate lock",
    category: "process",
    short:
      "A rate lock holds a quoted interest rate for a set period while your loan closes, protecting you from rate moves. Locks expire and their terms vary by lender.",
    body: [
      "A rate lock is a lender's commitment to hold a specific interest rate (and points) for a defined number of days while your loan is processed, shielding you from market moves during that window.",
      "Locks expire. If closing slips past the lock's end date, extending it can carry a cost, so the lock period is usually set to match a realistic closing timeline. Some locks offer a one-time float-down if rates fall, depending on the lender.",
      "A quoted rate before you lock is just that — a quote, subject to change until it's locked and until the loan closes on the terms underwriting confirms."
    ],
    related: [
      { href: "/resources/rate-lock-explained", label: "How rate locks work" },
      { href: "/resources/apr-vs-interest-rate", label: "APR vs. interest rate" },
      { href: "/calculators/rate-impact", label: "Rate impact calculator" }
    ]
  },
  {
    slug: "title-insurance",
    term: "Title insurance",
    category: "process",
    short:
      "Title insurance protects against defects in a property's ownership history — liens, errors, or competing claims. In Florida it's a standard part of closing costs.",
    body: [
      "Title insurance protects against problems in a property's chain of ownership: an undiscovered lien, a recording error, a forged signature, or a competing claim that surfaces after you buy. A title search aims to catch these; the policy covers what the search misses.",
      "There are two policies — a lender's policy protecting the loan, which lenders require, and an optional owner's policy protecting your equity. Unlike most insurance, it's a one-time premium paid at closing covering past events, not future ones.",
      "In Florida, title insurance and the related search are a standard, and regulated, part of a real-estate closing, so they appear on essentially every purchase's closing costs."
    ],
    related: [
      { href: "/resources/title-insurance-florida", label: "Title insurance in Florida" },
      { href: "/resources/closing-timeline-florida", label: "The closing timeline" },
      { href: "/calculators/closing-cost", label: "Closing cost calculator" }
    ]
  },

  // ---------------------------------------------------------------- credit
  {
    slug: "credit-score",
    term: "Credit score",
    category: "credit",
    short:
      "A credit score is a number lenders use to gauge credit risk. It shapes options and pricing, but it's one factor among income, assets, and the property.",
    body: [
      "A credit score summarizes your credit history into a single number that lenders use as one measure of risk. Payment history, amounts owed, length of history, new credit, and credit mix all feed it.",
      "Score influences which programs are available and how a loan is priced, and different programs weigh it differently — but it's never the entire decision. Stable income, reserves, down payment, and the property all matter in underwriting.",
      "Because a score reflects the underlying history, the durable way to improve it is the ordinary one: on-time payments and lower balances over time, not a quick fix."
    ],
    related: [
      { href: "/resources/credit-score-mortgage", label: "Credit scores & your mortgage" },
      { href: "/resources/mortgage-credit-inquiries", label: "Credit inquiries" },
      { href: "/mortgage/first-time-home-buyers", label: "First-time buyer guide" }
    ]
  },
  {
    slug: "debt-to-income",
    term: "Debt-to-income ratio (DTI)",
    aliases: ["DTI"],
    category: "credit",
    short:
      "DTI compares your monthly debt payments to your gross monthly income. Lenders use it to judge how much new mortgage payment your budget can reasonably support.",
    body: [
      "Debt-to-income ratio is your total monthly debt payments divided by your gross monthly income, expressed as a ratio. Lenders look at it to gauge whether adding a mortgage payment leaves your budget sustainable.",
      "It usually comes in two flavors: a front-end ratio counting just housing, and a back-end ratio counting housing plus other debts like car loans and credit cards. Program guidelines set the limits, and they differ by loan type.",
      "Two levers move DTI: reducing monthly debt or increasing qualifying income. It's one of the most direct things a buyer can influence before applying."
    ],
    related: [
      { href: "/resources/dti-explained", label: "DTI, explained" },
      { href: "/calculators/debt-to-income", label: "DTI calculator" },
      { href: "/calculators/affordability", label: "Affordability calculator" }
    ]
  },
  {
    slug: "hard-inquiry",
    term: "Hard credit inquiry",
    aliases: ["Hard pull", "Hard inquiry"],
    category: "credit",
    short:
      "A hard inquiry is a lender's credit check made when you apply. Shopping several mortgage lenders in a short window generally counts as a single inquiry.",
    body: [
      "A hard inquiry (or hard pull) is a credit check a lender runs, with your authorization, when you apply for credit. It can have a small, temporary effect on your credit score, unlike a soft inquiry such as checking your own report.",
      "Credit-scoring models generally treat multiple mortgage inquiries within a short shopping window as a single event, so comparing several lenders' offers doesn't multiply the impact the way it might seem to.",
      "The takeaway for buyers: don't avoid comparing mortgage offers out of fear of your score — shop within a focused window, and be more cautious about opening unrelated new credit while you're in process."
    ],
    related: [
      { href: "/resources/mortgage-credit-inquiries", label: "Mortgage credit inquiries" },
      { href: "/resources/credit-score-mortgage", label: "Credit scores & your mortgage" },
      {
        href: "/resources/preapproval-vs-prequalification",
        label: "Preapproval vs. prequalification"
      }
    ]
  },

  // ---------------------------------------------------------------- programs
  {
    slug: "conventional-loan",
    term: "Conventional loan",
    category: "programs",
    short:
      "A conventional loan is a mortgage not insured by a government agency, usually following Fannie Mae or Freddie Mac guidelines. It's the most common loan type.",
    body: [
      "A conventional loan is any mortgage not backed by a government program like FHA, VA, or USDA. Most conventional loans are written to Fannie Mae or Freddie Mac guidelines, which set the standards for qualifying.",
      "Its defining feature versus FHA is how mortgage insurance works: conventional PMI can be removed as equity builds, whereas FHA insurance often stays for the life of the loan. That makes the conventional-versus-FHA choice worth running for your numbers.",
      "Conventional loans suit borrowers with solid credit and steady income, but the right answer depends on down payment, credit, and the property — not a blanket rule."
    ],
    related: [
      { href: "/mortgage/conventional", label: "Conventional loans" },
      { href: "/resources/conventional-vs-fha", label: "Conventional vs. FHA" },
      { href: "/resources/pmi-vs-mip", label: "PMI vs. MIP" }
    ]
  },
  {
    slug: "fha-loan",
    term: "FHA loan",
    category: "programs",
    short:
      "An FHA loan is insured by the Federal Housing Administration for lower down payments and more flexible credit. It carries its own mortgage insurance (MIP).",
    body: [
      "An FHA loan is a government-insured mortgage designed to widen access to homeownership, with lower down-payment and more flexible credit requirements than many conventional loans.",
      "The trade-off is mortgage insurance: FHA loans carry an upfront premium and an annual premium (MIP), and on most FHA loans today the annual premium lasts the life of the loan unless you refinance out. That's the crux of comparing FHA with conventional.",
      "FHA is a strong fit for some first-time and credit-rebuilding buyers, but whether it beats a conventional loan depends on your specific credit, down payment, and how long you'll keep the loan."
    ],
    related: [
      { href: "/mortgage/fha", label: "FHA loans" },
      { href: "/resources/fha-mip-explained", label: "FHA MIP, explained" },
      { href: "/resources/conventional-vs-fha", label: "Conventional vs. FHA" }
    ]
  },
  {
    slug: "va-loan",
    term: "VA loan",
    category: "programs",
    short:
      "A VA loan is backed by the U.S. Department of Veterans Affairs for eligible service members, veterans, and surviving spouses, often with no down payment.",
    body: [
      "A VA loan is guaranteed by the U.S. Department of Veterans Affairs and available to eligible active-duty service members, veterans, and certain surviving spouses. For many borrowers it allows a home purchase with no down payment.",
      "VA loans don't carry monthly mortgage insurance, though most involve a one-time VA funding fee, which some borrowers are exempt from. Eligibility runs through a Certificate of Eligibility from the VA.",
      "For those who qualify, the no-down-payment feature and the absence of monthly mortgage insurance make the VA loan one of the strongest programs available — worth comparing carefully against the alternatives."
    ],
    related: [
      { href: "/mortgage/va", label: "VA loans" },
      { href: "/resources/va-loan-benefits-florida", label: "VA loan benefits in Florida" },
      { href: "/mortgage/first-time-home-buyers", label: "First-time buyer guide" }
    ]
  },
  {
    slug: "usda-loan",
    term: "USDA loan",
    category: "programs",
    short:
      "A USDA loan is a government-backed mortgage for eligible rural and suburban areas, aimed at moderate-income buyers, often with no down payment.",
    body: [
      "A USDA loan, backed by the U.S. Department of Agriculture's rural development program, helps moderate-income buyers purchase in eligible rural and many suburban areas, frequently with no down payment.",
      "Eligibility has two parts: the property must be in a USDA-eligible area, and household income must fall within the program's local limits. Both are defined by the USDA and can be checked against its maps and tables.",
      "In Florida, more areas qualify than many buyers expect, so a USDA loan is worth checking against the property's location before ruling it out."
    ],
    related: [
      { href: "/mortgage/usda", label: "USDA loans" },
      { href: "/resources/usda-eligibility-florida", label: "USDA eligibility in Florida" },
      { href: "/resources/down-payment-how-much", label: "How much down payment" }
    ]
  },
  {
    slug: "down-payment-assistance",
    term: "Down payment assistance (DPA)",
    aliases: ["DPA"],
    category: "programs",
    short:
      "Down payment assistance helps cover the down payment or closing costs, often as a second loan or grant. Florida runs statewide and many county options.",
    body: [
      "Down payment assistance (DPA) programs help bridge the cash hurdle of buying, typically by lending or granting money toward the down payment and closing costs. Many are structured as a second mortgage — sometimes deferred, sometimes forgivable — that layers on top of a first loan.",
      "Florida runs statewide programs through its housing finance agency, and many counties and cities run their own, each with income and purchase-price limits that change and vary by location. Eligibility is confirmed by a licensed loan officer against the current tables, not by a web page.",
      "DPA can often be combined with conventional, FHA, VA, or USDA first mortgages, which is why it's worth asking about early — funding is finite and timing matters."
    ],
    related: [
      { href: "/florida-down-payment-assistance", label: "Florida down payment assistance" },
      { href: "/resources/down-payment-how-much", label: "How much down payment" },
      { href: "/mortgage/first-time-home-buyers", label: "First-time buyer guide" }
    ]
  }
];

export function glossaryTermBySlug(slug: string): GlossaryTerm | undefined {
  return GLOSSARY_TERMS.find((entry) => entry.slug === slug);
}

/** Terms in a category, in array order. */
export function glossaryTermsByCategory(category: GlossaryCategory): GlossaryTerm[] {
  return GLOSSARY_TERMS.filter((entry) => entry.category === category);
}

/* ------------------------------------------------------------------ *
 * JSON-LD builders (local, plain objects for @tract/seo graph()).
 *
 * DefinedTerm / DefinedTermSet describe the glossary as structured data. They
 * return plain nodes so a page can drop them straight into graph([...]) beside
 * webPageNode and breadcrumbNode. They take the site URL rather than importing
 * app config, so the data module stays pure and unit-testable.
 * ------------------------------------------------------------------ */

const GLOSSARY_PATH = "/mortgage-glossary";

function glossaryBase(siteUrl: string): string {
  return `${siteUrl.replace(/\/+$/, "")}${GLOSSARY_PATH}`;
}

export function definedTermNode(term: GlossaryTerm, siteUrl: string): Record<string, unknown> {
  const base = glossaryBase(siteUrl);
  const termUrl = `${base}/${term.slug}`;
  return {
    "@type": "DefinedTerm",
    "@id": `${termUrl}#definedterm`,
    name: term.term,
    description: term.short,
    termCode: term.slug,
    url: termUrl,
    inDefinedTermSet: { "@id": `${base}#glossary` }
  };
}

export function definedTermSetNode(
  terms: GlossaryTerm[],
  siteUrl: string
): Record<string, unknown> {
  const base = glossaryBase(siteUrl);
  return {
    "@type": "DefinedTermSet",
    "@id": `${base}#glossary`,
    name: "Mortgage & Florida Home-Buying Glossary",
    url: base,
    inLanguage: "en-US",
    hasDefinedTerm: terms.map((term) => definedTermNode(term, siteUrl))
  };
}
