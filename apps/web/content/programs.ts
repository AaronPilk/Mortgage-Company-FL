/**
 * Loan program pages.
 *
 * Every page here is educational. None of it states a rate, a fee, a limit that
 * changes annually, an approval threshold, or a claim that a specific borrower
 * qualifies — those require a current primary source and a licensed human, and
 * they belong in a conversation, not a static page.
 *
 * `sources` are the primary references a reviewer must check before this page
 * moves from noindex to index. `requiresLenderPath` marks programs the company
 * cannot offer until an executed broker agreement covers them.
 */

export type ProgramSource = { publisher: string; title: string; url: string };

export type Program = {
  slug: string;
  navLabel: string;
  h1: string;
  title: string;
  description: string;
  eyebrow: string;
  summary: string;
  mayFit: string[];
  exploreAlternativesIf: string[];
  howItWorks: { heading: string; body: string }[];
  variables: { label: string; body: string }[];
  faqs: { question: string; answer: string }[];
  relatedCalculators: { href: string; label: string }[];
  relatedPrograms: string[];
  sources: ProgramSource[];
  requiresLenderPath: boolean;
  loanTypeForSchema: string | null;
};

const CFPB_MORTGAGE: ProgramSource = {
  publisher: "Consumer Financial Protection Bureau",
  title: "Mortgages — buying a house",
  url: "https://www.consumerfinance.gov/consumer-tools/mortgages/"
};

export const PROGRAMS: Program[] = [
  {
    slug: "purchase",
    navLabel: "Buying a home",
    h1: "Financing a home purchase in Florida",
    title: "Home Purchase Financing in Florida",
    description:
      "What actually determines your payment, your cash to close, and your options when buying a home in Florida.",
    eyebrow: "Purchase",
    summary:
      "A purchase mortgage is the loan you use to buy a home. The interesting part is not the loan itself — it is the interaction between price, down payment, rate, term, taxes, and insurance, because in Florida the last two move the payment more than most buyers expect.",
    mayFit: [
      "You are buying a primary residence, second home, or investment property",
      "You want to understand your realistic payment range before you write offers",
      "You need to know how much cash you actually need at closing, not just the down payment"
    ],
    exploreAlternativesIf: [
      "You already own the home and want to change your rate or term — that is a refinance",
      "You are buying with cash and only want a comparison of the tradeoffs"
    ],
    howItWorks: [
      {
        heading: "You establish a realistic budget",
        body: "Start with the full monthly cost, not the principal and interest alone. In Florida, property taxes, homeowners insurance, wind coverage, flood coverage where applicable, and HOA dues frequently add more to the payment than buyers plan for. The payment calculator lets you enter each one separately so you can see which line is driving the number."
      },
      {
        heading: "You get a conversation, then a documented review",
        body: "A licensed loan originator reviews your income, obligations, credit profile, assets, and timeline. That conversation is what turns a calculator estimate into an actual set of options, and it is the point at which real program eligibility can be assessed."
      },
      {
        heading: "You apply through a secure system",
        body: "The application itself happens in the approved secure system, not on a marketing form. That is where documents belong, and it is where the required disclosures are issued and tracked."
      },
      {
        heading: "The lender underwrites and you close",
        body: "The lender verifies what was represented, orders an appraisal, and issues conditions. Timelines depend on the lender, the property, and how quickly documentation is returned."
      }
    ],
    variables: [
      {
        label: "Down payment",
        body: "Changes the loan amount, whether mortgage insurance applies, and often the pricing. It is not the same as cash to close."
      },
      {
        label: "Credit profile",
        body: "Affects which programs are available and how a loan is priced. Different programs weigh it differently."
      },
      {
        label: "Debt-to-income ratio",
        body: "Your existing monthly obligations reduce the housing payment a lender will support. Paying off a small balance sometimes matters more than a larger down payment."
      },
      {
        label: "Property type and occupancy",
        body: "A condo, a manufactured home, a second home, and an investment property are each underwritten differently. Florida condo financing in particular has its own project-level review."
      },
      {
        label: "Insurance",
        body: "Florida homeowners and wind premiums vary enormously by county, construction, roof age, and carrier. Get a real quote early; an assumed premium can move your qualifying payment materially."
      }
    ],
    faqs: [
      {
        question: "How much do I need for a down payment?",
        answer:
          "It depends entirely on the loan program, the property, and your profile. Several programs allow far less than twenty percent. The more useful question is how much total cash you need at closing, which includes closing costs and prepaid items — the closing cost calculator breaks that down."
      },
      {
        question: "Does using a broker cost more than going to a bank?",
        answer:
          "Not inherently. A broker works with multiple lenders, which means comparing options rather than being limited to one institution's products. What a specific transaction costs depends on the lender and the loan; we will show you the actual figures before you commit to anything."
      },
      {
        question: "Can you tell me my rate today?",
        answer:
          "Not from a web page. Rates move daily and price differently depending on credit, loan-to-value, property type, occupancy, loan amount, and lock period. Anyone publishing a single rate without those inputs is showing you an advertisement, not your rate."
      }
    ],
    relatedCalculators: [
      { href: "/calculators/mortgage-payment", label: "Estimate a monthly payment" },
      { href: "/calculators/affordability", label: "Explore an affordability range" },
      { href: "/calculators/closing-cost", label: "Plan your cash to close" }
    ],
    relatedPrograms: ["first-time-home-buyers", "conventional", "fha"],
    sources: [CFPB_MORTGAGE],
    requiresLenderPath: true,
    loanTypeForSchema: "Purchase money mortgage"
  },
  {
    slug: "refinance",
    navLabel: "Refinancing",
    h1: "Refinancing a mortgage in Florida",
    title: "Mortgage Refinancing in Florida",
    description:
      "When a refinance is worth the cost, how break-even actually works, and the tradeoff a lower payment can hide.",
    eyebrow: "Refinance",
    summary:
      "A refinance replaces your existing mortgage with a new one. It can lower a rate, change a term, remove mortgage insurance, or convert equity to cash. It always has a cost, so the question is never just whether the new rate is lower — it is whether you hold the loan long enough for the savings to exceed what you paid to get them.",
    mayFit: [
      "Your current rate is meaningfully above what is available to you now",
      "You want to shorten your term and can support the higher payment",
      "You have equity and a specific, considered use for it"
    ],
    exploreAlternativesIf: [
      "You expect to sell or move before you reach break-even",
      "You are close to paying off the loan and would be restarting amortization",
      "The only goal is a lower payment and a longer term would cost you more in total interest than you realize"
    ],
    howItWorks: [
      {
        heading: "You establish the real cost",
        body: "Refinance costs include lender fees, title, recording, and prepaid items. Financing those costs into the balance does not make them free — it moves them into the loan where you pay interest on them."
      },
      {
        heading: "You calculate break-even honestly",
        body: "Divide the cost by the monthly payment reduction. That is the number of months before the refinance has paid for itself. If you will not be in the loan that long, the math does not work regardless of how good the rate looks."
      },
      {
        heading: "You compare total interest, not just payment",
        body: "Extending from a fifteen-year remaining term back to thirty years lowers the payment and can substantially increase total interest. Our calculator shows both figures side by side for exactly this reason."
      }
    ],
    variables: [
      {
        label: "Remaining term",
        body: "How far into your current loan you are changes the comparison completely."
      },
      { label: "Closing costs", body: "The single largest driver of break-even." },
      {
        label: "How long you will stay",
        body: "The assumption that determines whether break-even is reachable."
      },
      {
        label: "Mortgage insurance",
        body: "Removing it can change the math even when the rate improvement is modest."
      },
      { label: "Cash-out amount", body: "Increases the balance and usually affects pricing." }
    ],
    faqs: [
      {
        question: "Is there a rule of thumb, like one percent?",
        answer:
          "No. A rule of thumb ignores your balance, your remaining term, your costs, and how long you will stay. On a large balance a quarter point can be worth it; on a small balance a full point may not be. Run your own numbers."
      },
      {
        question: "Can I skip a payment when I refinance?",
        answer:
          "You are not skipping anything. What appears to be a skipped payment is interest handled through payoff and prepaid items. Framing it as free is a marketing tactic, not a benefit."
      }
    ],
    relatedCalculators: [
      { href: "/calculators/refinance-break-even", label: "Calculate your break-even point" },
      { href: "/calculators/mortgage-payment", label: "Compare payments" }
    ],
    relatedPrograms: ["conventional", "va"],
    sources: [CFPB_MORTGAGE],
    requiresLenderPath: true,
    loanTypeForSchema: "Refinance mortgage"
  },
  {
    slug: "first-time-home-buyers",
    navLabel: "First-time buyers",
    h1: "First-time home buyers in Florida",
    title: "First-Time Home Buyer Guide for Florida",
    description:
      "The sequence that actually matters when you have never done this before, and where first-time buyers most often get surprised.",
    eyebrow: "First-time buyers",
    summary:
      "Being a first-time buyer is not a loan program. It is a status that can make you eligible for certain assistance programs and that changes what you need explained. The financing itself is the same set of options everyone else has.",
    mayFit: [
      "You have not owned a home in the past three years",
      "You want the process explained in order, without jargon",
      "You want to know what assistance programs exist before assuming you do not qualify"
    ],
    exploreAlternativesIf: [
      "You have owned recently and are moving up — the mechanics change when you have a home to sell"
    ],
    howItWorks: [
      {
        heading: "Understand the full cost of ownership",
        body: "Payment, taxes, insurance, maintenance, and utilities. The mortgage payment is the part that gets quoted; the rest is what determines whether the home is comfortable to own."
      },
      {
        heading: "Look at assistance programs before ruling them out",
        body: "Florida Housing administers homebuyer programs with their own eligibility rules, income limits, and purchase price limits, and those change. We check the current program terms directly rather than working from memory."
      },
      {
        heading: "Get your financing conversation done before you shop",
        body: "Knowing your realistic range before you tour homes saves you from falling in love with a house you cannot comfortably carry."
      }
    ],
    variables: [
      {
        label: "Assistance program eligibility",
        body: "Income limits, purchase price limits, and occupancy requirements vary and change."
      },
      {
        label: "Down payment source",
        body: "Gift funds, savings, and assistance funds are each documented differently."
      },
      {
        label: "Credit history depth",
        body: "A thin file is not the same problem as a damaged one and is often solvable."
      }
    ],
    faqs: [
      {
        question: "Do I need twenty percent down?",
        answer:
          "No. That figure persists because it is the point at which conventional mortgage insurance is typically not required. Several programs allow substantially less."
      },
      {
        question: "What credit score do I need?",
        answer:
          "There is no single number, because requirements differ by program and lenders apply their own overlays on top. A conversation about your actual profile is more useful than a threshold from a web page."
      }
    ],
    relatedCalculators: [
      { href: "/calculators/affordability", label: "See an affordability range" },
      { href: "/calculators/closing-cost", label: "Plan your cash to close" }
    ],
    relatedPrograms: ["fha", "conventional", "purchase"],
    sources: [
      CFPB_MORTGAGE,
      {
        publisher: "Florida Housing Finance Corporation",
        title: "Homebuyer programs overview",
        url: "https://www.floridahousing.org/programs/homebuyer-overview-page"
      }
    ],
    requiresLenderPath: true,
    loanTypeForSchema: null
  },
  {
    slug: "conventional",
    navLabel: "Conventional",
    h1: "Conventional mortgages",
    title: "Conventional Mortgages in Florida",
    description:
      "How conventional financing works, when mortgage insurance applies, and where it differs from government-backed options.",
    eyebrow: "Program",
    summary:
      "A conventional mortgage is not insured or guaranteed by a government agency. Most conventional loans are written to standards set by Fannie Mae or Freddie Mac, which is why their requirements are relatively consistent across lenders — though every lender may add its own overlays.",
    mayFit: [
      "You have a reasonably established credit profile",
      "You want the option to remove mortgage insurance once you reach sufficient equity",
      "You are buying a second home or investment property, where government programs generally do not apply"
    ],
    exploreAlternativesIf: [
      "Your credit profile or down payment would be better served by a government-backed program",
      "You are eligible for VA financing, which has meaningfully different economics"
    ],
    howItWorks: [
      {
        heading: "Agency standards set the baseline",
        body: "Eligibility, documentation, appraisal, and property requirements follow the current agency selling guides. Those guides are updated regularly, so current terms are verified at the time of your application rather than quoted from memory."
      },
      {
        heading: "Mortgage insurance is tied to equity",
        body: "Conventional mortgage insurance generally applies below a threshold of equity and can typically be removed once sufficient equity is established. The specific rules and timing are program- and servicer-dependent."
      }
    ],
    variables: [
      { label: "Loan-to-value ratio", body: "Drives both mortgage insurance and pricing." },
      {
        label: "Credit profile",
        body: "Conventional pricing is more sensitive to credit than some government programs."
      },
      {
        label: "Occupancy",
        body: "Primary, second home, and investment are priced and underwritten differently."
      },
      {
        label: "Loan limit",
        body: "Conforming limits are set annually. Above them, the loan is a jumbo and follows different rules."
      }
    ],
    faqs: [
      {
        question: "Can conventional mortgage insurance be removed?",
        answer:
          "Generally yes, once sufficient equity is established, subject to the applicable rules and your servicer's requirements. This is a meaningful difference from some government programs and worth discussing before you choose a path."
      },
      {
        question: "What is the conforming loan limit?",
        answer:
          "It is set annually and varies by county. We check the current published limit for your specific county rather than working from a figure that may be out of date."
      }
    ],
    relatedCalculators: [{ href: "/calculators/mortgage-payment", label: "Estimate a payment" }],
    relatedPrograms: ["jumbo", "fha", "purchase"],
    sources: [
      {
        publisher: "Fannie Mae",
        title: "Selling Guide",
        url: "https://selling-guide.fanniemae.com/"
      },
      {
        publisher: "Freddie Mac",
        title: "Seller/Servicer Guide",
        url: "https://guide.freddiemac.com/"
      }
    ],
    requiresLenderPath: true,
    loanTypeForSchema: "Conventional mortgage"
  },
  {
    slug: "fha",
    navLabel: "FHA",
    h1: "FHA loans in Florida",
    title: "FHA Loans in Florida",
    description:
      "How FHA insurance changes the payment, who the program tends to serve, and the tradeoff to weigh against conventional.",
    eyebrow: "Program",
    summary:
      "An FHA loan is insured by the Federal Housing Administration. That insurance is why the program can be more flexible on credit and down payment than conventional financing — and it is also the cost you weigh against that flexibility, because FHA mortgage insurance behaves differently from conventional mortgage insurance.",
    mayFit: [
      "Your credit profile makes conventional pricing unattractive",
      "You have limited funds for a down payment",
      "You are buying a primary residence"
    ],
    exploreAlternativesIf: [
      "You are eligible for VA financing",
      "Your credit and down payment would make conventional cheaper over the time you plan to hold the loan",
      "You are buying a second home or investment property"
    ],
    howItWorks: [
      {
        heading: "FHA insures the lender, not you",
        body: "The insurance protects the lender against loss, which is what allows more flexible qualifying terms. You pay for it through an upfront premium and an annual premium collected monthly."
      },
      {
        heading: "The property has to qualify too",
        body: "FHA has minimum property standards. An appraiser evaluates the property against them, and required repairs can affect your timeline."
      },
      {
        heading: "The insurance duration matters",
        body: "How long FHA mortgage insurance remains on the loan depends on the terms in effect and your loan structure. This is the single most important thing to understand before choosing FHA over conventional, and it is worth working through with real numbers for your situation."
      }
    ],
    variables: [
      {
        label: "Mortgage insurance premiums",
        body: "Both the upfront and annual premium are set by HUD and change from time to time."
      },
      {
        label: "County loan limits",
        body: "FHA limits vary by county and are updated periodically."
      },
      {
        label: "Property condition",
        body: "Minimum property standards can require repairs before closing."
      },
      {
        label: "Lender overlays",
        body: "Lenders frequently apply requirements stricter than FHA's own."
      }
    ],
    faqs: [
      {
        question: "Is FHA always cheaper than conventional?",
        answer:
          "No. It depends on your credit profile, your down payment, and how long you keep the loan. For some borrowers conventional is less expensive overall; for others FHA clearly wins. The comparison is worth doing with your actual numbers."
      },
      {
        question: "Can I use FHA for an investment property?",
        answer:
          "FHA financing is intended for owner-occupied primary residences. Investment property financing follows a different path."
      }
    ],
    relatedCalculators: [
      { href: "/calculators/mortgage-payment", label: "Estimate a payment with mortgage insurance" }
    ],
    relatedPrograms: ["conventional", "first-time-home-buyers"],
    sources: [
      {
        publisher: "U.S. Department of Housing and Urban Development",
        title: "FHA single family housing policy handbook",
        url: "https://www.hud.gov/program_offices/housing/sfh/handbook_4000-1"
      }
    ],
    requiresLenderPath: true,
    loanTypeForSchema: "FHA loan"
  },
  {
    slug: "va",
    navLabel: "VA",
    h1: "VA home loans in Florida",
    title: "VA Home Loans in Florida",
    description:
      "What VA eligibility provides, how entitlement and the funding fee work, and why the program is frequently underused.",
    eyebrow: "Program",
    summary:
      "A VA loan is guaranteed by the Department of Veterans Affairs and available to eligible service members, veterans, and certain surviving spouses. For borrowers who qualify it is often the strongest option available, and it is also the one most frequently left on the table because people assume it is slow or that sellers dislike it.",
    mayFit: [
      "You are an eligible service member, veteran, or surviving spouse",
      "You want to preserve cash at closing",
      "You want to avoid monthly mortgage insurance"
    ],
    exploreAlternativesIf: [
      "You are not eligible for the program",
      "You are buying an investment property, which the program does not serve"
    ],
    howItWorks: [
      {
        heading: "Eligibility comes from service",
        body: "You establish eligibility through a Certificate of Eligibility. Requirements depend on when and how you served."
      },
      {
        heading: "Entitlement determines your guaranty",
        body: "Entitlement is the amount VA guarantees on your behalf. It can be partially used by a prior loan and restored under certain conditions."
      },
      {
        heading: "The funding fee replaces monthly mortgage insurance",
        body: "Most borrowers pay a one-time funding fee, which can typically be financed. Some borrowers are exempt. There is no monthly mortgage insurance, which changes the payment comparison substantially."
      }
    ],
    variables: [
      {
        label: "Certificate of Eligibility",
        body: "Establishes that you qualify and what entitlement you have."
      },
      {
        label: "Funding fee",
        body: "Varies by service type, down payment, and whether you have used the benefit before. Exemptions exist."
      },
      {
        label: "Occupancy",
        body: "The program requires occupancy; it is not for investment property."
      },
      {
        label: "Property requirements",
        body: "VA has its own minimum property requirements assessed by the appraiser."
      }
    ],
    faqs: [
      {
        question: "Do VA loans take longer to close?",
        answer:
          "Not inherently. Timelines depend on the lender's process and the property, the same as any other loan. The reputation is largely outdated."
      },
      {
        question: "Can I use the benefit more than once?",
        answer:
          "Frequently yes. Entitlement can be restored under certain conditions, and remaining entitlement can sometimes support a second loan. Your specific situation determines the answer."
      }
    ],
    relatedCalculators: [{ href: "/calculators/mortgage-payment", label: "Estimate a payment" }],
    relatedPrograms: ["conventional", "purchase"],
    sources: [
      {
        publisher: "U.S. Department of Veterans Affairs",
        title: "VA home loan programs",
        url: "https://www.va.gov/housing-assistance/home-loans/"
      }
    ],
    requiresLenderPath: true,
    loanTypeForSchema: "VA loan"
  },
  {
    slug: "usda",
    navLabel: "USDA",
    h1: "USDA loans and eligible Florida areas",
    title: "USDA Loans in Florida",
    description:
      "How USDA rural development financing works, and why the eligibility map surprises people.",
    eyebrow: "Program",
    summary:
      "USDA guaranteed loans support home purchases in designated rural areas, subject to household income limits. The word rural is misleading — many areas on the edge of Florida metros are eligible, and the only way to know is to check the current official map for the specific address.",
    mayFit: [
      "The property is in a currently eligible area",
      "Your household income is within the applicable limit",
      "You are buying a primary residence and want to minimize cash at closing"
    ],
    exploreAlternativesIf: [
      "The address is not in an eligible area",
      "Your household income exceeds the limit",
      "You are buying an investment property or second home"
    ],
    howItWorks: [
      {
        heading: "The address determines eligibility",
        body: "Eligibility is geographic and set by USDA. Maps are updated periodically, so we check the current official map for your specific address rather than relying on a general impression of an area."
      },
      {
        heading: "Household income is capped",
        body: "Limits vary by county and household size and are adjusted over time. The calculation includes household members beyond the borrowers in some cases."
      }
    ],
    variables: [
      {
        label: "Property location",
        body: "The single gating factor. Verified against the current official map."
      },
      { label: "Household income", body: "County- and size-dependent limits that change." },
      { label: "Guarantee fees", body: "USDA charges an upfront and an annual fee." }
    ],
    faqs: [
      {
        question: "Can you tell me if my address qualifies?",
        answer:
          "We check it against USDA's current official eligibility map together. We will not guess from a general sense of whether an area feels rural, because the boundaries frequently do not match intuition."
      }
    ],
    relatedCalculators: [
      { href: "/calculators/affordability", label: "See an affordability range" }
    ],
    relatedPrograms: ["fha", "conventional"],
    sources: [
      {
        publisher: "U.S. Department of Agriculture",
        title: "Single family housing guaranteed loan program",
        url: "https://www.rd.usda.gov/programs-services/single-family-housing-programs/single-family-housing-guaranteed-loan-program"
      }
    ],
    requiresLenderPath: true,
    loanTypeForSchema: "USDA loan"
  },
  {
    slug: "jumbo",
    navLabel: "Jumbo",
    h1: "Jumbo mortgage planning",
    title: "Jumbo Mortgages in Florida",
    description:
      "What changes when a loan exceeds conforming limits, and why jumbo guidelines vary so much between lenders.",
    eyebrow: "Program",
    summary:
      "A jumbo loan exceeds the conforming loan limit for its county. Because these loans are not eligible for purchase by the agencies, each investor sets its own guidelines — which is why jumbo terms differ far more between lenders than conforming terms do.",
    mayFit: [
      "Your loan amount exceeds the current conforming limit for the county",
      "You have documented reserves and a strong credit profile",
      "You want lender comparison to matter — with jumbo, it matters a great deal"
    ],
    exploreAlternativesIf: [
      "Structuring the transaction differently would bring the loan within conforming limits",
      "You have limited reserves, which jumbo guidelines weigh heavily"
    ],
    howItWorks: [
      {
        heading: "Guidelines are investor-specific",
        body: "There is no single jumbo rulebook. Reserve requirements, documentation, appraisal expectations, and pricing all vary by investor, which makes shopping genuinely valuable here."
      },
      {
        heading: "Reserves usually matter more than you expect",
        body: "Many jumbo programs require a specified number of months of payments in reserve after closing. This trips up borrowers who planned their cash around the down payment alone."
      }
    ],
    variables: [
      { label: "County conforming limit", body: "Determines whether the loan is jumbo at all." },
      { label: "Reserve requirements", body: "Often the binding constraint." },
      {
        label: "Property type",
        body: "Condos, unique properties, and high-value homes are scrutinized more closely."
      },
      {
        label: "Documentation depth",
        body: "Jumbo underwriting is typically more document-intensive."
      }
    ],
    faqs: [
      {
        question: "Are jumbo rates always higher?",
        answer:
          "Not necessarily. Jumbo pricing has at times been competitive with or better than conforming, depending on the investor and market conditions. It is worth comparing rather than assuming."
      }
    ],
    relatedCalculators: [{ href: "/calculators/mortgage-payment", label: "Estimate a payment" }],
    relatedPrograms: ["conventional", "self-employed"],
    sources: [CFPB_MORTGAGE],
    requiresLenderPath: true,
    loanTypeForSchema: "Jumbo mortgage"
  },
  {
    slug: "investment-property",
    navLabel: "Investment property",
    h1: "Financing an investment property",
    title: "Investment Property Financing in Florida",
    description:
      "How investment property financing differs, and which expenses belong in the model before you call something cash-flow positive.",
    eyebrow: "Investors",
    summary:
      "Investment property financing carries different down payment, reserve, and pricing expectations than a primary residence. The financing is usually the easier half of the analysis — the harder half is building an expense model honest enough to be worth acting on.",
    mayFit: [
      "You are buying a property you will not occupy",
      "You want the full expense stack modeled, not just rent minus mortgage",
      "You have reserves beyond the down payment"
    ],
    exploreAlternativesIf: [
      "You intend to occupy the property — occupancy is a representation you make to the lender, and misstating it is fraud",
      "You have not yet verified the local short-term rental rules for the strategy you have in mind"
    ],
    howItWorks: [
      {
        heading: "Occupancy changes everything",
        body: "Down payment, pricing, and reserve requirements all shift for non-owner-occupied property. Occupancy is a representation on your application, not a preference."
      },
      {
        heading: "Rental income treatment is program-specific",
        body: "Whether and how projected or existing rent counts toward qualifying varies by program and by whether there is a lease and a history."
      },
      {
        heading: "The expense model is where deals are won or lost",
        body: "Vacancy, management, maintenance, capital reserves, taxes, insurance, HOA, and utilities. Our investment calculator includes each of them because a model that omits capital reserves is not a model, it is optimism."
      }
    ],
    variables: [
      {
        label: "Down payment and reserves",
        body: "Typically higher than an owner-occupied purchase."
      },
      {
        label: "Rental income documentation",
        body: "A signed lease and a rent history are treated differently from a projection."
      },
      {
        label: "Insurance",
        body: "Landlord policies price differently, and Florida wind and flood exposure varies sharply by location."
      },
      {
        label: "Local rental regulation",
        body: "Short-term rental rules are municipal and change. Verify before you underwrite a strategy that depends on them."
      }
    ],
    faqs: [
      {
        question: "Will projected rent help me qualify?",
        answer:
          "Sometimes, depending on the program and the documentation available. It is never automatic and it is rarely the full amount."
      },
      {
        question: "Can I convert my primary residence into a rental?",
        answer:
          "Often yes, but the timing and your representations at application matter. Discuss it before you close, not after."
      }
    ],
    relatedCalculators: [{ href: "/calculators/mortgage-payment", label: "Estimate a payment" }],
    relatedPrograms: ["conventional", "jumbo"],
    sources: [CFPB_MORTGAGE],
    requiresLenderPath: true,
    loanTypeForSchema: null
  },
  {
    slug: "self-employed",
    navLabel: "Self-employed",
    h1: "Mortgage planning for self-employed borrowers",
    title: "Self-Employed Mortgage Planning in Florida",
    description:
      "How self-employment income is actually evaluated, and why the number on your tax return is the one that counts.",
    eyebrow: "Situations",
    summary:
      "Self-employment does not make a mortgage harder to obtain. It makes income calculation more involved, because lenders generally work from documented net income rather than gross revenue — and the deductions that reduce your tax bill also reduce the income used to qualify.",
    mayFit: [
      "You own a business, contract, or receive substantial 1099 income",
      "You want to understand how your income will be calculated before you apply",
      "You are planning ahead and can time a purchase around your filings"
    ],
    exploreAlternativesIf: [
      "Your business is very new — most programs expect a documented history"
    ],
    howItWorks: [
      {
        heading: "Documented net income is the starting point",
        body: "Lenders generally average net income across a period, with certain add-backs. Aggressive deductions lower that figure, which is the tension self-employed borrowers most often run into."
      },
      {
        heading: "History and stability matter",
        body: "Most programs look for a documented track record and evidence that the business continues to operate."
      },
      {
        heading: "Plan the timing",
        body: "If you know a purchase is coming, the conversation is worth having before you file, not after. That is a discussion with your accountant, and we are happy to be in it."
      }
    ],
    variables: [
      {
        label: "Business structure",
        body: "Sole proprietorship, partnership, S corporation, and C corporation are each analyzed differently."
      },
      {
        label: "Deductions",
        body: "They lower taxable income and therefore usually lower qualifying income."
      },
      { label: "Business history length", body: "Program requirements vary." },
      {
        label: "Program selection",
        body: "Documentation requirements differ meaningfully between programs."
      }
    ],
    faqs: [
      {
        question: "Can I use bank statements instead of tax returns?",
        answer:
          "Some programs evaluate income differently, but availability, terms, and pricing vary and change. Whether such a path exists for you depends on current lender offerings at the time you apply."
      },
      {
        question: "How many years of self-employment do I need?",
        answer:
          "It depends on the program and your broader profile. Some situations are workable with a shorter history than people expect."
      }
    ],
    relatedCalculators: [
      { href: "/calculators/affordability", label: "See an affordability range" }
    ],
    relatedPrograms: ["conventional", "jumbo"],
    sources: [CFPB_MORTGAGE],
    requiresLenderPath: true,
    loanTypeForSchema: null
  },
  {
    slug: "condo",
    navLabel: "Condo",
    h1: "Florida condo financing",
    title: "Condo Financing in Florida",
    description:
      "Why condo financing depends on the building as much as on you, and what to ask before you go under contract.",
    eyebrow: "Situations",
    summary:
      "With a condo, the lender underwrites the project as well as the borrower. In Florida this matters more than almost anywhere, because association finances, reserves, insurance, and structural inspection status can determine whether a building is financeable at all.",
    mayFit: [
      "You are considering a condominium or a unit in an association-governed community",
      "You want to know which questions to ask before your inspection period runs out"
    ],
    exploreAlternativesIf: [
      "You need certainty on a short timeline and the association is slow to produce documents"
    ],
    howItWorks: [
      {
        heading: "The project is reviewed",
        body: "Lenders evaluate the association's budget, reserves, insurance, litigation, delinquency rates, owner-occupancy mix, and single-entity ownership concentration. A unit can be perfect and still be difficult to finance because of the building."
      },
      {
        heading: "Florida-specific structural and reserve requirements matter",
        body: "Florida law regarding milestone structural inspections and reserve studies affects associations directly, and lender treatment of those items has evolved. Current requirements are checked at the time of your transaction."
      },
      {
        heading: "Ask early",
        body: "Association documents can take time to obtain. Requesting them at the start of your inspection period rather than the end is the single most useful thing you can do."
      }
    ],
    variables: [
      {
        label: "Association financial health",
        body: "Reserves, delinquencies, and budget adequacy."
      },
      { label: "Insurance", body: "Both master policy adequacy and your own unit coverage." },
      {
        label: "Special assessments",
        body: "Pending or recent assessments affect both financing and your carrying cost."
      },
      {
        label: "Litigation",
        body: "Certain kinds of pending litigation can make a project ineligible."
      },
      { label: "Owner-occupancy and investor concentration", body: "Both are evaluated." }
    ],
    faqs: [
      {
        question: "Why was my condo loan declined when I qualified?",
        answer:
          "Almost always the project rather than the borrower. Project eligibility is a separate review, which is why we ask about the association early."
      },
      {
        question: "What should I ask the association up front?",
        answer:
          "The current budget and reserve study, insurance certificates, any pending or recent special assessments, the status of any required structural inspection, and whether there is pending litigation."
      }
    ],
    relatedCalculators: [
      { href: "/calculators/mortgage-payment", label: "Estimate a payment including HOA dues" }
    ],
    relatedPrograms: ["conventional", "fha"],
    sources: [CFPB_MORTGAGE],
    requiresLenderPath: true,
    loanTypeForSchema: null
  }
];

export function programBySlug(slug: string): Program | undefined {
  return PROGRAMS.find((program) => program.slug === slug);
}
