import type { Article } from "./types";

/**
 * Condo cluster. Florida condo financing is project underwriting as much as
 * borrower underwriting, and post-2022 the statutes (milestone inspections,
 * SIRS) are load-bearing facts — every statutory claim here cites the statute
 * page it was checked against.
 */
export const CONDO_ARTICLES: Article[] = [
  {
    slug: "condo-financing-florida",
    category: "condo",
    title: "Condo Financing in Florida: How Lenders Review the Building",
    description:
      "Florida condo loans are underwritten twice: once on you, once on the building. What lenders check in the budget, reserves, insurance, litigation, and occupancy mix.",
    h1: "Condo financing in Florida: the building gets underwritten alongside you",
    answerSummary:
      "A Florida condo loan is really two approvals: the lender evaluates your credit, income, and assets, and separately evaluates the condominium project itself. The association's budget, reserve funding, master insurance, pending litigation, and the mix of owner-occupants and investors all shape whether the loan can be sold to Fannie Mae or Freddie Mac — and therefore which programs, terms, and lenders are available for your unit.",
    sections: [
      {
        heading: "Two underwritings, one loan",
        paragraphs: [
          "When you finance a detached house, the collateral is the house. When you finance a condo, the collateral is a unit inside a building that you will own jointly with hundreds of strangers, governed by an association whose decisions directly affect the value of the lender's lien. That is why every agency condo loan includes a project review: Fannie Mae's Selling Guide dedicates an entire chapter, B4-2, to project standards, and Freddie Mac's Guide does the same in Chapter 5701.",
          "The project review runs in parallel with your personal underwriting. Your loan can be flawless on the borrower side and still stall because the building's insurance deductible is too high, its reserves are underfunded, or a structural repair remains unresolved. In Florida, where buildings face wind, water, and — since the state's post-2021 safety reforms — mandatory structural inspections, the project side of the file often takes more work than the borrower side.",
          "Fannie Mae also applies Florida-specific rules: new and newly converted attached condo projects in Florida generally require Fannie Mae's own project approval rather than a lender-delegated review, and established Florida projects carry their own loan-to-value framework by occupancy type. The details live in Selling Guide section B4-2.2-04, and they are one reason an experienced Florida broker matters on condo deals."
        ]
      },
      {
        heading: "The budget and reserves",
        paragraphs: [
          "The association's annual budget is the first document a project reviewer reads. A healthy budget covers day-to-day operations — insurance, management, maintenance, utilities — and sets aside money every year for the big-ticket items that wear out: roofs, elevators, paint, paving, and in Florida, the structural components flagged by reserve studies.",
          "Agency guidelines expect the budget to dedicate a meaningful share of income to replacement reserves, or to be backed by a reserve study demonstrating equivalent protection; the specific reserve expectation is published in Fannie Mae's Full Review requirements rather than being a fixed number you should assume. A budget that funds reserves thinly, or that leans on special assessments to cover routine maintenance, tells the reviewer the association is deferring costs — and deferred costs eventually land on unit owners.",
          "Florida law has tightened this picture. Structural integrity reserve studies now determine reserve funding for certain structural components in buildings three stories and taller, which means budgets in older coastal buildings are rising to reflect real repair schedules. That is uncomfortable for monthly fees but healthy for financing: a building that funds its future is a building lenders can lend in."
        ]
      },
      {
        heading: "Insurance: the building's policies come first",
        paragraphs: [
          "Before your own homeowners policy matters, the association's master policies do. Lenders require the project to carry property insurance at full replacement cost with acceptable deductibles, liability coverage, and — where the building sits in a special flood hazard area — flood coverage on the structure. Fannie Mae's requirements for master project policies are set out in Selling Guide section B7-3-03.",
          "In Florida, this is frequently where condo deals wobble. Wind and flood premiums have pushed some associations toward higher deductibles or lower coverage than agency guidelines accept. A project review can fail on insurance alone, even in a building with pristine finances. Asking for the master policy declarations early — before your deposit goes hard — is one of the cheapest pieces of due diligence available to a Florida condo buyer.",
          "You will still need your own HO-6 unit policy for the interior of your unit, and your lender will size its required coverage against what the master policy leaves out. The two policies are designed to meet at the boundary the condominium documents draw between association property and unit-owner property."
        ]
      },
      {
        heading: "Litigation and structural condition",
        paragraphs: [
          "Project reviewers ask whether the association is a party to litigation, and the answer matters most when the suit concerns the safety, structural soundness, habitability, or functional use of the project. Fannie Mae's list of ineligible project characteristics in Selling Guide section B4-2.1-03 makes that kind of litigation, and projects needing critical repairs, disqualifying until resolved.",
          "Not all litigation blocks a loan. Routine collection actions against delinquent owners, or minor disputes with clear insurance coverage, are generally acceptable. The distinction is whether the outcome could materially damage the project's finances or the building itself. A construction-defect suit over balcony waterproofing reads very differently from a dispute over a landscaping contract.",
          "Since Florida's milestone inspection law took effect, structural condition has its own paper trail: inspection reports and reserve studies are association records, and lenders increasingly ask for them. An unremediated finding of substantial structural deterioration will pause agency financing in that building for everyone, not just for you."
        ]
      },
      {
        heading: "Occupancy mix, commercial space, and control",
        paragraphs: [
          "Reviewers also look at who owns and occupies the building. A high share of investor-owned units, a single entity owning many units, extensive commercial space, or ongoing developer control can each move a project outside standard eligibility, because each concentrates risk: investors walk away from assessments more readily than residents, and one overextended bulk owner can destabilize the whole budget.",
          "None of these factors is about your qualifications. They are about how the project would behave in a downturn, and the agencies price and gate accordingly. The occupancy tests that apply depend on how you will use the unit — a primary-residence purchase is reviewed more leniently on this axis than an investment purchase.",
          "The practical takeaway: in Florida, choose the building as carefully as the unit. TRACT is a mortgage broker, not a lender — we arrange condo financing through wholesale lenders and can often tell you early which review path a building is likely to need, but the lender, not TRACT, makes the credit decision on both you and the project."
        ]
      }
    ],
    faqs: [
      {
        question:
          "Can my condo loan be denied because of the building, even if my finances are strong?",
        answer:
          "Yes. Project eligibility is evaluated separately from borrower eligibility. Insurance shortfalls, underfunded reserves, unresolved structural repairs, litigation over the building's safety, or an unacceptable occupancy mix can each make a project ineligible for agency financing regardless of the borrower's strength. When that happens, alternatives such as portfolio or non-agency loans may still exist through other lenders."
      },
      {
        question: "What documents does the lender collect about a Florida condo association?",
        answer:
          "Typically a completed condo questionnaire, the current budget, the master insurance certificates, and, where relevant, reserve studies, milestone inspection reports, and information about litigation and special assessments. Florida resale buyers are separately entitled to key association documents under state disclosure law, so much of this material is available to you as well."
      },
      {
        question: "Why is condo financing harder in Florida than in many other states?",
        answer:
          "Three reasons compound: property insurance costs and deductibles strain association budgets, Fannie Mae applies Florida-specific project rules including its own approval requirement for new attached condo projects, and the state's milestone inspection and structural reserve study laws surface building-condition information that underwriters must act on. Buildings that manage all three well remain very financeable."
      },
      {
        question: "Does TRACT decide whether my building passes project review?",
        answer:
          "No. TRACT is a broker — we arrange financing through wholesale lenders, package the project documents, and match the building's profile to lenders whose guidelines fit it. The lender and, for some programs, the agency perform the actual project review and make the credit decision."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B4-2.1-01, General Information on Project Standards",
        url: "https://selling-guide.fanniemae.com/sel/b4-2.1-01/general-information-project-standards"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B4-2.2-04, Geographic-Specific Condo Project Considerations",
        url: "https://selling-guide.fanniemae.com/sel/b4-2.2-04/geographic-specific-condo-project-considerations"
      },
      {
        publisher: "Freddie Mac",
        title: "Condominium Unit Mortgages",
        url: "https://sf.freddiemac.com/working-with-us/origination-underwriting/mortgage-products/condominium-unit-mortgages"
      }
    ],
    related: [
      { href: "/mortgage/condo", label: "Condo financing with TRACT" },
      {
        href: "/resources/warrantable-vs-non-warrantable",
        label: "Warrantable vs. non-warrantable condos"
      },
      { href: "/resources/hoa-condo-docs-review", label: "What to read in the condo documents" },
      { href: "/calculators/affordability", label: "Affordability calculator" },
      { href: "/locations/florida", label: "Mortgages across Florida" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "warrantable-vs-non-warrantable",
    category: "condo",
    title: "Warrantable vs. Non-Warrantable Condos in Florida",
    description:
      "What makes a condo project warrantable for Fannie Mae and Freddie Mac, the characteristics that break eligibility, and how non-warrantable units still get financed.",
    h1: "Warrantable vs. non-warrantable condos: what the label means for your loan",
    answerSummary:
      "A warrantable condo project meets Fannie Mae or Freddie Mac eligibility standards, so loans on its units can be sold to the agencies and priced accordingly. Non-warrantable projects fail one or more tests — hotel-style operation, critical repairs, heavy commercial space, ownership concentration, litigation, or weak finances — and their units need portfolio or non-agency financing, which usually means different pricing, larger down payments, and fewer lender choices.",
    sections: [
      {
        heading: "Warrantable is a salability label, not a safety grade",
        paragraphs: [
          "Most conventional mortgages are sold to Fannie Mae or Freddie Mac shortly after closing. The agencies will only buy condo loans from projects that meet their published standards, so lenders test the project before closing. A project that passes is called warrantable — the lender can warrant its eligibility. A project that fails a test is non-warrantable, and its units cannot back a standard agency loan while the condition persists.",
          "The label describes marketability of the loan, not necessarily livability of the building. A well-run beachfront building can be non-warrantable simply because too much of it operates as short-term rentals; a mediocre building can be warrantable because it happens to pass every test. But the tests exist because the flagged characteristics historically correlate with losses, so the label is worth taking seriously as a risk signal too.",
          "Warrantability is also unit-and-transaction specific in practice: the review path and the standards applied can differ for a primary residence versus an investment purchase, and for an established project versus a new one. In Florida, new and newly converted attached condo projects generally require Fannie Mae's own project approval rather than a lender-level review."
        ]
      },
      {
        heading: "The tests a project must pass",
        paragraphs: [
          "Fannie Mae's Selling Guide section B4-2.1-03 lists the characteristics that make a project ineligible, and Freddie Mac's condo requirements in Guide Chapter 5701 run closely parallel. The recurring themes are commercial operation, concentration, condition, and cash.",
          "A reviewer working through a Florida condo questionnaire is usually probing for the following:"
        ],
        bullets: [
          "Hotel or resort operation — mandatory rental pooling, front-desk registration, daily cleaning, or marketing as a condotel",
          "Critical repairs — unresolved significant deferred maintenance, unsafe conditions, or unfunded near-term repairs above the guide's per-unit cost threshold",
          "Litigation concerning the safety, structural soundness, habitability, or functional use of the project",
          "Single-entity concentration — one owner holding more units than the guide allows for the project's size",
          "Excessive commercial or non-residential space relative to the guide's limit",
          "Inadequate budget or reserves, high assessment delinquency, or association insolvency",
          "Incomplete construction, ongoing developer control past allowed limits, or timeshare and fractional structures",
          "Master insurance below required coverage or with unacceptable deductibles"
        ]
      },
      {
        heading: "What actually happens when a project fails",
        paragraphs: [
          "First, the failure is diagnosed. Some conditions are permanent features of the project — a condotel is structurally a condotel — while others are temporary states: a litigation matter settles, a repair is completed and funded, an insurance policy is rewritten at renewal. Knowing which kind you are facing determines the strategy.",
          "Second, there are cure paths inside the agency world. Fannie Mae operates a project eligibility review service and maintains project status designations; Freddie Mac's Condo Project Advisor lets lenders request unit-level exceptions for certain requirements and provides an appeal path for projects flagged as not eligible. A strong file assembled by the lender can sometimes move a borderline project through.",
          "Third, when the project stays non-warrantable, the loan moves outside the agencies. Portfolio lenders, credit unions, and non-QM investors finance non-warrantable condos under their own guidelines. Expect the tradeoffs to show up as larger down payment requirements, different pricing, and reserve or occupancy conditions that vary lender to lender — each lender publishes its own terms, and they change, so treat any specific figure as a question for the quote, not a fact from an article."
        ]
      },
      {
        heading: "Non-warrantable is common in Florida — and often survivable",
        paragraphs: [
          "Florida's coastal markets produce non-warrantable findings at a high rate: short-term rental economies, investor-heavy buildings, aging structures working through inspection findings, and insurance markets that strain master policies. None of this is exotic here. A finding of non-warrantability is the beginning of a financing conversation, not the end of one.",
          "The order of operations matters. Discover the project's status before your deposit goes hard, not at day twenty-five of a thirty-day contract. The condo questionnaire, budget, and insurance certificates can be requested early, and Florida's resale disclosure framework entitles buyers to core association documents with a statutory review window.",
          "As a broker, TRACT works both sides of this line: agency financing where the project qualifies, and non-agency lenders where it does not. We arrange the loan and assemble the project file; the lender makes the credit decision. If a building's status is uncertain, pricing both paths early keeps your contract dates honest."
        ]
      }
    ],
    faqs: [
      {
        question: "Is a non-warrantable condo a bad investment?",
        answer:
          "Not automatically. Some causes of non-warrantability, like resort operation, are business models rather than defects; others, like critical repairs or insolvency, are genuine warning signs. Read the reason for the failure, not just the label. Financing will cost more and resale buyers will face the same constraint, which is itself worth pricing into your offer."
      },
      {
        question: "Can a non-warrantable project become warrantable again?",
        answer:
          "Often, yes. Litigation resolves, repairs get completed and funded, insurance gets rewritten, developer control ends, and occupancy mixes shift. Projects move in and out of eligibility over time, and the agencies provide review and appeal mechanisms. A building's status today is a snapshot, not a permanent classification."
      },
      {
        question: "Do FHA and VA use the same warrantability rules?",
        answer:
          "No. FHA and VA maintain their own project approval systems with separate criteria and public lookup tools, so a project can be acceptable to one program and not another. Conventional warrantability under Fannie Mae and Freddie Mac is a distinct analysis, though the underlying concerns — finances, condition, operation — overlap heavily."
      },
      {
        question: "Who decides whether my building is warrantable?",
        answer:
          "The lender performing the project review applies the agency's published standards, and in some cases the agency itself reviews the project. TRACT, as a broker, does not make that determination — we identify the likely outcome early, assemble the documentation, and place the loan with a lender whose process fits the building."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B4-2.1-03, Ineligible Projects",
        url: "https://selling-guide.fanniemae.com/sel/b4-2.1-03/ineligible-projects"
      },
      {
        publisher: "Freddie Mac",
        title: "Condominium Unit Mortgages",
        url: "https://sf.freddiemac.com/working-with-us/origination-underwriting/mortgage-products/condominium-unit-mortgages"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B4-2.1-01, General Information on Project Standards",
        url: "https://selling-guide.fanniemae.com/sel/b4-2.1-01/general-information-project-standards"
      }
    ],
    related: [
      { href: "/mortgage/condo", label: "Condo financing with TRACT" },
      { href: "/resources/condotel-financing", label: "Condotel financing explained" },
      {
        href: "/resources/condo-investor-ratios",
        label: "How investor concentration affects condo loans"
      },
      { href: "/mortgage/investment-property", label: "Investment property loans" },
      { href: "/contact", label: "Talk through a specific building" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "milestone-inspection-sirs",
    category: "condo",
    title: "Milestone Inspections and SIRS in Florida Condo Deals",
    description:
      "Florida's milestone inspections and structural integrity reserve studies: which buildings they cover, when they are due, and how findings affect financing.",
    h1: "Milestone inspections and structural integrity reserve studies: what condo buyers should know",
    answerSummary:
      "Florida law requires milestone structural inspections for condominium and cooperative buildings three or more habitable stories tall, generally by the time the building turns 30 and every ten years after, with earlier local deadlines possible near salt water. A separate structural integrity reserve study, repeated at least every ten years, drives reserve funding for major structural components. Lenders read both documents, and unresolved findings can pause financing building-wide.",
    sections: [
      {
        heading: "Why Florida created these requirements",
        paragraphs: [
          "After the 2021 building collapse in Surfside, Florida rewrote the rules for how aging condominium buildings are inspected and how associations save for structural repairs. The result is two distinct instruments: the milestone inspection, a periodic engineering examination of the building's structural condition, and the structural integrity reserve study, a financial planning document that converts the building's physical needs into a funding schedule.",
          "Both are worth understanding calmly. The overwhelming majority of inspected buildings do not have dangerous conditions; what the law changed is that condition and funding are now documented, disclosed, and hard to ignore. For buyers, that is a gift: information that used to be invisible until after closing is now an association record you can ask for before your deposit goes hard.",
          "For financing, these documents matter because lenders act on them. Agency guidelines make projects with significant deferred maintenance or unfunded critical repairs ineligible, so an inspection finding that goes unaddressed affects every unit's financeability, not just the units directly involved."
        ]
      },
      {
        heading: "The milestone inspection: section 553.899, Florida Statutes",
        paragraphs: [
          "Florida law requires a milestone inspection for condominium and cooperative buildings that are three or more habitable stories tall. Under section 553.899, the initial inspection is generally due by December 31 of the year the building reaches 30 years of age, measured from its certificate of occupancy, and must be repeated every ten years thereafter. Local enforcement agencies may set the initial deadline earlier — at 25 years — where local conditions such as proximity to salt water justify it.",
          "The inspection has two phases. Phase one is a visual examination by a licensed architect or engineer producing a qualitative assessment of the structural components. If phase one finds no substantial structural deterioration, the process ends there until the next cycle. If it does find substantial deterioration, phase two follows: a deeper investigation, which may include testing, that defines the scope of repairs.",
          "Reports are not private. The statute requires sealed inspection reports to be provided to the local enforcement agency and to the association, with unit owners informed — which means a building's milestone history is discoverable by a buyer who asks, and by a lender who asks."
        ]
      },
      {
        heading: "The SIRS: section 718.112, Florida Statutes",
        paragraphs: [
          "The structural integrity reserve study, created in section 718.112 of the Condominium Act, applies to buildings three habitable stories or higher and must be completed at least every ten years. It is performed by qualified professionals and inventories the major structural and life-safety components — roof, load-bearing walls and other primary structural members, waterproofing, plumbing, electrical, and similar systems — estimating remaining useful life and replacement cost.",
          "The teeth are in the funding rules. Florida associations historically could vote to waive or underfund reserves; for items identified in a structural integrity reserve study, the statute restricts that practice, so budgets must actually fund the structural schedule the study lays out. This is why many Florida associations have seen fees rise since the law took effect: the increase is the cost of the building's future being funded rather than deferred.",
          "For a buyer, a recent SIRS is one of the most useful documents in the resale package. It tells you what the building will need, roughly when, and whether the current budget is paying for it — the exact questions a special assessment would otherwise answer for you later, unpleasantly."
        ]
      },
      {
        heading: "How findings flow into your mortgage file",
        paragraphs: [
          "Lenders reach this information through the condo questionnaire and document requests: they ask about inspection findings, repair status, reserve funding, and planned or levied special assessments. Fannie Mae's ineligible-projects criteria in Selling Guide section B4-2.1-03 exclude projects in need of critical repairs and those with significant unfunded near-term repair costs, so a phase-two finding without a funded repair plan typically makes agency financing unavailable in that building until the work is resolved.",
          "The healthier pattern is just as visible in the file. A building that completed its milestone inspection cleanly, or that found issues, funded them, and finished the work, presents well: the documents prove the association manages the asset. Buildings mid-repair sit in between, and lenders will want to see the scope, the funding source, and the timeline.",
          "Timing matters for buyers. Ask early — Florida's resale disclosure framework includes inspection reports and reserve studies among the association records a buyer can obtain — and build your financing contingency around what the documents show. If the building's status pushes you outside agency lending, non-agency options may exist, with different terms."
        ]
      },
      {
        heading: "What to do with all this as a buyer",
        paragraphs: [
          "Request the most recent milestone inspection report, the current structural integrity reserve study, the budget, and the last year of board minutes as soon as you are serious about a unit. Read the minutes for repair discussions that have not yet become assessments. If anything in the engineering documents is unclear, the money for an hour of a structural engineer's time is well spent.",
          "Keep the legal questions with the right professional. How a statute applies to a particular building, what an association was required to disclose, or what remedies a buyer has are questions for a Florida real estate attorney — this is educational context, not legal advice.",
          "On the financing side, TRACT arranges condo loans through wholesale lenders and sees these documents through an underwriter's eyes daily. We can tell you early whether a building's inspection posture is likely to fit agency guidelines or needs a non-agency path — the lender makes the final call, but you should not have to discover the answer at the closing table."
        ]
      }
    ],
    faqs: [
      {
        question: "Do milestone inspections apply to every Florida condo?",
        answer:
          "No. Section 553.899 applies to condominium and cooperative buildings three or more habitable stories in height. Low-rise buildings under three stories are outside the milestone requirement, though their associations still budget for maintenance and remain subject to the Condominium Act's other provisions. Check the statute text for the current scope and deadlines, which the Legislature has amended more than once."
      },
      {
        question: "The building I want failed phase one. Is the deal dead?",
        answer:
          "Not necessarily, but the path changes. A phase-two investigation defines the repair scope, and financing generally depends on the repairs being funded and progressing. Some buyers renegotiate, some wait out the repair, and some use non-agency financing that accepts the situation. What matters is knowing the status before your deposit becomes nonrefundable."
      },
      {
        question: "Will a SIRS make my HOA fees go up?",
        answer:
          "It can, because the statute restricts waiving reserves for items the study identifies, and budgets must reflect real funding schedules. But the study does not create the costs — the building's aging does. The study converts a hidden future liability into a visible, funded plan, which is better for owners and for financing than a surprise assessment."
      },
      {
        question: "Can I see these reports before I buy a resale unit?",
        answer:
          "Yes. Florida's resale disclosure framework entitles buyers to key association documents, and inspection reports and reserve studies are association records. Ask for them in your offer, read them with your attorney or an engineer where needed, and treat reluctance to produce them as information in itself."
      }
    ],
    sources: [
      {
        publisher: "Florida Senate",
        title:
          "Section 553.899, Florida Statutes — Mandatory structural inspections for condominium and cooperative buildings",
        url: "https://www.flsenate.gov/Laws/Statutes/2025/553.899"
      },
      {
        publisher: "Florida Senate",
        title:
          "Section 718.112, Florida Statutes — Bylaws; structural integrity reserve study requirements",
        url: "https://www.flsenate.gov/Laws/Statutes/2025/718.112"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B4-2.1-03, Ineligible Projects",
        url: "https://selling-guide.fanniemae.com/sel/b4-2.1-03/ineligible-projects"
      }
    ],
    related: [
      {
        href: "/resources/special-assessments-mortgage",
        label: "Special assessments and your mortgage"
      },
      { href: "/resources/hoa-condo-docs-review", label: "What to read in the condo documents" },
      { href: "/mortgage/condo", label: "Condo financing with TRACT" },
      { href: "/plan", label: "Build your financing plan" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "special-assessments-mortgage",
    category: "condo",
    title: "Special Assessments and Your Mortgage in Florida",
    description:
      "How a condo special assessment changes what you can afford and how lenders underwrite it: monthly obligations, project review, and negotiating who pays at closing.",
    h1: "How a special assessment hits your affordability and your mortgage approval",
    answerSummary:
      "A special assessment is a charge the association levies on unit owners beyond regular dues, usually to fund repairs, insurance shortfalls, or reserve gaps. For your mortgage, it cuts twice: any ongoing assessment payment is counted in your monthly debt obligations alongside dues, and the reason for the assessment can trigger project-level scrutiny. Florida law makes the unit owner of record liable for assessments as they come due, so who pays is a contract negotiation.",
    sections: [
      {
        heading: "What a special assessment is, and why boards levy them",
        paragraphs: [
          "Regular dues fund the association's operating budget and reserves. When the budget cannot absorb a cost — a roof that failed early, an insurance premium that jumped at renewal, a repair ordered after a milestone inspection, a reserve study revealing years of underfunding — the board levies a special assessment: an additional charge on every unit, typically allocated by the same shares as regular dues.",
          "Assessments come in two payment shapes, and the shape matters to underwriting. Some are due as a lump sum by a deadline; others are payable in installments over months or years, sometimes financed by an association loan that owners repay through their dues. A lump sum is a one-time cash question; an installment plan is a recurring monthly obligation that follows the unit.",
          "In Florida, section 718.116 of the Condominium Act makes the unit owner liable for all assessments that come due while they own the unit, and gives the association a lien on the parcel for unpaid amounts. New owners can also share liability with the previous owner for amounts unpaid at transfer — one of several reasons the estoppel certificate ordered during closing, which states exactly what is owed on the unit, deserves a careful read."
        ]
      },
      {
        heading: "The affordability hit: assessments live in your debt ratio",
        paragraphs: [
          "Lenders qualify you on the relationship between your monthly obligations and your income — the debt-to-income ratio the Consumer Financial Protection Bureau describes in its consumer guidance. For a condo, the housing expense already includes principal, interest, taxes, insurance, and association dues. An ongoing special assessment installment is one more line in that stack.",
          "The arithmetic is unforgiving in both directions. Every dollar of monthly assessment is a dollar of qualifying capacity you no longer have for principal and interest, which effectively shrinks the loan amount your income supports. Conversely, a building whose dues already reflect fully funded reserves may need fewer future assessments — a reason a higher-dues building can be the more affordable purchase over a full ownership horizon.",
          "Run your numbers with the assessment included before you write the offer. Our affordability and debt-to-income calculators let you add the real monthly figure from the association's payment schedule rather than guessing."
        ]
      },
      {
        heading: "The project-review hit: why the assessment exists matters",
        paragraphs: [
          "Underwriters do not stop at the payment amount; they ask what the assessment is for. The condo questionnaire asks about current and planned special assessments, and the answer feeds the project review. An assessment funding a completed insurance premium or a cosmetic upgrade reads very differently from one funding structural repairs that are not yet complete.",
          "Fannie Mae's Full Review framework examines the association's budget and reserve adequacy, and its ineligible-projects criteria exclude buildings with unresolved critical repairs. An assessment can therefore be reassuring — evidence the association is funding its obligations — or disqualifying, if it reveals a repair problem that is still open. The documentation, not the assessment itself, decides which.",
          "Expect the lender to want the assessment's paperwork: what it funds, the total levied, the per-unit share, the payment schedule, and the status of the underlying work. Getting those documents from the association early keeps the file moving."
        ]
      },
      {
        heading: "Negotiating who pays at closing",
        paragraphs: [
          "Because Florida law ties liability to ownership as amounts come due, an assessment levied before closing but payable over time will follow the unit to the buyer unless the contract says otherwise. Florida's standard contract forms address who pays assessments levied or pending at closing, and the allocation is negotiable — sellers frequently pay off known assessments at closing, or credit the buyer for the remaining balance.",
          "Precision matters more than sentiment here. Pin down whether an assessment has been levied, merely approved, or only discussed in board minutes; each stage has different contractual treatment. Board minutes are the early-warning system — read the last year of them for repair and budget discussions that have not yet become line items.",
          "How your contract allocates an assessment, and what the association was required to disclose, are questions for a Florida real estate attorney; this is education, not legal advice. On the financing side, TRACT arranges the loan and helps you present the assessment cleanly to the lender — including modeling how a seller credit versus a payoff changes your qualifying numbers."
        ]
      }
    ],
    faqs: [
      {
        question: "Does a special assessment count against my debt-to-income ratio?",
        answer:
          "If it is payable in ongoing installments, lenders generally include the monthly amount in your obligations along with regular dues, which reduces the loan size your income supports. A lump-sum assessment paid off at or before closing typically is not a recurring obligation, but the lender will still ask what it funded and whether the work is complete."
      },
      {
        question: "Who pays an assessment that was levied before I bought the unit?",
        answer:
          "Under section 718.116, Florida Statutes, the owner of record is liable for assessments as they come due, and buyers can share liability for amounts unpaid at transfer — so an installment assessment follows the unit unless your contract allocates it differently. The estoppel certificate obtained during closing states what is owed. Have a Florida real estate attorney review how your contract handles it."
      },
      {
        question: "Can a special assessment stop my loan entirely?",
        answer:
          "The assessment itself rarely does; the reason for it can. If it reveals unresolved critical repairs or a structural finding without a funded plan, the project can fail agency review for every unit in the building. If it funds completed or routine work, well-documented assessments pass through underwriting regularly."
      },
      {
        question: "Should I avoid buildings that have had special assessments?",
        answer:
          "Not categorically. An association that assessed, collected, and finished its repairs has demonstrated it maintains the building. Be more cautious about buildings with artificially low dues and no assessment history in an aging structure — that pattern often means the bill has not arrived yet."
      }
    ],
    sources: [
      {
        publisher: "Florida Senate",
        title: "Section 718.116, Florida Statutes — Assessments; liability; lien and priority",
        url: "https://www.flsenate.gov/Laws/Statutes/2025/718.116"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is a debt-to-income ratio?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-to-income-ratio-en-1791/"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide, Full Review Process (project budget and reserve requirements)",
        url: "https://selling-guide.fanniemae.com/sel/b4-2.2-02/full-review-process"
      }
    ],
    related: [
      { href: "/calculators/debt-to-income", label: "Debt-to-income calculator" },
      { href: "/calculators/affordability", label: "Affordability calculator" },
      { href: "/resources/milestone-inspection-sirs", label: "Milestone inspections and SIRS" },
      { href: "/mortgage/condo", label: "Condo financing with TRACT" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "hoa-condo-docs-review",
    category: "condo",
    title: "Reviewing Condo Documents Before You Buy in Florida",
    description:
      "Florida gives resale condo buyers a document package and a cancellation window. How to read the budget, reserves, minutes, and rules before your deposit goes hard.",
    h1: "What to read in the condo documents before your deposit goes hard",
    answerSummary:
      "Florida resale condo buyers are entitled to the association's core documents — declaration, bylaws, rules, the question-and-answer sheet, financial information, and where applicable inspection reports and reserve studies — with a statutory window to cancel after receiving them. The four highest-value reads are the budget, the reserve funding, a year of board minutes, and the use restrictions, because together they predict fees, assessments, and whether lenders will finance the building.",
    sections: [
      {
        heading: "Your statutory review window",
        paragraphs: [
          "Florida does not leave condo document review to negotiation. Section 718.503 of the Condominium Act requires a resale seller to furnish the buyer, at the seller's expense, the declaration of condominium, articles of incorporation, bylaws and rules, the association's question-and-answer sheet, and financial information — and the current version of the statute reaches structural documents such as inspection reports and reserve studies where they exist.",
          "The same section gives a resale buyer a cancellation right: the contract is voidable by the buyer for a statutory period after signing and receiving the documents — measured in days and excluding weekends and legal holidays under the statute's terms — and that right cannot be waived, though it ends at closing. Developer sales of new units have their own, longer disclosure regime.",
          "Treat the window as a working deadline, not a formality. It exists so that you can read before you are bound. What follows is where the signal actually lives — and because document review shades quickly into legal interpretation, have a Florida real estate attorney on call for anything ambiguous. This is education, not legal advice."
        ]
      },
      {
        heading: "The budget: what the building costs to be honest about",
        paragraphs: [
          "Start with the current adopted budget and, if you can get it, the prior year's actuals. You are reading for three things: whether insurance is fully funded at real market premiums, whether maintenance lines look like a building being cared for or starved, and how much of total income flows to reserves rather than being consumed by operations.",
          "Compare the dues to comparable buildings with open eyes. Suspiciously low dues in an older building are rarely a bargain; they usually mean underinsurance, underfunded reserves, or deferred maintenance — each of which converts into special assessments later. Lenders read the same budget during project review, so a budget that worries you will likely worry an underwriter.",
          "Then look at delinquencies. A meaningful share of owners not paying their assessments starves the budget and is itself a project-eligibility problem under agency guidelines. The association's financial statements or the questionnaire will show it."
        ]
      },
      {
        heading: "Reserves and the structural paper trail",
        paragraphs: [
          "For buildings three habitable stories and taller, Florida's structural integrity reserve study requirement under section 718.112 converts the building's structural future into a funding schedule, and restricts the old practice of waiving those reserves. Read the most recent study alongside the budget: are the components' remaining lives realistic, and is the budget actually funding the schedule?",
          "Ask for the milestone inspection report where the building's age and height make one due. A clean report is comfort; an open finding is a negotiation and a financing question at once. A building that completed repairs after a finding — with the paper to prove it — is often the strongest posture of all.",
          "If the reserve study is old, missing, or the budget quietly ignores it, price that in. You are not just predicting assessments; you are predicting whether agency lenders will finance resale buyers when you eventually sell."
        ]
      },
      {
        heading: "Minutes: where the truth arrives early",
        paragraphs: [
          "Board and membership meeting minutes are the association's diary, and they run ahead of the budget by a year or more. Request the last twelve months and read them for recurring characters: the elevator that keeps failing, the insurance renewal the board is dreading, the engineer's presentation about the garage, the assessment that was discussed and tabled.",
          "Minutes also reveal governance. A board that meets regularly, documents decisions, and communicates plainly is an asset that never appears on a balance sheet. A board at war with itself, or with its property manager, produces the kind of chaos that eventually shows up in deferred repairs and litigation — both of which are financing problems.",
          "Nothing in the minutes is automatically disqualifying. The point is sequencing: problems discussed in minutes become assessments and questionnaire answers later. Reading them during your review window means you negotiate with tomorrow's information at today's prices."
        ]
      },
      {
        heading: "Rules and restrictions: can you use the unit the way you plan to?",
        paragraphs: [
          "The declaration, bylaws, and rules control leasing, pets, renovations, parking, and occupancy. If your plan involves renting the unit — seasonally, annually, or ever — read the leasing provisions first: minimum lease terms, approval requirements, caps on the number of rented units, and waiting periods for new owners all appear routinely in Florida documents.",
          "Restrictions cut both ways for financing and value. Heavy short-term rental activity can push a building toward condotel territory that agency lenders avoid, while strict leasing limits protect owner-occupancy ratios but constrain your exit options. Neither is wrong; they are different buildings, and your financing should match the one you are actually buying.",
          "Finally, connect what you read to your loan early. TRACT arranges condo financing through wholesale lenders, and the documents you receive under the disclosure statute answer much of what a lender's project review will ask. Sharing them with your broker during the review window — not after — is how condo contracts keep their dates."
        ]
      }
    ],
    faqs: [
      {
        question: "How long do I have to review condo documents in Florida?",
        answer:
          "For resale units, section 718.503 makes the contract voidable by the buyer for a statutory number of days — excluding Saturdays, Sundays, and legal holidays — after signing and receiving the required documents, with the right ending at closing. Developer sales carry a longer statutory period. Check the statute's current text and confirm the mechanics with a Florida real estate attorney."
      },
      {
        question: "Which documents am I entitled to receive as a resale buyer?",
        answer:
          "The statute's list includes the declaration, articles of incorporation, bylaws and rules, the association's question-and-answer sheet, and financial information, with the current statute also reaching documents like inspection reports and structural integrity reserve studies where applicable. You can separately ask the seller or association for board minutes and the budget detail, which are association records."
      },
      {
        question: "What is the single biggest red flag in a condo document package?",
        answer:
          "A mismatch between the building's age and its money: an older building with low dues, thin reserves, no recent reserve study, and minutes full of deferred repair discussions. Any one of those items alone is a question; the pattern together usually means a special assessment is coming and agency financing may tighten."
      },
      {
        question: "Do lenders read the same documents I receive?",
        answer:
          "Substantially, yes. The project review draws on the budget, insurance, reserve information, and association answers to the condo questionnaire, which overlap heavily with your disclosure package. A problem you spot during your review window is one an underwriter is likely to spot later — which is exactly why the window is valuable."
      }
    ],
    sources: [
      {
        publisher: "Florida Senate",
        title: "Section 718.503, Florida Statutes — Disclosure prior to sale",
        url: "https://www.flsenate.gov/Laws/Statutes/2025/718.503"
      },
      {
        publisher: "Florida Senate",
        title:
          "Section 718.112, Florida Statutes — Bylaws; reserves and structural integrity reserve studies",
        url: "https://www.flsenate.gov/Laws/Statutes/2025/718.112"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide, Full Review Process (project budget and reserve requirements)",
        url: "https://selling-guide.fanniemae.com/sel/b4-2.2-02/full-review-process"
      }
    ],
    related: [
      {
        href: "/resources/special-assessments-mortgage",
        label: "Special assessments and your mortgage"
      },
      { href: "/resources/condo-master-insurance-h06", label: "Master policy vs. HO-6 coverage" },
      { href: "/mortgage/condo", label: "Condo financing with TRACT" },
      { href: "/plan", label: "Build your financing plan" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "condo-master-insurance-h06",
    category: "condo",
    title: "Condo Master Policy vs. HO-6: What Lenders Require",
    description:
      "How a Florida condo association's master insurance and your walls-in HO-6 policy fit together, where flood coverage enters, and what mortgage lenders check on both.",
    h1: "The master policy and your HO-6: two policies, one insured building",
    answerSummary:
      "Condo insurance is split by law and by lender requirement: the association's master policy covers the building as originally built — structure, common elements, and most systems — while the unit owner's HO-6 policy covers the interior 'walls-in' property Florida law assigns to owners, such as flooring, cabinets, appliances, and improvements. Lenders require both layers to meet coverage standards, and in flood zones a building-level flood policy as well.",
    sections: [
      {
        heading: "Where the master policy ends and yours begins",
        paragraphs: [
          "Florida draws the boundary in statute. Under section 718.111(11), the association's property insurance must cover the condominium property as originally installed — the structure, roof, common elements, and building systems — while unit owners are responsible for items within their units such as floor, wall, and ceiling coverings, electrical fixtures, appliances, water heaters, built-in cabinets and countertops, and window treatments, plus anything the declaration assigns to them.",
          "That statutory line is why the unit owner's policy is called walls-in coverage. Your HO-6 policy picks up where the master policy stops: the interior finishes, your improvements and betterments, your personal property, your liability, and — critically — the master policy's deductible share that can be passed to owners after a building loss.",
          "The declaration can move the boundary for particular items, so the master policy, the declaration, and your HO-6 have to be read together. An insurance agent who works Florida condos will reconcile the three; the association's management company can supply the master policy summary your agent needs."
        ]
      },
      {
        heading: "What lenders require from the association's coverage",
        paragraphs: [
          "Mortgage lenders check the building's insurance before they check yours. Fannie Mae's Selling Guide section B7-3-03 requires the master property policy to be written on a special or equivalent coverage form, to insure the project's improvements at full replacement cost, to settle losses on a replacement-cost basis, and to keep deductibles within the guide's published limits. Liability and, where equipment warrants it, boiler and machinery coverage round out the package.",
          "In Florida's insurance market, these requirements do real work. Associations facing steep premiums sometimes accept high wind deductibles or coverage below replacement cost, and either choice can make every unit in the building ineligible for agency financing until the policy is corrected. The certificate of insurance the lender collects from the association is where this surfaces.",
          "If the building sits in a special flood hazard area, a building-level flood policy is part of the picture as well. The National Flood Insurance Program's FloodSmart resources are the plain-language starting point for what flood policies cover; note that standard property insurance does not cover flood, and building coverage and contents coverage are separate purchases."
        ]
      },
      {
        heading: "What lenders require from your HO-6",
        paragraphs: [
          "Your own policy is not optional decoration. Fannie Mae's section B7-3-04 requires a unit owner's policy whenever the master policy leaves interior portions of the unit uncovered or carries a per-unit deductible, sized to restore the uncovered interior, written to settle at replacement cost, and with the deductible held within the guide's limits.",
          "Practically, your insurance agent will calculate the walls-in replacement value — what it would cost to rebuild the interior finishes and improvements the statute and declaration assign to you — and set the dwelling coverage on the HO-6 accordingly. Loss assessment coverage, which responds when the association passes part of a large loss to owners, is an inexpensive add-on worth discussing given Florida's deductible structures.",
          "Your lender will collect proof of the HO-6 before closing and require it to stay in force. If your unit is in a flood zone, expect a conversation about contents or unit-level flood coverage too, depending on what the association's flood policy covers."
        ]
      },
      {
        heading: "Florida-specific pressure points",
        paragraphs: [
          "Wind is the recurring stress. Hurricane deductibles on master policies are typically expressed as a share of the building's insured value, and a large building's deductible after a storm can be a very large number that the association must collect from owners — which is exactly the scenario loss assessment coverage and a properly sized HO-6 exist for.",
          "Premium volatility is the second. Associations shop coverage at every renewal, and a renewal that arrives with a much higher premium often becomes next year's dues increase or a special assessment. When you read an association budget, the insurance line deserves particular attention: an insurance line that has not moved in years may mean the coverage has quietly thinned.",
          "The state publishes genuinely useful consumer material here. The Florida Department of Financial Services maintains plain-language guides to property insurance for consumers, and its resources are a sensible companion when you compare what the association carries against what you need. For the financing itself, TRACT arranges condo loans and coordinates the insurance documentation lenders require — the association's certificates and your HO-6 — so the pieces arrive verified before closing week."
        ]
      }
    ],
    faqs: [
      {
        question: "What does an HO-6 policy cover that the master policy does not?",
        answer:
          "The interior property Florida law and your declaration assign to the unit owner — typically flooring, wall and ceiling coverings, cabinets and countertops, appliances, water heaters, fixtures, and improvements — plus your personal property, personal liability, loss of use, and optionally loss assessment coverage for your share of association deductibles or uninsured common losses."
      },
      {
        question: "Does my lender really check the association's insurance?",
        answer:
          "Yes. Agency guidelines set requirements for the master policy's coverage form, replacement-cost coverage, loss settlement, deductibles, and liability insurance, and lenders collect certificates from the association to verify them. A master policy outside those limits can make units in the building ineligible for agency loans until the coverage is corrected."
      },
      {
        question: "Who buys flood insurance in a Florida condo building?",
        answer:
          "In a special flood hazard area, the association carries building-level flood coverage, and unit owners can add their own coverage for contents or gaps depending on what the master flood policy includes. Flood is always a separate policy from standard property insurance; FEMA's FloodSmart program explains the building-versus-contents split."
      },
      {
        question: "What is loss assessment coverage and do I need it?",
        answer:
          "It is an HO-6 add-on that pays your share when the association assesses owners after a covered loss — commonly a large hurricane deductible. Given how Florida master policies structure wind deductibles, many owners carry it. Whether and how much is a conversation for your insurance agent against your building's actual master policy."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title:
          "Selling Guide B7-3-03, Master Property Insurance Requirements for Project Developments",
        url: "https://selling-guide.fanniemae.com/sel/b7-3-03/master-property-insurance-requirements-project-developments"
      },
      {
        publisher: "Fannie Mae",
        title:
          "Selling Guide B7-3-04, Individual Property Insurance Requirements for a Unit in a Project Development",
        url: "https://selling-guide.fanniemae.com/sel/b7-3-04/individual-property-insurance-requirements-unit-project-development"
      },
      {
        publisher: "Florida Senate",
        title: "Section 718.111, Florida Statutes — The association; insurance",
        url: "https://www.flsenate.gov/Laws/Statutes/2025/718.111"
      },
      {
        publisher: "FEMA National Flood Insurance Program",
        title: "FloodSmart — Flood insurance basics",
        url: "https://www.floodsmart.gov/"
      },
      {
        publisher: "Florida Department of Financial Services",
        title: "Understanding Insurance — consumer resources",
        url: "https://www.myfloridacfo.com/division/consumers/understanding-insurance"
      }
    ],
    related: [
      { href: "/resources/hoa-condo-docs-review", label: "What to read in the condo documents" },
      { href: "/resources/condo-financing-florida", label: "How lenders review a condo building" },
      { href: "/mortgage/condo", label: "Condo financing with TRACT" },
      { href: "/calculators/mortgage-payment", label: "Mortgage payment calculator" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "fha-va-condo-approval",
    category: "condo",
    title: "FHA and VA Condo Approval Lists: How to Check a Project",
    description:
      "FHA and VA condo loans require project approval. Where HUD and VA's official lookup tools live, how to read results, and options when a building is not listed.",
    h1: "FHA and VA condo approval: checking the lists before you fall for a unit",
    answerSummary:
      "FHA and VA condo loans require the project, not just the borrower, to be acceptable to the agency. Both maintain public lookup tools: HUD's condominium search shows FHA project approvals by name, location, and status, and the VA's condo report on its loan guaranty portal shows VA project status. Checking a building before writing an offer tells you immediately whether these programs are on the table or an approval effort is needed first.",
    sections: [
      {
        heading: "Why FHA and VA keep project lists at all",
        paragraphs: [
          "Government-backed condo lending works on a different model from conventional. Fannie Mae and Freddie Mac mostly delegate project review to lenders loan by loan; FHA and VA instead approve projects centrally and publish the results. If the building holds a current approval, an eligible borrower can use the program there; if it does not, the loan cannot proceed until the project is approved.",
          "The logic is the same as every other condo rule: the agency's guarantee stands behind a unit whose value depends on the whole building's finances, insurance, and management, so the agency reviews the building. The difference is where the review happens and how visible the result is — the lists are public, which makes this one of the few parts of condo financing you can check yourself in minutes.",
          "For Florida buyers using VA or FHA benefits, the list check belongs at the top of the search process. Filtering to approved buildings before touring saves the most painful version of this problem: finding the right unit in a building your loan program cannot touch on your contract's timeline."
        ]
      },
      {
        heading: "Checking the FHA list",
        paragraphs: [
          "HUD publishes its approved condominium search on the entp.hud.gov portal. You can search by state, county, city, zip code, or project name, and filter by status — approved, expired, rejected, or withdrawn. The record shows the approval's dates, so check that the status is current rather than lapsed: FHA project approvals expire and must be renewed, and buildings drift off the list simply because nobody re-applied.",
          "Read a miss carefully. A building absent from the list may never have applied, which is neutral, or may have been rejected or allowed to expire, which are different signals. The approval history shown in the lookup helps distinguish them.",
          "FHA also has mechanisms short of full project approval — including case-by-case unit-level approval in unapproved projects under criteria HUD sets — and approval requirements differ for site condominiums. Whether a specific path is open for your building and transaction is a question your lender answers against HUD's current rules; the lookup tells you which conversation to have."
        ]
      },
      {
        heading: "Checking the VA list",
        paragraphs: [
          "The VA maintains its own approved-condo database, published through the condo report on its loan guaranty portal at lgy.va.gov. Search by state and name to see whether a project is approved, and note the status: accepted projects are eligible, while other statuses signal an application in process or a problem in the record.",
          "VA approval is separate from FHA approval. The VA reviews the project's organizational documents against its own requirements, and a building can hold one agency's approval without the other. If the building is unapproved, a lender can submit the project's documents to the VA for review — associations and sellers motivated to widen their buyer pool sometimes cooperate readily, but the review takes time that a short contract window may not allow.",
          "The VA's home loan program itself — eligibility, entitlement, and the certificate of eligibility — is documented on VA.gov. The project approval is a separate gate from your personal eligibility: both must be open for the loan to close."
        ]
      },
      {
        heading: "When the building is not on the list",
        paragraphs: [
          "You have three honest options. First, pursue approval: for VA, a lender submits the project for review; for FHA, the association or other parties can seek project approval, and unit-level paths may exist depending on the building and HUD's current criteria. This works best when the association cooperates and your closing date has slack.",
          "Second, change programs. Conventional financing reviews projects loan by loan rather than from a central list, so a building without FHA or VA approval may still pass a conventional project review — with the down payment and qualifying differences that come with switching programs.",
          "Third, change buildings. In condo-dense Florida markets there are usually approved alternatives, and the lookup tools let you generate that list before you tour. TRACT arranges FHA, VA, and conventional condo loans through wholesale lenders; we run the project checks at pre-approval so your offer targets buildings your program can actually close in. The agencies, not TRACT, decide project approval."
        ]
      }
    ],
    faqs: [
      {
        question: "Where do I check whether a condo is FHA or VA approved?",
        answer:
          "HUD's approved condominium search at entp.hud.gov lets you search FHA project approvals by location, name, and status. The VA's condo report, published through its loan guaranty portal at lgy.va.gov, shows VA project status. Both are free and public, and both are worth checking before an offer, since each agency keeps its own list."
      },
      {
        question: "The building's FHA approval is expired. What does that mean?",
        answer:
          "FHA project approvals lapse unless renewed, so an expired status often reflects administrative neglect rather than a problem with the building. The project can seek approval again, and depending on HUD's current criteria there may be unit-level options. Your lender can tell you which path fits your timeline."
      },
      {
        question: "Can a building be VA approved but not FHA approved, or vice versa?",
        answer:
          "Yes. The agencies maintain separate lists and separate review standards, and many buildings sought only one approval — or neither. That is why the check must be run against the specific program you plan to use rather than assumed from a general reputation of being government-loan friendly."
      },
      {
        question: "How long does getting a project approved take?",
        answer:
          "It depends on the agency's queue and how quickly the association produces documents, and neither is within your control as a buyer. Treat approval-in-progress as a timeline risk: either build the time into your contract, hold a conventional backup plan, or focus on buildings already approved."
      }
    ],
    sources: [
      {
        publisher: "U.S. Department of Housing and Urban Development",
        title: "FHA Approved Condominiums search",
        url: "https://entp.hud.gov/idapp/html/condlook.cfm"
      },
      {
        publisher: "U.S. Department of Veterans Affairs",
        title: "VA Loan Guaranty — Condo Report",
        url: "https://lgy.va.gov/lgyhub/condo-report"
      },
      {
        publisher: "U.S. Department of Veterans Affairs",
        title: "VA housing assistance — home loans",
        url: "https://www.va.gov/housing-assistance/home-loans/"
      }
    ],
    related: [
      { href: "/mortgage/fha", label: "FHA loans with TRACT" },
      { href: "/mortgage/va", label: "VA loans with TRACT" },
      { href: "/mortgage/condo", label: "Condo financing with TRACT" },
      {
        href: "/resources/warrantable-vs-non-warrantable",
        label: "Warrantable vs. non-warrantable condos"
      }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "condotel-financing",
    category: "condo",
    title: "Condotel Financing: Why Condo-Hotels Need Different Loans",
    description:
      "Condo-hotels sit outside Fannie Mae and Freddie Mac eligibility. What makes a building a condotel, how to spot one, and how these units get financed in Florida.",
    h1: "Condotel financing: why condo-hotels fall outside standard agency lending",
    answerSummary:
      "A condotel is a condominium operated like a hotel — front-desk registration, short stays, rental pooling, hospitality services — and both Fannie Mae and Freddie Mac exclude such projects from the loans they buy, because the unit's value behaves like resort revenue rather than housing. Condotel buyers finance through portfolio and non-QM lenders instead, typically with larger down payments and pricing tied to the property's income character rather than agency terms.",
    sections: [
      {
        heading: "What makes a condo a condotel",
        paragraphs: [
          "The name describes an operating model, not an architectural style. A condotel is legally a condominium — individually deeded units, an association, a declaration — that functions as a hotel: units rent by the night through an on-site or affiliated program, guests check in at a desk, housekeeping turns the rooms, and the building may carry a hospitality brand.",
          "Fannie Mae's ineligible-projects section, Selling Guide B4-2.1-03, draws the line in operational terms: projects operated or managed as a hotel, motel, or similar commercial enterprise are ineligible, and characteristics such as mandatory rental pooling, hotel-type services, registration desks, and marketing the project as a hospitality property all point the wrong way. Freddie Mac's condo framework similarly conditions eligibility on the project's residential character and financial viability.",
          "The classification is about the project, not your intentions. Buying a unit as your full-time residence inside a building run as a hotel does not make the building residential — the project review looks at how the building operates, and every unit in it inherits the answer."
        ]
      },
      {
        heading: "Why the agencies stay away",
        paragraphs: [
          "Agency mortgages are priced for housing: collateral whose value rests on people needing somewhere to live. A condotel unit's value rests substantially on nightly rental income, which moves with tourism, seasonality, brand management, and the broader economy. That is commercial lodging risk wearing a residential deed, and it behaves differently in a downturn — resort markets historically see sharper price swings and deeper distress than primary housing.",
          "Structure compounds the risk. Rental pooling agreements can encumber the unit, hospitality operators can fail or change terms, and association budgets entangled with hotel operations are harder to evaluate as housing finances. The appraisal problem is real too: comparable sales are other condotel units, whose prices embed the same income volatility.",
          "None of this makes condotels bad assets. It makes them a different asset class — closer to a small hospitality business than to a home — and the agencies' charters and guidelines aim their guarantees at housing. The exclusion is a boundary, not a verdict."
        ]
      },
      {
        heading: "How condotel purchases actually get financed",
        paragraphs: [
          "A real lending market exists for condotels; it simply is not the agency market. Portfolio lenders — banks and credit unions that keep loans on their own books — and non-QM investors underwrite condotels under their own guidelines. Some price the loan against the borrower's full finances; others, in the DSCR style, lean on the unit's documented rental income relative to the proposed payment.",
          "Expect structural differences from agency lending: larger down payments, pricing above comparable agency terms, reserve requirements, and closer attention to the rental program agreement and the project's operating history. Each lender publishes its own terms and they change with the market, so treat specific figures as questions for a live quote.",
          "Underwriting the project remains part of the deal. Even condotel lenders evaluate the building — occupancy history, the operator, the association's finances, insurance — because the collateral is still a unit inside a collective enterprise. The documents you would gather for any Florida condo purchase still matter here; the standards they are measured against differ."
        ]
      },
      {
        heading: "Spotting a condotel before you write the offer",
        paragraphs: [
          "Some signals are visible from the listing: a unit sold furnished with a rental history attached, a building with a resort brand in its name, minimum-stay rules measured in nights, or marketing aimed at investors' nightly revenue. Others live in the documents — the declaration and rules will show mandatory rental programs, and the budget will show hospitality operations.",
          "Ask direct questions early: is there a front desk and rental program, is participation mandatory, what share of units are in it, and has any agency lender recently declined the project as a condotel. Listing agents in resort markets generally know their building's status, and the association's manager certainly does.",
          "The cost of guessing wrong is a financing surprise mid-contract. TRACT works Florida's coastal markets where the residential-to-resort spectrum is crowded, and we arrange both agency condo loans and the non-agency programs condotels need — identifying which market a building belongs to is the first thing we check, before your deposit is at risk. The lender makes the credit decision; our job is aiming the file at the right one."
        ]
      }
    ],
    faqs: [
      {
        question: "Can I get a conventional Fannie Mae or Freddie Mac loan on a condotel?",
        answer:
          "Projects operated as hotels are ineligible under both agencies' project standards, so standard conventional financing is generally unavailable while the building operates that way. The classification follows the project's operation, not your personal use of the unit. Portfolio and non-QM lenders are the realistic financing market for condotel units."
      },
      {
        question: "How do lenders that accept condotels underwrite them?",
        answer:
          "Under their own guidelines, since the loans are not sold to the agencies. Common patterns include larger down payments, pricing above agency terms, scrutiny of the rental program agreement and the building's operating history, and in some programs qualification based on the unit's rental income relative to the payment rather than only the borrower's income."
      },
      {
        question: "Is a condo with some short-term rentals automatically a condotel?",
        answer:
          "No. Many Florida buildings permit short rentals without operating as hotels. The review looks at how the project functions: mandatory rental pooling, front-desk operations, hospitality services, and hotel-style marketing are the disqualifying pattern. A building near the line deserves an early read of its documents, because reasonable lenders can reach different conclusions."
      },
      {
        question: "Do condotels make sense as investments?",
        answer:
          "That is a business judgment, not a financing fact. The unit couples you to tourism revenue, an operator, and resort-market pricing swings, and your eventual buyer faces the same non-agency financing you did. Model the income honestly, read the rental agreement with an attorney, and price the financing difference into the return."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B4-2.1-03, Ineligible Projects",
        url: "https://selling-guide.fanniemae.com/sel/b4-2.1-03/ineligible-projects"
      },
      {
        publisher: "Freddie Mac",
        title: "Condominium Unit Mortgages",
        url: "https://sf.freddiemac.com/working-with-us/origination-underwriting/mortgage-products/condominium-unit-mortgages"
      }
    ],
    related: [
      {
        href: "/resources/warrantable-vs-non-warrantable",
        label: "Warrantable vs. non-warrantable condos"
      },
      { href: "/mortgage/dscr", label: "DSCR loans" },
      {
        href: "/calculators/investment-property-cash-flow",
        label: "Investment property cash flow calculator"
      },
      { href: "/mortgage/investment-property", label: "Investment property loans" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "condo-investor-ratios",
    category: "condo",
    title: "Investor Concentration and Condo Financing in Florida",
    description:
      "How the share of investor-owned units in a condo building shapes financing for every unit in it: occupancy ratios, single-entity limits, and Florida's LTV overlay.",
    h1: "How investor concentration in a building affects financing for everyone in it",
    answerSummary:
      "Lenders measure who owns a condo building, not just who is buying the unit. The share of investor-owned units, whether any single entity holds too many, and assessment delinquency rates all feed project review. Heavy investor concentration can restrict which loan types the project supports and, in Florida, interacts with occupancy-based loan-to-value rules — so a building's ownership mix quietly sets the financing terms available to every buyer and every seller in it.",
    sections: [
      {
        heading: "Why lenders count the neighbors",
        paragraphs: [
          "A condominium is a financial partnership you join by deed. Every owner funds the budget, votes on the board, and decides each month whether the assessment gets paid. Owner-occupants and investors behave differently as partners: residents live with the consequences of deferred maintenance and tend to keep paying through hard times, while investors run the unit as a business and cut losses when the numbers stop working.",
          "History taught the agencies this the expensive way. In stressed markets, investor-heavy buildings saw assessment delinquencies climb faster, budgets buckle, and values fall further — each delinquent unit shifting costs onto the remaining payers in a compounding spiral. Project standards now measure the exposure up front: the occupancy mix, concentration of ownership, and delinquency rates are all standard condo questionnaire items.",
          "The result is a fact worth internalizing before you buy: the building's ownership census is part of your unit's financeability, today and at resale, whether or not you personally are an investor."
        ]
      },
      {
        heading: "The ratios in play",
        paragraphs: [
          "Three measurements do most of the work in project review. First, owner-occupancy: what share of units are principal residences or second homes versus rentals. Under Fannie Mae's framework, occupancy-ratio requirements attach in defined situations — notably for investment-property purchases in established projects — rather than to every transaction, and the applicable figures are published in the Selling Guide rather than being a constant to memorize.",
          "Second, single-entity concentration: whether one person, company, or the developer holds more units than the guide allows for a project of that size. A building can be majority owner-occupied and still fail here because one landlord accumulated a large block — a concentration of budget risk and voting control the agencies cap. Related tests limit how much of a project one lender can finance.",
          "Third, financial behavior: the share of units delinquent on assessments, which is investor concentration's downstream symptom and a project-eligibility test in its own right. The condo questionnaire asks for all three, and the answers move loan availability for the whole building."
        ]
      },
      {
        heading: "Florida's occupancy-sensitive overlay",
        paragraphs: [
          "Florida gets its own page in the agency rulebook. Fannie Mae's Selling Guide section B4-2.2-04 sets Florida-specific requirements, including maximum loan-to-value frameworks for attached units in established projects that vary by occupancy type — principal residence, second home, and investment — and by the depth of project review performed. In practice, the same Florida unit can support different financing depending on how the buyer will occupy it and which review the project can pass.",
          "This overlay makes investor concentration doubly consequential in Florida: investor purchases face occupancy-linked constraints, and heavily invested buildings can struggle to pass the deeper reviews that unlock better terms. Coastal and vacation-market buildings — precisely where investor share runs highest — feel this most.",
          "Sellers should notice the mirror image. A building whose mix drifts too far toward rentals gradually narrows its future buyer pool to cash and non-agency financing, which shows up over time in the prices its units achieve. The occupancy mix is a slow-moving driver of exit value, not just an underwriting checkbox."
        ]
      },
      {
        heading: "Reading a building before you commit",
        paragraphs: [
          "The information is obtainable. The condo questionnaire completed for your lender states the occupancy breakdown, single-entity holdings, and delinquency figures; association managers can often give informal answers earlier. County property records show mailing addresses and homestead exemptions unit by unit if you want independent evidence. Board minutes reveal whether leasing caps or rental disputes are live topics.",
          "For owner-occupant buyers, a rental-heavy building is not automatically disqualifying for your own loan — occupancy tests bind hardest on investment purchases — but it shapes the association's culture, budget priorities, and your resale market. For investor buyers, the ratios can gate the transaction directly, and the building's existing mix determines how much room remains.",
          "TRACT arranges condo financing across this whole spectrum — primary residences, second homes, and investor purchases including DSCR programs for rental condos — through wholesale lenders whose appetites for occupancy mix differ. We pull the building's numbers early and match the file to a lender whose guidelines fit both you and the building; the lender makes the credit decision on each."
        ]
      }
    ],
    faqs: [
      {
        question: "Do owner-occupancy requirements apply when I am buying the condo to live in?",
        answer:
          "Under Fannie Mae's framework, occupancy-ratio tests attach in defined cases — most prominently investment-property purchases in established projects — so a principal-residence purchase is generally not blocked by the building's rental share alone. Other project tests still apply, and FHA and VA run their own occupancy criteria, so the check is program-specific."
      },
      {
        question: "What is a single-entity limit?",
        answer:
          "A cap on how many units one owner — a person, company, or developer — may hold in a project before it becomes ineligible, scaled to project size and published in the agency guides. It exists because one overextended bulk owner can destabilize the budget and control association decisions. Small projects have their own tailored thresholds."
      },
      {
        question: "How do I find out a building's investor percentage?",
        answer:
          "Ask the association or its manager, request the figures gathered on recent lender questionnaires, or reconstruct it from county property records using owner mailing addresses and homestead exemptions. Listing agents active in the building usually know it approximately. Verify anything load-bearing through the questionnaire your lender obtains."
      },
      {
        question: "Does high investor concentration hurt my unit's value?",
        answer:
          "It narrows financing at the margin, and financing breadth supports prices: fewer eligible loan programs means fewer able buyers at resale. The effect is gradual rather than cliff-edge, and vacation markets price some of it in. Watch the trendline in the building's mix, not just the level."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title:
          "Selling Guide, Full Review Process (occupancy and project eligibility requirements)",
        url: "https://selling-guide.fanniemae.com/sel/b4-2.2-02/full-review-process"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B4-2.2-04, Geographic-Specific Condo Project Considerations",
        url: "https://selling-guide.fanniemae.com/sel/b4-2.2-04/geographic-specific-condo-project-considerations"
      },
      {
        publisher: "Freddie Mac",
        title: "Condominium Unit Mortgages",
        url: "https://sf.freddiemac.com/working-with-us/origination-underwriting/mortgage-products/condominium-unit-mortgages"
      }
    ],
    related: [
      { href: "/mortgage/investment-property", label: "Investment property loans" },
      { href: "/mortgage/dscr", label: "DSCR loans" },
      {
        href: "/resources/warrantable-vs-non-warrantable",
        label: "Warrantable vs. non-warrantable condos"
      },
      { href: "/calculators/dscr", label: "DSCR calculator" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "townhouse-vs-condo-financing",
    category: "condo",
    title: "Townhouse vs. Condo Financing: Legal Form Decides",
    description:
      "Your townhome may be a condo in the eyes of your lender. Why legal form beats building form in mortgage underwriting, and how to check what you are actually buying.",
    h1: "Townhouse vs. condo financing: the deed decides, not the architecture",
    answerSummary:
      "Lenders classify a property by its legal form of ownership, not its architecture. A townhome where you own the land beneath the unit — usually inside a planned unit development — finances like a house with an HOA, while an identical-looking townhome titled as a condominium unit finances as a condo, complete with project review, questionnaire, and master insurance requirements. The declaration and deed, not the floor plan, determine which process and costs apply.",
    sections: [
      {
        heading: "Two questions that sound the same but are not",
        paragraphs: [
          "Buyers ask what a home looks like; underwriting asks what is legally owned. A townhouse describes architecture — an attached, usually multi-story dwelling sharing walls with its neighbors. A condominium describes a legal regime — you own a defined unit plus an undivided share of common elements, under a recorded declaration, with an association governed in Florida by Chapter 718 of the statutes.",
          "The two vocabularies cross freely. Florida subdivisions are full of townhomes platted as fee-simple lots inside planned unit developments, where you own the ground under your walls and the HOA owns the shared spaces. They are equally full of townhome-style buildings recorded as condominiums, where the association owns the structure's exterior and the land, and your deed conveys a unit in the air plus a share of everything else.",
          "Fannie Mae's project standards in Selling Guide section B4-2.1 make the classification consequential: condos, co-ops, and planned unit developments each carry different review requirements, and the property's recorded documents — not its marketing — decide which set applies."
        ]
      },
      {
        heading: "How to tell what you are actually buying",
        paragraphs: [
          "The answer is in the recorded paperwork, and it takes minutes to check. A condominium exists because a declaration of condominium was recorded; the legal description on the deed will read as a unit number within a named condominium. A fee-simple townhome's legal description reads as a lot and block within a recorded plat, and the governing document is a declaration of covenants for the community.",
          "Three quick checks: read the legal description in the listing or prior deed; look the parcel up on the county property appraiser's site, which typically labels condominium parcels; and ask the title agent, who must classify the property correctly to insure it. Florida's condominium disclosure statute also does the work for you on resales — if you receive a condominium document package with its statutory cancellation window, you are buying a condo.",
          "Do not rely on the word townhouse or villa in the listing, on the presence or absence of an HOA fee, or on neighbors' assumptions. Adjacent, identical buildings in the same community can sit under different legal regimes, and only the documents know."
        ]
      },
      {
        heading: "What condo title changes about your mortgage",
        paragraphs: [
          "Once the property is a condominium unit, condo underwriting applies regardless of its shape. The lender orders a condo questionnaire and reviews the project: association budget and reserves, master insurance, litigation, occupancy mix, and any structural or assessment issues. The transaction absorbs the associated costs and timeline — questionnaire and estoppel fees, document review, and the possibility that the project, not you, fails review.",
          "Insurance flips too. In a condominium, the association's master policy insures the structure and your lender requires an HO-6 for the interior; in a fee-simple townhome, you insure the whole dwelling with a standard homeowners policy, with the HOA covering only common areas. The premium, the coverage boundary, and what your lender verifies all shift with the legal form.",
          "Planned unit developments get the lighter touch: agency review of a PUD is generally minimal for established communities, without the condo questionnaire apparatus. And within condo world, note that detached condominiums — free-standing houses under condo title — get streamlined treatment under agency rules, another reminder that the review follows the paperwork rather than the architecture."
        ]
      },
      {
        heading: "Why Florida builders choose each form — and what it means for you",
        paragraphs: [
          "Developers pick the legal structure for their own reasons: condominium regimes suit stacked or intertwined construction where slicing the land into lots is impractical, centralize exterior maintenance and insurance, and are governed by Chapter 718's machinery; platted townhomes suit row construction on individual footprints and leave structure and insurance with each owner under a lighter HOA framework.",
          "For a buyer, neither form is better in the abstract — they allocate maintenance, insurance, and control differently, and they finance differently. The condo form brings project review and the state's structural inspection framework where the building qualifies; the fee-simple form brings full responsibility for your own roof and walls. Price the difference in dues against what the dues actually buy.",
          "Practically: identify the legal form on day one and tell your loan officer, because it changes the document list, the third-party fees, and the realistic timeline. TRACT arranges financing for both — condo units through lenders comfortable with Florida project review, and townhomes in PUDs through the simpler track — and confirming the classification is one of the first things we do with a new contract. For what the legal form means for your rights and obligations, a Florida real estate attorney is the right reader of the declaration; this is education, not legal advice."
        ]
      }
    ],
    faqs: [
      {
        question: "My listing says townhouse. Why is my lender treating it as a condo?",
        answer:
          "Because the recorded declaration and your deed's legal description show a condominium unit, and underwriting follows the legal form. Listing labels describe architecture, not title. The condo questionnaire, project review, master insurance verification, and HO-6 requirement all attach to the recorded form of ownership."
      },
      {
        question: "Is it cheaper to finance a fee-simple townhome than a condo?",
        answer:
          "The transaction usually involves fewer condo-specific steps — no project questionnaire or condo project review — and agency pricing treats attached condo units differently from other attached homes in some scenarios, with the specifics published in the agency guides and reflected in your quote. Offsetting that, you insure the entire structure yourself, so compare total monthly cost, not just the loan terms."
      },
      {
        question: "What is a site or detached condominium?",
        answer:
          "A free-standing house whose land and ownership are organized under a condominium declaration rather than a platted lot. Agencies recognize the lower risk and apply streamlined review to detached condo units, but it is still legally a condo — association, declaration, and master-policy structure included — so verify insurance responsibilities in the documents."
      },
      {
        question: "How do I check the legal form before making an offer?",
        answer:
          "Read the legal description in the prior deed or title commitment: a unit in a named condominium means condo; a lot and block in a plat means fee simple. County property appraiser records usually label condominium parcels, and any title agent can confirm in minutes. On a Florida resale, receiving the statutory condominium disclosure package is itself the answer."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B4-2.1-01, General Information on Project Standards",
        url: "https://selling-guide.fanniemae.com/sel/b4-2.1-01/general-information-project-standards"
      },
      {
        publisher: "Freddie Mac",
        title: "Condominium Unit Mortgages",
        url: "https://sf.freddiemac.com/working-with-us/origination-underwriting/mortgage-products/condominium-unit-mortgages"
      },
      {
        publisher: "Florida Senate",
        title: "Section 718.503, Florida Statutes — Disclosure prior to sale",
        url: "https://www.flsenate.gov/Laws/Statutes/2025/718.503"
      }
    ],
    related: [
      { href: "/mortgage/condo", label: "Condo financing with TRACT" },
      { href: "/mortgage/purchase", label: "Purchase loans with TRACT" },
      { href: "/resources/condo-master-insurance-h06", label: "Master policy vs. HO-6 coverage" },
      { href: "/calculators/closing-cost", label: "Closing cost calculator" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  }
];
