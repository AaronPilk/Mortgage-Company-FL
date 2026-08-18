import type { Article } from "./types";

export const CONSTRUCTION_ARTICLES: Article[] = [
  {
    slug: "lot-loans-vs-land-loans",
    category: "construction",
    title: "Lot Loans vs. Land Loans in Florida: Key Differences",
    description:
      "Why an improved lot finances differently from raw acreage: shorter terms, larger equity requirements, and how each parcel type leads to a construction loan.",
    h1: "Lot loans vs. land loans: why the same dirt finances so differently",
    answerSummary:
      "A lot loan finances an improved, buildable parcel: utilities at the street, legal road access, often a platted subdivision. A land loan finances raw acreage with none of that in place. Because raw land is harder to value and harder to resell, lenders that finance it generally require more equity up front and repay the debt over shorter terms, with fewer institutions willing to hold the loan at all.",
    sections: [
      {
        heading: "What makes a lot improved",
        paragraphs: [
          "In lending shorthand, an improved lot is a parcel that is ready to accept a house. Water, sewer or an approved septic site, and electricity are available at or near the property line. The parcel has recorded legal access to a maintained road. It usually sits inside a platted subdivision, which means a surveyor has already fixed its boundaries and a local government has already accepted the plat.",
          "Each of those facts removes a question a lender would otherwise have to price. A platted, utility-served lot in a growing Florida county has a visible resale market: builders and future owners bid on parcels like it every month. That liquidity is what a lot lender is really underwriting."
        ]
      },
      {
        heading: "Why raw land is the hardest collateral in residential lending",
        paragraphs: [
          "Raw acreage produces no shelter and, usually, no income. If a borrower stops paying on a house, the lender at least holds a dwelling someone needs to live in; the Consumer Financial Protection Bureau's consumer materials on construction lending reflect the same idea, that value follows the completed home. If a borrower stops paying on vacant land, the lender holds a parcel whose buyer pool is thin and whose value can swing with entitlement and zoning outcomes it does not control.",
          "Raw land also raises questions improved lots have already answered. Can it be legally accessed? Will the county permit a well and septic system? Are wetlands, flood zones, or protected species on the parcel? None of that is a mortgage question, which is exactly the point: a land lender is exposed to answers it cannot verify from a credit file. Those questions belong with the county property appraiser, the local building and zoning department, and licensed professionals such as surveyors and environmental consultants."
        ]
      },
      {
        heading: "How the financing differs in structure",
        paragraphs: [
          "The pattern across land lenders is consistent even though the numbers vary: more equity from the borrower, shorter repayment periods, and often a balloon structure that assumes the land will be refinanced into a construction loan or sold within a few years. Improved lots sit closer to conventional mortgage treatment; raw acreage sits further away. Any specific down payment or term is a lender-by-lender decision, so treat quoted figures as offers to compare rather than market constants."
        ],
        bullets: [
          "Improved lot: more lender competition, longer terms available, underwriting focused on the borrower",
          "Raw land: fewer lenders, shorter terms, underwriting focused on the parcel itself",
          "Both: the exit plan, usually a build or a sale, matters as much as the purchase"
        ]
      },
      {
        heading: "The path from parcel to construction loan",
        paragraphs: [
          "Most people buying a parcel intend to build, and the financing world is organized around that intention. Fannie Mae's selling guide, for example, lets a single-closing construction-to-permanent transaction treat the borrower's existing equity in the lot as part of the transaction, which is why buying the lot first and building second is a workable sequence rather than a penalty.",
          "In eligible rural areas, USDA Rural Development operates single-family housing programs that can finance building a home, which changes the calculus for acreage outside Florida's metro cores. Program eligibility is address-specific, so the maps and income limits on the USDA site are the authority."
        ]
      },
      {
        heading: "How TRACT fits in",
        paragraphs: [
          "TRACT is a mortgage broker: we arrange financing through lenders, we do not make credit decisions or set prices, and we are not a land-use authority. What a broker adds on a land file is placement, knowing which lenders will even look at unimproved acreage versus a platted lot, and sequencing, structuring the purchase so it does not block the construction loan that follows. Questions about zoning, utilities, and buildability should go to the county before any contract is signed."
        ]
      }
    ],
    faqs: [
      {
        question: "Is a lot loan cheaper than a land loan?",
        answer:
          "Generally the financing on an improved lot carries less lender risk premium than financing on raw acreage, because the collateral is easier to value and resell. The specific pricing difference varies by lender and by parcel, which is one reason comparing multiple lenders matters more on land than on almost any other property type."
      },
      {
        question: "Can I roll a land purchase and construction into one loan?",
        answer:
          "Often, yes. A construction-to-permanent loan can fund the lot purchase and the build together, and Fannie Mae's single-closing rules allow lot equity a borrower already holds to count in the transaction. Whether that structure beats buying the land first depends on timing, builder readiness, and the lenders available for each path."
      },
      {
        question: "What should I check before buying Florida land I plan to build on?",
        answer:
          "Confirm zoning and permitted use with the county, verify legal access and utility availability, review the FEMA flood zone, and get a survey. A lender will ask about all of these eventually; finding a problem after closing on the land means owning a parcel you cannot build on or finance."
      },
      {
        question: "Do lot and land loans close like regular mortgages?",
        answer:
          "The closing looks similar, a note, a mortgage recorded against the parcel, title insurance, but the documents carry land-specific terms: shorter maturities, possible balloon payments, and sometimes an obligation to begin construction by a stated date. Read the maturity and any build-by clause carefully, because refinancing a matured land loan is not automatic."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title:
          "B5-3.1-02, Conversion of Construction-to-Permanent Financing: Single-Closing Transactions",
        url: "https://selling-guide.fanniemae.com/sel/b5-3.1-02/conversion-construction-permanent-financing-single-closing-transactions"
      },
      {
        publisher: "USDA Rural Development",
        title: "Single Family Housing Programs",
        url: "https://www.rd.usda.gov/programs-services/single-family-housing-programs"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is a construction loan?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-construction-loan-en-108/"
      }
    ],
    related: [
      { href: "/mortgage/land", label: "Land loan financing" },
      { href: "/mortgage/construction", label: "Construction loans" },
      {
        href: "/resources/construction-to-permanent",
        label: "How construction-to-permanent loans work"
      },
      { href: "/calculators/affordability", label: "Affordability calculator" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "construction-to-permanent",
    category: "construction",
    title: "Construction-to-Permanent Loans: One Closing, Two Phases",
    description:
      "How a single-close construction-to-permanent loan works: the construction phase, the automatic conversion to a permanent mortgage, and one closing versus two.",
    h1: "Construction-to-permanent financing: one closing that carries you from dirt to mortgage",
    answerSummary:
      "A single-close construction-to-permanent loan funds the build and the long-term mortgage in one transaction. During construction the lender advances money in draws and the borrower typically pays interest only on funds disbursed. When the home is complete, the loan converts to a permanent mortgage under terms set at the original closing, so there is no second application, second approval, or second set of closing costs.",
    sections: [
      {
        heading: "The two phases of a single loan",
        paragraphs: [
          "A construction-to-permanent loan, often shortened to CTP or single-close, is one credit decision covering two very different periods. Phase one is the construction period: the lender disburses funds in stages as the house goes up, and the borrower is billed for interest on the amounts actually advanced. Phase two begins at completion, when the same loan becomes an ordinary amortizing mortgage.",
          "Fannie Mae's selling guide describes the mechanics directly: in a single-closing transaction, the construction loan converts automatically to permanent long-term financing when construction is complete. The guide also caps how long the construction phase can run, so the structure has a built-in clock; check the current limits in the guide itself, since they are program rules rather than physics."
        ]
      },
      {
        heading: "How the conversion actually happens",
        paragraphs: [
          "Because everything was signed at the original closing, conversion is a paperwork event, not a new loan. Depending on how the lender documented the transaction, the note either already contains the permanent terms or is modified at completion under a process agreed to up front. The borrower does not reapply, and the lender does not re-decide the loan, although program rules can require updated credit documents if too much time passes or the borrower's circumstances change materially.",
          "Contrast that with a two-closing structure, which Fannie Mae addresses separately: an interim construction loan is paid off by a brand-new permanent mortgage, with a new note, a second closing, and a second round of qualification. The permanent loan in that structure is underwritten as a refinance."
        ]
      },
      {
        heading: "One closing versus two: the real tradeoffs",
        paragraphs: [
          "The single-close structure buys certainty. The permanent financing is committed before the first shovel of dirt moves, which removes the scenario borrowers fear most: a finished house and no mortgage to pay off the construction lender, because rates moved or circumstances changed during the build.",
          "The two-closing structure buys flexibility at the price of that certainty. The borrower can shop the permanent loan fresh when the house is done, which can work out well or badly depending on where the market has moved, and must qualify again at that point. It also means paying two sets of closing costs. Neither structure dominates; the right choice depends on how much rate and qualification risk a borrower can absorb during a build that may take a year."
        ],
        bullets: [
          "Single close: one approval, one set of closing costs, permanent terms locked before construction",
          "Two closings: interim loan plus a separate permanent refinance, with requalification and second costs",
          "Both: draws, inspections, and builder review work the same way during construction"
        ]
      },
      {
        heading: "Qualifying and the as-completed appraisal",
        paragraphs: [
          "Underwriting a CTP loan means underwriting a house that does not exist yet. The appraiser works from plans, specifications, and the builder contract to produce an as-completed value, and the loan amount is sized against that value under the program's rules. The builder and the budget get reviewed alongside the borrower, because the lender's collateral depends on the project actually finishing.",
          "The Consumer Financial Protection Bureau's overview of construction loans makes the consumer-facing version of the same point: these are short-term, stage-funded loans whose terms vary significantly by lender, so the details in your commitment letter, not a general description, govern your project."
        ]
      },
      {
        heading: "Where a broker earns its place",
        paragraphs: [
          "Construction lending is one of the least standardized corners of the mortgage market. Lenders differ on builder requirements, draw procedures, construction-phase length, and whether they offer single-close at all. TRACT arranges construction financing across multiple lenders and matches the structure to the project; we do not build, inspect, or permit anything, and questions about your specific build belong with your builder and your local building department."
        ]
      }
    ],
    faqs: [
      {
        question: "Do I make full mortgage payments during construction?",
        answer:
          "Typically no. During the construction phase most programs bill interest only on the funds disbursed to date, so payments start small and grow as draws are advanced. Full principal-and-interest payments begin after conversion to the permanent phase. Confirm the exact payment structure in your loan documents, because lenders document this differently."
      },
      {
        question: "What happens if construction runs past the construction phase deadline?",
        answer:
          "Program rules cap the construction period; Fannie Mae's single-closing rules, for example, set maximum construction timelines. If a build runs long, the lender may extend under its policies, sometimes with requalification or updated documents. Build schedule risk is a real underwriting topic, which is one reason lenders vet builders before closing."
      },
      {
        question: "Can I lock permanent terms before the house is built?",
        answer:
          "That is the core promise of a single-closing transaction: permanent terms are established at the original closing, before construction starts. How rate protection works during a long build varies by lender, so ask how the lender handles the construction period before you commit to a structure."
      },
      {
        question: "Is a two-closing construction loan ever the better choice?",
        answer:
          "Sometimes. Borrowers who expect their finances to strengthen during the build, or who want to shop permanent financing fresh at completion, may prefer two closings despite the second set of costs and the requalification. It is a risk allocation decision, not a right-or-wrong answer."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title:
          "B5-3.1-02, Conversion of Construction-to-Permanent Financing: Single-Closing Transactions",
        url: "https://selling-guide.fanniemae.com/sel/b5-3.1-02/conversion-construction-permanent-financing-single-closing-transactions"
      },
      {
        publisher: "Fannie Mae",
        title:
          "B5-3.1-03, Conversion of Construction-to-Permanent Financing: Two-Closing Transactions",
        url: "https://selling-guide.fanniemae.com/sel/b5-3.1-03/conversion-construction-permanent-financing-two-closing-transactions"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is a construction loan?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-construction-loan-en-108/"
      }
    ],
    related: [
      { href: "/mortgage/construction", label: "Construction loans" },
      {
        href: "/resources/construction-draws-inspections",
        label: "How construction draws and inspections work"
      },
      { href: "/resources/lot-loans-vs-land-loans", label: "Lot loans vs. land loans" },
      { href: "/calculators/mortgage-payment", label: "Mortgage payment calculator" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "construction-draws-inspections",
    category: "construction",
    title: "Construction Loan Draws and Inspections, Explained",
    description:
      "How the draw schedule on a construction loan works: inspections before each disbursement, interest billed on funds advanced, and how disclosure handles it all.",
    h1: "Draws, inspections, and construction-phase interest: how the money actually moves",
    answerSummary:
      "Construction loans disburse in stages called draws, tied to completed work rather than the calendar. Before releasing each draw, the lender typically sends an inspector to confirm the work claimed is actually in place, and collects lien waivers from the builder. Interest during construction is billed on the funds advanced so far, not the full loan amount, so carrying costs start small and grow with the house.",
    sections: [
      {
        heading: "Why construction money moves in stages",
        paragraphs: [
          "A construction lender never hands over the full loan amount on day one, because on day one the collateral is a vacant lot. Instead, the budget is broken into a draw schedule keyed to milestones: foundation, framing, dry-in, mechanical rough-ins, drywall, finishes. As each stage completes, the builder requests a draw and the lender advances the portion of the budget that stage represents.",
          "The Consumer Financial Protection Bureau's consumer guidance describes the same mechanic from the borrower's side: construction loans are short-term loans whose funds are disbursed in stages while the home is built. The staging is not bureaucracy for its own sake. It keeps the loan balance roughly in line with the value of the work actually standing on the site, which protects both the lender and the borrower if the project stalls."
        ]
      },
      {
        heading: "The inspection before every disbursement",
        paragraphs: [
          "Between the draw request and the wire sits verification. The lender sends an inspector, or in some cases relies on a title company or fund-control service, to confirm that the work billed for is complete and roughly consistent with the plans. Lenders also commonly require lien waivers, in which the builder and major subcontractors confirm they have been paid for prior work, and a title update to catch any construction liens recorded against the property.",
          "Borrowers sometimes read this as friction. It is closer to protection. A draw released against work that does not exist is a hole in the budget that surfaces at the worst possible time, near the end of the project when the money is gone and the house is not finished. Lender inspections are not a substitute for the county's building inspections or for the borrower's own walk-throughs; they verify progress for disbursement purposes, nothing more."
        ]
      },
      {
        heading: "Interest during construction",
        paragraphs: [
          "During the build, interest is charged on the amount actually advanced, not on the full commitment. Early in the project, when only the foundation draw is outstanding, the monthly interest bill is modest. By the final draws, the borrower is paying interest on most of the construction budget. Many lenders structure this as interest-only billing during the construction phase, with amortizing payments starting at conversion.",
          "Because the pace of draws is unknowable at closing, federal disclosure rules provide a defined method for estimating construction interest. Appendix D to Regulation Z, Part 1026, titled Multiple Advance Construction Loans, lets creditors estimate interest and the annual percentage rate for loans advanced in stages, which is why your Loan Estimate can state figures for a project whose draw timing has not happened yet. The disclosure is an estimate by design; the interest you actually pay follows the actual draws."
        ]
      },
      {
        heading: "What a typical draw cycle looks like",
        paragraphs: [
          "The rhythm repeats through the project, and knowing it in advance keeps expectations realistic. Draw turnaround times vary by lender and are worth asking about before closing, because a builder waiting two weeks for money is a builder not scheduling subcontractors."
        ],
        bullets: [
          "Builder completes a milestone and submits a draw request against the approved budget",
          "Lender orders an inspection to confirm the claimed work is in place",
          "Title is updated and lien waivers are collected for previously funded work",
          "Funds are disbursed, and interest begins accruing on the new, larger outstanding balance",
          "At completion, the final draw funds and the loan converts or is refinanced into permanent financing"
        ]
      },
      {
        heading: "Where borrowers and brokers fit in the process",
        paragraphs: [
          "Fannie Mae's construction-to-permanent rules assume this draw-and-verify machinery exists; it is part of what makes a construction loan deliverable as a conventional mortgage after conversion. As a broker, TRACT's job is before the first draw: placing the loan with a lender whose draw procedures, inspection expectations, and construction timeline fit the project and the builder. During the build, the draw relationship runs between borrower, builder, and lender. Disputes about workmanship or code compliance belong with the builder and the local building department, not the loan file."
        ]
      }
    ],
    faqs: [
      {
        question: "Who requests the draw, the borrower or the builder?",
        answer:
          "It depends on the loan documents. On most residential construction loans the builder submits draw requests against the approved schedule, but the borrower usually signs off, and on some programs the borrower formally requests each draw. Read the draw provisions before closing so nobody is surprised mid-project."
      },
      {
        question: "What if the inspection finds less work done than the draw claims?",
        answer:
          "The lender funds only what is verified, holding back the difference until the work is actually in place. Holdbacks are normal and self-correcting on healthy projects. Repeated shortfalls are an early warning about the builder or the budget, and they are far cheaper to confront at draw three than at draw ten."
      },
      {
        question: "Do I pay interest on the whole loan from day one?",
        answer:
          "No. Interest accrues on funds disbursed, so the bill grows as draws are advanced. Federal disclosure rules, Appendix D to Regulation Z, provide the method lenders use to estimate total construction interest up front, but your actual interest follows your actual draw pace."
      },
      {
        question: "Can the draw schedule change after closing?",
        answer:
          "Only with lender consent, since the schedule is part of the loan agreement. Lenders often accommodate legitimate re-sequencing, a builder moving mechanical work earlier, for example, but they will not advance funds ahead of verified progress. If the budget itself changes, expect a formal change order process rather than an informal reshuffle."
      }
    ],
    sources: [
      {
        publisher: "eCFR, Regulation Z",
        title: "Appendix D to Part 1026, Multiple Advance Construction Loans",
        url: "https://www.ecfr.gov/current/title-12/chapter-X/part-1026/appendix-Appendix%20D%20to%20Part%201026"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is a construction loan?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-construction-loan-en-108/"
      },
      {
        publisher: "Fannie Mae",
        title:
          "B5-3.1-02, Conversion of Construction-to-Permanent Financing: Single-Closing Transactions",
        url: "https://selling-guide.fanniemae.com/sel/b5-3.1-02/conversion-construction-permanent-financing-single-closing-transactions"
      }
    ],
    related: [
      {
        href: "/resources/construction-to-permanent",
        label: "Construction-to-permanent loans explained"
      },
      { href: "/mortgage/construction", label: "Construction loans" },
      { href: "/resources/builder-approval-process", label: "Why lenders vet your builder" },
      { href: "/calculators/amortization", label: "Amortization calculator" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "builder-approval-process",
    category: "construction",
    title: "Why Construction Lenders Vet Your Builder",
    description:
      "Before funding a build, lenders review the builder: Florida licensure under Chapter 489, insurance, financial standing, and track record. Here is what they check.",
    h1: "The builder approval process: why your lender underwrites your contractor",
    answerSummary:
      "On a construction loan, the lender's collateral is a house that does not exist yet, so the builder's ability to finish it is part of the credit decision. Lenders typically verify Florida contractor licensure, confirm liability and workers compensation coverage, review the builder's financial standing and references, and examine the construction contract and budget before approving the project for funding.",
    sections: [
      {
        heading: "The builder is part of the collateral",
        paragraphs: [
          "A mortgage on an existing home is secured by something the lender can inspect and appraise today. A construction loan is secured mostly by a promise: plans, a budget, and a contract with the person who will turn advances into a building. If the builder fails, the lender is left holding a partially completed structure that is worth less than the money advanced against it. Builder review is how lenders price that risk down before it exists.",
          "Agency guidelines make the expectation explicit. Fannie Mae's renovation rules, for instance, require the contractor to be reviewed and state that the borrower must choose one; the lender must be satisfied the contractor is qualified and experienced for the work being financed. Construction lenders apply the same logic, usually with more paperwork, to a ground-up build."
        ]
      },
      {
        heading: "Licensing: the Florida baseline",
        paragraphs: [
          "In Florida, construction contracting is a licensed profession governed by Chapter 489 of the Florida Statutes, which sets out who may contract, what classifications exist, and what happens to those who contract without a license. The Department of Business and Professional Regulation administers contractor licensure, and license status is publicly verifiable through the state's online license search.",
          "For a lender, an active, correctly classified license is the entry ticket, not the finish line. It confirms the builder may legally pull permits and contract for the work. It says nothing about whether the builder can manage your project's cash flow, which is why the review continues past the license check. Verifying a specific builder's license and complaint history is something borrowers can and should do themselves through the state, independent of the loan."
        ]
      },
      {
        heading: "Insurance, financials, and track record",
        paragraphs: [
          "Beyond the license, lender builder packages commonly ask for proof of general liability insurance and workers compensation coverage, since an uninsured jobsite accident can turn into a lien or lawsuit attached to the lender's collateral. Many lenders also review the builder's financial references, supplier and subcontractor payment history, and a portfolio of completed projects comparable in scope to yours.",
          "The track record question is the quiet center of the review. A builder who has completed twenty houses like yours, on budgets like yours, is a different credit risk than one attempting a first custom home, even if both hold identical licenses. Lenders vary in how formally they score this; some maintain approved builder lists, others review each builder per project."
        ]
      },
      {
        heading: "What lenders typically collect",
        paragraphs: [
          "The exact package differs by lender, but a Florida builder approval file usually draws from the same list."
        ],
        bullets: [
          "Current Florida contractor license in the correct classification, verifiable with the state",
          "Certificates of general liability and workers compensation insurance",
          "Builder questionnaire or resume covering years in business and completed projects",
          "References from lenders, suppliers, and subcontractors",
          "The executed construction contract, plans, specifications, and a line-item budget"
        ]
      },
      {
        heading: "When a builder does not pass, and what a broker does about it",
        paragraphs: [
          "A declined builder is not always a condemned builder; it may simply be a mismatch with that lender's requirements. Some lenders decline builders with short operating histories or projects outside their usual scope. Because requirements differ, a project rejected at one institution can be fundable at another whose builder criteria fit. That placement question is where TRACT operates: we arrange construction financing with lenders whose builder requirements match the team you have hired. We do not license, endorse, or supervise contractors, and disputes about work quality belong with the builder, the local building department, and the state licensing board."
        ]
      }
    ],
    faqs: [
      {
        question: "Can I use an unlicensed handyman as my general contractor in Florida?",
        answer:
          "Not for work that Chapter 489 of the Florida Statutes reserves to licensed contractors, and as a practical matter no construction lender will fund a ground-up build run by an unlicensed contractor. Unlicensed contracting carries legal consequences in Florida, and it makes the project unfinanceable."
      },
      {
        question: "How do I verify a Florida builder's license myself?",
        answer:
          "Use the state's public license search, administered by the Department of Business and Professional Regulation, to confirm the license is active, correctly classified for your project, and free of discipline. Do this before signing a contract, not after; lenders will run the same check, and finding a problem early costs nothing."
      },
      {
        question: "My builder is approved with one lender. Does that transfer?",
        answer:
          "No. Builder approval is lender-specific. Each institution applies its own criteria, so a builder in good standing with one lender still submits a package to the next. If your preferred lender declines your builder, another lender with different requirements may accept the same file."
      },
      {
        question: "Does the lender guarantee my builder's work?",
        answer:
          "No. Builder review protects the loan, not the workmanship. The lender verifies progress for disbursement purposes only. Your protections on quality come from your contract, Florida's licensing and permitting system, and the county inspection process, so invest in a strong contract before construction starts."
      },
      {
        question: "How long does builder approval take?",
        answer:
          "It depends on the lender and on how complete the builder's package is. A builder who can produce license, insurance, references, and a comparable project history promptly can clear review in days; missing documents stretch it into weeks. Starting the builder package alongside the loan application, rather than after approval, keeps the closing timeline honest."
      }
    ],
    sources: [
      {
        publisher: "Florida Legislature, Online Sunshine",
        title: "Florida Statutes, Chapter 489, Contracting",
        url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0400-0499/0489/0489.html"
      },
      {
        publisher: "Fannie Mae",
        title: "B5-3.2-03, HomeStyle Renovation Mortgages: Collateral Considerations",
        url: "https://selling-guide.fanniemae.com/sel/b5-3.2-03/homestyle-renovation-mortgages-collateral-considerations"
      },
      {
        publisher: "Florida Senate",
        title: "Florida Statutes, Section 489.103, Exemptions",
        url: "https://www.flsenate.gov/Laws/Statutes/2025/489.103"
      }
    ],
    related: [
      { href: "/mortgage/construction", label: "Construction loans" },
      { href: "/resources/owner-builder-realities", label: "Owner-builder financing realities" },
      {
        href: "/resources/construction-draws-inspections",
        label: "Draws and inspections explained"
      },
      { href: "/contact", label: "Talk to TRACT about a construction project" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "owner-builder-realities",
    category: "construction",
    title: "Owner-Builder Loans: Why They Are So Hard to Place",
    description:
      "Florida law lets you act as your own contractor, but construction lenders rarely fund it. What lenders fear about owner-builder projects, and workable paths.",
    h1: "Owner-builder financing: legal to do, hard to fund",
    answerSummary:
      "Florida's owner-builder exemption lets a property owner act as their own contractor on their own residence, but a legal right to build is not a loan approval. Most construction lenders decline owner-builder projects because completion risk concentrates in one inexperienced person: no licensed general contractor stands behind the schedule, the budget, or the subcontractors. The realistic paths are hiring a licensed builder, or finding one of the few lenders with a genuine owner-builder program.",
    sections: [
      {
        heading: "What owner-builder actually means in Florida",
        paragraphs: [
          "Section 489.103 of the Florida Statutes exempts owners from contractor licensing when they build or improve certain property for their own use, provide direct onsite supervision of work not performed by licensed contractors, and personally appear to sign the building permit application. The statute also requires a disclosure acknowledging the risks, including that an owner may be liable if an unlicensed worker is injured on the property.",
          "Read that disclosure the way a lender does. The state is telling owner-builders, in statute, that they are stepping into the responsibilities of a contractor: supervision, worksite liability, and compliance. The exemption exists to preserve a property right, not to suggest the role is easy."
        ]
      },
      {
        heading: "What lenders fear, specifically",
        paragraphs: [
          "Construction lending already carries the risk that the collateral does not exist until the project succeeds. A licensed general contractor mitigates that risk with experience, subcontractor relationships, supplier credit, and a license the state can discipline. An owner-builder removes every one of those mitigants at once, and replaces them with a borrower who is usually managing a construction schedule for the first time while working a full-time job.",
          "The failure patterns lenders have seen are consistent: budgets built without contractor pricing knowledge run over, schedules slip when subcontractors deprioritize a one-time customer, and half-finished projects stall when money and stamina run out together. A stalled owner-builder project is close to a worst-case asset, a partially built house with no contractor under contract to finish it. Agency renovation guidelines reflect the same instinct; Fannie Mae's HomeStyle rules, for example, tightly restrict when borrowers may perform their own work."
        ]
      },
      {
        heading: "Why saving the builder fee often is not a saving",
        paragraphs: [
          "The case for owner-building is usually financial: cut out the general contractor's overhead and fee. Against that saving, weigh what the fee purchases. A contractor's pricing power with subcontractors and suppliers frequently offsets a meaningful share of the fee. Mistakes an experienced builder would not make, wrong sequencing, rework after failed inspections, materials ordered twice, land in the owner's column. And financing itself gets more expensive when few lenders compete for the loan, which is a real cost even though it never appears on a builder invoice."
        ]
      },
      {
        heading: "Paths that actually get funded",
        paragraphs: [
          "Owner-builder projects do get financed; they just get financed narrowly. The workable structures cluster into a few shapes."
        ],
        bullets: [
          "Hire a licensed general contractor and finance conventionally, the widest and usually cheapest path",
          "Engage a licensed builder in a supervisory or construction-manager role acceptable to the lender",
          "Find one of the limited number of lenders with an explicit owner-builder program, typically with strong documentation of the owner's relevant experience",
          "Build in phases from cash and finance the completed home afterward, which trades financing risk for time"
        ]
      },
      {
        heading: "How TRACT approaches an owner-builder file",
        paragraphs: [
          "TRACT is a broker, so our contribution is placement and honesty about odds. If you have professional construction experience, we can help present it to the lenders that will weigh it; a licensed tradesperson building their own home is a different file than a first-timer with a spreadsheet. If the numbers only work without a contractor, that is usually a sign the budget is too tight to survive construction at all. Permitting and code questions belong with your local building department, and the owner-builder disclosure in Section 489.103 deserves a careful read before you sign a permit application."
        ]
      }
    ],
    faqs: [
      {
        question: "Does Florida's owner-builder exemption mean lenders must consider me?",
        answer:
          "No. The exemption in Section 489.103 governs licensing, not lending. It makes it legal for you to pull your own permit on your own residence; it places no obligation on any lender to finance the project. Credit appetite for owner-builder construction is a business decision each lender makes independently."
      },
      {
        question: "I work in construction. Does that change my odds?",
        answer:
          "Meaningfully, with the right lender. Documented professional experience, a realistic budget with contractor-grade pricing, and strong reserves address the exact risks that cause declines. The pool of willing lenders is still small, so expect the search to be a placement exercise rather than a rate-shopping exercise."
      },
      {
        question: "Can I owner-build and refinance once the house is done?",
        answer:
          "If you can fund construction from cash or other resources, financing the completed home afterward is an ordinary mortgage transaction. The risk transfers to you during the build: cost overruns, stalls, and anything that prevents completion are yours alone until there is a finished, appraisable house."
      },
      {
        question: "What happens if an owner-builder project stalls before completion?",
        answer:
          "A stalled project is the exact scenario lender caution exists to avoid. The construction loan still matures on schedule, interest keeps accruing on the funds drawn, and the collateral is a structure no ordinary buyer or lender wants in its current condition. Finishing usually means hiring a licensed contractor at retail pricing, precisely the cost the owner-builder plan was meant to avoid. Deep cash reserves, a realistic schedule, and a fallback contractor relationship are cheaper to arrange at the start than to improvise mid-frame."
      }
    ],
    sources: [
      {
        publisher: "Florida Senate",
        title: "Florida Statutes, Section 489.103, Exemptions (owner-builder provisions)",
        url: "https://www.flsenate.gov/Laws/Statutes/2025/489.103"
      },
      {
        publisher: "Fannie Mae",
        title: "B5-3.2-03, HomeStyle Renovation Mortgages: Collateral Considerations",
        url: "https://selling-guide.fanniemae.com/sel/b5-3.2-03/homestyle-renovation-mortgages-collateral-considerations"
      },
      {
        publisher: "Florida Legislature, Online Sunshine",
        title: "Florida Statutes, Chapter 489, Contracting",
        url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0400-0499/0489/0489.html"
      }
    ],
    related: [
      { href: "/resources/builder-approval-process", label: "Why lenders vet your builder" },
      { href: "/mortgage/construction", label: "Construction loans" },
      { href: "/contact", label: "Discuss your project with TRACT" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "adu-financing-florida",
    category: "construction",
    title: "Financing an ADU in Florida: Renovation Loan Paths",
    description:
      "How to finance an accessory dwelling unit in Florida: renovation loan options, how appraisers treat ADU value, and when rental income can help you qualify.",
    h1: "Financing an accessory dwelling unit in Florida",
    answerSummary:
      "Most Florida homeowners finance an accessory dwelling unit through a renovation loan, such as Fannie Mae HomeStyle, Freddie Mac CHOICERenovation, or FHA 203(k), which lends against the as-completed value of the property with the ADU in place. Agency rules generally allow one ADU per parcel, require it to be a legal use, and permit ADU rental income in qualifying only under specific documentation requirements.",
    sections: [
      {
        heading: "What counts as an ADU to a lender",
        paragraphs: [
          "Fannie Mae's property eligibility rules describe an accessory dwelling unit as an additional living area independent of the primary dwelling, whether added to it, created within it, or detached from it, with its own kitchen, sleeping area, and bathroom. The same rules generally allow one ADU on a one-unit property and require the unit to be a permissible use, which pulls local zoning directly into the loan file.",
          "That definition does the sorting. A garage apartment with a full kitchen is an ADU; a bonus room over the garage without one is just square footage. The distinction matters because it changes how the appraisal treats the space and whether its rental potential can ever count toward qualifying."
        ]
      },
      {
        heading: "The Florida legal backdrop",
        paragraphs: [
          "Florida addresses ADUs in Section 163.31771 of the statutes, which authorizes local governments to adopt ordinances allowing accessory dwelling units in single-family residential zones as a way of expanding affordable rental housing. Authorization is the key word: whether ADUs are permitted on your parcel, at what size, and with what parking or occupancy conditions is decided by your city or county code, not by state law or by any lender.",
          "Before pricing construction or financing, confirm with your local planning or zoning department that an ADU is a legal use for your lot and what the permit path looks like. A lender will require the unit to be legal, and an unpermitted conversion can subtract value and financing options rather than add them."
        ]
      },
      {
        heading: "The renovation loan paths",
        paragraphs: [
          "Because an ADU is construction attached to an existing home, the natural financing vehicles are renovation mortgages, which fund purchase-plus-construction or refinance-plus-construction in a single loan underwritten to the as-completed value. Fannie Mae's HomeStyle Renovation program finances renovations including additions and accessory units; Freddie Mac's CHOICERenovation program serves the same role in that agency's system; and FHA's 203(k) rehabilitation mortgage insurance program offers a government-insured route with its own rules on eligible improvements.",
          "Homeowners with substantial equity sometimes use cash-out refinancing or home equity products instead, trading renovation-loan oversight for simplicity. The tradeoff is real on both sides: renovation loans bring draw schedules, contractor review, and contingency reserves, while equity-based routes require the equity to already exist and place the construction risk management entirely on the owner."
        ]
      },
      {
        heading: "How value and rental income are treated",
        paragraphs: [
          "Two underwriting questions decide most ADU files. First, value: on a renovation loan the appraiser estimates the as-completed value of the property with the ADU finished, and the loan is sized against that value under program limits. How much value an ADU adds varies sharply by market, so the appraisal, not the construction budget, is the number that governs.",
          "Second, income: whether expected rent from the ADU can help you qualify. Agency rules permit ADU rental income only under specific conditions and documentation requirements; Fannie Mae's guide, for example, routes the question to its rental income policy with its own eligibility tests. Treat rental income as a possibility to verify against current guidelines, not an assumption to build the budget on."
        ]
      },
      {
        heading: "Sequencing the project",
        paragraphs: [
          "The files that close smoothly tend to follow the same order: zoning confirmation first, then a licensed contractor's bid, then financing structured around the real budget. TRACT arranges renovation and construction financing across these programs and can map which path fits your equity, timeline, and contractor. We are not a zoning authority or a builder; permitted use and construction cost questions belong with your local government and your licensed contractor, respectively."
        ]
      }
    ],
    faqs: [
      {
        question: "Can I count future Airbnb income from my ADU to qualify?",
        answer:
          "Short-term rental projections are generally the hardest income to use in qualifying, and long-term ADU rental income is usable only under specific agency conditions and documentation rules. Assume the loan must work without the income, and treat any income allowance confirmed under current guidelines as improvement rather than foundation."
      },
      {
        question: "Does an ADU make my home a two-unit property?",
        answer:
          "Not under agency rules. A one-unit property with one qualifying ADU is still underwritten as a one-unit property; that classification is exactly what the ADU provisions in Fannie Mae's guide exist to preserve. A second full unit that does not meet ADU criteria can change the property type and the applicable loan rules."
      },
      {
        question: "What if my ADU was built without permits?",
        answer:
          "Unpermitted space is a problem for value, insurance, and financing. Appraisers may give it little or no value, and lenders require legal use. Your local building department can explain whether a retroactive permit path exists for the unit; resolving legality before applying is almost always the right order."
      },
      {
        question: "Is a detached ADU financed differently from a garage conversion?",
        answer:
          "The loan programs are the same; the budget and appraisal differ. Detached new construction usually costs more and adds more complexity, site work, utilities, and a foundation, while conversions work within an existing structure. Either way the loan is sized against the as-completed appraised value under the program's rules."
      },
      {
        question: "Do I need a licensed contractor to build a financed ADU?",
        answer:
          "As a practical matter, yes. Renovation programs require qualified contractors under lender review, and Florida licensing law governs who may perform structural, electrical, and plumbing work. Self-performed work under renovation programs is tightly restricted, so budget for a licensed builder from the first estimate onward."
      }
    ],
    sources: [
      {
        publisher: "Florida Senate",
        title: "Florida Statutes, Section 163.31771, Accessory dwelling units",
        url: "https://www.flsenate.gov/Laws/Statutes/2025/163.31771"
      },
      {
        publisher: "Fannie Mae",
        title: "B2-3-04, Special Property Eligibility Considerations",
        url: "https://selling-guide.fanniemae.com/sel/b2-3-04/special-property-eligibility-considerations"
      },
      {
        publisher: "Fannie Mae",
        title: "B5-3.2-01, HomeStyle Renovation Mortgages",
        url: "https://selling-guide.fanniemae.com/sel/b5-3.2-01/homestyle-renovation-mortgages"
      },
      {
        publisher: "Freddie Mac",
        title: "CHOICERenovation Mortgages",
        url: "https://sf.freddiemac.com/working-with-us/origination-underwriting/mortgage-products/choicerenovation"
      }
    ],
    related: [
      { href: "/mortgage/renovation", label: "Renovation loans" },
      {
        href: "/resources/renovation-budget-contingency",
        label: "Why renovation loans carry contingency"
      },
      { href: "/calculators/investment-property-cash-flow", label: "Rental cash flow calculator" },
      { href: "/locations/florida", label: "Florida mortgage services" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "manufactured-home-financing",
    category: "construction",
    title: "Manufactured Home Financing: Titling and Foundations",
    description:
      "HUD-code manufactured homes can qualify for mortgage financing, but titling as real property and meeting foundation standards decide which programs are open.",
    h1: "Financing a manufactured home: why titling and the foundation decide everything",
    answerSummary:
      "A manufactured home is a factory-built house constructed to the federal HUD code and bearing a HUD certification label. Whether it can be financed with a mortgage depends chiefly on two things: the home must be titled as real property together with the land, rather than as personal property like a vehicle, and it must be installed on a foundation meeting the applicable federal and program standards.",
    sections: [
      {
        heading: "What HUD-code actually means",
        paragraphs: [
          "Manufactured homes are the only housing type built to a federal construction code. HUD's Office of Manufactured Housing Programs administers the standards program created by the National Manufactured Housing Construction and Safety Standards Act of 1974, overseeing factory inspections and enforcement of construction and safety standards nationwide. Homes built under this system carry a HUD certification label, the small red plate attached to each transportable section.",
          "The vocabulary matters when shopping for financing. A manufactured home is HUD-code. A modular home is factory-built to the same state and local building codes as site-built housing, and is generally financed like a site-built house. A mobile home, strictly speaking, predates the federal standards, and pre-code homes face the narrowest financing options of all."
        ]
      },
      {
        heading: "Real property versus personal property",
        paragraphs: [
          "Most manufactured homes leave the factory titled like a vehicle, as personal property. A mortgage, by contrast, is a lien on real estate. Fannie Mae's legal requirements state the principle plainly: the manufactured home must be legally classified as real property under applicable state law before the loan is eligible. Converting title, sometimes called retiring the title, is a state-law process that attaches the home to the land in the public records.",
          "The distinction is not paperwork trivia; it determines which market finances the home. Real-property manufactured homes can access mortgage programs with mortgage-style pricing and terms. Personal-property homes are financed, if at all, through chattel lending, a separate market with different pricing, terms, and protections. In Florida the conversion runs through state titling procedures, and a title company or attorney handles it in most transactions."
        ]
      },
      {
        heading: "Foundations and installation standards",
        paragraphs: [
          "Federal law also governs how a manufactured home is installed. The Model Manufactured Home Installation Standards at 24 CFR Part 3285 set minimum requirements for the initial installation of new homes, including an entire subpart on foundations, footings, piers, and anchoring, with special provisions for flood hazard areas, a familiar Florida concern. Individual loan programs then layer their own foundation requirements on top; government-backed programs are known for requiring engineered permanent foundations, with the details set out in each agency's current handbooks.",
          "Practical consequence: a home that has been moved from its original installation, or one sitting on a nonconforming foundation, can be difficult or impossible to finance under major programs. Foundation certifications by licensed engineers are a routine condition on manufactured home loans, so the state of the foundation is worth establishing before a contract, not during underwriting."
        ]
      },
      {
        heading: "Which programs finance manufactured homes",
        paragraphs: [
          "With real-property title and a conforming foundation, the program menu is wider than most buyers expect, though each program applies its own eligibility rules and property conditions."
        ],
        bullets: [
          "Conventional financing under Fannie Mae and Freddie Mac manufactured housing guidelines, including newer-generation products for homes with site-built characteristics",
          "FHA-insured financing for qualifying real-property manufactured homes",
          "VA and USDA programs for eligible borrowers and properties under those agencies' rules",
          "Chattel lending for personal-property homes, a distinct market with distinct terms"
        ]
      },
      {
        heading: "Buying one in Florida",
        paragraphs: [
          "Florida has one of the largest manufactured housing stocks in the country, so lenders here see these files constantly; the ones that stall share the same three culprits, title status, foundation condition, and homes moved from their first site. TRACT arranges manufactured home financing through lenders active in each program and can tell you early which market your specific home falls into. Questions about a home's HUD label, data plate, or construction standard belong with HUD's manufactured housing resources, and title conversion mechanics belong with your closing agent."
        ]
      }
    ],
    faqs: [
      {
        question: "How do I tell whether a home is manufactured or modular?",
        answer:
          "Look for the HUD certification label, a metal plate on the exterior of each section, and the data plate inside the home. Those mark a HUD-code manufactured home. A modular home instead carries state or local code certification and is generally financed like site-built housing, so the distinction changes your loan options."
      },
      {
        question: "Can I get a mortgage on a manufactured home in a leased-lot community?",
        answer:
          "Generally not a standard mortgage, because a mortgage attaches to land the borrower owns. Homes on leased land are typically financed as personal property through chattel lending, a different market with different terms. Owning the lot and converting title to real property is what opens mortgage programs."
      },
      {
        question: "Does an older manufactured home qualify for financing?",
        answer:
          "Age matters mainly through the June 1976 line, when the federal HUD code took effect. Pre-code homes are outside most mainstream programs entirely. Post-code homes are evaluated on title status, foundation, condition, and whether the home has been moved, under each program's current rules rather than a single age cutoff."
      },
      {
        question: "The home was moved from its original site. Is that a problem?",
        answer:
          "Often, yes. Several major programs restrict or prohibit financing homes relocated from their initial installation, and a move raises engineering questions about the foundation and structure. Disclose a move immediately, because it narrows the lender list and is far better discovered at application than at appraisal."
      },
      {
        question: "Can a new manufactured home and land be financed together?",
        answer:
          "Yes. Buying land and placing a new manufactured home on it can be financed as one transaction under programs that treat the combination like construction lending: the home purchase, transport, foundation, and site work enter a single budget, with title converted to real property at completion. Availability varies by lender, so this is a placement question."
      }
    ],
    sources: [
      {
        publisher: "U.S. Department of Housing and Urban Development",
        title: "Office of Manufactured Housing Programs",
        url: "https://www.hud.gov/program_offices/housing/rmra/mhs/mhshome"
      },
      {
        publisher: "Fannie Mae",
        title: "B5-2-05, Manufactured Housing Legal Considerations",
        url: "https://selling-guide.fanniemae.com/sel/b5-2-05/manufactured-housing-legal-considerations"
      },
      {
        publisher: "eCFR",
        title: "24 CFR Part 3285, Model Manufactured Home Installation Standards",
        url: "https://www.ecfr.gov/current/title-24/subtitle-B/chapter-XX/part-3285"
      }
    ],
    related: [
      { href: "/mortgage/fha", label: "FHA loans" },
      { href: "/mortgage/conventional", label: "Conventional loans" },
      {
        href: "/resources/well-septic-financing",
        label: "Wells, septic, and rural property loans"
      },
      { href: "/locations/florida", label: "Florida mortgage services" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "well-septic-financing",
    category: "construction",
    title: "Wells, Septic Systems, and Rural Florida Mortgages",
    description:
      "Private wells and septic systems add steps to a rural mortgage: water tests, septic evaluations, and program site requirements. What to expect and who decides.",
    h1: "Financing a home on well and septic: the rural property checklist",
    answerSummary:
      "Homes served by private wells and septic systems can be financed through conventional and government programs, but the systems themselves become part of underwriting. Depending on the program and what the appraisal surfaces, lenders may require water quality testing, evidence the septic system functions, and confirmation the property meets site standards such as those in USDA's guaranteed loan regulation, which requires adequate water and wastewater disposal systems.",
    sections: [
      {
        heading: "Why private systems get lender attention",
        paragraphs: [
          "On a city-services home, water and sewer are utilities someone else maintains. On a rural parcel, the well and the septic system are unpriced mechanical assets belonging to the property, and a failure in either is a five-figure problem that lands on the owner. Lenders and the agencies behind them treat the systems as part of the collateral: a house without safe water or working waste disposal is not fully habitable, whatever its square footage says.",
          "The regulatory language is straightforward. USDA's guaranteed single-family program regulation at 7 CFR 3555.201 requires that a site be supported by adequate utilities and water and wastewater disposal systems, and permits certain private and community systems where the lender determines they are adequate, safe, and code-compliant. FHA's Single Family Housing Policy Handbook 4000.1 carries its own property acceptability criteria for wells and onsite sewage systems, applied through the appraisal and underwriting process."
        ]
      },
      {
        heading: "Water testing: when it happens and what it covers",
        paragraphs: [
          "Water testing is not automatic on every loan. Conventional lenders typically act on what the appraisal flags, while government programs require testing in defined situations, new construction, appraiser-noted concerns, or jurisdiction requirements among them, under the current versions of their handbooks. When a test is required, it is performed on a sample analyzed by a qualified laboratory against the applicable safe-water standards, and a failed result becomes a condition to clear, usually through treatment and retesting.",
          "Timing advice from experience: if you are buying a well-served home under a government program, ask your lender early whether a water test will be required and schedule it with room to respond. Treatment systems can usually cure a failed result, but not in the last week before closing."
        ]
      },
      {
        heading: "Septic evaluations and the county layer",
        paragraphs: [
          "Septic scrutiny follows the same pattern: the appraiser notes observable problems, and programs require evaluation where their rules or the evidence calls for one. A septic inspection by a licensed contractor examines the tank and drainfield and reports whether the system is functioning as designed. Separately from lending, Florida regulates onsite sewage treatment and disposal systems through a state permitting program administered with county health departments, which is where questions about permits, capacity, and repairs belong.",
          "Well-and-septic properties also carry siting rules, minimum separation between a well and a septic system among them, set by state and local regulation. Lenders do not invent these standards; they rely on the applicable authority, which is why documentation from the county often resolves a lender condition faster than argument."
        ]
      },
      {
        heading: "What to line up on a well and septic purchase",
        paragraphs: [
          "A rural file closes on schedule when the property evidence is assembled early rather than discovered late."
        ],
        bullets: [
          "Ask early which tests and inspections your program will require, before the appraisal is ordered",
          "Budget for the water test, septic evaluation, and any survey showing system locations",
          "Locate permit records for the well and septic system through the county",
          "If a system fails, get repair bids quickly; repairs can often be negotiated or escrowed under program rules",
          "On new construction, expect the systems to be permitted and approved before final draw or closing"
        ]
      },
      {
        heading: "Programs built for rural property",
        paragraphs: [
          "It is no accident that the agency with the most explicit site language, USDA, is also the one designed for rural lending: its guaranteed program finances homes in eligible rural areas, much of which in Florida is well-and-septic country. Conventional, FHA, and VA financing all reach rural properties too, each applying its own property standards. TRACT arranges loans across these programs and can match a rural property's realities to a program that accommodates them. We do not test water or inspect systems; licensed laboratories, septic contractors, and your county health department are the authorities there."
        ]
      }
    ],
    faqs: [
      {
        question: "Does every loan on a well-and-septic home require testing?",
        answer:
          "No. Requirements depend on the program, the jurisdiction, and what the appraisal notes. Government programs define specific triggers for water testing and septic evaluation in their current handbooks, while conventional lenders typically respond to appraisal findings. Ask your lender at application rather than assuming either way."
      },
      {
        question: "Who pays to fix a failed well or septic system before closing?",
        answer:
          "It is negotiable. Sellers often cure the failure to keep the sale alive, buyers sometimes accept a price adjustment where program rules allow, and some programs permit repair escrows. What is not negotiable is the condition itself: the loan will not close until the program's property standard is met."
      },
      {
        question: "Can I finance drilling a new well or installing a new septic system?",
        answer:
          "On new construction, site work including water and waste systems belongs in the construction budget. On an existing home, renovation loan programs can fund system replacement as part of a larger project. Permits from the county come first in either case; lenders fund permitted work."
      },
      {
        question: "Do shared wells or community water systems work for financing?",
        answer:
          "Often, under conditions. USDA's regulation, for example, permits certain private and community systems where the lender determines they are adequate, safe, and code-compliant, and other programs impose their own shared-well requirements. Expect documentation, a recorded shared-well agreement is a common condition, and confirm what your program needs early."
      }
    ],
    sources: [
      {
        publisher: "eCFR",
        title: "7 CFR 3555.201, Site requirements (USDA Guaranteed Rural Housing)",
        url: "https://www.ecfr.gov/current/title-7/subtitle-B/chapter-XXXV/part-3555/subpart-E/section-3555.201"
      },
      {
        publisher: "U.S. Department of Housing and Urban Development",
        title: "FHA Single Family Housing Policy Handbook 4000.1",
        url: "https://www.hud.gov/program_offices/housing/sfh/handbook_4000-1"
      },
      {
        publisher: "USDA Rural Development",
        title: "Single Family Housing Guaranteed Loan Program",
        url: "https://www.rd.usda.gov/programs-services/single-family-housing-programs/single-family-housing-guaranteed-loan-program"
      }
    ],
    related: [
      { href: "/mortgage/usda", label: "USDA loans" },
      { href: "/mortgage/fha", label: "FHA loans" },
      { href: "/resources/lot-loans-vs-land-loans", label: "Lot loans vs. land loans" },
      { href: "/plan", label: "Plan your purchase with TRACT" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "impact-fees-florida",
    category: "construction",
    title: "Florida Impact Fees and Your Construction Budget",
    description:
      "Impact fees are one-time local charges on new construction in Florida. What they fund, when they hit a building budget, and why amounts differ by county.",
    h1: "Impact fees in Florida: the line item that surprises first-time builders",
    answerSummary:
      "Impact fees are one-time charges that Florida counties, cities, and special districts levy on new construction to fund the infrastructure growth requires, roads, schools, parks, water, and public safety among them. They are governed by Section 163.31801 of the Florida Statutes, which sets minimum requirements for how fees are adopted and collected, but each local government sets its own amounts, so the cost varies dramatically from county to county.",
    sections: [
      {
        heading: "What an impact fee is",
        paragraphs: [
          "When a new house is built, it adds demand on everything public around it: another household on the roads, children in the schools, connections to water and sewer, calls to fire and EMS. Impact fees are how Florida local governments charge growth for a share of that new infrastructure. They are one-time charges tied to new development, distinct from property taxes, which recur annually, and from utility connection charges, which pay for the physical hookup itself.",
          "Florida governs the practice through Section 163.31801 of the Florida Statutes, the Florida Impact Fee Act. The statute sets minimum requirements for local governments and special districts that adopt impact fees, requiring among other things that fees be based on recent, localized studies, that collections be accounted for properly, that notice be given before changes, and that developer contributions be credited against fees owed."
        ]
      },
      {
        heading: "When impact fees hit a construction budget",
        paragraphs: [
          "For someone building a home, impact fees surface in the permitting stage: they are charges associated with the building permit process, due before construction can lawfully proceed, with the exact collection point governed by state law and local ordinance. That timing matters for financing, because the fees come due near the start of the project, when the construction loan has advanced little money, not at the end when the budget picture is clear.",
          "On a construction loan, impact fees belong in the line-item budget the lender approves, alongside the site work and the slab. A budget that omits them is understated by a number that, in some Florida counties, rivals the cost of a roof. Builders working in a county routinely know its current fee schedule; on an owner-managed budget, the county's own published schedule is the source to use."
        ]
      },
      {
        heading: "Why the amounts vary so much by county",
        paragraphs: [
          "Impact fees are local legislation. Each county or city decides which categories to charge, transportation, schools, parks, utilities, public safety, and commissions its own studies to set the amounts, subject to the statute's requirements and its limits on how quickly fees may increase. A high-growth county building roads and schools at speed will charge more than a built-out county adding little infrastructure; some jurisdictions have at times suspended or reduced fees to encourage building.",
          "The practical consequence: never carry an impact fee assumption from one county to another, even next door. The same house plan can carry meaningfully different fee totals across a county line. Verify the current schedule with the county or municipal building department where the lot sits, and note that school impact fees may be levied by the school district as a separate item."
        ]
      },
      {
        heading: "Fitting fees into the financing",
        paragraphs: ["Handled early, impact fees are just another budget line the loan can carry."],
        bullets: [
          "Get the current fee schedule from the county or city where you are building, in writing",
          "Confirm with the builder whether their contract price includes impact and permit fees or excludes them",
          "Include the fees in the construction budget submitted to the lender, so draws cover them when due",
          "Ask about credits if the developer of your lot already contributed infrastructure; the statute requires credits against collections in defined cases",
          "Re-verify before permitting if months have passed; schedules change with required notice"
        ]
      },
      {
        heading: "Where TRACT stands on fee questions",
        paragraphs: [
          "TRACT arranges construction and land financing; we are not a permitting authority and do not calculate or collect impact fees. What we do is make sure the budget a lender underwrites reflects the real cost of building in your county, fees included, because the alternative is discovering mid-project that the contingency reserve is spent on a permit counter. For the authoritative fee figures, the county building department is the only source that counts, and for the governing law, the Florida Legislature publishes Section 163.31801 in full."
        ]
      }
    ],
    faqs: [
      {
        question: "Are impact fees the same everywhere in Florida?",
        answer:
          "No, and the differences are large. State law sets minimum requirements for how fees are adopted, studied, and collected, but each county, city, or district sets its own categories and amounts. Always get the current schedule from the local building department for the specific parcel; a neighboring county's figures tell you nothing reliable."
      },
      {
        question: "Can impact fees be financed in my construction loan?",
        answer:
          "Generally yes, as part of the approved construction budget, the same way permits and site work are financed. The key is listing them in the budget before closing so the draw schedule funds them when they come due. Fees discovered after closing must be paid from contingency or cash."
      },
      {
        question: "Do I pay impact fees when buying an existing home?",
        answer:
          "Ordinarily no. Impact fees attach to new development, so the original builder paid them when the home was built. They can reappear if you change the property in ways that add demand, such as adding a dwelling unit, which is a question for the local building department during permitting."
      },
      {
        question: "Who can tell me the exact impact fees for my lot?",
        answer:
          "The building or planning department of the county or municipality where the lot sits, and the school district for school fees where those are separate. Ask for the current adopted schedule and how your project is classified. Builders active in the area will know, but verify against the published schedule."
      }
    ],
    sources: [
      {
        publisher: "Florida Senate",
        title:
          "Florida Statutes, Section 163.31801, Impact fees; short title; intent; minimum requirements; audits; challenges",
        url: "https://www.flsenate.gov/Laws/Statutes/2025/163.31801"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is a construction loan?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-construction-loan-en-108/"
      }
    ],
    related: [
      { href: "/mortgage/construction", label: "Construction loans" },
      {
        href: "/resources/construction-to-permanent",
        label: "Construction-to-permanent loans explained"
      },
      { href: "/calculators/closing-cost", label: "Closing cost calculator" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "renovation-budget-contingency",
    category: "construction",
    title: "Why Every Renovation Loan Carries a Contingency Reserve",
    description:
      "Renovation loans build in a contingency reserve because remodels uncover surprises. How reserves, change orders, and cost overruns work when walls come open.",
    h1: "The contingency reserve: why renovation loans plan for the surprise",
    answerSummary:
      "A contingency reserve is a slice of the renovation budget set aside for costs nobody can see at closing, the rot behind the shower wall, the wiring that is not to code. Agency programs formalize it: Fannie Mae requires a reserve equal to ten percent of renovation costs on two- to four-unit HomeStyle properties, expandable to fifteen percent, and lenders may require one on any project. Unused reserve funds typically reduce the loan balance or fund additional approved work.",
    sections: [
      {
        heading: "Why renovation budgets break",
        paragraphs: [
          "New construction starts from bare dirt and a full set of plans; the unknowns are mostly weather and prices. Renovation starts from an existing building whose true condition is hidden behind drywall, tile, and decades of prior owners' decisions. Open a wall and the project changes: undocumented plumbing, termite damage, an earlier remodel done without permits. In Florida's older housing stock, moisture and the era of a home's electrical system are the classic sources of surprise.",
          "Contractors bid what they can see. The gap between what was bid and what the wall reveals has to be paid by someone, and a renovation loan, which disburses against a fixed approved budget, has no elastic to absorb it unless the elastic was built in at closing. That built-in elastic is the contingency reserve."
        ]
      },
      {
        heading: "How the reserve works mechanically",
        paragraphs: [
          "The reserve is financed as part of the loan and held with the renovation escrow, but it is not allocated to any line item. It sits unassigned until a legitimate cost overrun or necessary unforeseen repair claims it, at which point the lender releases reserve funds through the same documented draw process as the rest of the budget.",
          "Fannie Mae's HomeStyle rules show the standard shape: a contingency reserve equal to ten percent of the total renovation costs is required on two- to four-unit properties, the lender may raise it to fifteen percent where the project warrants, and lenders may establish a reserve on one-unit properties even though the guide does not mandate it there. FHA's 203(k) rehabilitation program builds reserves into its structure as well, with requirements that vary by program variant and property condition under current FHA policy. The reserve percentages are program rules, so confirm current figures in the applicable guide rather than assuming them."
        ]
      },
      {
        heading: "Change orders: the paper trail of the surprise",
        paragraphs: [
          "When scope changes mid-project, the change enters the loan through a change order: a written amendment to the construction contract stating what changed, why, and what it costs. On a renovation loan the change order generally needs lender approval before the work proceeds, because the lender is the one funding it and its appraisal was based on the original scope.",
          "Discipline here protects the borrower as much as the lender. Verbal change orders are how renovation budgets die, ten undocumented yes-decisions that surface as one unpayable invoice at the end. The rule that keeps projects solvent is simple: no changed work before a priced, signed, lender-acknowledged change order. Fannie Mae's collateral rules likewise contemplate documented handling of changes and unplanned repairs rather than informal scope drift."
        ]
      },
      {
        heading: "When the overrun exceeds the reserve",
        paragraphs: [
          "The reserve is the first line of defense, not a bottomless one. If costs blow past it, the remaining options are narrower and worth knowing in advance."
        ],
        bullets: [
          "Reduce scope elsewhere in the project, trading finishes for the repair the house actually needs",
          "Bring borrower cash to the escrow, the most common real-world resolution",
          "Where program rules permit, request additional financing, a slow path that reopens underwriting",
          "What is not an option: skipping required work, since the lender funds completion of the approved scope and the appraised value assumed it"
        ]
      },
      {
        heading: "What happens to an unspent reserve",
        paragraphs: [
          "Good news is also governed by rules. Under Fannie Mae's HomeStyle provisions, unused contingency funds that were financed must be applied to reduce the loan balance after completion, while funds the borrower deposited directly can be returned; alternatively, remaining reserve money may fund additional improvements if the lender confirms the original work is complete and inspects the new work. Either way, the reserve is never lost money, it is either a smaller loan or more house.",
          "TRACT arranges renovation financing under these programs and structures budgets with lenders so the reserve fits the project's real risk, older homes and structural scopes justify the higher end. Construction cost estimates and hidden-condition assessments belong with your licensed contractor and inspector; the loan can only be as honest as the budget underneath it."
        ]
      }
    ],
    faqs: [
      {
        question: "Is the contingency reserve extra money I have to bring to closing?",
        answer:
          "Usually it is financed within the loan as part of the total renovation budget, subject to the program's loan-to-value limits, though borrowers can fund it in cash. Financing the reserve raises the loan slightly; not having one risks the whole project. Underwriters treat a reserve-free renovation budget as a red flag, not a saving."
      },
      {
        question: "Can I spend the contingency on upgrades if no problems turn up?",
        answer:
          "Only through the front door: under Fannie Mae's rules, leftover reserve funds may pay for additional improvements if the lender confirms the original scope is complete and inspects the added work. Otherwise financed reserve money reduces your loan balance at the end. It cannot be quietly absorbed into nicer countertops mid-project."
      },
      {
        question: "Who approves a change order on a renovation loan?",
        answer:
          "You and your contractor agree to it, and the lender acknowledges it before funding, since draws follow the approved budget. Expect the lender to ask what the change costs, why it is needed, and whether the contingency covers it. Undocumented changes are the most common cause of renovation escrow disputes."
      },
      {
        question: "How big should my contingency be if the program does not set one?",
        answer:
          "Program minimums, like the ten to fifteen percent range in Fannie Mae's HomeStyle rules for small multi-unit properties, are a reasonable calibration point, and lenders often apply similar reserves case by case. Older homes, structural work, and anything involving concealed plumbing or wiring argue for the higher end. Your contractor's assessment of hidden-condition risk is the input that matters most."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title: "B5-3.2-04, HomeStyle Renovation Mortgages: Costs and Escrow Accounts",
        url: "https://selling-guide.fanniemae.com/sel/b5-3.2-04/homestyle-renovation-mortgages-costs-and-escrow-accounts"
      },
      {
        publisher: "Fannie Mae",
        title: "B5-3.2-03, HomeStyle Renovation Mortgages: Collateral Considerations",
        url: "https://selling-guide.fanniemae.com/sel/b5-3.2-03/homestyle-renovation-mortgages-collateral-considerations"
      },
      {
        publisher: "U.S. Department of Housing and Urban Development",
        title: "203(k) Rehabilitation Mortgage Insurance Program",
        url: "https://www.hud.gov/program_offices/housing/sfh/203k"
      }
    ],
    related: [
      { href: "/mortgage/renovation", label: "Renovation loans" },
      { href: "/resources/adu-financing-florida", label: "Financing an ADU in Florida" },
      {
        href: "/resources/construction-draws-inspections",
        label: "Draws and inspections explained"
      },
      { href: "/contact", label: "Talk through a renovation budget with TRACT" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  }
];
