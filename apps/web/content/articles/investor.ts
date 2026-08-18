import type { Article } from "./types";

export const INVESTOR_ARTICLES: Article[] = [
  {
    slug: "rental-cash-flow-analysis",
    category: "investor",
    title: "Rental Cash Flow Analysis: Beyond Rent Minus Mortgage",
    description:
      "Real rental cash flow analysis counts vacancy, management, maintenance, and capital reserves — not just rent minus mortgage. How to model a Florida rental honestly.",
    h1: "How to analyze rental property cash flow (the honest version)",
    answerSummary:
      "A real cash flow analysis starts with gross rent, then subtracts vacancy, property management, maintenance, capital expenditure reserves, taxes, insurance, and any association dues before the mortgage payment ever enters the math. Rent minus mortgage is not cash flow — it is the ceiling on cash flow. Properties that look profitable on that shortcut routinely lose money once the full expense line is modeled.",
    sections: [
      {
        heading: "Why rent minus mortgage is not analysis",
        paragraphs: [
          "Every listing marketed to investors implies the same arithmetic: the tenant pays rent, the rent covers the mortgage, the difference is yours. That arithmetic omits every cost that makes a rental a business. A roof does not fail monthly, but it fails; a tenant does not leave every year, but tenants leave. Analysis that ignores lumpy, irregular costs is not conservative or aggressive — it is simply wrong, and the error always runs in one direction.",
          "The discipline that fixes this is old and simple: convert every irregular cost into a monthly accrual. You will not write a check for vacancy each month, but the property incurs the cost continuously. Underwriting it that way is how lenders think, how appraisers approach income property, and how experienced landlords decide what to pay."
        ]
      },
      {
        heading: "The expense lines that belong in every model",
        paragraphs: [
          "A defensible pro forma for a Florida rental includes each of the following, every month, whether or not the check goes out that month. The IRS's own guidance on rental property lists most of these as ordinary deductible expenses — which is a useful tell: if the tax code expects the cost, your model should too."
        ],
        bullets: [
          "Vacancy and turnover — an allowance for the weeks a unit sits empty between tenants, plus make-ready costs like paint, cleaning, and re-listing.",
          "Property management — even if you self-manage, price your time; if the deal only works with free labor, the deal is paying you a wage, not a return.",
          "Repairs and maintenance — the routine stream of appliance calls, plumbing fixes, and lawn care that never appears in a listing flyer.",
          "Capital expenditure reserves — an accrual for the roof, HVAC, water heater, and repiping that will eventually come due; Florida sun and humidity shorten those clocks.",
          "Property taxes and insurance — in Florida, model both with escalation in mind rather than trailing figures; non-homestead assessment rules and the insurance market both move.",
          "Association dues and assessments — for condos and HOA communities, dues plus a realistic view of special assessment risk."
        ]
      },
      {
        heading: "A hypothetical walk-through",
        paragraphs: [
          "Suppose, purely as an illustration, a house rents for $2,400 a month. A rent-minus-mortgage view compares that $2,400 to a $1,900 payment and calls it $500 of monthly profit. A real model first deducts a vacancy allowance, a management line, a maintenance line, and a capital reserve accrual — hypothetically, several hundred dollars combined — and only then compares net operating income to the debt service. The same property can show positive cash flow under the shortcut and negative cash flow under honest accounting. The property did not change; the honesty did.",
          "The point of the exercise is not pessimism. It is that offers, financing structure, and rent targets should all be set against the honest number. Investors who model correctly can hold through a bad year because the bad year was already in the spreadsheet."
        ]
      },
      {
        heading: "How lenders read your cash flow",
        paragraphs: [
          "When you finance a rental with a conventional loan, the lender does not take your pro forma at face value. Fannie Mae's Selling Guide sets out how rental income is documented and adjusted — generally from lease agreements or the property's tax return history — and applies its own discounting before any of that income supports your qualification. Income you project and income a lender will count are different numbers, and the gap matters when you size a loan.",
          "TRACT is a mortgage broker: we arrange financing and can tell you how a given program will treat a property's income. We are not investment advisers, and nothing here is a recommendation to buy any property — the modeling is yours to own, and a licensed accountant should review the tax treatment."
        ]
      },
      {
        heading: "Run the numbers before you write the offer",
        paragraphs: [
          "The order of operations matters. Model the property's full expense load first, see what income survives, and then shop financing sized to that number. Doing it backwards — falling for a property, then stretching the model until it works — is how rent-minus-mortgage thinking turns into an alligator that eats a paycheck every month. A cash flow calculator that forces every expense line into the open is the cheapest insurance an investor can buy."
        ]
      }
    ],
    faqs: [
      {
        question: "What percentage should I assume for vacancy and maintenance?",
        answer:
          "There is no universal figure — vacancy depends on the submarket and property class, and maintenance depends on the age and condition of the building. The honest approach is to research local vacancy data, get quotes from local property managers, and age the major systems yourself. Any fixed rule of thumb is a starting point for research, not a substitute for it."
      },
      {
        question: "Do lenders count my projected cash flow when qualifying me?",
        answer:
          "Not the way you calculate it. Conventional lenders follow agency rules — Fannie Mae's Selling Guide, for example — that document rental income from leases or tax returns and apply their own adjustments. DSCR lenders compare projected rent to the proposed payment using their own formula. In both cases the lender's number, not your spreadsheet, drives qualification."
      },
      {
        question: "Is negative cash flow ever acceptable?",
        answer:
          "Some investors knowingly accept negative monthly cash flow expecting appreciation or future rent growth. That is a speculation decision, not a financing decision, and it belongs to you and your financial adviser. What is never acceptable is negative cash flow you did not see coming because the model skipped vacancy, capex, or insurance escalation."
      },
      {
        question: "How does Florida specifically change the math?",
        answer:
          "Three ways, chiefly: property insurance costs and availability require careful, current quotes rather than assumptions; non-homestead properties follow different assessment rules than homesteaded ones, so the seller's tax bill is a poor predictor of yours; and heat, humidity, and storm exposure shorten the replacement cycle on roofs and HVAC, which raises the honest capex accrual."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B3-3.1-08, Rental Income",
        url: "https://selling-guide.fanniemae.com/sel/b3-3.1-08/rental-income"
      },
      {
        publisher: "Internal Revenue Service",
        title: "Topic No. 415, Renting Residential and Vacation Property",
        url: "https://www.irs.gov/taxtopics/tc415"
      },
      {
        publisher: "Internal Revenue Service",
        title: "About Publication 527, Residential Rental Property",
        url: "https://www.irs.gov/forms-pubs/about-publication-527"
      }
    ],
    related: [
      {
        href: "/calculators/investment-property-cash-flow",
        label: "Investment property cash flow calculator"
      },
      { href: "/mortgage/investment-property", label: "Investment property loans" },
      { href: "/resources/cap-rate-explained", label: "Cap rate explained" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "cap-rate-explained",
    category: "investor",
    title: "Cap Rate Explained: What It Measures and What It Ignores",
    description:
      "Cap rate compares a property's net operating income to its price — before financing. What the number actually tells you, what it ignores, and when it misleads.",
    h1: "Cap rate, explained honestly: what it measures, ignores, and gets wrong",
    answerSummary:
      "Capitalization rate is a property's net operating income divided by its price — the unlevered yield the building itself produces before any mortgage. It is useful for comparing similar properties in the same market. It deliberately ignores financing, and it silently depends on whose expense assumptions produced the NOI, which is why a quoted cap rate misleads as often as it informs.",
    sections: [
      {
        heading: "What cap rate actually measures",
        paragraphs: [
          "Cap rate answers one narrow question: if you paid all cash for this property, what annual return would its operations produce? Divide net operating income — rent minus operating expenses, before debt service — by the purchase price. The result is a yield on the asset itself, independent of how any particular buyer finances it. That independence is the point: it lets two buyers with completely different loan structures discuss the same building with one number.",
          "Because it strips financing out, cap rate is best understood as a pricing convention, not a profit forecast. Markets express what they will pay for a stream of rental income through the cap rates at which properties trade. When investors say a market is expensive, they usually mean cap rates are low: you pay more for each dollar of income."
        ]
      },
      {
        heading: "What it deliberately ignores: your mortgage",
        paragraphs: [
          "Cap rate contains no interest rate, no loan amount, and no monthly payment. Your actual cash-on-cash return — what your invested dollars earn after debt service — can land far from the cap rate in either direction depending on the financing. Leverage amplifies: when the property's yield exceeds the cost of the debt, borrowed money improves your return; when it does not, the same loan magnifies losses. Two investors can buy identical buildings at identical cap rates and have opposite outcomes because their loans differ.",
          "That is precisely why financing deserves its own analysis rather than a footnote. As a mortgage broker, TRACT arranges investor financing across conventional and DSCR programs, and the structure you choose changes the equation the cap rate never sees. We are not investment advisers — whether a given cap rate justifies a purchase is a judgment we leave to you and your advisers."
        ]
      },
      {
        heading: "The number is only as honest as the NOI",
        paragraphs: [
          "Every cap rate you are quoted was computed by someone with an interest in the answer. Net operating income moves dramatically depending on whether the expense line includes a vacancy allowance, market-rate management, real maintenance, and capital reserves — the same lines that separate honest cash flow analysis from rent-minus-mortgage arithmetic. A seller's pro forma cap rate built on trailing taxes, lapsed insurance quotes, and zero vacancy is not comparable to a buyer's underwritten cap rate on the same building.",
          "The IRS's Schedule E framework — the form on which rental income and expenses are actually reported — is a useful reality check: a property's tax history shows expenses somebody was willing to report, which often diverge sharply from the marketing flyer. Recompute NOI yourself before you trust any cap rate."
        ]
      },
      {
        heading: "When cap rate misleads",
        paragraphs: [
          "Cap rate misleads whenever it is used outside its narrow lane. Comparing cap rates across different markets, property classes, or risk profiles tells you little — a higher cap rate on a rougher property is compensation for risk, not free yield. It says nothing about appreciation, rent growth, or deferred maintenance about to come due. And on one- to four-unit residential property, where most individual investors operate, comparable sales usually drive both price and appraisal more than income does — the residential appraisal process is not a cap-rate exercise.",
          "It also tempts investors into false precision. A single-family rental's NOI swings meaningfully with one vacancy or one roof; a cap rate computed to two decimal places on numbers that volatile is theater."
        ]
      },
      {
        heading: "Where cap rate fits in a financing decision",
        paragraphs: [
          "Used well, cap rate is a screening and comparison tool: it ranks similar properties in a market and flags pro formas whose implied yields look too good. The financing decision then runs on different numbers — the lender's treatment of the property's income under Fannie Mae's rental income rules for conventional loans, or the rent-to-payment ratio for DSCR programs. Screen with cap rate, underwrite with cash flow, and size the loan against the numbers a lender will actually count."
        ]
      }
    ],
    faqs: [
      {
        question: "Is a higher cap rate always better?",
        answer:
          "No. Cap rate prices risk. A property trading at a noticeably higher cap rate than its market usually carries something the market is discounting — location, condition, tenant quality, or expense risk. A higher number means more income per dollar of price, and the market's judgment that the income is less certain."
      },
      {
        question: "Does my mortgage rate change the cap rate?",
        answer:
          "No — cap rate is computed before financing and does not move with your loan. What financing changes is your levered return. The relationship between the property's unlevered yield and your borrowing cost determines whether leverage helps or hurts, which is why the same building can be a sound purchase for one capital structure and a poor one for another."
      },
      {
        question: "Do lenders use cap rate to underwrite residential investor loans?",
        answer:
          "Generally not on one- to four-unit properties. Conventional underwriting documents rental income under agency rules and appraises primarily from comparable sales. DSCR lenders compare projected market rent to the proposed payment. Cap rate is an investor's comparison tool, not the lender's qualification metric, for this property class."
      },
      {
        question: "Should I trust the cap rate in a listing?",
        answer:
          "Treat it as the seller's opening argument. Rebuild the NOI yourself with a vacancy allowance, current insurance quotes, realistic taxes after sale, management, maintenance, and capital reserves. If your rebuilt cap rate is materially lower than the listed one — and it usually is — negotiate from your number."
      }
    ],
    sources: [
      {
        publisher: "Internal Revenue Service",
        title: "About Schedule E (Form 1040), Supplemental Income and Loss",
        url: "https://www.irs.gov/forms-pubs/about-schedule-e-form-1040"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B3-3.1-08, Rental Income",
        url: "https://selling-guide.fanniemae.com/sel/b3-3.1-08/rental-income"
      }
    ],
    related: [
      {
        href: "/calculators/investment-property-cash-flow",
        label: "Investment property cash flow calculator"
      },
      { href: "/resources/rental-cash-flow-analysis", label: "Rental cash flow analysis" },
      { href: "/mortgage/investment-property", label: "Investment property loans" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "dscr-vs-conventional-investor",
    category: "investor",
    title: "DSCR vs. Conventional Investor Loans: Honest Tradeoffs",
    description:
      "DSCR loans qualify the property; conventional loans qualify you. The real tradeoffs in documentation, pricing, prepayment terms, and consumer protections.",
    h1: "DSCR vs. conventional financing for rentals: the tradeoffs nobody markets",
    answerSummary:
      "Conventional investor loans qualify the borrower — full income documentation, debt-to-income analysis, agency pricing. DSCR loans qualify the property, comparing projected rent to the proposed payment with minimal personal income review. DSCR buys convenience and scalability at a price: generally higher rates, common prepayment penalties, and business-purpose status that sits outside many consumer protections. Neither is better; they fit different investors.",
    sections: [
      {
        heading: "Two different questions",
        paragraphs: [
          "A conventional investor loan asks: can this person afford this debt? The lender documents your income, computes your debt-to-income ratio with all your obligations included, and applies Fannie Mae's rules for how much of the property's rental income can offset the payment. A DSCR loan asks a different question: does this property cover this debt? The lender divides the projected rent by the proposed payment; a ratio of 1.0 means the rent exactly covers it, and each lender sets its own minimum for approval.",
          "That difference in the question drives every downstream tradeoff — documentation, pricing, legal status, and how the loan scales with a portfolio."
        ]
      },
      {
        heading: "What conventional does better",
        paragraphs: [
          "Pricing, mostly. Agency-eligible loans are generally the least expensive investor financing available because they are sold into the most liquid mortgage market on earth. Conventional loans also typically carry no prepayment penalty, which matters enormously if your plan involves refinancing or selling inside a few years. And because they are consumer-credit transactions, the full apparatus of federal consumer protection — disclosures, servicing rules, ability-to-repay standards — applies.",
          "The cost is friction. Full documentation means tax returns, and tax returns optimized for deductions can understate qualifying income. Rental income is counted only per the Selling Guide's documentation and adjustment rules, reserves are required on investment property, and agency limits on the number of financed properties eventually cap how far conventional financing scales."
        ]
      },
      {
        heading: "What DSCR does better",
        paragraphs: [
          "DSCR removes your personal income statement from the transaction. Self-employed investors with aggressive write-offs, investors with many properties, and investors whose DTI is already loaded can still finance a property that carries itself. Closing tends to be simpler, entity vesting is often available, and portfolio growth is not throttled by a financed-property count in the same way.",
          "The costs are real. DSCR pricing is generally higher than conventional for comparable risk. Prepayment penalties are common and vary widely in structure and duration — read them, because they change exit math. And because these are business-purpose loans, Regulation Z's coverage generally does not extend to them; the CFPB's regulation exempts credit extended primarily for business or commercial purposes, which means protections consumers take for granted may simply not apply. That is a legal difference, not a paperwork difference."
        ]
      },
      {
        heading: "The tradeoffs, side by side",
        paragraphs: [
          "The honest comparison is not which product is cheaper on a rate sheet, but which set of constraints costs you less over the life of your plan."
        ],
        bullets: [
          "Documentation: conventional requires full personal income documentation; DSCR runs on the property's projected rent and your credit.",
          "Pricing: conventional is generally cheaper; DSCR charges for its flexibility. The spread between them varies with the market, so compare live quotes rather than assumptions.",
          "Prepayment: conventional investor loans typically have none; DSCR loans often do — model the penalty against your intended hold period.",
          "Consumer protection: conventional investor loans are consumer-credit transactions; DSCR loans are generally business-purpose and outside much of Regulation Z.",
          "Scalability: conventional is bounded by financed-property limits, reserve requirements, and DTI; DSCR scales property by property.",
          "Reserves: both worlds want them — Fannie Mae's guide sets reserve requirements for investment property, and DSCR lenders impose their own."
        ]
      },
      {
        heading: "How to actually choose",
        paragraphs: [
          "Start from your constraint. If your documented income is strong, your property count is low, and you value the cheapest money with no exit penalty, conventional usually deserves the first look. If your tax returns understate your economics, your DTI is committed, or you are past the point where agency limits bind, DSCR exists precisely for you. Many investors use both across a portfolio — conventional while it is available, DSCR where it is not.",
          "TRACT is a mortgage broker and arranges both kinds of financing; we can price your specific scenario both ways so the comparison is real rather than theoretical. We are not attorneys or tax advisers — the entity, liability, and tax dimensions of this choice belong with your own professionals."
        ]
      }
    ],
    faqs: [
      {
        question: "What DSCR ratio do lenders require?",
        answer:
          "Each lender sets its own minimum, and programs differ — some price loans down to ratios near or even under break-even at stricter terms, while others require the rent to clear the payment with margin. A ratio of 1.0 simply means projected rent equals the proposed payment. Ask for each lender's threshold in writing rather than assuming an industry standard."
      },
      {
        question: "Are DSCR loans riskier for me as a borrower?",
        answer:
          "They carry different risks, not automatically greater ones. The two to examine hardest are the prepayment penalty, which can make an early sale or refinance expensive, and the business-purpose classification, which places the loan outside many Regulation Z consumer protections. Both are knowable in advance — read the note terms before committing."
      },
      {
        question: "Can rental income help me qualify for a conventional loan?",
        answer:
          "Yes, within rules. Fannie Mae's Selling Guide governs how rental income is documented — through leases or tax return history — and how much of it can offset the payment, including different treatment depending on your landlord history. The lender's calculation is usually more conservative than an investor's pro forma, so have the numbers run before you write offers."
      },
      {
        question: "Can I close a DSCR loan in an LLC?",
        answer:
          "Many DSCR lenders permit or even prefer entity vesting, usually with a personal guaranty, while conventional agency loans are made to natural persons. If entity ownership matters to your plan, that alone can decide the product — but discuss the liability and tax consequences with your attorney and CPA first, since vesting is a legal decision, not a financing preference."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "Regulation Z, 12 CFR § 1026.3, Exempt transactions",
        url: "https://www.consumerfinance.gov/rules-policy/regulations/1026/3/"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B3-3.1-08, Rental Income",
        url: "https://selling-guide.fanniemae.com/sel/b3-3.1-08/rental-income"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B3-4.1-01, Minimum Reserve Requirements",
        url: "https://selling-guide.fanniemae.com/sel/b3-4.1-01/minimum-reserve-requirements"
      }
    ],
    related: [
      { href: "/calculators/dscr", label: "DSCR calculator" },
      { href: "/mortgage/dscr", label: "DSCR loans" },
      { href: "/mortgage/investment-property", label: "Investment property loans" },
      { href: "/resources/investor-reserves-requirements", label: "Investor reserve requirements" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "str-financing-florida",
    category: "investor",
    title: "Financing Short-Term Rentals in Florida",
    description:
      "How lenders treat Florida short-term rentals: occupancy intent, why projected STR income differs from lease income, and the licensing and tax reality underneath.",
    h1: "Financing a short-term rental in Florida: what lenders and the state actually require",
    answerSummary:
      "Financing a Florida short-term rental turns on three things lenders and regulators treat seriously: your true occupancy intent, since second-home and investment financing carry different terms and misstating intent is fraud; how the income is counted, because projected nightly revenue is not documented lease income; and the state's licensing and tax regime, which makes an unlicensed rental a legal problem before it is a financing one.",
    sections: [
      {
        heading: "Occupancy intent is the first underwriting question",
        paragraphs: [
          "Every mortgage application declares how you will occupy the property, and the declaration is not a formality. Fannie Mae's Selling Guide defines the three occupancy types — principal residence, second home, and investment property — and each carries different pricing and rules. A second home must genuinely be for your personal use; a property bought primarily to rent nightly is an investment property and should be financed as one, even though investment pricing is higher.",
          "Declaring second-home occupancy to get better terms on what is really a rental business is occupancy misrepresentation, which is mortgage fraud. If your honest plan is nightly rental with occasional personal use, say so and let the loan be structured truthfully. The pricing difference is real money; the alternative is a federal crime."
        ]
      },
      {
        heading: "Why projected STR income is not lease income",
        paragraphs: [
          "A twelve-month lease is a contract producing documented, continuing income, and agency guidelines have a defined process for counting it. Projected short-term rental revenue is a forecast: seasonal, weather-exposed, platform-dependent, and regulation-sensitive. Conventional underwriting counts rental income per the Selling Guide's documentation rules — typically leases or the property's tax return history — so a projection from a listing platform generally cannot qualify you the way a lease can.",
          "This is where DSCR lenders diverge among themselves. Some will underwrite short-term rental income using market-rent appraisals or documented booking history; others use long-term market rent even for an STR, which can dramatically change the ratio. If the deal only works at nightly rates, the choice of lender and their income methodology is the whole ballgame — surface that before you contract, not at underwriting."
        ]
      },
      {
        heading: "Florida's licensing and tax reality",
        paragraphs: [
          "Florida regulates vacation rentals at both state and local levels. State law preempts local governments from prohibiting vacation rentals or regulating their duration or frequency — but the same statute grandfathers certain local ordinances and leaves cities and counties real power over registration, inspections, and nuisance enforcement. Practical result: legality varies block by block across Florida, and the state statute is the beginning of the research, not the end.",
          "The tax side is just as concrete. Short-term stays are transient rentals under Florida law, subject to state sales tax on the rental charge, and many counties layer a local tourist development tax on top. A licensed rental collecting and remitting correctly is a business; an unlicensed one is accumulating liability. Underwrite the compliance costs into the pro forma, and confirm the property's specific jurisdiction allows your intended use before you write the offer."
        ]
      },
      {
        heading: "Modeling STR cash flow without fooling yourself",
        paragraphs: [
          "Everything true of long-term rental analysis is true here, amplified. Vacancy becomes seasonality; management becomes cleaning, turnover, dynamic pricing, and platform fees; maintenance accelerates with guest churn; and insurance for short-term rental use is its own market with its own pricing. The IRS also treats short-term rental activity with specific rules — including how minimal-rental-use and personal-use days change what you report and deduct — so the after-tax picture needs a professional's eyes.",
          "A useful discipline: model the property twice — once at conservative nightly assumptions, once as a plain long-term rental. If it only survives as an optimistic STR, you are not buying a property; you are buying a forecast."
        ]
      },
      {
        heading: "How TRACT fits in",
        paragraphs: [
          "TRACT is a Florida mortgage broker. We arrange financing for second homes, investment properties, and short-term rental projects across conventional and DSCR programs, and we can tell you precisely how each lender on our panel treats STR income — which ones count it, how they document it, and what that does to your ratio. We are not attorneys, tax advisers, or licensing consultants: the local-ordinance research, state licensing, and tax registration belong with the appropriate professionals before closing, not after."
        ]
      }
    ],
    faqs: [
      {
        question: "Can I finance a Florida STR as a second home if I also use it myself?",
        answer:
          "Only if it genuinely is a second home — a property you occupy for part of the year for personal use, consistent with your loan program's occupancy rules. Occasional rental of a true second home and a rental business with occasional personal use are different things, and the application must reflect the honest primary purpose. When in doubt, disclose the full plan to your broker and let the program fit the truth."
      },
      {
        question: "Will lenders count my Airbnb projections when qualifying me?",
        answer:
          "Conventional underwriting generally will not — agency rules document rental income from leases or tax returns, not platform forecasts. Some DSCR lenders will underwrite short-term rental income from market data or documented booking history, while others use long-term market rent regardless. Which methodology your lender uses can decide whether the loan works, so ask early."
      },
      {
        question: "Do I need a license to run a short-term rental in Florida?",
        answer:
          "Vacation rentals in Florida are generally subject to state licensing as public lodging, and state law addresses how far local governments can go in regulating them — while leaving room for registration programs and grandfathered ordinances. Requirements vary by jurisdiction, so verify the state license, local registration, and zoning for the specific address before purchase."
      },
      {
        question: "What taxes apply to short-term rental income in Florida?",
        answer:
          "Rental charges for transient stays are generally subject to Florida sales tax, and many counties add a local tourist development tax; federal income tax treatment then depends on personal-use days and other IRS rules. Registration and remittance are the operator's responsibility. A Florida-licensed CPA should set this up before the first booking."
      }
    ],
    sources: [
      {
        publisher: "Florida Senate",
        title: "Florida Statutes § 509.032, Duties — public lodging; vacation rental preemption",
        url: "https://www.flsenate.gov/Laws/Statutes/2024/509.032"
      },
      {
        publisher: "Florida Senate",
        title: "Florida Statutes § 212.03, Transient rentals tax",
        url: "https://www.flsenate.gov/Laws/Statutes/2024/212.03"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B2-1.1-01, Occupancy Types",
        url: "https://selling-guide.fanniemae.com/sel/b2-1.1-01/occupancy-types"
      },
      {
        publisher: "Internal Revenue Service",
        title: "Topic No. 415, Renting Residential and Vacation Property",
        url: "https://www.irs.gov/taxtopics/tc415"
      }
    ],
    related: [
      { href: "/mortgage/dscr", label: "DSCR loans" },
      {
        href: "/calculators/investment-property-cash-flow",
        label: "Investment property cash flow calculator"
      },
      { href: "/locations/florida", label: "Florida mortgage services" },
      { href: "/resources/dscr-vs-conventional-investor", label: "DSCR vs. conventional loans" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "house-hacking-florida",
    category: "investor",
    title: "House Hacking in Florida: Financing a 1-4 Unit Home",
    description:
      "Owner-occupying a duplex, triplex, or fourplex: how rental income from other units can help you qualify, and the occupancy obligations that come with the pricing.",
    h1: "House hacking in Florida: owner-occupied financing for 2–4 unit properties",
    answerSummary:
      "House hacking means buying a one- to four-unit property, living in one unit, and renting the rest. Because you occupy it, you can use owner-occupied financing — including low-down-payment FHA and conventional options — and lenders can count a portion of the other units' rental income toward qualification under agency rules. The tradeoff is a binding occupancy obligation: you must actually move in and live there, and misrepresenting occupancy is mortgage fraud.",
    sections: [
      {
        heading: "Why house hacking works at all",
        paragraphs: [
          "Mortgage pricing is built around occupancy. Owner-occupied loans get the friendliest terms in the market — lower down payments and better pricing — because homeowners default less than absentee investors. A two- to four-unit property occupied by its owner sits in a sweet spot: it is a primary residence for financing purposes and a small rental business in economic fact. FHA financing extends to one- to four-unit principal residences under HUD's Single Family Housing Policy Handbook, and conventional programs have their own multi-unit owner-occupied paths.",
          "That combination — residential financing terms on income-producing property — is the entire strategy. Nothing about it is a loophole; it is how the programs are designed, provided the occupancy is real."
        ]
      },
      {
        heading: "How the other units' rent helps you qualify",
        paragraphs: [
          "Lenders can count part of the projected rent from the units you will not occupy toward your qualifying income. For conventional loans, Fannie Mae's Selling Guide governs the documentation — typically an appraiser's rent analysis for units without leases, or leases and tax returns where history exists — and applies an adjustment to gross rent before counting it. FHA has parallel rules in the 4000.1 handbook, including its own approach to multi-unit rental income and self-sufficiency analysis on larger properties.",
          "Two honest cautions. First, the lender's counted rent is always less than the gross rent on the flyer — the adjustment for vacancy and expenses is built in. Second, counted income is not the same as cash flow: qualifying for the loan and having the building carry itself are separate questions, and the second one deserves the full analysis with vacancy, maintenance, and capital reserves included."
        ]
      },
      {
        heading: "The occupancy obligation is real, and lying about it is fraud",
        paragraphs: [
          "Owner-occupied financing requires you to occupy. Programs generally require you to move in within a defined period after closing and maintain the home as your principal residence for a minimum time — the specifics live in your loan documents and the program handbooks, and they are covenants, not suggestions.",
          "Say it plainly: signing an owner-occupancy certification for a property you intend to run entirely as a rental is occupancy misrepresentation, and occupancy misrepresentation is mortgage fraud — a federal offense that can mean loan acceleration, civil liability, and criminal prosecution. It is also entirely unnecessary. Investment-property financing exists, it is priced for the actual risk, and TRACT arranges it every week. If your plans genuinely change after closing — a job transfer, a family change — document the change and talk to your servicer; life happening is not fraud, but intent at signing is what the certification speaks to."
        ]
      },
      {
        heading: "Florida-specific mechanics worth knowing",
        paragraphs: [
          "Florida adds a few wrinkles worth pricing in. Homestead exemption applies to your residence, and on a multi-unit property the exemption applies to the owner-occupied portion rather than the whole building — the rented units are assessed differently, so model taxes accordingly rather than assuming the whole parcel is homesteaded. Insurance on 2–4 unit properties in Florida deserves early quotes, since the market prices multifamily and coastal exposure on its own terms. And tenant income means landlord obligations under Florida law — a lease, security deposit handling, and the operational reality of living next to your tenants.",
          "None of this defeats the strategy. It just belongs in the spreadsheet before the offer, not after closing."
        ]
      },
      {
        heading: "Running the numbers and getting financed",
        paragraphs: [
          "Model the purchase twice: once as a household expense — can you carry the whole payment if every other unit sits empty? — and once as an investment, with honest vacancy, maintenance, and reserves against the rental units. Strong house hacks pass both tests. Then have the financing run both ways, FHA and conventional, because the down payment, mortgage insurance, and rental-income treatment differ between them in ways that shift the answer. TRACT is a mortgage broker: we arrange the loan and can price both paths for your scenario. For tax treatment of the rental units — including depreciation and the homestead split — bring in a Florida CPA; that part is theirs."
        ]
      }
    ],
    faqs: [
      {
        question: "How long do I have to live in a house-hacked property?",
        answer:
          "Owner-occupied programs generally require you to move in within a set period after closing and occupy the home as your principal residence for at least a defined minimum, stated in your loan documents. The specific periods are program terms — check your note and the applicable handbook rather than relying on a rule of thumb, and keep evidence of your occupancy."
      },
      {
        question: "Can I count future rent from the other units to qualify?",
        answer:
          "Often, yes — that is one of the strategy's main advantages. For conventional loans, Fannie Mae's rules let lenders count a portion of documented or appraiser-estimated market rent from the non-occupied units; FHA has its own multi-unit income rules in the 4000.1 handbook. Expect the counted figure to be discounted from gross rent, and expect documentation requirements."
      },
      {
        question: "What happens if I move out after a year or two?",
        answer:
          "If you satisfied your occupancy obligation in good faith and your circumstances changed, converting the property to a full rental afterward is normal — investors do it routinely, and the loan typically stays in place. The line that cannot be crossed is intent at closing: certifying occupancy you never meant to perform is fraud regardless of what happens later."
      },
      {
        question: "Does Florida homestead exemption apply to a duplex I live in?",
        answer:
          "Generally the exemption and its assessment protections apply to the portion of the property you occupy as your permanent residence, not to the rented units, which the property appraiser assesses separately. The split affects your tax bill materially, so model it with the county property appraiser's guidance and confirm treatment for the specific parcel."
      }
    ],
    sources: [
      {
        publisher: "U.S. Department of Housing and Urban Development",
        title: "FHA Single Family Housing Policy Handbook 4000.1",
        url: "https://www.hud.gov/program_offices/housing/sfh/handbook_4000-1"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B3-3.1-08, Rental Income",
        url: "https://selling-guide.fanniemae.com/sel/b3-3.1-08/rental-income"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B2-1.1-01, Occupancy Types",
        url: "https://selling-guide.fanniemae.com/sel/b2-1.1-01/occupancy-types"
      }
    ],
    related: [
      { href: "/mortgage/fha", label: "FHA loans" },
      { href: "/mortgage/conventional", label: "Conventional loans" },
      {
        href: "/calculators/investment-property-cash-flow",
        label: "Investment property cash flow calculator"
      },
      { href: "/resources/rental-cash-flow-analysis", label: "Rental cash flow analysis" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "brrrr-financing",
    category: "investor",
    title: "BRRRR Financing: The Refinance Step Nobody Models",
    description:
      "Buy, rehab, rent, refinance, repeat — the strategy lives or dies at the refinance. Seasoning requirements, appraisal risk, and rate reality, modeled honestly.",
    h1: "BRRRR financing: why the refinance step decides everything",
    answerSummary:
      "BRRRR — buy, rehab, rent, refinance, repeat — depends entirely on its fourth step. The refinance that returns your capital is governed by seasoning rules on how long you must own before a cash-out, an appraisal you do not control, and whatever rates prevail months after you bought. Investors model the purchase and rehab in detail and treat the refinance as automatic; it is the least certain step in the sequence.",
    sections: [
      {
        heading: "The strategy, and where the risk actually lives",
        paragraphs: [
          "BRRRR compresses a simple idea: buy a distressed property cheaply, force appreciation through renovation, place a tenant, then refinance against the new value to pull your capital back out and do it again. The buy and the rehab feel like the hard parts because they are the work. But the buy and the rehab spend money you already have; the refinance is the step that gives it back. Every assumption in the model — the ability to repeat, the return on capital, the timeline — routes through a loan that has not been approved yet, at a value no one has confirmed, at a rate no one can promise.",
          "Treating that step as a formality is the single most common failure in the strategy."
        ]
      },
      {
        heading: "Seasoning: the clock starts at closing",
        paragraphs: [
          "Cash-out refinances carry seasoning requirements — a minimum period you must have owned the property before the new loan can return cash to you. Fannie Mae's Selling Guide sets an ownership seasoning requirement for conventional cash-out transactions, with defined exceptions such as its delayed financing provisions for buyers who paid cash; check the guide for the current period and conditions, because these rules are amended over time. DSCR and portfolio lenders impose their own seasoning policies, which differ by lender and sometimes distinguish between seasoning of ownership and seasoning of the appraised value.",
          "For a BRRRR timeline, seasoning is not trivia — it is the gating item. Your capital is locked in the deal until the clock runs and the refinance closes, and your renovation-to-refinance schedule has to be built around the rule, not discover it."
        ]
      },
      {
        heading: "Appraisal risk: your ARV is an opinion until it isn't",
        paragraphs: [
          "The model's after-repair value is your estimate. The refinance is sized against the appraiser's. Those can diverge for reasons that have nothing to do with your renovation quality: thin comparable sales for renovated properties in the submarket, a market that cooled during your rehab, or simply a defensible difference of professional opinion. Because the new loan is a percentage of appraised value, every dollar the appraisal comes in low is capital that stays trapped in the deal.",
          "Honest modeling means running the refinance at several appraisal outcomes — your target, and meaningfully below it — and confirming the deal survives each. If the plan only works when the appraisal matches your best case, the plan is a hope. Build the comp file yourself before you buy: if you cannot find sold comparables supporting your ARV today, the appraiser may not find them either."
        ]
      },
      {
        heading: "Rate reality: you are borrowing at a future price",
        paragraphs: [
          "The refinance happens months after the purchase, at whatever the market charges then. Nobody — not TRACT, not any lender — can tell you what that price will be. A rate shift between purchase and refinance changes the payment on the new loan, which changes the property's cash flow, which for a DSCR refinance changes the qualifying ratio itself: the same rent covers less payment at a higher rate, so the loan the ratio supports shrinks just when you need it. Rate risk and proceeds risk are the same risk wearing two coats.",
          "Model the refinance at a range of rates above your assumption, and decide in advance what you will do if the cash-out proceeds come back smaller: hold with capital in the deal, take the smaller loan, or wait. All three are survivable if they were planned for."
        ]
      },
      {
        heading: "Financing the front end, and how TRACT helps",
        paragraphs: [
          "The purchase-and-rehab phase has its own financing menu — cash, hard money, renovation loans — and the right choice depends on the exit: the refinance lender's seasoning policy and income methodology determine when and how you can get out of the expensive money. That is the useful order of operations: underwrite the exit first, then choose the entrance. TRACT is a mortgage broker; we arrange both ends — renovation and bridge-style financing into conventional or DSCR takeouts — and can map lender seasoning policies against your timeline before you commit capital. We are not investment advisers, and BRRRR's returns are never assured: this is a strategy with execution risk at every step, and the modeling above is the minimum diligence, not a guarantee of outcome."
        ]
      }
    ],
    faqs: [
      {
        question: "How long do I have to wait before the cash-out refinance?",
        answer:
          "It depends on the loan. Conventional cash-out refinances follow Fannie Mae's ownership seasoning requirement, with exceptions such as delayed financing for all-cash purchases — check the Selling Guide for the current period. DSCR and portfolio lenders each set their own seasoning policies. Confirm the specific lender's rule in writing before you build a timeline on it."
      },
      {
        question: "What if the appraisal comes in below my after-repair value?",
        answer:
          "The refinance shrinks: the new loan is sized from appraised value, so a low appraisal means less cash returned and more of your capital left in the deal. Your options are typically to challenge the appraisal with better comparables, accept smaller proceeds, wait and re-approach later, or try another lender. The best defense is buying deals that survive a below-target appraisal."
      },
      {
        question: "Should the BRRRR refinance be conventional or DSCR?",
        answer:
          "Both are used. Conventional is generally cheaper but requires full income documentation and counts rental income under agency rules; DSCR qualifies on the property's rent-to-payment ratio and scales more easily across a portfolio, at higher pricing and often with prepayment penalties. The right takeout depends on your documentation, property count, and hold plan — price both."
      },
      {
        question: "Is BRRRR still viable when rates are high?",
        answer:
          "The strategy does not stop working; the math gets stricter. Higher borrowing costs shrink refinance proceeds and thin cash flow, which means only deeper discounts at purchase survive the model. The discipline is unchanged in any market: underwrite the refinance at conservative rate and appraisal assumptions, and let deals that fail that test go."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B2-1.3-03, Cash-Out Refinance Transactions",
        url: "https://selling-guide.fanniemae.com/sel/b2-1.3-03/cash-out-refinance-transactions"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B3-3.1-08, Rental Income",
        url: "https://selling-guide.fanniemae.com/sel/b3-3.1-08/rental-income"
      }
    ],
    related: [
      { href: "/mortgage/renovation", label: "Renovation loans" },
      { href: "/mortgage/refinance", label: "Refinancing" },
      { href: "/calculators/dscr", label: "DSCR calculator" },
      { href: "/resources/fix-and-flip-financing", label: "Fix-and-flip financing" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "investor-reserves-requirements",
    category: "investor",
    title: "Why Lenders Require Reserves on Investment Property",
    description:
      "Reserve requirements on investment property loans: why lenders demand months of payments in the bank, what assets count, and how portfolios raise the bar.",
    h1: "Investment property reserve requirements: why lenders want money left over",
    answerSummary:
      "Lenders require reserves on investment property because rentals fail in ways a paycheck does not: tenants leave, roofs fail, and the mortgage is due regardless. Reserves are liquid assets left after closing, measured in months of the property's full housing payment, and agency rules extend the requirement across every financed property you own. Fannie Mae's Selling Guide defines what counts, how much is required, and how the calculation scales.",
    sections: [
      {
        heading: "The logic: rentals have income risk a paycheck doesn't",
        paragraphs: [
          "On a primary residence, the lender's main question is whether your income covers the payment. On a rental, the payment is supposed to be covered by a tenant who has not missed rent yet, in a property that has not needed a roof yet. Reserves are the underwriting answer to the gap between those two states of the world: verified liquid assets, still in your accounts after the closing table, sufficient to carry the property through vacancy, turnover, or repair without the loan going delinquent.",
          "This is not lender paranoia; it is the same math behind the capital expenditure accrual in an honest cash flow model. The lender is simply requiring you to hold, in advance, the buffer the property will eventually demand. Investors who resent the requirement are usually the ones whose pro formas skipped the vacancy line."
        ]
      },
      {
        heading: "What reserves are, precisely",
        paragraphs: [
          "In agency underwriting, reserves are measured in months of PITIA — the property's full monthly obligation of principal, interest, taxes, insurance, and association dues — not a flat dollar figure. Fannie Mae's Selling Guide sets the required number of months by transaction and occupancy type, and the requirement for investment properties is higher than for principal residences; the specific counts are in the guide and change with policy updates, so verify the current figure for your scenario rather than trusting a remembered rule.",
          "The requirement is assets remaining after your down payment and closing costs are paid. A buyer who empties every account to close has not met a reserve requirement even if the closing funds were ample — the test is what is left."
        ]
      },
      {
        heading: "What counts, and what doesn't",
        paragraphs: [
          "Agency rules define eligible reserve assets with some nuance worth knowing in advance."
        ],
        bullets: [
          "Checking, savings, and money market funds count at face value once documented and sourced.",
          "Stocks, bonds, and mutual funds in taxable accounts are generally eligible, subject to the guide's valuation rules.",
          "Retirement accounts can count subject to conditions on accessibility and valuation set out in the Selling Guide.",
          "Business funds may be usable for self-employed borrowers within specific documentation rules.",
          "Anticipated income — the security deposit you have not collected, the rent a lease promises — is not a reserve; reserves are assets you hold, not cash flow you expect.",
          "Unsecured borrowed funds, and gifts where the program disallows them for investment transactions, generally do not count — sourcing rules exist precisely to catch reserve-stuffing."
        ]
      },
      {
        heading: "How a portfolio raises the bar",
        paragraphs: [
          "Reserves scale with your holdings. Agency rules require reserves not only for the property being financed but also additional reserves calculated against the other financed properties you own — Fannie Mae's guide pairs its multiple-financed-property limits with a reserve calculation that grows with the portfolio. The practical consequence: each acquisition raises the liquidity bar for the next one, and an investor scaling on thin cash eventually fails underwriting on reserves before failing on anything else.",
          "DSCR and portfolio lenders sit outside agency rules but impose their own reserve requirements, which vary by lender and program. The concept survives everywhere even where the arithmetic differs: nobody lends on a rental to a borrower with no cushion."
        ]
      },
      {
        heading: "Planning reserves into the acquisition",
        paragraphs: [
          "Treat reserves as part of the purchase price of the deal. When you compute the cash needed to buy, add the reserve requirement to the down payment and closing costs — and then, separately, keep your own operating reserve for the property that is yours by policy rather than the lender's minimum, because the lender's minimum is an underwriting floor, not a business plan. TRACT arranges investor financing daily and can tell you the reserve requirement for your specific scenario — program, property count, and transaction type — before you write an offer, so the liquidity math is settled early. We arrange loans; we do not give investment advice, and how much cushion your business should hold beyond the requirement is a decision for you and your financial adviser."
        ]
      }
    ],
    faqs: [
      {
        question: "How many months of reserves do I need for an investment property?",
        answer:
          "The required count depends on the program, the transaction, and how many financed properties you own. Fannie Mae's Selling Guide sets the current requirements for conventional loans and adds a calculation across your other financed properties; DSCR lenders set their own figures. The counts are policy numbers that get amended, so confirm the current requirement for your exact scenario."
      },
      {
        question: "Can I use my 401(k) or IRA as reserves?",
        answer:
          "Often, in part. Agency rules allow certain retirement assets to count toward reserves, subject to conditions about accessibility and valuation discounts described in the Selling Guide. The account's value is not simply taken at face; documentation of terms and vesting matters. Bring statements early so your broker can compute the countable figure."
      },
      {
        question: "Do reserve requirements apply to DSCR loans too?",
        answer:
          "Generally yes, though the rules are lender-specific rather than set by agency guidelines. Most DSCR programs require documented liquid reserves measured against the new loan's payment, with requirements that vary by lender, transaction, and portfolio size. Since these loans skip personal income analysis, liquidity is one of the few borrower-strength signals left — lenders take it seriously."
      },
      {
        question: "Why did my required reserves go up when I bought another rental?",
        answer:
          "Because agency reserve requirements scale with your financed-property count. Fannie Mae's rules compute additional reserves against the other financed properties you own, so each new mortgage raises the total liquidity you must show on the next one. It is one of the structural reasons growing investors eventually add business-purpose financing alongside conventional loans."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B3-4.1-01, Minimum Reserve Requirements",
        url: "https://selling-guide.fanniemae.com/sel/b3-4.1-01/minimum-reserve-requirements"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B2-2-03, Multiple Financed Properties for the Same Borrower",
        url: "https://selling-guide.fanniemae.com/sel/b2-2-03/multiple-financed-properties-same-borrower"
      }
    ],
    related: [
      { href: "/mortgage/investment-property", label: "Investment property loans" },
      { href: "/calculators/affordability", label: "Affordability calculator" },
      { href: "/resources/portfolio-growth-financing", label: "Scaling a rental portfolio" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "llc-vs-personal-title-financing",
    category: "investor",
    title: "LLC vs. Personal Title: How Vesting Affects Financing",
    description:
      "Holding rentals in an LLC changes which loans you can get. Conventional lending goes to natural persons; business-purpose lending can vest in entities.",
    h1: "LLC or personal name? How title vesting interacts with your financing options",
    answerSummary:
      "How you hold title constrains how you can borrow. Conventional agency loans are made to natural persons, so financing in an LLC generally means business-purpose lending — DSCR and portfolio programs that permit entity vesting, usually at higher cost and with a personal guaranty, and outside many consumer protections. The liability and tax questions behind the choice are legal and accounting questions: decide them with an attorney and CPA, then finance accordingly.",
    sections: [
      {
        heading: "Why lenders care whose name is on title",
        paragraphs: [
          "A mortgage is a claim against a property and a promise from a borrower, and both halves depend on who holds title. Conventional loans eligible for sale to Fannie Mae must be made to borrowers who are natural persons — the Selling Guide's borrower eligibility rules say so directly, with narrow accommodations for certain trusts. An LLC is not a natural person, so a property vested in an LLC does not fit the agency box regardless of how strong the member's finances are.",
          "Business-purpose lenders answer the question differently. DSCR and portfolio programs routinely close loans to LLCs, typically with the members signing personal guaranties — the entity holds title and the debt, and the humans still stand behind it. Entity vesting rarely removes personal exposure to the lender; what it changes is the legal architecture around the asset."
        ]
      },
      {
        heading: "What each path costs and buys",
        paragraphs: [
          "Financing in your personal name keeps the cheapest and most protected end of the market open: agency pricing, no prepayment penalty as a rule, and consumer-credit status under Regulation Z. Financing in an entity generally means business-purpose credit — the CFPB's regulation exempts credit extended primarily for business or commercial purposes from Regulation Z's coverage — which trades those protections for entity vesting, more flexible underwriting, and scalability. Pricing is generally higher and prepayment penalties are common.",
          "There is a hybrid pattern worth knowing: some investors close conventionally in personal names and later transfer title to an LLC. Whether and when a servicer may treat a transfer as triggering the loan's due-on-sale clause depends on the loan documents, the loan's owner, and applicable policy — Fannie Mae, for instance, has published conditions under which certain transfers to LLCs controlled by the original borrower are permitted. This is exactly the kind of maneuver to run past your attorney and the servicer first, in writing, not to improvise from a forum post."
        ]
      },
      {
        heading: "What the LLC does and does not do",
        paragraphs: [
          "Investors usually reach for an LLC for liability separation and estate or partnership structure. Those benefits are real but conditional — they depend on the entity being properly formed, funded, insured, and operated, and none of that is a mortgage question. An LLC also does not make debt disappear from your life: guaranteed business-purpose debt follows you in every future lender's global cash flow analysis, even when it stays off a consumer credit report.",
          "Say the quiet part directly: TRACT is a mortgage broker. We are not attorneys, not accountants, and not investment advisers, and nothing here is legal or tax advice. Whether an LLC protects you, how it is taxed, and how Florida's specific entity and homestead rules bear on your situation are questions for a Florida-licensed attorney and a CPA. What we can tell you with authority is which lenders on our panel will close in an entity, at what pricing, and with what guaranty structure — and we will happily coordinate with your professionals so the vesting and the financing are decided together."
        ]
      },
      {
        heading: "Tax mechanics: mostly less dramatic than expected",
        paragraphs: [
          "For a single-member LLC, the IRS generally disregards the entity for income tax purposes — rental income and expenses land on Schedule E of the member's return much as they would with personal title. Multi-member structures file differently, and elections can change the picture. The point for financing is that the tax motivation for an LLC is often smaller than investors assume, while the financing consequences — losing agency eligibility for entity-vested purchases — are concrete and immediate. Get the accounting answer from a CPA before paying the financing cost of the structure.",
          "Whatever you choose, keep the paper trail clean: rent into the right account, expenses from it, and books that match the tax return. Every future refinance will read them."
        ]
      },
      {
        heading: "A sane order of operations",
        paragraphs: [
          "Decide the legal structure first, with counsel, based on liability and estate goals. Then finance to fit the structure: agency loans while you qualify and want personal vesting, business-purpose loans where the entity must hold title from day one. If the answer is a later transfer to an entity, clear the due-on-sale question with the servicer and your attorney before closing on that plan. The expensive mistake is deciding the structure by financing convenience — or the financing by structural folklore — instead of letting each professional answer the question that is actually theirs."
        ]
      }
    ],
    faqs: [
      {
        question: "Can my LLC get a conventional mortgage?",
        answer:
          "No — conventional loans salable to the agencies are made to natural persons under Fannie Mae's borrower eligibility rules, with limited accommodation for certain trusts. An LLC that must hold title at closing points you to business-purpose financing, such as DSCR or portfolio programs that permit entity vesting, generally with a personal guaranty from the members."
      },
      {
        question: "Does putting a rental in an LLC protect me from the mortgage debt?",
        answer:
          "Generally not. Business-purpose lenders almost always require personal guaranties from the entity's members, so you remain personally answerable for the debt. What an LLC may affect is liability arising from the property's operations — and even that depends on proper formation and operation, which is a question for your attorney, not your lender or broker."
      },
      {
        question: "If I buy in my name, can I transfer the property to my LLC later?",
        answer:
          "Sometimes, under conditions. Loan documents contain due-on-sale clauses, and whether a transfer to your own LLC is permitted depends on the loan's owner and published policy — Fannie Mae has allowed certain transfers to entities controlled by the original borrower. Get the servicer's position and your attorney's review in writing before transferring; do not rely on the transfer going unnoticed."
      },
      {
        question: "Is an LLC better for taxes on rental property?",
        answer:
          "Often it changes less than expected: the IRS generally disregards a single-member LLC, so rental results flow to the owner's Schedule E either way, while multi-member entities file partnership returns. Whether any structure improves your tax position is fact-specific and belongs with a CPA. TRACT arranges financing and does not give tax advice."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B2-2-01, General Borrower Eligibility Requirements",
        url: "https://selling-guide.fanniemae.com/sel/b2-2-01/general-borrower-eligibility-requirements"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "Regulation Z, 12 CFR § 1026.3, Exempt transactions",
        url: "https://www.consumerfinance.gov/rules-policy/regulations/1026/3/"
      },
      {
        publisher: "Internal Revenue Service",
        title: "About Schedule E (Form 1040), Supplemental Income and Loss",
        url: "https://www.irs.gov/forms-pubs/about-schedule-e-form-1040"
      }
    ],
    related: [
      { href: "/mortgage/dscr", label: "DSCR loans" },
      { href: "/mortgage/investment-property", label: "Investment property loans" },
      { href: "/contact", label: "Talk to a broker" },
      { href: "/resources/dscr-vs-conventional-investor", label: "DSCR vs. conventional loans" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "fix-and-flip-financing",
    category: "investor",
    title: "Fix-and-Flip Financing: Carrying Costs and Exit Risk",
    description:
      "How flip financing actually works: short-term business-purpose loans, draw schedules, the carrying-cost clock, and the exit risks that decide whether you profit.",
    h1: "Fix-and-flip financing: the loan, the carrying-cost clock, and the exit",
    answerSummary:
      "Flip financing is short-term, business-purpose lending sized against purchase price and renovation budget, with rehab funds released through inspected draws. It is expensive by design, because the loan is meant to be alive for months, not decades. The profit math is a race between forced appreciation and carrying costs — interest, taxes, insurance, and utilities accrue every day — and the exit, whether sale or refinance, is where flips actually fail.",
    sections: [
      {
        heading: "What a flip loan actually is",
        paragraphs: [
          "A fix-and-flip loan is not a small mortgage; it is a different instrument. These are business-purpose loans — credit extended primarily for a commercial purpose, which Regulation Z generally exempts from its consumer-credit coverage — made by private, hard-money, and specialty lenders for terms measured in months. Underwriting centers on the deal: purchase price, renovation budget, the after-repair value, and your track record, more than your tax returns. Interest-only payments during the term are typical, and origination costs are front-loaded.",
          "Structure follows the project. The lender typically funds a share of the purchase at closing and holds the renovation budget in escrow, releasing it in draws as an inspector verifies completed work. That draw structure means you float each stage of the rehab before reimbursement — a cash flow reality first-time flippers consistently underestimate."
        ]
      },
      {
        heading: "The carrying-cost clock",
        paragraphs: [
          "From the day you close, the project burns money independent of any progress: loan interest, property taxes, insurance priced for a vacant property under renovation, utilities, and in Florida often an HOA. Every week of permit delay, contractor slippage, or slow listing activity adds a week of that burn against a sale price that does not rise to match.",
          "Model it as a monthly number before you offer. Hypothetically: if a project carries several thousand dollars a month in combined interest and holding costs, a two-month overrun consumes a five-figure slice of expected profit — and two-month overruns are ordinary, not exceptional. Time is the flip's real currency; the renovation budget merely buys the materials. Experienced flippers pad the timeline, not just the budget, and price both pads into the maximum offer."
        ]
      },
      {
        heading: "Exit risk: the sale you haven't made yet",
        paragraphs: [
          "A flip's entire return is realized at exit, and the exit is exposed to everything: the market's direction during your hold, the appraisal your buyer's lender orders, and the financing rules that govern that buyer. If your likely purchaser uses FHA financing, HUD's Single Family Housing Policy Handbook restricts resales occurring shortly after acquisition and layers requirements on quick resales — timing rules that can shape when you list and to whom you can realistically sell. Check the current provisions while planning the exit, not after an offer arrives.",
          "The disciplined protection is a second exit: underwrite every flip as a rental too. If the property can be leased and refinanced at numbers that survive, a soft market turns a failed flip into an accidental BRRRR instead of a forced loss. If it cannot — if the deal only works as a quick sale at the projected price — you are carrying the full exit risk with no floor under it."
        ]
      },
      {
        heading: "The numbers that decide the offer",
        paragraphs: [
          "Flip math runs backward from the after-repair value, and every input deserves hostility."
        ],
        bullets: [
          "ARV from sold comparables you verified yourself — not the listing agent's optimism and not an average of dissimilar houses.",
          "Renovation budget from a scoped, contractor-priced estimate with a contingency line — surprises in older Florida housing stock (roofs, electrical, plumbing, moisture) are the rule.",
          "Carrying costs as a monthly burn multiplied by a padded timeline, including the loan's interest and fees.",
          "Transaction costs on both ends — acquisition closing costs, and at exit the commissions, seller concessions, and Florida closing customs that come out of the sale price.",
          "Profit margin sized to the risk actually taken; a flip projected to net a sliver has no room for a single missed assumption. All of it hypothetical until proven — flipping offers no assured return, and no lender or broker can promise one."
        ]
      },
      {
        heading: "Where TRACT fits",
        paragraphs: [
          "TRACT is a mortgage broker. On the front end we arrange short-term renovation and business-purpose financing for acquisition and rehab; on the back end we arrange the exits — the buyer's mortgage when you sell, or your own DSCR or conventional refinance when you keep it. Because we see both ends, we can pressure-test a project's financing plan before you commit: what the acquisition money costs, what the refinance takeout requires, and where the seasoning and appraisal rules will bite. We are not investment advisers or contractors, and we do not underwrite your rehab budget — but we can make sure the financing on both ends of the plan is real before your capital is."
        ]
      }
    ],
    faqs: [
      {
        question: "How is a fix-and-flip loan different from a regular mortgage?",
        answer:
          "It is short-term, business-purpose, and project-based: months-long terms, interest-only payments, underwriting focused on purchase price, rehab budget, and after-repair value, and renovation funds released through inspected draws. Because it is business-purpose credit, it generally sits outside Regulation Z's consumer protections — and its pricing reflects a loan built to be repaid quickly."
      },
      {
        question: "What are typical carrying costs on a flip?",
        answer:
          "The recurring burn is loan interest, property taxes, insurance for a vacant renovation project, utilities, and any association dues — plus the transaction costs waiting at both ends. The dollar figure is project-specific; the discipline is universal: express it as a monthly number, multiply by a padded timeline, and subtract it from projected profit before you set a maximum offer."
      },
      {
        question: "Can a quick resale cause problems for my buyer's financing?",
        answer:
          "It can. FHA rules in HUD's Handbook 4000.1 restrict resales shortly after acquisition and add requirements to quick resales with significant price increases, which can affect when you list and how a sale to an FHA buyer proceeds. Verify the current timing provisions and document your renovation thoroughly — a clean scope-of-work file supports the appraisal on any exit."
      },
      {
        question: "What happens if the flip doesn't sell?",
        answer:
          "The loan still matures. Your realistic options are a price cut, an extension from the lender at a cost, or converting to a rental with a refinance takeout — which is only available if the property's numbers support one. That is why underwriting the rental fallback before purchase is the single most protective habit in flipping: it converts a cliff into a slope."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "Regulation Z, 12 CFR § 1026.3, Exempt transactions",
        url: "https://www.consumerfinance.gov/rules-policy/regulations/1026/3/"
      },
      {
        publisher: "U.S. Department of Housing and Urban Development",
        title: "FHA Single Family Housing Policy Handbook 4000.1",
        url: "https://www.hud.gov/program_offices/housing/sfh/handbook_4000-1"
      }
    ],
    related: [
      { href: "/mortgage/renovation", label: "Renovation loans" },
      { href: "/resources/brrrr-financing", label: "BRRRR financing" },
      { href: "/calculators/closing-cost", label: "Closing cost calculator" },
      { href: "/contact", label: "Talk to a broker" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "portfolio-growth-financing",
    category: "investor",
    title: "Scaling a Rental Portfolio: Financing Past the First Few",
    description:
      "Conventional financing gets harder with each rental: financed-property limits, stacking reserves, DTI drag. When and why investors add business-purpose lending.",
    h1: "Financing portfolio growth: what changes after the first few rentals",
    answerSummary:
      "Conventional financing tightens as a portfolio grows: agency rules cap the number of financed properties a borrower can hold, reserve requirements stack with each mortgage, and accumulating payments drag on debt-to-income even when the properties perform. Investors who keep scaling typically add business-purpose financing — DSCR and portfolio loans that qualify each property on its own income — accepting higher pricing in exchange for room to grow.",
    sections: [
      {
        heading: "The first few are the easy ones",
        paragraphs: [
          "An investor's first rental loans look like ordinary mortgages with stricter pricing: document income, show reserves, close. The machinery works because the borrower's personal finances can comfortably absorb one or two more payments. The compounding problem appears with scale — each new mortgage adds an obligation to your debt-to-income calculation, raises the reserves the next loan will demand, and moves you one step closer to the agency ceiling on financed properties. Growth does not fail suddenly; it gets incrementally more expensive to qualify for until, one day, the conventional box simply will not close the next deal.",
          "Knowing where those walls stand before you hit them is the difference between a financing strategy and a series of surprises."
        ]
      },
      {
        heading: "The three walls, specifically",
        paragraphs: [
          "Three mechanisms do most of the constraining, and all three are documented agency policy rather than lender whim."
        ],
        bullets: [
          "Financed-property limits: Fannie Mae's Selling Guide caps the number of financed one- to four-unit residential properties a borrower may have when the new loan is on a second home or investment property, with eligibility rules tightening above a lower count. The specific counts are in the guide — check the current table rather than folklore.",
          "Stacking reserves: agency reserve requirements are computed not just on the subject property but across your other financed properties, so each acquisition raises the liquidity bar for the next.",
          "DTI drag: every mortgage payment enters your debt-to-income ratio, while the Selling Guide's rental income rules count only an adjusted portion of each property's rent — well-performing rentals can still consume qualifying capacity on paper."
        ]
      },
      {
        heading: "When business-purpose lending enters",
        paragraphs: [
          "DSCR and portfolio loans exist for precisely this moment. Because they qualify the property on its rent-to-payment ratio rather than qualifying you on global income, they sidestep the DTI drag; because they sit outside agency delivery rules, the financed-property ceiling does not bind them; and because each loan stands on its property, the model scales property by property, including with entity vesting for investors who hold title in LLCs.",
          "The exchange is explicit and worth naming honestly: business-purpose loans are generally priced above conventional, commonly carry prepayment penalties, and — as credit extended primarily for business purposes — are generally exempt from Regulation Z's consumer protections. The mature way to read that trade: you are giving up consumer-market advantages you can no longer access anyway. The realistic comparison at property number whatever-it-is for you isn't DSCR versus conventional; it is DSCR versus not growing."
        ]
      },
      {
        heading: "Sequencing: use the cheap capacity first",
        paragraphs: [
          "Because conventional capacity is finite and cheaper, order matters. A common pattern among deliberate investors: use conventional financing while DTI, reserves, and the property-count ceiling allow, then transition new acquisitions to business-purpose lending as the walls approach — rather than burning DSCR pricing on early deals that would have qualified conventionally, or discovering the ceiling mid-contract. Periodically, consolidation becomes worth studying too: refinancing several seasoned properties into portfolio structures can simplify a balance sheet, though it trades away flexibility and should be priced skeptically.",
          "There is no universally right sequence — only the one that fits your income documentation, liquidity, and pipeline. The failure mode is not choosing a wrong product; it is not having a sequence at all."
        ]
      },
      {
        heading: "Scaling without fooling yourself",
        paragraphs: [
          "Portfolio growth multiplies whatever your underwriting habits are. Honest cash flow modeling — vacancy, management, maintenance, capital reserves — matters more at ten properties than at one, because thin deals in quantity are a liquidity crisis on a schedule. Keep clean books per property; every future lender will read them, and business-purpose underwriting leans hard on the property-level record. And hold liquidity beyond any lender's minimum, because vacancies correlate — the storm, the insurance repricing, the soft season hit the whole portfolio at once, not one door at a time.",
          "TRACT is a mortgage broker: we arrange conventional, DSCR, and portfolio financing, and we can map your specific position — property count, reserves, income documentation — against the walls described here so the next three acquisitions are financed by plan. We are not investment advisers; how big the portfolio should get was never a mortgage question."
        ]
      }
    ],
    faqs: [
      {
        question: "How many conventional mortgages can one investor have?",
        answer:
          "Fannie Mae's Selling Guide limits the number of financed one- to four-unit properties a borrower may have when obtaining a new loan on a second home or investment property, with stricter eligibility above a lower threshold. The counts are policy figures that have changed over the years, so verify the current limits in the guide rather than relying on a remembered number."
      },
      {
        question: "Do my rental mortgages count against my DTI even when tenants pay them?",
        answer:
          "Yes — each payment is your obligation, and the offsetting rental income is counted only as the Selling Guide's documentation and adjustment rules allow, generally from tax returns or leases with a discount applied. A portfolio can be genuinely profitable and still exhaust conventional qualifying capacity on paper, which is a structural reason investors add DSCR financing."
      },
      {
        question: "Should I refinance my whole portfolio into one loan?",
        answer:
          "Portfolio and blanket structures can simplify management and unlock equity across properties, but they concentrate risk, often carry prepayment penalties, and can make selling a single property more complicated through release provisions. It is a legitimate tool that deserves skeptical pricing against the alternative of individual loans — and your attorney's read on the structure."
      },
      {
        question:
          "Is there a point where I should stop using conventional loans even if I still qualify?",
        answer:
          "Sometimes. Conventional capacity is a finite, cheap resource, and some investors deliberately preserve remaining slots for properties that most benefit from agency terms while routing others to DSCR — especially where entity vesting or income documentation favors it. That is a sequencing judgment based on your pipeline; a broker can model both orders before you commit."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B2-2-03, Multiple Financed Properties for the Same Borrower",
        url: "https://selling-guide.fanniemae.com/sel/b2-2-03/multiple-financed-properties-same-borrower"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B3-4.1-01, Minimum Reserve Requirements",
        url: "https://selling-guide.fanniemae.com/sel/b3-4.1-01/minimum-reserve-requirements"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "Regulation Z, 12 CFR § 1026.3, Exempt transactions",
        url: "https://www.consumerfinance.gov/rules-policy/regulations/1026/3/"
      }
    ],
    related: [
      { href: "/mortgage/dscr", label: "DSCR loans" },
      { href: "/calculators/dscr", label: "DSCR calculator" },
      { href: "/resources/investor-reserves-requirements", label: "Investor reserve requirements" },
      { href: "/plan", label: "Build your financing plan" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  }
];
