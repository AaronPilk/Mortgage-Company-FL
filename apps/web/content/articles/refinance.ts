import type { Article } from "./types";

/**
 * Refinance cluster. The through-line: a refinance is a purchase of a new loan
 * with real costs, and every decision in this cluster reduces to whether those
 * costs are recovered. Figures that move (rates, fees, LTV caps, seasoning
 * rules) are attributed to their source rather than stated as current fact.
 */
export const REFINANCE_ARTICLES: Article[] = [
  {
    slug: "refinance-break-even",
    category: "refinance",
    title: "Refinance Break-Even Point: The Only Math That Matters",
    description:
      "How to compute your refinance break-even in months, what counts as a real cost, and why restarting a 30-year clock can quietly erase the monthly savings.",
    h1: "The refinance break-even point: the only math that matters",
    answerSummary:
      "Divide the total cost of the refinance by the true monthly saving and you get the break-even point: the number of months before the new loan has paid for itself. If you expect to keep the loan longer than that, the refinance can make sense. If you do not, it cannot — no matter how attractive the new payment looks on its own.",
    sections: [
      {
        heading: "The formula is one line",
        paragraphs: [
          "Total refinance costs divided by monthly savings equals months to break even. Suppose a refinance costs $6,000 in fees and taxes and cuts the payment by $200 a month. Six thousand divided by two hundred is thirty: for the first thirty months, the refinance is a loss. Every month after that is genuine savings. Sell or refinance again in month twenty, and the deal never paid for itself.",
          "Everything else in refinance analysis is a refinement of that one line — getting the cost number honest, getting the savings number honest, and checking both against how long you actually expect to keep the loan. A rate that sounds dramatic and a payment that looks pleasant are marketing. Months to break even is arithmetic."
        ]
      },
      {
        heading: "What counts as a cost — all of it",
        paragraphs: [
          "The Consumer Financial Protection Bureau's breakdown of mortgage costs applies to refinances just as it does to purchases: lender origination charges, discount points, third-party fees like the appraisal and title work, and government recording charges. Freddie Mac's consumer guidance on refinancing costs lists the same categories and notes they are commonly measured as a percentage of the loan amount — which means a bigger balance means bigger costs.",
          "In Florida, the government line includes documentary stamp tax on the new note and intangible tax on the new mortgage, which is one reason Florida refinances often cost more than the national articles suggest. Two things do not belong in the cost column: your escrow deposit (the old escrow account is refunded after payoff) and prepaid interest (you skip a payment cycle that offsets it). Counting those overstates the cost and distorts the break-even."
        ],
        bullets: [
          "Count: origination fees, points, appraisal, title, recording, Florida documentary stamp and intangible taxes",
          "Do not count: new escrow deposits and per-diem interest, which are timing effects, not costs",
          "If costs are rolled into the balance or into the rate, they are still costs — put them in the numerator"
        ]
      },
      {
        heading: "The cost nobody prices: restarting the clock",
        paragraphs: [
          "As the CFPB explains, mortgage amortization front-loads interest: early payments are mostly interest, later payments mostly principal. Six years into a 30-year loan, you have finally started making real progress on principal. Refinance into a fresh 30-year term and you move back to the interest-heavy end of the curve — while stretching the remaining balance over 30 years instead of 24, which is where much of the payment 'saving' actually comes from.",
          "That is why a lower payment can coexist with more total interest. The honest comparison is a new loan with a term matching your remaining term, or keeping the new 30-year loan but paying it at your old payment amount so the extra goes to principal. Run both on an amortization schedule before deciding; the payment-versus-interest gap is often the deciding fact."
        ]
      },
      {
        heading: "Two break-evens: payment and interest",
        paragraphs: [
          "There are really two calculations. The payment break-even — costs divided by monthly payment reduction — tells you when your cash flow recovers. The interest break-even asks a harder question: when does total interest paid under the new loan, plus the costs, fall beneath what the old loan would have charged? With a term reset, the second number arrives later than the first, and occasionally never.",
          "Which one governs depends on your goal. If the point of the refinance is monthly breathing room, the payment break-even is the test. If the point is paying less for the house over your ownership horizon, use the interest version and hold the term constant."
        ]
      },
      {
        heading: "When the math says no",
        paragraphs: [
          "Common failure modes: you plan to sell within the break-even window; the monthly saving is small enough that break-even lands years out; or the costs are financed into the balance, which feels free but accrues interest for decades. A refinance that never breaks even during your ownership is a purchase of a lower payment at a premium price — sometimes still worth it for cash-flow reasons, but it should be chosen with the price tag visible.",
          "TRACT is a Florida mortgage brokerage: we arrange loans through wholesale lenders and do not make, approve, or price them. What we can do is put real lender quotes into this exact framework — costs, savings, months — so the decision is yours and the math is honest. The break-even calculator linked from every refinance page runs the same arithmetic."
        ]
      }
    ],
    faqs: [
      {
        question: "What is a good break-even period for a refinance?",
        answer:
          "There is no universal number — the test is your own horizon. A break-even of two years is excellent if you will hold the loan for ten, and useless if you are selling next spring. Compare the months-to-recover figure against how long you realistically expect to keep this loan, not against a rule of thumb."
      },
      {
        question: "Do rolled-in closing costs change the break-even math?",
        answer:
          "They change where the cost shows up, not whether it exists. Costs financed into the balance accrue interest for the life of the loan, and costs absorbed into a higher rate raise every payment. Both belong in the numerator of the break-even calculation, valued honestly."
      },
      {
        question: "Should I refinance into a shorter term instead?",
        answer:
          "A shorter term avoids the restart problem entirely and usually carries a lower rate than a longer term from the same lender, though the payment is higher. If you can carry the payment, comparing your current loan against a term that matches your remaining years is often the fairest comparison to run."
      },
      {
        question: "How often can I refinance?",
        answer:
          "There is no legal limit, but some programs impose seasoning requirements between loans, and every refinance restarts the cost clock. Serial refinancing without recovering costs each time is how borrowers end up with decades of payments and little principal progress. Each round has to clear its own break-even."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What costs will I have to pay as part of taking out a mortgage loan?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-costs-will-i-have-to-pay-as-part-of-taking-out-a-mortgage-loan-en-153/"
      },
      {
        publisher: "Freddie Mac",
        title: "Understanding the costs of refinancing",
        url: "https://myhome.freddiemac.com/refinancing/costs-of-refinancing"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "How does paying down a mortgage work?",
        url: "https://www.consumerfinance.gov/ask-cfpb/how-does-paying-down-a-mortgage-work-en-1943/"
      }
    ],
    related: [
      { href: "/calculators/refinance-break-even", label: "Refinance break-even calculator" },
      { href: "/calculators/amortization", label: "Amortization schedule calculator" },
      { href: "/mortgage/refinance", label: "Refinancing with TRACT" },
      {
        href: "/resources/no-closing-cost-refinance",
        label: "The truth about no-closing-cost refinances"
      }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "cash-out-refinance-florida",
    category: "refinance",
    title: "Cash-Out Refinance in Florida: How It Actually Works",
    description:
      "What a cash-out refinance is, how loan-to-value caps the check you can take, and why closing costs — including Florida's taxes — apply to the whole new loan.",
    h1: "How a cash-out refinance works in Florida",
    answerSummary:
      "A cash-out refinance replaces your existing mortgage with a larger new one and hands you the difference in cash at closing. The size of the new loan is capped by a loan-to-value limit set by the loan program, and closing costs — including Florida's documentary stamp and intangible taxes — are charged on the entire new balance, not just on the cash you take.",
    sections: [
      {
        heading: "One loan replaces another, and the difference is cash",
        paragraphs: [
          "Mechanically, a cash-out refinance is a full new first mortgage. The new lender pays off your existing loan, covers the transaction's costs if you finance them, and wires you the remainder. You leave with one loan, one payment, and a check. Fannie Mae's Selling Guide defines the acceptable uses: paying off the existing first mortgage, paying transaction costs, retiring certain other liens, and taking equity out as cash.",
          "The word 'refinance' undersells what is happening. Your old loan — its rate, its remaining term, its accumulated principal progress — is extinguished. Everything about the new loan is repriced at today's market for your credit profile, your equity position, and the cash-out feature itself. If your existing rate is meaningfully better than what the market offers now, that trade is the largest cost in the deal, and it never appears on a fee sheet."
        ]
      },
      {
        heading: "Loan-to-value: the cap on the check",
        paragraphs: [
          "Loan-to-value, or LTV, is the new loan amount divided by the appraised value of the home. A $300,000 loan on a $400,000 house is 75 percent LTV. Every loan program sets a maximum LTV for cash-out transactions, and it is lower than the maximum for a purchase or a rate-and-term refinance because lenders treat equity extraction as added risk.",
          "The arithmetic runs backward from the cap: maximum loan equals appraised value times the program's LTV limit, and your cash is that maximum minus the payoff of your current loan minus any financed costs. The specific limits vary by program, property type, and occupancy, and they change — check the current figures in the agency guides or ask when you get quoted. The appraisal matters as much as the cap: every dollar of appraised value moves the maximum loan by the LTV fraction of a dollar."
        ]
      },
      {
        heading: "Closing costs apply to the whole loan — and Florida adds taxes",
        paragraphs: [
          "This is the part that surprises people. The CFPB's inventory of mortgage costs — origination, points, appraisal, title insurance, recording — is calculated on or scaled to the full new loan amount, not the cash portion. Take $50,000 out of a home with a $250,000 balance and you are paying transaction costs on a roughly $300,000 loan.",
          "Florida then adds two state taxes on the new financing: documentary stamp tax on the promissory note and nonrecurring intangible tax on the recorded mortgage, both levied per dollar of the new obligation. The Florida Department of Revenue publishes the rates. Because both scale with the whole new balance, extracting a small amount of cash through a full refinance can be an expensive way to borrow — which is exactly the comparison a home equity line deserves to win or lose on paper, not by default."
        ],
        bullets: [
          "Cash received = (appraised value × program LTV cap) − current payoff − financed costs",
          "Fees and Florida taxes scale with the full new loan, not the cash-out portion",
          "A stronger appraisal raises the cap; a weak one shrinks the check"
        ]
      },
      {
        heading: "What lenders look at",
        paragraphs: [
          "Cash-out refinances are underwritten as thoroughly as purchases: full credit review, income documentation, an appraisal, and program rules on top. Fannie Mae's guide, for example, imposes requirements on how long you have owned the property and how long the existing loan has been in place before a cash-out is eligible — seasoning rules that change over time, so verify the current ones rather than assuming.",
          "Pricing also carries loan-level adjustments for the cash-out feature that scale with LTV and credit score. Two borrowers with identical balances can be quoted differently because one is classified cash-out and the other rate-and-term. That classification line — and why it is worth planning around — gets its own article in this library."
        ]
      },
      {
        heading: "Where TRACT fits",
        paragraphs: [
          "TRACT is a mortgage brokerage. We do not make or approve loans, and we do not set the LTV caps or the prices — lenders and the agencies do. What a broker adds on a cash-out is shopping the same scenario across multiple wholesale lenders and putting the results side by side: cash received, total costs including Florida taxes, new payment, and the rate you are giving up. If a home equity line or a smaller loan serves the goal better, the comparison should show that too. Education first; the decision is yours."
        ]
      }
    ],
    faqs: [
      {
        question: "Is cash from a cash-out refinance taxable income?",
        answer:
          "Loan proceeds are borrowed money, not income, so taking cash out is not a taxable event by itself. The tax treatment of the interest you pay depends on how the funds are used and on rules that change — that question belongs to a tax professional working from IRS guidance, not to a mortgage article."
      },
      {
        question: "How much cash can I actually take out?",
        answer:
          "Roughly: your home's appraised value times the program's loan-to-value cap, minus your current payoff and any financed costs. The caps differ by program, property type, and occupancy and are updated by the agencies, so treat any specific percentage you read as a claim to verify against the current guidelines."
      },
      {
        question: "Do I pay Florida documentary stamp tax on the whole new loan?",
        answer:
          "The documentary stamp tax on the note and the nonrecurring intangible tax are assessed on the new financing being recorded, which is the full new mortgage — not just the cash you extracted. The Florida Department of Revenue publishes the current rates and the calculation rules."
      },
      {
        question: "Is a cash-out refinance better than a HELOC?",
        answer:
          "Neither wins categorically. A cash-out refinance reprices your entire first mortgage to get at the equity; a HELOC leaves the first mortgage alone but carries a variable rate on a second lien. Which is cheaper depends on your existing rate, how much you need, and for how long — it is a math problem worth running both ways."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B2-1.3-03, Cash-Out Refinance Transactions",
        url: "https://selling-guide.fanniemae.com/sel/b2-1.3-03/cash-out-refinance-transactions"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What costs will I have to pay as part of taking out a mortgage loan?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-costs-will-i-have-to-pay-as-part-of-taking-out-a-mortgage-loan-en-153/"
      },
      {
        publisher: "Florida Department of Revenue",
        title: "Documentary Stamp Tax",
        url: "https://floridarevenue.com/taxes/taxesfees/Pages/doc_stamp.aspx"
      }
    ],
    related: [
      { href: "/calculators/refinance-break-even", label: "Refinance break-even calculator" },
      { href: "/calculators/closing-cost", label: "Florida closing cost calculator" },
      { href: "/resources/heloc-vs-cash-out", label: "HELOC vs. cash-out refinance" },
      {
        href: "/resources/rate-term-vs-cash-out",
        label: "Rate-and-term vs. cash-out classification"
      },
      { href: "/mortgage/refinance", label: "Refinancing with TRACT" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "rate-term-vs-cash-out",
    category: "refinance",
    title: "Rate-and-Term vs. Cash-Out: Why the Label Sets the Price",
    description:
      "Two refinances of the same size can price differently because the agencies classify them differently. What makes a loan 'cash-out,' and why the label costs money.",
    h1: "Rate-and-term vs. cash-out refinance: why the label changes the price",
    answerSummary:
      "Refinance pricing depends on how the transaction is classified, not just how large it is. A rate-and-term refinance — Fannie Mae calls it limited cash-out — mostly replaces existing mortgage debt. A cash-out refinance extracts equity beyond narrow allowances. Agencies treat cash-out as higher risk and attach pricing adjustments, so an identical loan amount can carry a higher rate purely because of where the money goes.",
    sections: [
      {
        heading: "Same balance, different price",
        paragraphs: [
          "Picture two neighbors each closing a $320,000 refinance on similar houses with similar credit. One is paying off a $318,000 first mortgage and financing costs. The other is paying off a $260,000 first mortgage and taking the rest in cash. Same loan amount, same collateral — different classification, and typically a different price, because the second transaction is cash-out and carries loan-level pricing adjustments the first does not.",
          "This is not a lender being arbitrary. Fannie Mae and Freddie Mac price loans they buy according to risk attributes, and equity extraction is one of the attributes their pricing grids adjust for. The adjustment scales with loan-to-value and credit score, and it exists at every lender selling to the agencies. Understanding the boundary between the two labels is therefore worth real money."
        ]
      },
      {
        heading: "What keeps a refinance 'rate-and-term'",
        paragraphs: [
          "Fannie Mae's Selling Guide defines the limited cash-out refinance by what the proceeds may do: pay off the unpaid balance of the existing first mortgage, cover closing costs and prepaids, and return to the borrower only a small amount of incidental cash — the guide specifies the exact allowance, and it is small by design. Freddie Mac maintains a parallel 'no cash-out' category with its own definitions.",
          "The intuition: if the new loan essentially replaces old acquisition debt plus the friction of replacing it, the borrower's equity position hasn't changed, so the loan prices like the lower-risk thing it is. The moment meaningful equity leaves the property as cash, the classification — and the price — flips."
        ]
      },
      {
        heading: "What tips it into cash-out",
        paragraphs: [
          "The obvious trigger is taking cash beyond the incidental allowance. The less obvious ones catch people. Paying off a second mortgage or home equity line generally makes the refinance cash-out unless that second lien meets the guide's conditions — for example, that it was used entirely to purchase the property. Paying off other debts — cards, cars, tax liens — through the loan is equity extraction by definition.",
          "The rules are precise, they differ slightly between Fannie Mae and Freddie Mac, and they are amended over time, so the current guides are the authority. The practical point is that the classification is determined by the structure of the payoff, which is often something you can plan. How a HELOC was used years ago, or whether a debt is paid at closing versus after it, can decide which pricing grid your loan lands on."
        ],
        bullets: [
          "Cash back beyond the guide's incidental allowance makes the loan cash-out",
          "Paying off a non-purchase second lien generally makes it cash-out",
          "Consolidating unrelated debts through the mortgage is cash-out",
          "The agencies' current guides — not habit — draw the exact line"
        ]
      },
      {
        heading: "Why the market charges for the label",
        paragraphs: [
          "The performance data behind agency pricing shows borrowers who extract equity default more often than borrowers who merely restructure existing debt, all else equal. Cash-out loans also tend to follow financial stress — consolidation, liquidity needs — which is precisely when risk is elevated. The pricing adjustment is the market's estimate of that gap, applied upfront as a cost that lenders typically pass through as a higher rate or added points.",
          "Cash-out classification also drags eligibility with it: lower maximum LTVs and ownership-seasoning requirements that rate-and-term loans do not face, per the current agency guides. So the label affects not just what you pay, but what you can do at all."
        ]
      },
      {
        heading: "Planning around the line",
        paragraphs: [
          "If you need cash and a better first-mortgage structure, run the alternatives explicitly: one cash-out refinance versus a rate-and-term refinance paired with a separate home equity line, versus leaving the first mortgage alone entirely. The delayed-financing exception in Fannie Mae's guide — for owners who recently paid cash for a property — is another example of a structural rule worth knowing before you close, not after.",
          "TRACT arranges loans through multiple wholesale lenders; we do not set these classifications or their prices. What a broker can do is price your actual scenario both ways where both are possible, so the cost of the cash-out label is a number on paper instead of a surprise in a quote. Start with the break-even calculator, then get the classifications priced."
        ]
      }
    ],
    faqs: [
      {
        question: "Is 'limited cash-out' the same as 'rate-and-term'?",
        answer:
          "Functionally yes. 'Rate-and-term' is the industry's everyday phrase; Fannie Mae's guide calls the category 'limited cash-out' because it permits a small incidental amount of cash back, and Freddie Mac uses 'no cash-out.' The definitions differ in detail between the agencies, which is why the payoff structure gets checked against the specific guide."
      },
      {
        question: "Does paying off my HELOC in a refinance make it cash-out?",
        answer:
          "Often, yes. Under agency rules, retiring a subordinate lien generally keeps rate-and-term treatment only if that lien meets specific conditions — such as having been used entirely to acquire the property. A HELOC drawn for other purposes typically pushes the refinance into the cash-out category. The current guides control."
      },
      {
        question: "How much more does a cash-out refinance cost?",
        answer:
          "It depends on your loan-to-value and credit score, because the agencies' loan-level price adjustments scale with both. The honest answer is a same-day quote of your scenario under each classification — the difference is specific to you, and any fixed number quoted in an article would be stale by the time you read it."
      },
      {
        question: "Can I take a small amount of cash and stay rate-and-term?",
        answer:
          "The agencies allow incidental cash back within a defined limit — Fannie Mae's guide states the exact figure. Beyond that allowance, the transaction is classified cash-out regardless of how modest the amount feels. If you need meaningful cash, compare a true cash-out against a separate equity line on price."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B2-1.3-02, Limited Cash-Out Refinance Transactions",
        url: "https://selling-guide.fanniemae.com/sel/b2-1.3-02/limited-cash-out-refinance-transactions"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B2-1.3-03, Cash-Out Refinance Transactions",
        url: "https://selling-guide.fanniemae.com/sel/b2-1.3-03/cash-out-refinance-transactions"
      },
      {
        publisher: "Fannie Mae",
        title: "Pricing & Execution — Loan-Level Price Adjustment Matrix",
        url: "https://singlefamily.fanniemae.com/pricing-execution"
      }
    ],
    related: [
      {
        href: "/resources/cash-out-refinance-florida",
        label: "How cash-out refinancing works in Florida"
      },
      { href: "/calculators/refinance-break-even", label: "Refinance break-even calculator" },
      { href: "/mortgage/refinance", label: "Refinancing with TRACT" },
      { href: "/resources/heloc-vs-cash-out", label: "HELOC vs. cash-out refinance" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "fha-streamline-refinance",
    category: "refinance",
    title: "FHA Streamline Refinance: Less Paperwork, Real Rules",
    description:
      "How an FHA-to-FHA streamline refinance cuts documentation, what the net tangible benefit test requires, and where mortgage insurance premiums fit into the math.",
    h1: "The FHA streamline refinance, explained",
    answerSummary:
      "An FHA streamline refinance replaces one FHA-insured loan with another using reduced documentation — typically no new appraisal and, in the non-credit-qualifying version, no full income re-verification. In exchange, HUD requires the new loan to deliver a defined net tangible benefit to the borrower, and FHA mortgage insurance premiums continue on the new loan. Costs still exist; only the paperwork shrinks.",
    sections: [
      {
        heading: "What 'streamline' actually means",
        paragraphs: [
          "The FHA streamline is HUD's mechanism for letting existing FHA borrowers into better loan terms without re-running the full origination gauntlet. Because the loan being replaced is already FHA-insured, HUD permits lenders to originate the new one with reduced credit and property documentation — the streamline generally proceeds without a new appraisal, using the original insured value instead.",
          "The word describes the documentation, not the transaction. There is still a lender, an underwrite against HUD's streamline rules, a closing, and a new loan that fully replaces the old one. And the streamline is FHA-to-FHA only: it exists to move borrowers between FHA loans, not to bring conventional loans into the program or move FHA borrowers out of it."
        ]
      },
      {
        heading: "Credit-qualifying vs. non-credit-qualifying",
        paragraphs: [
          "Streamlines come in two flavors. The non-credit-qualifying version — the one people usually mean — skips full income and employment re-verification. The credit-qualifying version re-documents income and credit, and lenders require it in certain situations HUD's handbook spells out, such as some changes to who is on the loan.",
          "Reduced documentation is not no standards. HUD's rules require a history of on-time payments on the existing FHA loan and minimum seasoning — measured in payments made and time since closing — before a streamline is eligible. The specific payment-history and seasoning tests are set in HUD's current handbook and lender guidance, so verify them at the time you apply rather than trusting a remembered figure."
        ]
      },
      {
        heading: "The net tangible benefit test",
        paragraphs: [
          "The streamline's defining guardrail is the net tangible benefit requirement: HUD obliges the lender to demonstrate that the refinance leaves the borrower measurably better off. The test is defined in HUD's rules by transaction type — for example, moving between fixed and adjustable rates, or shortening the term — with required improvement in the combined rate the borrower pays, mortgage insurance included.",
          "The purpose is anti-churning. A reduced-documentation refinance is cheap to produce, and without a benefit test it would be profitable to refinance borrowers repeatedly for trivial improvements while fees accumulate. The test forces every streamline to answer the same question this entire resource library keeps asking: what does the borrower concretely gain, and does it beat the cost?"
        ]
      },
      {
        heading: "Mortgage insurance doesn't go away",
        paragraphs: [
          "FHA loans carry mortgage insurance premiums in two parts, as the CFPB's overview of mortgage insurance explains: an upfront premium at closing and an annual premium paid monthly. A streamline originates a new FHA loan, so a new upfront premium applies — with a partial refund credit of the old upfront premium if the new loan closes within the window HUD's refund schedule defines — and the annual premium continues at whatever rates and duration apply to the new loan.",
          "This matters for the comparison. Borrowers with meaningful equity sometimes do better refinancing out of FHA into a conventional loan with no mortgage insurance at all, even at a similar note rate, because the premium disappears. The streamline's convenience should compete against that alternative, not be chosen for ease."
        ],
        bullets: [
          "New upfront premium at closing; a refund credit may apply within HUD's defined window",
          "Annual premium continues on the new loan per the current HUD schedule",
          "Enough equity may make a conventional refinance the stronger play — price both"
        ]
      },
      {
        heading: "Costs, and how they get paid",
        paragraphs: [
          "HUD's rules do not allow streamline closing costs to be financed into the new loan balance beyond the tightly defined loan-amount formula. In practice that leaves paying costs in cash at closing or absorbing them through the rate via a lender credit. Both are real costs and belong in a break-even calculation like any other refinance.",
          "TRACT arranges FHA loans through wholesale lenders; we do not make, approve, or price them, and HUD's rules — not ours — define eligibility and benefit tests. What we can do is price your streamline against a conventional refinance and against doing nothing, with the mortgage insurance treated honestly in all three columns."
        ]
      }
    ],
    faqs: [
      {
        question: "Does an FHA streamline require an appraisal?",
        answer:
          "Generally no — that is one of the program's defining features. The streamline typically relies on the original insured value rather than a new appraisal, which also means falling local prices do not by themselves block the refinance. Lender overlays can differ, so confirm with the lender handling your loan."
      },
      {
        question: "Can I take cash out with an FHA streamline?",
        answer:
          "No. The streamline is designed to improve the terms of an existing FHA loan, and HUD's loan-amount rules leave no room for meaningful cash back. Extracting equity requires a different transaction — FHA's separate cash-out program or a conventional cash-out — each with full documentation and its own rules."
      },
      {
        question: "What is a net tangible benefit, concretely?",
        answer:
          "It is HUD's required proof that the new loan leaves you better off, defined per transaction type — typically a required reduction in the combined interest-plus-insurance rate, or a defined benefit when moving between adjustable and fixed structures. The exact thresholds live in HUD's current handbook, and the lender must document that your loan meets them."
      },
      {
        question: "Do I skip payments or get my escrow back in a streamline?",
        answer:
          "Your old escrow balance is refunded by the old servicer after payoff, and the payment-cycle gap is an artifact of prepaid interest — neither is free money. Counting them as savings overstates the deal. Treat them as timing effects and judge the streamline on its actual cost and benefit."
      }
    ],
    sources: [
      {
        publisher: "U.S. Department of Housing and Urban Development",
        title: "Streamline Refinance Your Mortgage",
        url: "https://www.hud.gov/program_offices/housing/sfh/ins/streamline"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is mortgage insurance and how does it work?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-mortgage-insurance-and-how-does-it-work-en-1953/"
      }
    ],
    related: [
      { href: "/mortgage/fha", label: "FHA loans with TRACT" },
      { href: "/calculators/refinance-break-even", label: "Refinance break-even calculator" },
      { href: "/resources/no-closing-cost-refinance", label: "How lender credits really price" },
      { href: "/resources/remove-pmi", label: "Removing mortgage insurance on conventional loans" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "va-irrrl-explained",
    category: "refinance",
    title: "VA IRRRL Explained: The Streamlined VA Refinance",
    description:
      "How the VA Interest Rate Reduction Refinance Loan works: reduced documentation, a reduced funding fee, and the guardrails that keep the refi genuinely beneficial.",
    h1: "The VA IRRRL: the VA's interest rate reduction refinance loan, explained",
    answerSummary:
      "The IRRRL is the VA's streamlined refinance for borrowers who already have a VA-backed loan. It exists to lower the interest rate or move from an adjustable to a fixed rate, with reduced documentation, often no appraisal, and a reduced funding fee that most borrowers can roll into the loan. Statutory guardrails require the new loan to genuinely benefit the veteran.",
    sections: [
      {
        heading: "What an IRRRL is — and what it's for",
        paragraphs: [
          "IRRRL stands for Interest Rate Reduction Refinance Loan, and the name is the mission statement. VA describes it as a VA-to-VA refinance for one of two purposes: reducing the interest rate (and usually the payment) on an existing VA-backed loan, or making the payment more stable by moving from an adjustable rate to a fixed one. It is not a cash-out vehicle — VA runs a separate cash-out refinance program for that.",
          "Like every VA loan, an IRRRL is made by a private lender and guaranteed by VA, so rates and fees vary by lender even within the program's rules. That makes the IRRRL, despite its simplicity, still worth shopping."
        ]
      },
      {
        heading: "What's streamlined about it",
        paragraphs: [
          "Because the loan being replaced already carries VA's guaranty and a payment history, the IRRRL process drops much of a full origination: lenders can typically proceed without a new appraisal and without full income re-verification, per VA's program rules. You must certify prior occupancy of the home the loan covers, but current occupancy is not required — a point that matters for service members who have since relocated on orders.",
          "Streamlined is not automatic. Lenders still review the payment history on the existing loan, and VA's rules plus lender overlays govern eligibility. The three core requirements VA lists are simple: an existing VA-backed loan, the IRRRL refinancing that same loan, and the occupancy certification."
        ]
      },
      {
        heading: "The funding fee, reduced",
        paragraphs: [
          "VA charges a one-time funding fee on most VA loans in place of monthly mortgage insurance, and the IRRRL carries the schedule's reduced rate — VA publishes the current figure on its funding fee page. Borrowers receiving VA disability compensation and certain other groups are exempt entirely; the exemption categories are listed in the same place.",
          "On an IRRRL the funding fee can be financed into the new loan balance, which preserves cash but adds the fee to the amount accruing interest. Either way it belongs in the cost column of the break-even calculation, alongside the ordinary closing costs — title, recording, lender charges — that a refinance still incurs."
        ]
      },
      {
        heading: "The guardrails: recoupment and seasoning",
        paragraphs: [
          "Congress and VA responded to a history of churning — serial refinancing of veterans' loans for lender profit — with concrete tests. Current rules require the lender to certify that the borrower recoups the costs of the refinance within a defined period through the payment savings, require minimum seasoning on the loan being replaced, and set minimum rate-improvement thresholds, including stricter ones when moving from a fixed rate to an adjustable one. The specific numbers live in VA's current rules and lender guidance.",
          "Notice what the recoupment test is: a mandatory break-even calculation. VA effectively wrote this resource library's core advice into regulation. If an IRRRL cannot demonstrate that its savings repay its costs within the required window, it does not close — which is a decent standard to hold any refinance to, VA or not."
        ],
        bullets: [
          "Recoupment: certified proof that savings repay costs within the defined period",
          "Seasoning: a minimum age for the loan being refinanced, per current rules",
          "Rate improvement: required minimum reduction, stricter for fixed-to-ARM moves"
        ]
      },
      {
        heading: "Where TRACT fits",
        paragraphs: [
          "TRACT is a Florida mortgage brokerage that arranges VA loans through wholesale lenders; we do not make, approve, or price loans, and VA's rules — not ours — define IRRRL eligibility and the benefit tests. Because IRRRLs are lender-priced within VA's framework, the same veteran can see meaningfully different offers, and comparing several is the whole game. We put the offers through the same break-even arithmetic the recoupment rule requires, so the winning quote is visible on paper before anyone commits."
        ]
      }
    ],
    faqs: [
      {
        question: "Can I get cash out with an IRRRL?",
        answer:
          "No. The IRRRL exists to reduce the rate or stabilize the payment on an existing VA loan; VA operates a separate cash-out refinance program for equity extraction, with full underwriting and an appraisal. Incidental amounts aside, if you need cash, you are shopping a different transaction."
      },
      {
        question: "Do I have to live in the home to use an IRRRL?",
        answer:
          "VA requires you to certify that you previously occupied the home covered by the loan — not that you live there now. That distinction makes the IRRRL usable for veterans and service members who have moved, including those renting out a former residence after a PCS move."
      },
      {
        question: "Is the VA funding fee required on an IRRRL?",
        answer:
          "Most borrowers pay the IRRRL's reduced funding fee, and it can typically be financed into the loan. Borrowers receiving VA disability compensation, certain surviving spouses, and other groups VA lists are exempt. Check VA's funding fee page for the current rate and the full exemption list."
      },
      {
        question: "Why would an IRRRL be denied if it's streamlined?",
        answer:
          "The common reasons are the guardrails: the rate improvement is too small to meet the required threshold, the existing loan is too new to satisfy seasoning, the recoupment math fails, or the payment history does not meet the lender's standards. Streamlined documentation does not suspend the benefit tests."
      }
    ],
    sources: [
      {
        publisher: "U.S. Department of Veterans Affairs",
        title: "Interest Rate Reduction Refinance Loan (IRRRL)",
        url: "https://www.va.gov/housing-assistance/home-loans/loan-types/interest-rate-reduction-loan/"
      },
      {
        publisher: "U.S. Department of Veterans Affairs",
        title: "VA funding fee and loan closing costs",
        url: "https://www.va.gov/housing-assistance/home-loans/funding-fee-and-closing-costs/"
      }
    ],
    related: [
      { href: "/mortgage/va", label: "VA loans with TRACT" },
      { href: "/calculators/refinance-break-even", label: "Refinance break-even calculator" },
      { href: "/resources/refinance-break-even", label: "The only refinance math that matters" },
      { href: "/contact", label: "Talk through your VA refinance" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "remove-pmi",
    category: "refinance",
    title: "How to Remove PMI: Your Rights Under Federal Law",
    description:
      "The Homeowners Protection Act gives you two ways off PMI — requested cancellation at 80 percent and automatic termination at 78. Appreciation paths vary by servicer.",
    h1: "Removing PMI: cancellation, automatic termination, and the appreciation path",
    answerSummary:
      "Federal law gives conventional borrowers two exits from private mortgage insurance. You can request cancellation once the balance reaches 80 percent of the home's original value, and the servicer must terminate PMI automatically at 78 percent if the loan is current. Removing PMI earlier based on a home's appreciation is often possible too, but those rules come from the servicer and the loan's investor, not from the statute.",
    sections: [
      {
        heading: "What PMI is, and why it has an expiration built in",
        paragraphs: [
          "Private mortgage insurance protects the lender — not you — when a conventional loan closes with a small down payment, as the CFPB's explainer puts it plainly. It exists because low-equity loans are riskier, which contains its own logic for removal: once the equity gap closes, the insurance has done its job and the premium is pure cost.",
          "The Homeowners Protection Act of 1998 turned that logic into enforceable rights for most conventional loans on single-family homes. Before it, borrowers routinely paid PMI for years after the risk it covered had evaporated, because nothing obliged anyone to turn it off. FHA loans play by different rules entirely — their premiums follow HUD's schedule, not the HPA — which is why 'remove my PMI' conversations start with what kind of loan you have."
        ]
      },
      {
        heading: "Right one: cancellation on your request",
        paragraphs: [
          "Under the HPA, as the CFPB summarizes it, you can ask your servicer in writing to cancel PMI on the date the principal balance is scheduled to reach 80 percent of the home's original value — or earlier, if extra payments bring the actual balance there first. 'Original value' generally means the lesser of the purchase price and the original appraised value; the date it is scheduled to hit 80 percent is printed on your PMI disclosure from closing.",
          "The statute conditions the right: a good payment history as the law defines it, being current, and — at the servicer's requirement — evidence the value hasn't fallen and certification that no junior lien encumbers the property. This right requires you to act. Servicers apply the automatic rules on their own; the 80 percent cancellation happens because you wrote the letter."
        ]
      },
      {
        heading: "Right two: automatic termination",
        paragraphs: [
          "If you never ask, the HPA still ends PMI on its own. The servicer must terminate it automatically on the date the balance is scheduled to reach 78 percent of original value, provided the loan is current — and if you are behind on that date, termination happens once you catch up. There is also a backstop: PMI ends the month after the loan reaches the midpoint of its amortization schedule regardless of the balance, again if current.",
          "Note the word 'scheduled' in both rights. The statutory triggers run off the original amortization schedule and original value. Your home doubling in value does not move the automatic date one day — which is exactly why the third path exists."
        ]
      },
      {
        heading: "The appreciation path runs through your servicer's investor",
        paragraphs: [
          "Most borrowers who shed PMI early in a rising market do it based on current value — and that path is governed by the loan's investor, not the HPA. Fannie Mae's Servicing Guide, for instance, spells out when a servicer may terminate MI based on current property value: minimum equity thresholds that differ with how long the loan has been in place, a verified payment history, and a property valuation ordered by the servicer at the borrower's expense. Freddie Mac maintains its own parallel rules, and loans held outside the agencies follow whatever the note holder allows.",
          "Practical consequence: the answer to 'my house went up — can PMI come off?' depends on who owns your loan. Ask the servicer which investor's rules apply and what the current-value thresholds and valuation requirements are right now, because these are guide provisions that get amended, not statute."
        ],
        bullets: [
          "Statutory rights key off original value and the original amortization schedule",
          "Current-value removal is investor policy — Fannie Mae and Freddie Mac publish theirs",
          "Expect a servicer-ordered valuation, seasoning-dependent equity thresholds, and a clean payment history"
        ]
      },
      {
        heading: "When refinancing beats waiting",
        paragraphs: [
          "A refinance replaces the loan, and the new loan's PMI question is answered fresh at closing based on the new appraisal: enough equity and there is simply no PMI. When the servicer's current-value path is blocked or slow and substantial equity exists, refinancing can be the faster exit — but it buys that exit with full closing costs and a new rate, so it has to clear the same break-even test as any refinance, with the vanished premium counted as part of the monthly savings.",
          "TRACT arranges loans and does not make, approve, or price them — and PMI cancellation itself involves no loan at all, just your servicer. Where we help is the comparison: what the premium removal is worth per month, what a refinance would cost, and which path the arithmetic favors. Run it before paying for either an appraisal or an application."
        ]
      }
    ],
    faqs: [
      {
        question: "Does the Homeowners Protection Act apply to FHA loans?",
        answer:
          "No. The HPA's cancellation and termination rights cover private mortgage insurance on conventional loans. FHA loans carry FHA mortgage insurance premiums under HUD's own rules, and for many FHA loans the annual premium runs for the life of the loan — making a refinance into a conventional loan the usual exit."
      },
      {
        question: "Can my servicer refuse to cancel PMI at 80 percent?",
        answer:
          "The servicer can require what the statute allows: a written request, a good payment history, being current, evidence the value has not declined, and certification that no junior lien exists. If you meet the conditions, cancellation at the 80 percent threshold is a right, not a favor. The CFPB accepts complaints when servicers fail to honor it."
      },
      {
        question: "How do I use my home's appreciation to remove PMI early?",
        answer:
          "Ask your servicer which investor holds the loan and what its current-value termination rules are. Under Fannie Mae's guide, for example, the servicer orders the valuation and applies equity thresholds that depend on the loan's age. Expect to pay for the valuation and to need a clean payment record."
      },
      {
        question: "Do extra principal payments speed up PMI removal?",
        answer:
          "Yes, in two ways. Extra payments can bring your actual balance to the 80 percent cancellation threshold ahead of schedule, and they improve your equity position under any investor's current-value rules. Track your balance against original value — the servicer works from the schedule unless you ask."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "When can I remove private mortgage insurance (PMI) from my loan?",
        url: "https://www.consumerfinance.gov/ask-cfpb/when-can-i-remove-private-mortgage-insurance-pmi-from-my-loan-en-202/"
      },
      {
        publisher: "Fannie Mae",
        title: "Servicing Guide B-8.1-04, Termination of Conventional Mortgage Insurance",
        url: "https://servicing-guide.fanniemae.com/svc/b-8.1-04/termination-conventional-mortgage-insurance"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is private mortgage insurance?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-private-mortgage-insurance-en-122/"
      }
    ],
    related: [
      { href: "/calculators/amortization", label: "Amortization schedule calculator" },
      { href: "/calculators/refinance-break-even", label: "Refinance break-even calculator" },
      { href: "/mortgage/conventional", label: "Conventional loans with TRACT" },
      { href: "/resources/refinance-break-even", label: "The only refinance math that matters" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "recast-vs-refinance",
    category: "refinance",
    title: "Mortgage Recast vs. Refinance After a Lump-Sum Payment",
    description:
      "Recasting re-amortizes your existing loan after a large principal payment — same rate, modest fee. Refinancing replaces the loan. Which fits which situation.",
    h1: "Recast or refinance? What to do with a windfall against your mortgage",
    answerSummary:
      "A recast keeps your existing loan: after a lump-sum principal payment, the servicer re-amortizes the remaining balance over the remaining term, lowering the monthly payment without touching the rate — usually for a modest processing fee. A refinance replaces the loan entirely, at a new market rate and full closing costs. Which wins depends mostly on whether your existing rate is worth keeping.",
    sections: [
      {
        heading: "What a recast actually does",
        paragraphs: [
          "A fixed-rate mortgage payment is calculated from three inputs: balance, rate, and remaining term. A recast (also called re-amortization) recomputes the payment after a substantial principal reduction, holding the rate and the maturity date fixed. Pay $50,000 against the balance, and instead of keeping the old payment and finishing years early, the recast spreads the smaller balance over the original remaining term — producing a permanently lower required payment.",
          "Nothing else about the loan changes. Same note, same rate, same payoff date, same servicer. That is the recast's entire appeal: it delivers payment relief without surrendering a rate you may never see again, and without a new origination process. Servicers typically charge a processing fee for the recalculation and require a minimum principal reduction; both are servicer policies, so ask yours for its current terms."
        ]
      },
      {
        heading: "What a recast doesn't do",
        paragraphs: [
          "A recast will not lower your rate, shorten your term, remove mortgage insurance by itself, take a borrower off the loan, or produce cash. It is a payment recalculation, nothing more. If your existing rate is worse than what the market now offers, a recast locks in relief on a loan you might be better off replacing.",
          "Also worth knowing: you can make the same lump-sum payment and skip the recast. As the CFPB's explainer on paying down a mortgage describes, extra principal reduces the balance and shifts each subsequent payment's split toward principal — the required payment stays the same, but the loan finishes early and total interest falls. Recast lowers the payment and keeps the date; plain prepayment keeps the payment and pulls in the date. Same money, opposite goals."
        ],
        bullets: [
          "Recast: lower required payment, same rate, same payoff date",
          "Prepay without recast: same required payment, earlier payoff, less total interest",
          "Refinance: everything repriced — rate, term, and costs"
        ]
      },
      {
        heading: "Availability: your servicer and investor decide",
        paragraphs: [
          "There is no federal right to a recast. Whether your loan can be recast is a matter of the note, the investor's servicing rules, and the servicer's own program. Conventional loans held or securitized by the agencies are commonly recast-eligible under their servicing frameworks; government-backed loans — FHA and VA — generally are not recast in the conventional sense, and adjustable-rate loans re-amortize on their own schedule anyway.",
          "The only reliable answer comes from asking your servicer directly: is this loan eligible, what minimum principal reduction applies, what is the fee, and how long does processing take. Get the terms in writing before sending the lump sum, and say explicitly that the payment is intended as a principal curtailment pending recast — not as prepaid installments."
        ]
      },
      {
        heading: "The cost comparison is lopsided — and that's the point",
        paragraphs: [
          "A recast costs a processing fee. A refinance costs the full origination stack — lender charges, appraisal, title, recording, and in Florida documentary stamp and intangible taxes on a brand-new mortgage — which Freddie Mac's consumer guidance on refinancing costs describes as commonly running a meaningful percentage of the loan amount. On cost alone, recast wins by a mile.",
          "But cost alone is the wrong frame, because the refinance buys something the recast cannot: a different rate and term. If market rates sit meaningfully under your note rate, the refinance's interest savings can dwarf the fee difference. If your note rate beats the market, the recast preserves it — and the comparison is over before it starts. The deciding input is the spread between your rate and today's quotes, which is a number to obtain fresh, not assume."
        ]
      },
      {
        heading: "How to decide, in order",
        paragraphs: [
          "First, define the goal: lower required payment, earlier payoff, or lower lifetime interest — the three paths serve different masters. Second, get your servicer's recast terms and a current refinance quote for your scenario, then run the refinance through a break-even calculation with the recast as the baseline instead of doing nothing. Third, check the second-order effects: a lower required payment also helps debt-to-income math on future borrowing, while an early payoff builds equity faster.",
          "TRACT arranges refinances through wholesale lenders and has no role in recasts — that conversation belongs to you and your servicer, which is exactly why we will tell you when the recast is the better answer. A brokerage that only ever recommends the transaction it gets paid on is not doing analysis. Education first; the math decides."
        ]
      }
    ],
    faqs: [
      {
        question: "How much does a mortgage recast cost?",
        answer:
          "Servicers charge a processing fee that is typically small relative to refinance closing costs, and most require a minimum lump-sum principal reduction to qualify. Both figures are servicer policy and change, so get your servicer's current recast terms in writing rather than relying on a number from an article."
      },
      {
        question: "Can FHA and VA loans be recast?",
        answer:
          "Generally no — recasting in the conventional sense is a feature of conventional servicing, and government-backed programs handle payment relief through their own streamlined refinances instead. If you hold an FHA or VA loan and want a lower payment, the FHA streamline or VA IRRRL is usually the relevant comparison."
      },
      {
        question: "Does a recast reduce the interest I pay overall?",
        answer:
          "The lump sum itself reduces total interest, because interest accrues on a smaller balance. But the recast then lowers the payment and keeps the full term, so it saves less lifetime interest than making the same lump sum and keeping your old payment. Recast is a cash-flow tool, not an interest-minimization tool."
      },
      {
        question: "Should I recast or refinance after an inheritance or home-sale windfall?",
        answer:
          "Compare your note rate to a fresh refinance quote. If your existing rate is at or better than the market, a recast delivers payment relief while preserving it. If the market beats your rate meaningfully, price the refinance and run the break-even with recast — not standing still — as the alternative."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "How does paying down a mortgage work?",
        url: "https://www.consumerfinance.gov/ask-cfpb/how-does-paying-down-a-mortgage-work-en-1943/"
      },
      {
        publisher: "Freddie Mac",
        title: "Understanding the costs of refinancing",
        url: "https://myhome.freddiemac.com/refinancing/costs-of-refinancing"
      }
    ],
    related: [
      { href: "/calculators/amortization", label: "Amortization schedule calculator" },
      { href: "/calculators/refinance-break-even", label: "Refinance break-even calculator" },
      { href: "/mortgage/refinance", label: "Refinancing with TRACT" },
      { href: "/resources/refinance-break-even", label: "The only refinance math that matters" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "heloc-vs-cash-out",
    category: "refinance",
    title: "HELOC vs. Cash-Out Refinance: Two Ways to Tap Equity",
    description:
      "A HELOC adds a variable-rate second lien with low upfront cost; a cash-out refinance replaces your first mortgage. How structure, cost, flexibility, and risk differ.",
    h1: "HELOC vs. cash-out refinance: second lien or new first mortgage?",
    answerSummary:
      "Both convert home equity into money you can spend, but the structures differ completely. A cash-out refinance replaces your first mortgage with a bigger one at a new fixed rate, with closing costs on the whole loan. A HELOC leaves your first mortgage untouched and adds a second-lien credit line, usually variable-rate, that you draw as needed. The right choice depends on your existing rate, the amount, and the timeline.",
    sections: [
      {
        heading: "Two structures, not two flavors",
        paragraphs: [
          "A cash-out refinance is one loan: your old first mortgage is paid off and replaced by a larger one, and the equity you tapped becomes part of a single fixed payment. A home equity line of credit is a second, separate loan that sits behind your first mortgage in lien position. The first mortgage — its rate, payment, and payoff schedule — continues untouched.",
          "That structural difference drives everything else. The refinance reprices all of your mortgage debt to reach some of your equity; the HELOC prices only the new borrowing. When your existing first-mortgage rate is better than today's market, that distinction is usually decisive — repricing a large, cheap loan to extract a small amount of cash means paying the new rate on every dollar, not just the new ones."
        ]
      },
      {
        heading: "Rate structure: fixed lump sum vs. variable line",
        paragraphs: [
          "As the CFPB's HELOC explainer describes, a line of credit typically works in two phases: a draw period — often measured in years — during which you borrow, repay, and re-borrow up to the limit, followed by a repayment period when the outstanding balance amortizes. HELOCs usually carry variable rates tied to an index, so the payment can move with the market; many lenders offer fixed-rate conversion options on drawn balances at a premium.",
          "A cash-out refinance is the opposite: one disbursement at closing, at a rate that is commonly fixed for the life of the loan. You get certainty and a single payment; you give up flexibility and, if your old loan was cheap, the old rate. Neither structure is better in the abstract — a variable line is a different instrument than a fixed loan, suited to different jobs."
        ]
      },
      {
        heading: "Closing costs: the whole loan vs. the line",
        paragraphs: [
          "Refinance closing costs — origination, appraisal, title, recording, and in Florida the documentary stamp and intangible taxes — are assessed on the entire new first mortgage, per the CFPB's cost inventory. Tapping $40,000 of equity through a $340,000 refinance means transaction costs scaled to $340,000. HELOCs typically carry much lighter upfront costs, though ongoing charges like annual fees, minimum-draw requirements, and early-closure fees appear in some programs.",
          "The honest comparison prices both paths for your amount: total cost of the refinance including the rate change on the existing balance, versus the HELOC's expected interest at plausible rate paths plus its fees. For small draws against a well-priced first mortgage, the line often wins on arithmetic. For very large draws, or when the refinance also improves the first mortgage's rate, the single new loan can win."
        ],
        bullets: [
          "Refinance: costs and Florida taxes scale with the full new loan amount",
          "HELOC: light upfront cost, but variable rate and possible ongoing fees",
          "The bigger the draw relative to your first mortgage, the more the refinance structure can justify itself"
        ]
      },
      {
        heading: "Flexibility and risk",
        paragraphs: [
          "For staged spending — a phased renovation, tuition due each fall — the HELOC's draw-as-needed design means you pay interest only on what is outstanding. A cash-out refinance hands you the full amount on day one, accruing interest immediately, whether or not the money is deployed. For a single large, immediate use, that difference disappears.",
          "Both loans are secured by your home, and the CFPB's explainer is blunt that failing to repay a HELOC can cost you the house just as surely as a first mortgage default. The HELOC adds two specific risks: payment jump at the end of the draw period, when interest-only payments can become fully amortizing ones, and rate risk throughout. The refinance adds its own quiet risk — permanently surrendering a favorable first-mortgage rate, a cost that compounds monthly for decades and never shows up on a fee sheet."
        ]
      },
      {
        heading: "How to choose",
        paragraphs: [
          "Start with three questions. How does your current first-mortgage rate compare with a fresh quote — is repricing it a cost or a benefit? How much do you need, and is it one sum or a stream? How long will the money be outstanding — short enough that a variable rate is a tolerable risk, or long enough that fixed certainty is worth paying for?",
          "TRACT arranges first-mortgage loans, including cash-out refinances, through wholesale lenders; we do not make or price them, and home equity lines are often obtained through banks and credit unions directly. We will still run the comparison with you honestly — including when the answer is 'keep your first mortgage and get a line elsewhere' — because a recommendation that ignores the better path is not education, it is sales."
        ]
      }
    ],
    faqs: [
      {
        question: "Does a HELOC change my existing mortgage?",
        answer:
          "No. A HELOC is a separate second-lien loan; your first mortgage's rate, payment, and schedule continue unchanged. The line does encumber the property, which can matter later — for example, junior liens must be certified absent for PMI cancellation, and paying a HELOC off through a future refinance can affect that refinance's classification."
      },
      {
        question: "Which is cheaper: a HELOC or a cash-out refinance?",
        answer:
          "It depends on the spread between your current first-mortgage rate and today's quotes, the size of the draw relative to your balance, and how long the money stays outstanding. Small draw plus well-priced first mortgage usually favors the line; a large draw or an improvable first-mortgage rate can favor the refinance. Price both."
      },
      {
        question: "What happens when a HELOC's draw period ends?",
        answer:
          "The line converts to its repayment phase: no new draws, and the outstanding balance amortizes — so a payment that may have been interest-only becomes principal-and-interest. The CFPB flags this payment jump as a core HELOC risk. Know your draw and repayment terms before borrowing, not when the letter arrives."
      },
      {
        question: "Can I deduct the interest on either option?",
        answer:
          "Interest deductibility depends on how the borrowed funds are used and on tax rules that change over time. Neither structure is automatically deductible. Verify current treatment with a tax professional working from IRS guidance before letting a deduction assumption tilt the decision."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is a home equity line of credit (HELOC)?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-home-equity-line-of-credit-heloc-en-107/"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What costs will I have to pay as part of taking out a mortgage loan?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-costs-will-i-have-to-pay-as-part-of-taking-out-a-mortgage-loan-en-153/"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B2-1.3-03, Cash-Out Refinance Transactions",
        url: "https://selling-guide.fanniemae.com/sel/b2-1.3-03/cash-out-refinance-transactions"
      }
    ],
    related: [
      {
        href: "/resources/cash-out-refinance-florida",
        label: "How cash-out refinancing works in Florida"
      },
      { href: "/calculators/refinance-break-even", label: "Refinance break-even calculator" },
      { href: "/mortgage/refinance", label: "Refinancing with TRACT" },
      {
        href: "/resources/rate-term-vs-cash-out",
        label: "Why the cash-out label changes the price"
      }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "no-closing-cost-refinance",
    category: "refinance",
    title: "No-Closing-Cost Refinance: Where the Costs Actually Go",
    description:
      "'No closing costs' means the costs moved into the rate. How lender credits actually work, when accepting that trade is smart, and how to compare offers honestly.",
    h1: "There is no free refinance: what 'no closing costs' really means",
    answerSummary:
      "A no-closing-cost refinance does not eliminate costs — it pays them with a lender credit generated by accepting a higher interest rate, or hides them in a larger loan balance. You are trading an upfront bill for a larger payment every month you hold the loan. That trade is genuinely smart in some situations, but it is a financing choice, not a discount, and it should be compared as one.",
    sections: [
      {
        heading: "Where the money actually comes from",
        paragraphs: [
          "Every refinance generates real third-party bills — appraiser, title agent, county recorder, and in Florida the state's taxes on the new note and mortgage. Someone pays them. In a 'no-closing-cost' loan, the lender pays them on your behalf using a lender credit, and funds that credit by giving you a higher interest rate than your scenario would otherwise price at. The CFPB's explainer on points and lender credits describes the machine plainly: credits lower what you pay at closing in exchange for paying more over time.",
          "This is the same pricing dial as discount points, turned the other direction. Points: pay more today, get a lower rate. Credits: accept a higher rate, pay less today. Rate and upfront cost are two ends of one lever, and 'no closing costs' is simply a marketing name for one end of it."
        ]
      },
      {
        heading: "The other version: burying costs in the balance",
        paragraphs: [
          "Some loans advertised as no-cost instead roll the closing costs into the new loan amount. Freddie Mac's consumer guidance on refinancing costs warns about exactly this pattern. Nothing is waived — you now owe the costs, plus interest on them for up to thirty years, and in a refinance a larger balance can also mean slightly larger state taxes and fees that scale with loan size.",
          "Neither version is dishonest by itself. Both are legitimate structures with real uses. What is dishonest is the word 'free.' A cost you finance is a cost you pay with interest; a cost you absorb into the rate is a cost you pay monthly forever. The only version of a refinance with no costs is the one that doesn't happen."
        ]
      },
      {
        heading: "When the higher-rate trade genuinely wins",
        paragraphs: [
          "Here is the case for the structure, made honestly. If you expect to keep the loan only briefly — a planned sale, a likely subsequent refinance — the higher rate runs for a short time while the avoided costs were immediate and certain. Zero upfront cost also means a shorter break-even: a refinance that costs nothing at closing starts paying for itself with the first reduced payment.",
          "The trade loses the same way it wins: with time. Hold the loan for many years and the monthly premium you accepted eventually exceeds — then dwarfs — the costs you avoided. The crossover point is computable for your actual numbers, which is what the break-even calculator is for. The structure is a bet on a short holding period; make the bet knowingly or not at all."
        ],
        bullets: [
          "Short expected hold: credits likely win — costs avoided, premium paid briefly",
          "Long expected hold: paying costs (or points) likely wins over the years",
          "Unsure: price both structures and find the crossover month for your numbers"
        ]
      },
      {
        heading: "How to compare offers without being fooled",
        paragraphs: [
          "Two rules make the pricing lever visible. First, compare offers at the same rate: ask each lender what your total costs are at an identical rate, and the cheaper machine reveals itself. Comparing one lender's no-cost offer against another's low-rate-plus-fees offer tells you almost nothing, because you are looking at two different points on two different levers.",
          "Second, use the Loan Estimate. Every lender must issue this standardized federal disclosure within three business days of application, and lender credits appear on it explicitly, as the CFPB documents. Line up Loan Estimates issued on the same day — pricing moves daily — and the marketing labels fall away, leaving arithmetic."
        ]
      },
      {
        heading: "Why we tell you this",
        paragraphs: [
          "TRACT is a mortgage brokerage: we arrange loans through wholesale lenders and do not make, approve, or price them. Broker compensation is disclosed under federal rules, and nothing about our role changes the physics above — every no-cost loan we could arrange prices its costs into the rate the same way anyone else's does.",
          "The reason to explain the machine is simpler: borrowers who understand the rate-cost lever make better choices and are harder to mislead, and an educated borrower comparing honestly quoted structures is the client we want. Bring us any offer, including one we did not arrange, and we will decompose it into rate, credits, and costs so you can see what is actually being sold."
        ]
      }
    ],
    faqs: [
      {
        question: "Is a no-closing-cost refinance ever the right choice?",
        answer:
          "Yes — most clearly when your expected holding period is short, or when paying costs in cash would strain reserves you need elsewhere. The structure buys a shorter break-even at the price of a permanently higher rate. It is right when the numbers say so for your horizon, not as a default."
      },
      {
        question: "How can I tell if costs were rolled into my rate or my balance?",
        answer:
          "Read the Loan Estimate. A lender credit appears as an explicit line offsetting closing costs; a rolled-in structure shows a loan amount larger than your payoff. If the loan amount matches your payoff and the credit covers the costs, it is rate-financed. Ask the lender to quote the same loan without the credit and compare rates."
      },
      {
        question: "Do lender credits have to be disclosed?",
        answer:
          "Yes. Lender credits appear on the standardized Loan Estimate and again on the Closing Disclosure — federal forms whose formats the CFPB maintains precisely so structures like this are visible and comparable. If a quote will not put its credit in writing on those forms, treat that as your answer."
      },
      {
        question: "Isn't the higher rate only a small difference per month?",
        answer:
          "Per month, often yes — that is what makes the structure easy to sell. Multiplied by hundreds of payments, small monthly differences become large totals, which is why the honest comparison is cumulative: total extra interest over your realistic holding period versus the costs avoided at closing. Run the crossover month, then decide."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "How should I use lender credits and points (also called discount points)?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-are-discount-points-and-lender-credits-and-how-do-they-work-en-136/"
      },
      {
        publisher: "Freddie Mac",
        title: "Understanding the costs of refinancing",
        url: "https://myhome.freddiemac.com/refinancing/costs-of-refinancing"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What costs will I have to pay as part of taking out a mortgage loan?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-costs-will-i-have-to-pay-as-part-of-taking-out-a-mortgage-loan-en-153/"
      }
    ],
    related: [
      { href: "/calculators/refinance-break-even", label: "Refinance break-even calculator" },
      { href: "/resources/refinance-break-even", label: "The only refinance math that matters" },
      { href: "/mortgage/refinance", label: "Refinancing with TRACT" },
      { href: "/plan", label: "Build your mortgage plan" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "refinance-investment-property",
    category: "refinance",
    title: "Refinancing an Investment Property: Why It's Different",
    description:
      "Investment-property refinances carry occupancy pricing adjustments, tighter equity limits, and heavier underwriting — rental income, reserves — than a primary refi.",
    h1: "Refinancing an investment property: why it prices and underwrites differently",
    answerSummary:
      "Lenders treat investment-property refinances as a distinct, riskier product. Expect pricing adjustments for occupancy layered on top of any cash-out adjustment, lower maximum loan-to-value limits than a primary residence, and heavier underwriting: documented rental income, cash reserves, and scrutiny of your full property portfolio. The mechanics of refinancing are identical; the price, the equity required, and the paperwork are not.",
    sections: [
      {
        heading: "The risk premium is structural, not personal",
        paragraphs: [
          "When finances tighten, borrowers protect the home they live in before the one they rent out — decades of loan performance say so, and agency pricing is built on that data. Fannie Mae's loan-level price adjustment framework, published with its pricing materials, applies occupancy-based adjustments to investment-property loans that scale with loan-to-value. Lenders selling to the agencies pass those adjustments through as a higher rate, more points, or both.",
          "So an investor with excellent credit refinancing a rental will be quoted differently than the same person refinancing an identical primary residence. It is not a judgment about you; it is the price of the occupancy category. Knowing that upfront reframes shopping: you are comparing lenders' investment-property pricing, a spread that varies more between lenders than primary-residence pricing does."
        ]
      },
      {
        heading: "Equity requirements are tighter",
        paragraphs: [
          "Maximum loan-to-value limits for investment properties sit meaningfully lower than for primary residences, and lower again for cash-out transactions and multi-unit properties. The current numbers live in the agencies' eligibility matrices and change over time — treat any specific cap you read in an article as stale until verified.",
          "The practical consequence: equity that would comfortably support a cash-out refinance on a primary home may support a smaller loan, or none, on a rental. Before planning around a number, have the scenario priced against the current matrix — and remember the appraisal drives the other half of the LTV fraction, with investment appraisals also carrying rent analysis."
        ]
      },
      {
        heading: "Underwriting goes deeper",
        paragraphs: [
          "Beyond the ordinary refinance file — credit, income, assets, an appraisal, per the CFPB's general cost and process guidance — investment refinances add layers. Rental income must be documented to count, typically through tax return schedules and current leases, with the agencies' rules deciding how much of gross rent survives vacancy and expense adjustments. Cash reserves — months of payments held after closing — are required not just for the subject property but scaled to your other financed properties.",
          "The agencies also cap how many financed properties a conventional borrower can hold, with stricter terms as the count rises. Multi-property investors bump into these ceilings well before credit or income becomes the constraint, which is why portfolio structure — not just the subject property — shapes what a refinance can do."
        ],
        bullets: [
          "Rental income: documented via tax schedules and leases, counted after agency haircuts",
          "Reserves: months of payments, scaled across your financed-property portfolio",
          "Property count: agency limits tighten terms as financed properties accumulate"
        ]
      },
      {
        heading: "Cash-out on a rental: adjustments stack",
        paragraphs: [
          "Pulling equity out of an investment property combines the two most-adjusted categories in agency pricing: occupancy and cash-out. The adjustments stack, and the eligibility rules — ownership seasoning, LTV caps — apply in their strictest form, per Fannie Mae's cash-out refinance section. That is the structural reason investor cash-out quotes can look surprisingly far from the primary-residence quotes in advertisements.",
          "It is still frequently worth doing: extracting equity from one performing property to acquire the next is the basic engine of portfolio growth, and the mortgage is often the cheapest leverage an individual investor can access. The point is not that the price is unfair — it is that the comparison set should be other investor options, including DSCR loans underwritten on the property's own cash flow, not the primary-residence pricing your neighbor got."
        ]
      },
      {
        heading: "Run investor math, then shop wide",
        paragraphs: [
          "A homeowner refinances to a lower payment; an investor refinances to a return. The break-even calculation still governs, but the savings line feeds cash flow and cash-on-cash return, and a cash-out's proceeds have an opportunity cost and an expected yield. Run the property's numbers after the proposed refinance — payment, taxes, insurance, vacancy — before committing, using investor tools rather than homeowner intuition.",
          "TRACT arranges investment-property loans, conventional and DSCR alike, through wholesale lenders; we do not make, approve, or price them. Because investor pricing disperses widely across lenders, this is the corner of the market where shopping through a broker earns its keep most visibly: the same rental, quoted across multiple investor-focused lenders, side by side."
        ]
      }
    ],
    faqs: [
      {
        question: "Why is my investment refinance quoted higher than my home's?",
        answer:
          "Occupancy carries a loan-level pricing adjustment in agency pricing frameworks, scaled to loan-to-value, because rentals default more often than primary homes in stress. Lenders pass the adjustment through as rate or points. A cash-out feature adds its own adjustment on top. The gap is structural, and it varies by lender — which is why you shop it."
      },
      {
        question: "Can I count rental income in a refinance?",
        answer:
          "Yes, within agency rules: rental income is documented through tax return schedules and leases, and only a portion of gross rent typically counts after vacancy and expense adjustments. For DSCR loans, qualification rests on the property's own rent-to-payment ratio instead of your personal income — a different product with its own tradeoffs."
      },
      {
        question: "What are reserve requirements on investment refinances?",
        answer:
          "Reserves are funds — measured in months of the property's full payment — that you must still hold after closing. Requirements rise with cash-out features and with the number of financed properties you own, per the current agency guidelines. Plan liquidity around the whole portfolio, not just the subject property."
      },
      {
        question: "Is a DSCR refinance better than a conventional one for a rental?",
        answer:
          "Neither is categorically better. DSCR loans qualify on the property's cash flow — useful for self-employed investors or heavy portfolios — and typically price above comparable conventional loans while skipping personal income documentation. If you qualify conventionally, price both and let the difference pay for the paperwork, or not."
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
        title: "Pricing & Execution — Loan-Level Price Adjustment Matrix",
        url: "https://singlefamily.fanniemae.com/pricing-execution"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What costs will I have to pay as part of taking out a mortgage loan?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-costs-will-i-have-to-pay-as-part-of-taking-out-a-mortgage-loan-en-153/"
      }
    ],
    related: [
      { href: "/mortgage/investment-property", label: "Investment property loans with TRACT" },
      { href: "/mortgage/dscr", label: "DSCR loans" },
      {
        href: "/calculators/investment-property-cash-flow",
        label: "Investment property cash flow calculator"
      },
      { href: "/calculators/refinance-break-even", label: "Refinance break-even calculator" },
      {
        href: "/resources/rate-term-vs-cash-out",
        label: "Why the cash-out label changes the price"
      }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  }
];
