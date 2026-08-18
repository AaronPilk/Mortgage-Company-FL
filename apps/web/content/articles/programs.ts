import type { Article } from "./types";

export const PROGRAMS_ARTICLES: Article[] = [
  {
    slug: "fha-mip-explained",
    category: "programs",
    title: "FHA Mortgage Insurance Premiums: How MIP Really Works",
    description:
      "FHA loans carry two mortgage insurance premiums — one upfront, one annual. How each is charged, how long the annual premium lasts, and why LTV and term decide it.",
    h1: "How FHA mortgage insurance premiums actually work",
    answerSummary:
      "Every FHA loan carries two mortgage insurance premiums. An upfront premium is charged once at closing and is usually financed into the loan balance. An annual premium is calculated on the outstanding balance and paid in monthly installments. How long the annual premium lasts depends on the loan-to-value ratio at origination: lower-LTV loans shed it after a set period, while higher-LTV loans carry it for the life of the loan.",
    sections: [
      {
        heading: "Why FHA loans have mortgage insurance at all",
        paragraphs: [
          "The Federal Housing Administration does not lend money. It insures loans that private lenders make, promising to cover the lender's loss if the borrower defaults. That insurance is why lenders accept smaller down payments and more forgiving credit profiles on FHA loans than they would on their own paper.",
          "The insurance is not free, and the borrower is the one who pays for it. FHA collects premiums into its Mutual Mortgage Insurance Fund, and those premiums come in two distinct forms: a one-time upfront premium and a recurring annual premium. Understanding the difference between the two — and what ends each one — is most of what there is to know about FHA insurance costs."
        ]
      },
      {
        heading: "The upfront premium (UFMIP)",
        paragraphs: [
          "The upfront mortgage insurance premium is charged once, at closing, as a percentage of the base loan amount. Almost nobody writes a check for it. The standard move is to finance it — add it to the loan balance — which means a borrower who puts the minimum down starts out owing slightly more than the purchase price minus the down payment.",
          "Financing the upfront premium spreads its cost across the life of the loan and means you pay interest on it, which is worth knowing but rarely changes anyone's decision. The premium percentage itself is set by HUD and has changed over the years; check HUD's published premium schedule for the figure that applies when you apply."
        ]
      },
      {
        heading: "The annual premium, paid monthly",
        paragraphs: [
          "The second premium is misleadingly named. The 'annual' MIP is an annual rate applied to the outstanding loan balance, then divided by twelve and collected as part of each monthly payment. Because it is recalculated on the declining balance, the dollar amount drifts down slowly over time even while the rate stays fixed.",
          "The annual rate varies with the loan amount, the loan term, and the loan-to-value ratio. HUD publishes the current schedule and adjusts it as the health of the insurance fund allows — it has been cut in some years and raised in others — so treat any specific figure you read on a non-government site as potentially stale."
        ]
      },
      {
        heading: "Duration: why LTV and term decide when MIP ends",
        paragraphs: [
          "This is the part that surprises people. For FHA loans assigned on or after June 3, 2013, HUD ties the duration of the annual premium to the loan-to-value ratio at origination. Loans that start at a lower LTV — meaning a larger down payment — pay the annual premium for a fixed number of years. Loans that start above HUD's LTV threshold pay it for the life of the loan.",
          "Since the minimum-down-payment FHA loan sits above that threshold, most FHA borrowers are in the life-of-loan group. There is no request-to-cancel mechanism like the one private mortgage insurance has. The practical exit is refinancing into a conventional loan once the home's equity supports it — a common move for borrowers whose credit has improved since purchase.",
          "Loan term matters too: HUD's schedule treats shorter-term loans differently from 30-year loans, both in the annual rate and in duration rules. The exact cut-offs are HUD policy, not statute, so verify them against HUD's current guidance rather than memory."
        ]
      },
      {
        heading: "What this means when comparing loans",
        paragraphs: [
          "FHA insurance is a package: easier qualifying in exchange for an upfront premium plus an annual premium that, for most borrowers, never cancels on its own. Whether that trade is worth it depends on your credit profile and down payment — for many borrowers with strong credit, conventional financing with cancellable private mortgage insurance costs less over time, while for others FHA is clearly the better structure. A broker's job, and what TRACT does, is to arrange financing through lenders offering both so the comparison is made with real numbers rather than folklore."
        ]
      }
    ],
    faqs: [
      {
        question: "Can I avoid the upfront premium by paying cash for it?",
        answer:
          "You can pay it in cash at closing instead of financing it, but you cannot avoid it. Every FHA forward loan carries the upfront premium. Paying cash avoids interest on that amount; financing it preserves cash. Which is better depends on how long you keep the loan and what else that cash could do."
      },
      {
        question: "Does FHA MIP ever cancel automatically?",
        answer:
          "For loans assigned on or after June 3, 2013, it depends on the LTV at origination. Lower-LTV loans reach a point where the annual premium ends; loans above HUD's threshold carry it for the loan's life. For those, the realistic exit is refinancing into a conventional loan once equity allows."
      },
      {
        question: "Is FHA mortgage insurance the same as PMI?",
        answer:
          "No. PMI is private insurance on conventional loans with legal cancellation rights under the Homeowners Protection Act. FHA MIP is a government premium with its own upfront-plus-annual structure and duration rules set by HUD. The two are priced differently and end differently, which is why the comparison deserves real numbers."
      },
      {
        question: "If I refinance one FHA loan into another, do I pay the upfront premium again?",
        answer:
          "Generally yes — a new FHA loan means a new upfront premium, though on an FHA streamline refinance a partial refund of the prior upfront premium may apply if the refinance happens within the window HUD defines. Check HUD's current refund schedule before assuming a credit."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is mortgage insurance and how does it work?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-mortgage-insurance-and-how-does-it-work-en-1953/"
      },
      {
        publisher: "U.S. Department of Housing and Urban Development",
        title: "Single Family Mortgage Insurance Premiums",
        url: "https://www.hud.gov/hud-partners/housing-mip"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is an FHA loan?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-an-fha-loan-en-112/"
      }
    ],
    related: [
      { href: "/mortgage/fha", label: "FHA loans through TRACT" },
      { href: "/resources/pmi-vs-mip", label: "PMI vs. MIP: how the two differ" },
      {
        href: "/resources/conventional-vs-fha",
        label: "Conventional vs. FHA: a decision framework"
      },
      { href: "/calculators/mortgage-payment", label: "Mortgage payment calculator" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "va-loan-benefits-florida",
    category: "programs",
    title: "VA Loan Benefits in Florida: Entitlement and Funding Fee",
    description:
      "What VA entitlement actually guarantees, how the one-time funding fee works, and why VA loans carry no monthly mortgage insurance — explained for Florida buyers.",
    h1: "What a VA loan actually provides — entitlement, the funding fee, and no monthly MI",
    answerSummary:
      "A VA loan is a private loan backed by a federal guaranty. Eligible veterans, service members, and some surviving spouses receive entitlement — the VA's promise to cover part of a lender's loss on default. That guaranty is why lenders offer no-down-payment financing with no monthly mortgage insurance. Instead, most borrowers pay a one-time funding fee, which can be financed and is waived for certain disabled veterans.",
    sections: [
      {
        heading: "Entitlement is a guaranty, not a loan",
        paragraphs: [
          "The VA does not hand out mortgages. What an eligible borrower receives is entitlement: a dollar amount of guaranty the VA pledges to a private lender against loss if the loan defaults. The lender still underwrites the borrower — credit, income, and occupancy all still matter — but the guaranty absorbs enough of the lender's downside risk that the loan can be made with no down payment in most cases.",
          "Eligibility flows from service. Minimum service requirements vary by era and component — active duty, Guard, and Reserve each have their own thresholds — and certain surviving spouses qualify as well. The document that proves it is the Certificate of Eligibility (COE), which lenders can usually pull electronically. Florida's large veteran population means most local lenders process COEs routinely."
        ]
      },
      {
        heading: "How much house the entitlement supports",
        paragraphs: [
          "Borrowers with full entitlement can generally buy without a down payment at any price a lender will approve — the VA removed the loan-limit cap on full-entitlement borrowers. Borrowers with reduced entitlement, typically because an existing VA loan is still outstanding or a prior one ended in a loss the VA covered, may face a down payment above the conforming loan limit for their county.",
          "Entitlement is also restorable. Sell the home and pay off the VA loan, and the entitlement used can be restored for the next purchase. This matters in Florida, where military families transfer often: a VA loan is not a once-in-a-lifetime benefit."
        ]
      },
      {
        heading: "The funding fee: the price of the guaranty",
        paragraphs: [
          "Instead of monthly mortgage insurance, the VA charges most borrowers a one-time funding fee at closing, calculated as a percentage of the loan amount. The percentage depends on the down payment (larger down payments earn a lower fee) and on whether it is the borrower's first use of the benefit or a subsequent use. The fee can be paid in cash or financed into the loan; most borrowers finance it.",
          "The exemptions are significant. Veterans receiving VA disability compensation, certain surviving spouses, and Purple Heart recipients on active duty pay no funding fee at all. Given how many Florida veterans receive disability compensation, checking exemption status before quoting numbers is not optional — it can change the economics of the whole transaction. The VA publishes the current fee table; use it rather than any secondhand chart."
        ]
      },
      {
        heading: "Why there is no monthly mortgage insurance",
        paragraphs: [
          "On a conventional loan with a small down payment, a private insurer charges a monthly premium to protect the lender. On an FHA loan, the government charges upfront and annual premiums for the same purpose. On a VA loan, the guaranty itself plays that role — the VA has already promised to absorb part of any loss, so there is no insurer to pay monthly.",
          "That structural difference compounds over time. A monthly insurance premium is a permanent drag on the payment until it cancels or the loan is refinanced; the funding fee is a single known cost, and for exempt borrowers it is zero. This is the main reason a VA loan is usually the first program an eligible borrower should price, even when they could qualify conventionally."
        ]
      },
      {
        heading: "The Florida particulars",
        paragraphs: [
          "VA loans work the same in Florida as anywhere, but two local realities deserve attention. First, VA appraisals apply Minimum Property Requirements — safety, soundness, and sanitation standards — which matter in a state with older concrete-block housing stock and, in some markets, deferred roof maintenance. A property that needs work may need repairs negotiated before closing.",
          "Second, condominiums must be in a VA-approved project, and Florida's post-Surfside condo regulatory environment has made project-level review more consequential everywhere. TRACT arranges VA financing through lenders experienced with both issues; the loan itself is always made, approved, and priced by the lender, with the VA standing behind it."
        ]
      }
    ],
    faqs: [
      {
        question: "Can I use a VA loan more than once?",
        answer:
          "Yes. Entitlement can be restored after a VA loan is paid off and the property sold, and borrowers with remaining entitlement can sometimes hold two VA loans at once — common for service members who rent out a prior home after a permanent change of station. The math on remaining entitlement gets technical, so have a lender run it."
      },
      {
        question: "Is the funding fee ever waived?",
        answer:
          "Yes — most notably for veterans receiving VA disability compensation, for certain surviving spouses, and for Purple Heart recipients on active duty. The waiver is automatic once status is documented, and it applies no matter how many times the benefit is used. Verify status through the COE before closing, since a fee paid in error can be refundable."
      },
      {
        question: "Do sellers in Florida actually accept VA offers?",
        answer:
          "A VA offer closes on the same timeline as a conventional one with a competent lender, and VA appraisal standards are not the obstacle folklore says they are. Seller hesitancy is mostly a myth that persists from tighter eras. A strong pre-approval letter and an agent who can explain the program neutralize it."
      },
      {
        question: "Does the VA set the interest rate on VA loans?",
        answer:
          "No. Rates on VA-backed loans are set by the private lenders who make them, which is why quotes differ from lender to lender for identical borrowers. The VA guarantees the loan; it does not price it. Comparing more than one lender is as worthwhile here as with any program."
      }
    ],
    sources: [
      {
        publisher: "U.S. Department of Veterans Affairs",
        title: "Eligibility for VA home loan programs",
        url: "https://www.va.gov/housing-assistance/home-loans/eligibility/"
      },
      {
        publisher: "U.S. Department of Veterans Affairs",
        title: "VA funding fee and loan closing costs",
        url: "https://www.va.gov/housing-assistance/home-loans/funding-fee-and-closing-costs/"
      },
      {
        publisher: "U.S. Department of Veterans Affairs",
        title: "VA-backed purchase loans",
        url: "https://www.va.gov/housing-assistance/home-loans/loan-types/purchase-loan/"
      }
    ],
    related: [
      { href: "/mortgage/va", label: "VA loans through TRACT" },
      { href: "/locations/florida", label: "Buying in Florida" },
      { href: "/calculators/affordability", label: "Affordability calculator" },
      { href: "/resources/conventional-vs-fha", label: "Conventional vs. FHA compared" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "usda-eligibility-florida",
    category: "programs",
    title: "USDA Loan Eligibility in Florida: Location and Income",
    description:
      "USDA loans require an eligible location and household income under area limits. How both tests work in Florida, and why 'rural' covers more than you expect.",
    h1: "How USDA eligibility actually works in Florida — the location test and the income test",
    answerSummary:
      "USDA guaranteed loans finance homes with no down payment, but eligibility runs on two tests. The property must sit in an area USDA designates as rural, which in Florida includes many metro-fringe communities, not just farmland. Separately, total household income must fall under the moderate-income limit USDA sets for the county and household size. Both tests are checked against USDA's own maps and tables, which change over time.",
    sections: [
      {
        heading: "Two gates, checked separately",
        paragraphs: [
          "The USDA Single Family Housing Guaranteed Loan Program exists to push homeownership into rural areas, so it screens both the property and the household. A qualifying buyer looking at a non-qualifying address gets nowhere, and vice versa. Everything else about the loan — the underwriting, the note, the servicing — is handled by a private lender, with USDA guaranteeing a large share of the lender's exposure. That guaranty is what makes zero-down financing possible.",
          "Neither gate is a judgment call. USDA publishes a property eligibility map and county income limits, and the lender checks both. The only sensible first step for a Florida buyer curious about USDA is to run the specific address and the household's income through USDA's eligibility site."
        ]
      },
      {
        heading: "The location test: 'rural' is broader than it sounds",
        paragraphs: [
          "USDA's definition of rural is statutory and population-based, not aesthetic. Large swaths of Florida qualify — much of the Panhandle, the interior counties, and the fringes of nearly every metro. Communities that function as exurbs of Jacksonville, Orlando, Tampa, or Fort Myers can sit inside eligible territory while looking nothing like farm country.",
          "The boundaries are not permanent. Eligibility maps are redrawn as census data updates, and areas that urbanize can lose eligibility. A town that qualified when a neighbor bought there may not qualify now, and the reverse happens too. The map on USDA's eligibility site is the only authority worth consulting; a lender or broker can run an address in seconds."
        ]
      },
      {
        heading: "The income test: household income, not just borrower income",
        paragraphs: [
          "This is the piece that trips people up. USDA's guaranteed program caps total household income — the income of every adult living in the home, whether or not they are on the loan. A borrower whose own income fits easily can be pushed over the limit by a working spouse or an adult child in the household. Some deductions apply, for minor children and certain expenses, so the calculation is not a simple sum either.",
          "The ceiling itself is a moderate-income limit tied to the median income for the county and household size, and USDA revises the limits periodically. Do not anchor on any dollar figure you find in an article — including this one, which is deliberately not printing any. Check the current limit for your county and household size on USDA's income eligibility tool.",
          "There is a separate Section 502 Direct program, run by USDA itself rather than through lenders, aimed at low- and very-low-income households with deeper subsidies. It has its own lower income limits and its own process. Most buyers working with a lender or broker are in the guaranteed program."
        ]
      },
      {
        heading: "What the loan itself looks like",
        paragraphs: [
          "Guaranteed loans are 30-year fixed-rate mortgages for primary residences only — no investment properties, no second homes. There is no down payment requirement, which is the program's headline feature. Rates are set by the individual lender, not by USDA.",
          "USDA financing is not free of insurance-like costs: the program charges the lender a guarantee fee, typically passed to the borrower, both upfront and annually — structurally similar to FHA's premiums, though historically at lower levels. The current fee schedule is published by USDA Rural Development. The program has no fixed minimum credit score, but lenders apply their own standards and must document a reasonable ability and willingness to repay."
        ]
      },
      {
        heading: "Where USDA fits in a Florida decision",
        paragraphs: [
          "For a moderate-income household buying a primary home in an eligible area, USDA is often the strongest zero-down option that is not VA. The trade-offs are the geographic constraint, the household income cap, and a process that adds a USDA review step on top of lender underwriting, which can stretch timelines slightly. TRACT arranges USDA-guaranteed financing through participating lenders; the eligibility answer for any specific address and household takes minutes to establish and should come before falling in love with a house."
        ]
      }
    ],
    faqs: [
      {
        question: "Does my whole county qualify or just parts of it?",
        answer:
          "Usually parts. Eligibility follows area boundaries within counties, so one side of a road can qualify while the other does not — especially at metro edges. Always check the exact address on USDA's property eligibility map rather than relying on the county or town name."
      },
      {
        question:
          "My income qualifies but my spouse's pushes us over. Can we leave them off the loan?",
        answer:
          "Leaving a spouse off the loan does not remove their income from the household calculation — USDA counts the income of all adults living in the home, borrower or not, subject to certain deductions. Whether a specific household fits depends on the current county limit and how the deductions apply, which a lender can compute precisely."
      },
      {
        question: "Is there a USDA down payment or mortgage insurance?",
        answer:
          "No down payment is required. There is no private mortgage insurance, but USDA charges upfront and annual guarantee fees that function similarly and are usually financed or folded into the payment. Check USDA Rural Development's current fee schedule for the figures in effect when you apply."
      },
      {
        question: "Can I use a USDA loan for a manufactured home or a home that needs work?",
        answer:
          "It depends on the program specifics. USDA has provisions for new manufactured homes and, in some pilot areas, existing ones, and program funds can cover certain rehabilitation. Conditions are narrower than for site-built homes in good repair, so run the exact scenario past a USDA-experienced lender early."
      }
    ],
    sources: [
      {
        publisher: "USDA Rural Development",
        title: "Single Family Housing Guaranteed Loan Program",
        url: "https://www.rd.usda.gov/programs-services/single-family-housing-programs/single-family-housing-guaranteed-loan-program"
      },
      {
        publisher: "USDA Rural Development",
        title: "USDA property and income eligibility site",
        url: "https://eligibility.sc.egov.usda.gov/eligibility/welcomeAction.do"
      },
      {
        publisher: "USDA Rural Development",
        title: "Single Family Housing Direct Home Loans (Section 502)",
        url: "https://www.rd.usda.gov/programs-services/single-family-housing-programs/single-family-housing-direct-home-loans"
      }
    ],
    related: [
      { href: "/mortgage/usda", label: "USDA loans through TRACT" },
      { href: "/locations/florida", label: "Florida markets we serve" },
      { href: "/calculators/affordability", label: "Affordability calculator" },
      {
        href: "/resources/va-loan-benefits-florida",
        label: "VA loans: the other zero-down program"
      }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "conventional-vs-fha",
    category: "programs",
    title: "Conventional vs. FHA: An Honest Decision Framework",
    description:
      "Neither loan is 'better.' Credit profile, mortgage insurance structure, and property condition decide which one costs less — here is how to run that comparison.",
    h1: "Conventional vs. FHA: a decision framework, not a verdict",
    answerSummary:
      "Neither conventional nor FHA financing is categorically better; each wins for a different borrower. Conventional loans reward strong credit with cheaper, cancellable private mortgage insurance. FHA loans price credit more gently but charge upfront and annual premiums that usually persist for the loan's life. Credit profile, down payment, and property condition are the three variables that decide the comparison; run it with lender quotes on both, not assumptions.",
    sections: [
      {
        heading: "The lazy answer and why it fails",
        paragraphs: [
          "The folklore version — FHA for weak credit, conventional for strong credit — is directionally right and useless at the margins, which is where most real borrowers live. A buyer with mid-tier credit and a modest down payment can come out ahead on either program depending on how the mortgage insurance math lands, and the only way to know is to price both.",
          "The reason both programs exist is that they solve the same problem two different ways. Both let borrowers buy with far less than 20 percent down by insuring the lender against loss. Conventional loans use private mortgage insurance priced on risk; FHA uses government premiums priced mostly flat. Everything in the comparison follows from that difference."
        ]
      },
      {
        heading: "Variable one: credit profile",
        paragraphs: [
          "Conventional pricing is risk-based twice over. The loan's own pricing adjusts for credit score and loan-to-value, and the private mortgage insurance premium adjusts again on the same factors. A borrower with excellent credit gets rewarded in both places; a borrower with bruised credit gets charged in both places.",
          "FHA flattens that curve. Its insurance premiums do not vary by credit score, and FHA loan pricing penalizes lower scores far less. So as credit weakens, there is a crossover point where FHA's flat premiums undercut conventional's risk-priced ones. Where exactly that crossover sits moves with the private MI market and agency pricing, which is why the comparison has to be run fresh with current quotes rather than remembered from a previous year."
        ]
      },
      {
        heading: "Variable two: mortgage insurance structure",
        paragraphs: [
          "Private mortgage insurance on a conventional loan is monthly-only in its most common form, can be cancelled at the borrower's request once the balance reaches 80 percent of the home's original value, and terminates automatically at 78 percent under the Homeowners Protection Act. In an appreciating market, that cancellation can come startlingly fast.",
          "FHA charges an upfront premium at closing plus an annual premium paid monthly — and for loans made with the minimum down payment, the annual premium lasts for the life of the loan under current HUD policy. The usual exit is refinancing to conventional later. So the FHA structure front-loads accessibility and back-loads cost, while the conventional structure does the reverse. A borrower who expects their credit or the home's value to improve materially within a few years should weight that trajectory, not just the day-one payment."
        ]
      },
      {
        heading: "Variable three: property condition",
        paragraphs: [
          "FHA appraisals enforce minimum property standards — the home must be safe, sound, and sanitary, with defects like peeling paint on older homes, missing handrails, or an unserviceable roof flagged for repair before closing. In Florida's older housing stock this is not hypothetical; it kills deals on as-is sales where the seller refuses to touch anything.",
          "Conventional appraisals care mainly about value and marketability, so a structurally tired but livable house often passes conventionally when it would not pass FHA. If the target property is rough, that alone can decide the program — or push the conversation toward renovation lending, which exists on both sides: FHA's 203(k) and conventional HomeStyle or CHOICERenovation."
        ]
      },
      {
        heading: "Running the comparison properly",
        paragraphs: [
          "Get both structures priced on the same day for the same loan amount and down payment: total monthly payment including insurance, cash to close including FHA's upfront premium, and — the piece most quotes omit — what the insurance costs over the years you realistically expect to hold the loan. A five-year projection frequently reverses the verdict of a first-month comparison.",
          "This is exactly the situation a broker is for. TRACT arranges both conventional and FHA financing through multiple lenders and can put the two structures side by side for your actual profile; the lenders make and price the loans, and the numbers do the arguing."
        ]
      }
    ],
    faqs: [
      {
        question: "Is FHA only for first-time buyers?",
        answer:
          "No. FHA has no first-time-buyer requirement — anyone can use it for a primary residence, including repeat buyers. The association exists because FHA's easier credit terms and small down payment attract many first-timers, not because the program is restricted to them."
      },
      {
        question: "Can I start FHA and switch to conventional later?",
        answer:
          "Yes, by refinancing, and it is a common path: buy FHA while credit is rebuilding, then refinance to conventional once equity and credit support it, shedding FHA's annual premium. The catch is that refinancing depends on future rates, future equity, and closing costs — plan for it as an option, not a certainty."
      },
      {
        question: "Which program allows a smaller down payment?",
        answer:
          "They are closer than most people assume — both programs sit well under the traditional 20 percent, and some conventional programs for qualifying borrowers go lower than FHA's minimum. Down payment alone rarely decides the choice; the insurance structure attached to that down payment is what moves the total cost."
      },
      {
        question: "Do sellers prefer conventional offers over FHA?",
        answer:
          "Some do, mainly because of FHA's property condition standards and appraisal process. On a well-maintained home the practical difference is small; on a fixer, seller wariness is rational because FHA may require repairs before closing. A clean pre-approval and a realistic property choice matter more than the program label."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "Understand the different kinds of loans available",
        url: "https://www.consumerfinance.gov/owning-a-home/loan-options/"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is an FHA loan?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-an-fha-loan-en-112/"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is mortgage insurance and how does it work?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-mortgage-insurance-and-how-does-it-work-en-1953/"
      }
    ],
    related: [
      { href: "/mortgage/conventional", label: "Conventional loans through TRACT" },
      { href: "/mortgage/fha", label: "FHA loans through TRACT" },
      { href: "/resources/pmi-vs-mip", label: "PMI vs. MIP in detail" },
      { href: "/calculators/mortgage-payment", label: "Compare payments side by side" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "pmi-vs-mip",
    category: "programs",
    title: "PMI vs. MIP: How the Two Mortgage Insurances Differ",
    description:
      "Private mortgage insurance and FHA premiums both protect the lender, but pricing, structure, and cancellation differ completely. The differences that matter.",
    h1: "PMI vs. MIP: same purpose, different machines",
    answerSummary:
      "PMI and MIP both insure the lender against default, and the borrower pays for both; the resemblance ends there. Private mortgage insurance on conventional loans is risk-priced by credit and equity, and federal law gives borrowers cancellation rights as equity grows. FHA's MIP is government-set, includes an upfront premium plus an annual one, ignores credit score, and for most borrowers runs for the loan's life unless refinanced.",
    sections: [
      {
        heading: "What both insurances are actually for",
        paragraphs: [
          "Neither PMI nor MIP protects the homeowner. Both exist to reimburse the lender if the borrower defaults and the foreclosure sale falls short — the coverage that makes low-down-payment lending viable at all. On a conventional loan with less than 20 percent down, a private insurer takes that risk. On an FHA loan, the federal government takes it through the Mutual Mortgage Insurance Fund.",
          "Because the risk-taker differs, everything downstream differs: who sets the price, what the price responds to, how it is collected, and what makes it stop. Treating 'mortgage insurance' as one thing is how borrowers end up comparing loans incorrectly."
        ]
      },
      {
        heading: "Pricing: risk-based vs. schedule-based",
        paragraphs: [
          "Private MI is priced like insurance because it is insurance. Premiums vary with credit score, loan-to-value ratio, loan type, and coverage level, across competing private insurers. A strong-credit borrower with meaningful equity pays little; a weak-credit borrower at maximum LTV pays a lot. The market reprices continuously, which is why PMI quotes differ between lenders and over time.",
          "FHA's MIP comes off a published schedule that varies by loan amount, term, and LTV — and, pointedly, not by credit score. HUD adjusts the schedule occasionally as the insurance fund's health allows. The practical consequence: PMI usually undercuts MIP for strong credit, and MIP usually undercuts PMI as credit weakens. The crossover point moves, so it has to be found with current quotes, not rules of thumb."
        ]
      },
      {
        heading: "Structure: monthly vs. upfront-plus-annual",
        paragraphs: [
          "PMI in its most common form is a monthly premium and nothing else — no upfront charge. (Single-premium and lender-paid variants exist, trading the monthly charge for upfront cost or a higher rate, and are worth pricing in some cases.)",
          "FHA charges twice: an upfront premium at closing, almost always financed into the balance, plus an annual premium collected monthly on the outstanding balance. The upfront charge means an FHA borrower starts with slightly less equity than the down payment implies — a structural detail that matters when comparing five-year costs."
        ]
      },
      {
        heading: "The big one: cancellation rights vs. duration rules",
        paragraphs: [
          "PMI cancellation is a legal right. Under the Homeowners Protection Act, a borrower current on payments can request cancellation when the balance reaches 80 percent of the home's original value, the servicer must terminate it automatically at 78 percent, and it must end at the loan's midpoint regardless. Servicers may also allow earlier removal based on a new appraisal showing appreciation — their rules vary, but the statutory floors do not.",
          "FHA MIP has no equivalent right. For loans assigned on or after June 3, 2013, duration is set by the LTV at origination: minimum-down-payment loans carry the annual premium for the loan's life; only lower-LTV loans see it end after a fixed period. There is no request-to-cancel path — the exit is refinancing into a conventional loan. In an appreciating Florida market, that difference alone can swing the long-run cost comparison by a wide margin."
        ]
      },
      {
        heading: "How to use this when choosing a loan",
        paragraphs: [
          "The choice is rarely about which insurance is cheaper in month one. It is about trajectory: a conventional borrower in an appreciating market may shed PMI within a few years and then pay no insurance at all, while an FHA borrower keeps paying MIP until a refinance whose terms nobody can promise today. Against that, FHA's gentler credit pricing can make it decisively cheaper to get in the door. Price both structures over the horizon you actually expect to hold the loan — TRACT arranges both through its lenders and can produce that side-by-side; the lenders, not TRACT, make and price the loans."
        ]
      }
    ],
    faqs: [
      {
        question: "Does PMI require an appraisal to cancel?",
        answer:
          "Not for the statutory paths — the 80 percent request threshold and 78 percent automatic termination are measured against the home's original value, no new appraisal needed. Cancelling early based on appreciation is a servicer-policy path and usually does require a current valuation. Ask your servicer for its written requirements."
      },
      {
        question: "Is MIP ever cheaper than PMI?",
        answer:
          "Frequently, for borrowers with lower credit scores or very small down payments — FHA's schedule ignores credit score, while private MI prices it heavily. For strong-credit borrowers the reverse is typical. It depends on the borrower's exact profile and the day's MI market, which is why both should be quoted."
      },
      {
        question: "Do VA or USDA loans have PMI or MIP?",
        answer:
          "Neither. VA loans substitute a federal guaranty funded by a one-time funding fee, with no monthly insurance. USDA loans charge upfront and annual guarantee fees that resemble FHA's structure but are set by USDA. All four programs make the lender whole differently, and the differences show up in the payment."
      },
      {
        question: "If I refinance an FHA loan into a conventional loan, does MIP end?",
        answer:
          "Yes — the FHA loan is paid off, and its premiums end with it. Whether the new conventional loan needs PMI depends on the equity at refinance: at or above 20 percent equity, typically no PMI at all. This is the standard exit from life-of-loan MIP."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is private mortgage insurance?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-private-mortgage-insurance-en-122/"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "When can I remove private mortgage insurance (PMI) from my loan?",
        url: "https://www.consumerfinance.gov/ask-cfpb/when-can-i-remove-private-mortgage-insurance-pmi-from-my-loan-en-202/"
      },
      {
        publisher: "U.S. Department of Housing and Urban Development",
        title: "Single Family Mortgage Insurance Premiums",
        url: "https://www.hud.gov/hud-partners/housing-mip"
      }
    ],
    related: [
      { href: "/resources/fha-mip-explained", label: "FHA MIP in full detail" },
      { href: "/resources/conventional-vs-fha", label: "Conventional vs. FHA framework" },
      { href: "/mortgage/conventional", label: "Conventional loans through TRACT" },
      { href: "/calculators/amortization", label: "Amortization calculator" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "jumbo-loans-florida",
    category: "programs",
    title: "Jumbo Loans in Florida: Above the Conforming Limit",
    description:
      "When a loan exceeds the FHFA conforming limit, Fannie and Freddie can't buy it — and underwriting changes. What jumbo means in Florida and how to prepare for it.",
    h1: "Jumbo loans in Florida: what changes above the conforming limit",
    answerSummary:
      "A jumbo loan is simply one too large for Fannie Mae or Freddie Mac to purchase, because it exceeds the conforming loan limit FHFA sets each year by county. Without the agencies as buyers, the lender keeps or privately sells the loan, so underwriting reflects the lender's own risk appetite: fuller documentation, larger reserves, and stricter appraisal review. In Florida's higher-priced coastal markets, ordinary houses now routinely require jumbo financing.",
    sections: [
      {
        heading: "The conforming limit is the whole definition",
        paragraphs: [
          "Fannie Mae and Freddie Mac are restricted by law to purchasing loans below the conforming loan limit, which FHFA recalculates annually from national home-price data and publishes by county. A loan at or below the limit can be sold to the agencies; a loan above it cannot. 'Jumbo' means nothing more than that — it is a statement about who can buy the loan, not about the borrower or the house.",
          "The limit changes every year, and high-cost counties get higher limits under FHFA's formula. Most of Florida sits at the baseline limit, with Monroe County (the Keys) historically designated high-cost. Do not carry a remembered number in your head — FHFA's published table for the current year and your county is the only figure that matters, and it is a thirty-second lookup."
        ]
      },
      {
        heading: "Why losing the agency bid changes underwriting",
        paragraphs: [
          "When a lender writes a conforming loan, it underwrites to agency standards because the agencies are the end buyer and bear the credit risk. When a lender writes a jumbo, there is no standing government-sponsored bid. The lender either holds the loan on its balance sheet or sells it into a private market that is smaller and moodier than the agency machine.",
          "That means the lender is exposed to its own judgment, and jumbo guidelines show it: more scrutiny of income stability, less tolerance for thin credit files, and internal review layers that conforming loans skip. Jumbo guidelines also vary far more between lenders than conforming guidelines do — one lender's decline can genuinely be another's approval, which is a structural argument for shopping the loan across multiple lenders."
        ]
      },
      {
        heading: "What jumbo underwriting typically asks for",
        paragraphs: [
          "Expect the fuller version of everything. Down payment requirements are generally higher than conforming minimums, and pricing improves with equity. Credit expectations are stiffer. Debt-to-income tolerances are tighter. Most distinctively, jumbo lenders want post-closing reserves — months of housing payments in liquid or near-liquid assets after the down payment and closing costs are paid — with the required cushion growing with loan size.",
          "Appraisals get extra weight too. Large-balance properties are harder to comp, so lenders may require a field review or a second full appraisal on bigger loans. In Florida, condo and coastal properties add project-level review and insurance diligence on top. None of this is hostile; it is what lending looks like when the lender cannot hand the risk to Fannie or Freddie."
        ]
      },
      {
        heading: "The Florida wrinkle: ordinary homes, jumbo prices",
        paragraphs: [
          "In much of Miami-Dade, Broward, Palm Beach, Naples, Sarasota, and the beach towns, unremarkable single-family homes price above the conforming limit. Buyers who think of jumbo as mansion financing are often surprised to need one. Two tactics are worth knowing. First, a larger down payment can pull the loan amount under the conforming limit even when the price is above it — sometimes the cheaper path once pricing differences are counted.",
          "Second, jumbo pricing relative to conforming moves with market conditions; jumbos have at times priced surprisingly close to, or even through, conforming loans, because balance-sheet lenders want the asset. Which structure wins for a given purchase is an empirical question. TRACT arranges jumbo financing through multiple lenders precisely because guideline and pricing dispersion is widest in this segment; the lenders themselves make, approve, and price every loan."
        ]
      }
    ],
    faqs: [
      {
        question: "Is a jumbo loan harder to get than a conforming loan?",
        answer:
          "Generally yes, in the sense that documentation, reserve, and credit expectations run higher. But 'harder' varies enormously by lender, since each writes its own jumbo guidelines. A borrower declined by one jumbo lender can be well within another's box — more so than in conforming lending, where guidelines converge on agency rules."
      },
      {
        question: "Can I avoid jumbo by putting more down?",
        answer:
          "Often. The limit applies to the loan amount, not the purchase price, so a down payment large enough to bring the loan under your county's conforming limit keeps you in agency territory. Whether that beats taking the jumbo depends on pricing on the day and what else the cash could do — run both."
      },
      {
        question: "Do jumbo loans always have higher rates?",
        answer:
          "No. The spread between jumbo and conforming pricing moves with market conditions, and there have been stretches where well-qualified jumbo borrowers priced comparably to conforming ones. Treat relative pricing as something to check at application time across more than one lender, not as a fixed law."
      },
      {
        question: "Are there jumbo VA loans?",
        answer:
          "Veterans with full entitlement are not capped at the conforming limit — the VA guaranty can back larger loans if the lender approves them, though lenders apply their own overlays at high balances. Borrowers with reduced entitlement may need a down payment above the county limit. The details depend on entitlement math a lender can run."
      }
    ],
    sources: [
      {
        publisher: "Federal Housing Finance Agency",
        title: "Conforming Loan Limit (CLL) Values",
        url: "https://www.fhfa.gov/data/conforming-loan-limit-cll-values"
      },
      {
        publisher: "Fannie Mae",
        title: "Loan Limits",
        url: "https://singlefamily.fanniemae.com/originating-underwriting/loan-limits"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is a jumbo loan?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-jumbo-loan-en-1961/"
      }
    ],
    related: [
      { href: "/mortgage/jumbo", label: "Jumbo loans through TRACT" },
      { href: "/locations/florida", label: "Florida coastal markets" },
      { href: "/calculators/affordability", label: "Affordability calculator" },
      { href: "/calculators/rate-impact", label: "See how rate changes move the payment" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "fha-203k-explained",
    category: "programs",
    title: "FHA 203(k) Loans: Limited vs. Standard, Explained",
    description:
      "The FHA 203(k) finances a home and its renovation in one loan. How Limited and Standard differ, what the consultant does, and how draws pay contractors.",
    h1: "The FHA 203(k): buying the house and the renovation with one loan",
    answerSummary:
      "An FHA 203(k) loan finances a home purchase and its rehabilitation together, with renovation funds held in escrow and released to contractors as work completes. The Limited 203(k) handles smaller, non-structural projects with a streamlined process; the Standard 203(k) handles major work, including structural repairs, and requires a HUD-approved consultant who scopes the project and certifies each draw. The appraisal is based on the home's after-improved value.",
    sections: [
      {
        heading: "The problem the 203(k) solves",
        paragraphs: [
          "Ordinary mortgages assume a finished house: the appraisal values what exists, and lenders will not close on a property with serious defects. That locks buyers out of exactly the houses that trade at a discount — the dated, the damaged, the neglected. The 203(k) breaks the lock by letting FHA insure a single loan covering both the purchase and the cost of fixing the property, underwritten against its projected value after the work.",
          "One loan, one closing, one payment. The renovation money does not go to the borrower; it sits in an escrow account controlled by the lender and flows out to contractors as the work is verified. The property generally must be at least a year old, and the program is for owner-occupants — this is a homeownership tool, not a flipper's product."
        ]
      },
      {
        heading: "Limited 203(k): the small-project track",
        paragraphs: [
          "The Limited version covers repairs and improvements that are non-structural and modest in scope — think roof replacement, HVAC, flooring, kitchens and baths without moving walls, accessibility improvements. HUD caps the total repair cost for the Limited track and adjusts that cap over time; check HUD's current figure rather than trusting a remembered one.",
          "Because the projects are simpler, the process is lighter: no 203(k) consultant is required, paperwork is thinner, and the timeline is shorter. Funds are still escrowed and disbursed against completed work rather than handed over up front. For a Florida buyer facing a functional but tired house, the Limited track is often all that is needed."
        ]
      },
      {
        heading: "Standard 203(k): the full-rehabilitation track",
        paragraphs: [
          "The Standard 203(k) exists for serious work: structural repairs, additions, foundation work, full gut renovations, even rebuilding a house on its existing foundation. HUD sets a minimum repair amount for this track and no fixed ceiling short of FHA's loan limits. The scope of eligible work is wide — system replacements, safety-hazard elimination, and accessibility modifications all qualify.",
          "The price of that scope is process. Plans and cost estimates must be prepared before closing, contractors must be vetted and insured, and the project runs on a defined schedule with the lender watching. Owner-performed work is heavily restricted. A Standard 203(k) is closer to administering a small construction loan than to closing a normal mortgage, and borrowers should budget patience accordingly."
        ]
      },
      {
        heading: "The 203(k) consultant and how draws work",
        paragraphs: [
          "On every Standard 203(k), HUD requires a 203(k) consultant — an independent, HUD-approved professional who inspects the property up front, prepares the work write-up and cost estimate the lender underwrites against, and then inspects at each stage of construction. The consultant is the referee between borrower, contractor, and lender; HUD maintains a searchable roster of approved consultants.",
          "Money moves through draws. After a phase of work is completed, the consultant inspects it and certifies completion; the lender then releases that phase's funds from escrow to the contractor, typically holding back a portion until everything is finished. Contingency reserves are built into the budget for surprises — and in renovation, there are always surprises. The draw structure is what protects the borrower from paying for work that never happens, which is precisely the failure mode of paying a contractor cash up front."
        ]
      },
      {
        heading: "Where the 203(k) fits in Florida",
        paragraphs: [
          "Florida's housing stock includes a deep bench of mid-century block homes with good bones and bad everything else, plus storm-affected properties needing documented repair. The 203(k) is built for both, and because it is an FHA program, it comes with FHA's credit accessibility and FHA's mortgage insurance premiums — upfront and annual — like any FHA loan. Conventional alternatives (Fannie Mae HomeStyle and Freddie Mac CHOICERenovation) cover similar ground with different insurance math and stricter credit pricing. TRACT arranges renovation financing on both sides through lenders that actually staff 203(k) operations, which matters: this is a program where lender experience is visible in the outcome."
        ]
      }
    ],
    faqs: [
      {
        question: "Can I do the renovation work myself on a 203(k)?",
        answer:
          "Rarely, and only within tight limits. HUD generally requires licensed, insured contractors, and self-help work is allowed only when the borrower can prove professional competence and the lender agrees — and even then, the loan cannot pay the borrower for labor. Assume contractor-performed work when planning the budget."
      },
      {
        question: "How long does a 203(k) take to close and complete?",
        answer:
          "Longer than a standard FHA loan. Closing waits on bids, write-ups, and (for Standard) the consultant's work-up; construction then runs on the project schedule, generally within the completion window HUD and the lender set. Sellers should know the timeline up front — an experienced lender keeps it predictable, not fast."
      },
      {
        question: "Does the appraisal use the current value or the after-repair value?",
        answer:
          "The underwriting value is based on the after-improved value supported by the plans and cost write-up, which is what makes financing repairs on a discounted house possible. Value beyond the appraised after-improved figure is not borrowable — the loan is sized by the appraisal and FHA limits, whichever binds."
      },
      {
        question: "Can a 203(k) be used to refinance and renovate a home I already own?",
        answer:
          "Yes. Both tracks work as refinances, replacing the existing mortgage and funding the renovation in one new FHA loan. It is one of the few ways to fund major repairs based on the home's after-improved value rather than only its current equity. Whether it beats a conventional renovation refinance depends on your credit profile and existing loan."
      }
    ],
    sources: [
      {
        publisher: "U.S. Department of Housing and Urban Development",
        title: "203(k) Rehabilitation Mortgage Insurance Program",
        url: "https://www.hud.gov/hud-partners/single-family-mortgage-programs-203k"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is an FHA loan?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-an-fha-loan-en-112/"
      }
    ],
    related: [
      { href: "/mortgage/renovation", label: "Renovation loans through TRACT" },
      {
        href: "/resources/homestyle-choicerenovation",
        label: "Conventional renovation alternatives"
      },
      { href: "/resources/fha-mip-explained", label: "FHA mortgage insurance explained" },
      { href: "/calculators/closing-cost", label: "Closing cost calculator" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "homestyle-choicerenovation",
    category: "programs",
    title: "HomeStyle & CHOICERenovation: Conventional Rehab Loans",
    description:
      "Fannie Mae HomeStyle and Freddie Mac CHOICERenovation fund a home and its renovation in one conventional loan — with reach the FHA 203(k) doesn't have.",
    h1: "Conventional renovation lending: Fannie Mae HomeStyle and Freddie Mac CHOICERenovation",
    answerSummary:
      "HomeStyle Renovation (Fannie Mae) and CHOICERenovation (Freddie Mac) are conventional loans that finance a property and its renovation together, underwritten against the home's as-completed value, with renovation funds escrowed and drawn as work completes. Unlike the FHA 203(k), they can finance second homes and investment properties, carry cancellable private mortgage insurance instead of FHA premiums, and permit almost any improvement permanently affixed to the property.",
    sections: [
      {
        heading: "The conventional answer to the 203(k)",
        paragraphs: [
          "Both government-sponsored enterprises back a single-close renovation product: Fannie Mae's HomeStyle Renovation and Freddie Mac's CHOICERenovation. The design is the same in both cases — one mortgage covers the purchase or refinance plus renovation costs, sized against the appraiser's opinion of the home's value after the work is done. Renovation funds sit in a custodial escrow and are released through draws as completed work is inspected.",
          "Because these are conventional loans, everything that is true of conventional lending applies: risk-based pricing that rewards strong credit, private mortgage insurance that is cancellable as equity grows rather than FHA's upfront-plus-annual premiums, and eligibility rules set by the agencies' seller/servicer guides rather than HUD handbooks."
        ]
      },
      {
        heading: "What they can finance that FHA cannot",
        paragraphs: [
          "The occupancy reach is the headline difference. The 203(k) is for owner-occupied primary residences. HomeStyle and CHOICERenovation extend to second homes and, within limits, investment properties — which makes them the renovation tool for a Florida buyer fixing up a vacation property or a small rental. Eligible property types are broad: one- to four-unit homes, warrantable condos, and manufactured housing with program-specific constraints.",
          "The scope of eligible work is also generous: essentially any permanent improvement attached to the property, from structural repairs through kitchens, additions, landscaping, and accessory dwelling units. Renovation budgets are capped as a percentage of the as-completed value under each agency's guide, and luxury detached amenities that FHA prohibits — a pool, for instance — are generally financeable conventionally. CHOICERenovation additionally emphasizes resilience improvements, a category with obvious relevance in a hurricane state."
        ]
      },
      {
        heading: "How the money and oversight flow",
        paragraphs: [
          "Mechanically these loans run like a lightweight construction loan. Plans, specifications, and a contractor's detailed bid are underwritten before closing; the appraiser values the home subject to that scope of work. After closing, funds disburse through draws against inspected progress, with a contingency reserve for surprises and completion generally required within the agencies' stated timeframe.",
          "There is no HUD-style consultant mandate, but lenders impose their own project oversight — inspections, title updates at draws, contractor vetting — and some require more on larger or structural projects. Do-it-yourself work is narrowly permitted on primary residences under conditions few borrowers meet; plan around licensed contractors. As with the 203(k), the borrower never receives a pile of renovation cash; the escrow-and-draw structure is the fraud control."
        ]
      },
      {
        heading: "Choosing between conventional renovation and the 203(k)",
        paragraphs: [
          "The decision usually tracks the same variables as any conventional-versus-FHA choice. Strong credit and a meaningful down payment favor HomeStyle or CHOICERenovation: cheaper, cancellable mortgage insurance and no FHA upfront premium. Thinner credit favors the 203(k), whose insurance cost ignores credit score. Non-primary occupancy decides it outright — investment and second-home projects are conventional-only.",
          "Project type can also decide: FHA's minimum property standards and improvement restrictions rule out certain scopes that conventional programs accept. The practical constraint worth naming is lender capability. Renovation lending is operationally demanding, and not every lender offers these products or runs them well. TRACT arranges renovation financing through lenders that do — the lender makes, approves, and prices the loan, and on renovation products the lender's process quality is part of what you are choosing."
        ]
      }
    ],
    faqs: [
      {
        question: "Can I use HomeStyle or CHOICERenovation on a rental property?",
        answer:
          "Yes, within each agency's limits — investment-property renovation is allowed with larger down payment requirements and program-specific caps, which is a capability the FHA 203(k) does not offer at all. Confirm the current occupancy and LTV rules in the agency guides through your lender, as they are revised periodically."
      },
      {
        question: "Is a consultant required like on the Standard 203(k)?",
        answer:
          "The agencies do not mandate a HUD-style consultant, but lenders require plans, a qualified contractor's bid, and progress inspections before releasing draws, and some add their own project oversight on larger jobs. Expect consultant-like scrutiny even without the formal role, especially for structural work."
      },
      {
        question: "What happens if the renovation runs over budget?",
        answer:
          "The contingency reserve built into the loan absorbs normal overruns; beyond that, extra costs are the borrower's to fund out of pocket, since the loan amount is fixed at closing against the as-completed appraisal. Realistic bids and a healthy contingency are the protection — pick the contractor as carefully as the loan."
      },
      {
        question: "Can these loans fund hurricane-hardening upgrades in Florida?",
        answer:
          "Yes. Impact windows, roof upgrades, and similar resilience improvements are eligible permanent improvements under both programs, and CHOICERenovation calls out resilience work explicitly. Such upgrades can also affect windstorm insurance premiums, which is worth quantifying with your insurer before finalizing the scope."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title: "HomeStyle Renovation",
        url: "https://singlefamily.fanniemae.com/originating-underwriting/mortgage-products/homestyle-renovation"
      },
      {
        publisher: "Freddie Mac Single-Family",
        title: "CHOICERenovation Mortgages",
        url: "https://sf.freddiemac.com/working-with-us/origination-underwriting/mortgage-products/choicerenovation"
      }
    ],
    related: [
      { href: "/mortgage/renovation", label: "Renovation loans through TRACT" },
      { href: "/resources/fha-203k-explained", label: "The FHA 203(k) alternative" },
      { href: "/mortgage/investment-property", label: "Investment property financing" },
      { href: "/calculators/mortgage-payment", label: "Mortgage payment calculator" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "dscr-loans-explained",
    category: "programs",
    title: "DSCR Loans: Qualifying on Property Cash Flow",
    description:
      "DSCR loans underwrite a rental property's income instead of the investor's personal income. What the ratio measures, what it replaces, and where the trade-offs are.",
    h1: "DSCR loans: when the property's cash flow does the qualifying",
    answerSummary:
      "A DSCR loan qualifies an investment property on its own cash flow rather than the borrower's personal income. The debt service coverage ratio divides the property's rent by its full housing payment; a ratio above one means the rent covers the debt. Because these are business-purpose loans secured by rentals, they sit outside the consumer ability-to-repay framework — no tax returns, no employment verification, no personal debt-to-income calculation.",
    sections: [
      {
        heading: "The ratio, in one breath",
        paragraphs: [
          "Divide the property's monthly rental income by its full monthly obligation — principal, interest, taxes, insurance, and any association dues — and you have the debt service coverage ratio. A DSCR of exactly one means the rent precisely covers the payment. Above one, the property carries itself with margin; below one, the owner feeds it monthly.",
          "Lenders set minimum ratios by program and price better as the ratio rises; some will lend below break-even at lower leverage for investors betting on appreciation or rent growth. Rent is evidenced by the existing lease or by the market-rent schedule in the appraisal, so even a vacant property can be underwritten on what it should rent for. Each lender's minimum ratio and rent-documentation rules are its own — there is no government schedule to look up."
        ]
      },
      {
        heading: "What the ratio replaces",
        paragraphs: [
          "Consumer mortgage underwriting is built around the borrower's personal finances: verified employment, tax returns, pay stubs, and a personal debt-to-income ratio that every liability feeds into. Federal ability-to-repay rules require lenders to verify a consumer's income and assets through third-party records before making a consumer mortgage.",
          "A DSCR loan swaps all of that for the asset's own arithmetic. There is no employment verification, no tax return analysis, and no personal DTI calculation. Credit score and liquid reserves still matter — the borrower's willingness to pay and cushion against vacancy are still underwritten — but the income side of the file is the property's, not the person's. For a self-employed investor with heavily sheltered returns, or one whose portfolio has outgrown agency loan-count limits, that swap is the entire point."
        ]
      },
      {
        heading: "Why 'business purpose' is what makes this legal",
        paragraphs: [
          "The federal ability-to-repay rule protects consumer credit — loans primarily for personal, family, or household purposes. Regulation Z exempts credit extended primarily for business or commercial purposes, and lending against a non-owner-occupied rental held for investment is business-purpose credit. DSCR loans live in that exemption, which is why a lender may underwrite one without personal income verification at all.",
          "The bright line that follows: a DSCR loan cannot finance a home the borrower intends to live in. Occupancy is certified at closing and misrepresenting it is mortgage fraud, full stop. The business-purpose classification also means some consumer-protection features of home lending do not apply — one visible example being prepayment penalties, which are common in DSCR notes and typically structured to step down over the first several years. Read the note; the penalty terms are negotiable levers, not boilerplate."
        ]
      },
      {
        heading: "The rest of the trade",
        paragraphs: [
          "Pricing runs above comparable agency investment-property loans — the lender is giving up income verification and taking asset risk, and charges for it. Down payment expectations are materially higher than owner-occupied lending, and reserve requirements are real. Most DSCR lenders happily lend to LLCs, which agency loans do not allow, and many investors close in an entity for liability planning.",
          "In Florida, the underwriting lives or dies on carrying costs: insurance premiums and property taxes are large and volatile inputs to the payment side of the ratio, and a property that clears a lender's minimum with a stale insurance quote can fail it with a real one. Short-term-rental income adds another layer — some lenders count it, with haircuts, others refuse. TRACT arranges DSCR financing through lenders active in Florida's investor market; each lender makes and prices its own loans, and program terms differ enough that comparison is genuinely valuable."
        ]
      }
    ],
    faqs: [
      {
        question: "What DSCR do lenders require?",
        answer:
          "It depends on the lender and program. Break-even — a ratio of one — is a common reference point, with better pricing above it, and some programs accept lower ratios at reduced leverage. Because each lender sets its own thresholds and adjusts them with market conditions, treat any specific number as one lender's current policy, not a rule."
      },
      {
        question: "Can I use projected Airbnb income to qualify?",
        answer:
          "Some lenders accept short-term-rental income, usually documented through operating history or third-party market data and often discounted; others only count long-term market rent. Florida's short-term-rental markets make this a live issue, and local licensing and HOA restrictions can affect what a lender will count. It is a program-by-program question."
      },
      {
        question: "Do DSCR loans show up on my personal credit?",
        answer:
          "Practices vary. Many DSCR lenders check personal credit to originate but do not report the loan to consumer bureaus, particularly when it closes in an LLC — one reason portfolio investors like the product. Never assume either way; ask the specific lender how it reports before closing if it matters to your planning."
      },
      {
        question: "Could I just live in the property for a while if plans change?",
        answer:
          "No. A DSCR loan is business-purpose credit conditioned on non-owner occupancy; certifying investment intent and then moving in is occupancy fraud with serious consequences. If your plans genuinely change after a legitimate period of rental use, talk to the lender — refinancing into a consumer loan is the clean path."
      }
    ],
    sources: [
      {
        publisher: "eCFR — 12 CFR Part 1026 (Regulation Z)",
        title: "§ 1026.3 Exempt transactions (business-purpose credit)",
        url: "https://www.ecfr.gov/current/title-12/chapter-X/part-1026/subpart-A/section-1026.3"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is the ability-to-repay rule? Why is it important to me?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-the-ability-to-repay-rule-why-is-it-important-to-me-en-1787/"
      },
      {
        publisher: "eCFR — 12 CFR Part 1026 (Regulation Z)",
        title: "§ 1026.43 Minimum standards for transactions secured by a dwelling",
        url: "https://www.ecfr.gov/current/title-12/chapter-X/part-1026/subpart-E/section-1026.43"
      }
    ],
    related: [
      { href: "/mortgage/dscr", label: "DSCR loans through TRACT" },
      { href: "/calculators/dscr", label: "DSCR calculator" },
      {
        href: "/calculators/investment-property-cash-flow",
        label: "Investment property cash flow calculator"
      },
      {
        href: "/resources/bank-statement-loans",
        label: "Bank statement loans for self-employed borrowers"
      }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "bank-statement-loans",
    category: "programs",
    title: "Bank Statement Loans for Self-Employed Borrowers",
    description:
      "When tax returns understate real cash flow, bank statement loans document income from deposits instead. How the analysis works and what the trade-offs cost.",
    h1: "Bank statement loans: qualifying on deposits when tax returns undersell you",
    answerSummary:
      "A bank statement loan documents a self-employed borrower's income from bank deposits, typically a year or two of statements, instead of tax returns. The lender averages qualifying deposits and applies an expense factor to estimate income. It exists because legitimate write-offs shrink the taxable income conventional underwriting counts, leaving profitable owners looking artificially poor on paper. The trade is higher pricing and down payment for a truer income picture.",
    sections: [
      {
        heading: "The tax-return trap for the self-employed",
        paragraphs: [
          "Standard mortgage underwriting reads income off tax returns, and the ability-to-repay framework requires verification through reliable third-party records — for wage earners, W-2s and pay stubs; for the self-employed, the returns themselves. The problem is that a well-advised business owner's returns are engineered to minimize taxable income. Depreciation, vehicle and home-office deductions, retirement contributions, equipment expensing — every legitimate write-off lowers the income line a conventional underwriter counts.",
          "The result is a borrower whose bank account grows every month but whose qualifying income looks thin. Some underwriting adjustments add back non-cash deductions like depreciation, but the gap often remains. The self-employed borrower is punished at the mortgage desk for competence at the tax desk."
        ]
      },
      {
        heading: "What the lender actually does with your statements",
        paragraphs: [
          "A bank statement program replaces the returns with the deposit record — most commonly covering the previous year or two of business or personal accounts. An analyst strips out non-income items (transfers between accounts, loan proceeds, refunds, one-off asset sales) and averages what remains as gross deposits.",
          "For business accounts, an expense factor then converts gross deposits into usable income, since revenue is not profit. The factor may be a program default varying by industry, or set by a CPA's letter attesting to the business's actual expense ratio — a service business keeps more of each deposited dollar than a business that buys inventory. Consistency matters as much as volume: underwriters look for stable or rising deposits, and a sharp recent decline invites questions no average can answer. Self-employment is typically evidenced by a couple of years of business history via license, CPA letter, or similar documentation."
        ]
      },
      {
        heading: "Where these loans sit in the regulatory landscape",
        paragraphs: [
          "Bank statement loans are consumer mortgages, fully subject to the federal ability-to-repay rule. The lender must still make a reasonable, good-faith determination that you can repay, verified with third-party records — bank statements are exactly that. What the loan usually is not is a qualified mortgage, the safe-harbor category built around standardized documentation. Non-QM does not mean unregulated; it means the lender carries more compliance risk and underwrites accordingly.",
          "This distinguishes bank statement lending from both the no-documentation lending of the mid-2000s — outlawed for consumer mortgages precisely because nothing was verified — and from DSCR lending, which is business-purpose credit exempt from the consumer framework. A bank statement loan can finance the home you live in; the income is genuinely verified, just through a different instrument."
        ]
      },
      {
        heading: "The price of the alternative documentation",
        paragraphs: [
          "Expect pricing above comparable conventional loans, larger down payment requirements, meaningful reserve requirements, and closer scrutiny of credit history — the lender is compensating for non-standard documentation and the absence of QM protections. Program terms vary widely between lenders: how many months of statements, personal versus business accounts, expense factor menus, and treatment of multiple businesses all differ.",
          "That dispersion is the practical argument for shopping the loan. Florida's economy runs disproportionately on the self-employed — contractors, realtors, restaurateurs, charter captains, gig and seasonal earners — and lender appetite for each profile varies. TRACT arranges bank statement financing through multiple non-QM lenders; each lender makes, approves, and prices its own loans, and the same borrower can receive materially different terms from different shops. Worth knowing before committing: if your most recent tax year actually shows strong income, a conventional loan may beat the bank statement route — the alternative documentation is a tool for when returns undersell reality, not a default."
        ]
      }
    ],
    faqs: [
      {
        question: "How many months of bank statements do lenders want?",
        answer:
          "Program-dependent — a full year or two of statements is the common request, with some lenders offering shorter lookbacks at stiffer terms. Longer histories generally earn better pricing because the average is more credible. Expect every large or irregular deposit in the window to need an explanation."
      },
      {
        question: "Can W-2 employees use a bank statement loan?",
        answer:
          "These programs are built for the self-employed, and most lenders require a minimum self-employment history to use them. A W-2 earner with straightforward pay has no need for one — standard documentation will produce better terms. Mixed-income households can sometimes combine one borrower's W-2 income with the other's bank statement income."
      },
      {
        question: "Do large one-time deposits help me qualify?",
        answer:
          "Usually not. Underwriters exclude deposits that are not recurring business revenue — asset sales, transfers, loan proceeds, gifts — because the exercise is estimating sustainable income, not counting cash. Unexplained large deposits hurt rather than help, since they raise sourcing questions. Recurring, documentable revenue is what moves the number."
      },
      {
        question: "Is a bank statement loan the same as a stated-income loan?",
        answer:
          "No. Stated-income lending let borrowers assert income nobody verified, and the ability-to-repay rules ended it for consumer mortgages. A bank statement loan verifies income through months of third-party bank records and a documented expense analysis. The documentation is alternative, not absent — that distinction is the legal foundation of the product."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is the ability-to-repay rule? Why is it important to me?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-the-ability-to-repay-rule-why-is-it-important-to-me-en-1787/"
      },
      {
        publisher: "eCFR — 12 CFR Part 1026 (Regulation Z)",
        title: "§ 1026.43 Minimum standards for transactions secured by a dwelling",
        url: "https://www.ecfr.gov/current/title-12/chapter-X/part-1026/subpart-E/section-1026.43"
      }
    ],
    related: [
      { href: "/mortgage/bank-statement", label: "Bank statement loans through TRACT" },
      { href: "/mortgage/self-employed", label: "Mortgages for the self-employed" },
      { href: "/resources/dscr-loans-explained", label: "DSCR loans: the investor alternative" },
      { href: "/calculators/debt-to-income", label: "Debt-to-income calculator" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  }
];
