import type { Article } from "./types";

/**
 * BASICS cluster. These are the definitional questions people ask AI
 * assistants verbatim, so the `answerSummary` on each entry is written to be
 * quotable in full: a complete, standalone definition with the Florida nuance
 * already inside it. Sources are primary authorities only (CFPB ask-cfpb pages
 * carry most of the weight), and every figure that changes over time is
 * described structurally rather than stated as a current fact.
 */

const PUBLISHED = "2026-08-18";
const REVIEWED = "2026-08-18";

export const BASICS_ARTICLES: Article[] = [
  {
    slug: "what-is-piti",
    category: "basics",
    title: "What Is PITI? Mortgage Payment Parts, Florida Edition",
    description:
      "PITI stands for principal, interest, taxes, and insurance. In Florida the real monthly payment often adds HOA dues, flood insurance, and wind coverage.",
    h1: "What is PITI — and why the Florida version needs more letters",
    answerSummary:
      "PITI stands for principal, interest, taxes, and insurance — the four parts of a typical monthly mortgage payment. Principal reduces the loan balance, interest is the cost of borrowing, and taxes and homeowners insurance are usually collected through an escrow account. In Florida, a realistic payment often adds HOA or condo dues, flood insurance, and windstorm coverage, so lenders qualify borrowers on the full stack.",
    sections: [
      {
        heading: "The four letters, defined",
        paragraphs: [
          "Principal is the portion of each payment that reduces what you owe. Interest is what the lender charges for the money, calculated on the remaining balance. Together they make up the loan payment itself — the amount an amortization schedule describes.",
          "Taxes and insurance are not part of the loan, but your lender cares about them anyway, because unpaid property taxes and a lapsed insurance policy both threaten the collateral. That is why most loans collect one-twelfth of the annual property tax bill and homeowners insurance premium each month into an escrow account, and the servicer pays those bills when they come due. The CFPB explains escrow accounts in plain terms: the account exists to make sure property-related bills get paid on time.",
          "When a lender quotes your housing payment, or a preapproval letter states what you can carry, PITI is the number being discussed — not just principal and interest. A payment quote that shows only principal and interest is an incomplete picture everywhere, and in Florida it can be a badly incomplete one."
        ]
      },
      {
        heading: "Why Florida needs more letters",
        paragraphs: [
          "Florida's carrying costs lean harder on the T and the I than most states, and they add categories many buyers have never budgeted for. Property taxes reset when a home sells: the previous owner's homestead exemption and Save Our Homes assessment cap do not transfer, so the tax bill you see in a listing can understate what you will actually pay after the sale. Lenders and careful buyers estimate taxes on the purchase price, not on the seller's old bill.",
          "Homeowners insurance in Florida frequently comes in layers. A standard policy may exclude windstorm in coastal areas, requiring a separate wind policy or a policy through Citizens Property Insurance Corporation, the state-created insurer that covers property owners who cannot find comparable coverage in the private market. Flood is always a separate policy — homeowners insurance does not cover flood damage — and if the home sits in a FEMA-designated Special Flood Hazard Area and the loan is federally backed, flood insurance is mandatory, typically through the National Flood Insurance Program or a private flood insurer.",
          "Finally, a large share of Florida housing carries association dues. HOA fees, condo association dues, and special assessments are paid outside escrow but count fully in your debt-to-income ratio. On some condos, monthly dues rival the loan payment itself."
        ],
        bullets: [
          "P — principal: reduces the balance",
          "I — interest: the cost of borrowing",
          "T — taxes: estimated on your purchase price, not the seller's capped bill",
          "I — insurance: homeowners, plus wind where excluded, plus flood as a separate policy",
          "+ HOA or condo dues and any special assessments"
        ]
      },
      {
        heading: "How lenders use PITI to qualify you",
        paragraphs: [
          "Underwriting compares your full monthly housing expense — PITI plus association dues — against your gross income to produce a housing ratio, and adds your other debts to produce a total debt-to-income ratio. Because taxes, insurance, and dues all count, two identical loan amounts can produce very different qualifying pictures in Florida depending on the property. A buyer who qualifies comfortably for an inland single-family home may not qualify for a coastal condo at the same price once wind, flood, and dues enter the math.",
          "This is why an experienced Florida broker builds the payment from the property outward: pull the county's millage, price the insurance stack for that address, confirm the association dues, and only then talk about what loan size fits. TRACT arranges loans through wholesale lenders and does not set taxes or insurance premiums, but structuring the full payment honestly at the start is the difference between a preapproval that survives underwriting and one that does not."
        ]
      },
      {
        heading: "Escrow: how the T and I actually get paid",
        paragraphs: [
          "At closing, the lender typically establishes an escrow account funded with a cushion of a few months of taxes and insurance. Each monthly payment then includes the escrow portion, and the servicer pays the tax collector and insurance carriers directly. Once a year the servicer runs an escrow analysis; if taxes or premiums rose, your monthly payment rises to cover the shortfall — even on a fixed-rate loan.",
          "That last point surprises many Florida homeowners: a fixed rate fixes principal and interest, not the whole payment. When an insurance premium jumps or a reassessment lands, the payment moves. Budgeting with headroom for the T and the I, rather than treating the day-one payment as permanent, is the practical takeaway.",
          "Two escrow mechanics are worth knowing in advance. First, when the annual analysis finds a shortage, servicers generally let you either pay it as a lump sum or spread it across the next twelve payments — spreading it raises the monthly payment more, because you are covering both the shortage and the new, higher ongoing amounts. Second, escrow does not marry you to an insurance carrier: if you find better coverage, you can switch, and the servicer pays the new carrier from the same account once you provide the policy. Some lenders also allow escrow waivers at lower loan-to-value ratios, letting you pay taxes and insurance directly; the tradeoff is discipline — those Florida bills arrive large and annual, and a missed one has consequences an escrowed borrower never faces."
        ]
      },
      {
        heading: "Estimating your own PITI",
        paragraphs: [
          "A useful estimate starts with principal and interest from the loan amount, rate, and term; adds property taxes estimated from the purchase price and the county's rates; adds insurance quotes for that specific address, including wind and flood where applicable; and finishes with association dues from the current budget, not the listing. Our mortgage payment calculator is built to hold all of these lines, and the affordability calculator works the same math backward from your income.",
          "If any single line is uncertain — insurance on an older roof, a condo association mid-assessment — get the real number before you commit. In Florida, the letters after P and I are where budgets are won or lost."
        ]
      }
    ],
    faqs: [
      {
        question: "Is PITI the same as my total monthly housing cost?",
        answer:
          "Close, but not always. PITI covers principal, interest, taxes, and insurance. In Florida you often need to add HOA or condo dues, and sometimes separate wind and flood policies, to reach your true monthly cost. Lenders count all of these when qualifying you."
      },
      {
        question: "Why did my payment go up if I have a fixed-rate mortgage?",
        answer:
          "A fixed rate locks the principal-and-interest portion only. If your property taxes or insurance premiums rise, your escrow payment rises at the next annual escrow analysis, which increases the total monthly payment even though the loan terms never changed."
      },
      {
        question: "Is flood insurance included in homeowners insurance?",
        answer:
          "No. Flood damage is excluded from standard homeowners policies. Flood coverage is a separate policy, usually through the National Flood Insurance Program or a private flood insurer, and it is required when a federally backed loan is secured by a home in a FEMA-designated Special Flood Hazard Area."
      },
      {
        question: "Do HOA dues count against my qualification?",
        answer:
          "Yes. Association dues are part of your monthly housing expense for debt-to-income purposes, even though they are paid to the association rather than through escrow. High dues reduce the loan size you qualify for, dollar for dollar in the ratio math."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is an escrow or impound account?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-an-escrow-or-impound-account-en-140/"
      },
      {
        publisher: "FEMA / National Flood Insurance Program",
        title: "FloodSmart — the National Flood Insurance Program",
        url: "https://www.floodsmart.gov/"
      },
      {
        publisher: "Citizens Property Insurance Corporation",
        title: "Citizens Property Insurance Corporation (Florida)",
        url: "https://www.citizensfla.com/"
      }
    ],
    related: [
      { href: "/calculators/mortgage-payment", label: "Mortgage payment calculator" },
      { href: "/calculators/affordability", label: "Affordability calculator" },
      { href: "/resources/ltv-explained", label: "Loan-to-value (LTV), explained" },
      { href: "/mortgage/condo", label: "Florida condo loans" }
    ],
    publishedAt: PUBLISHED,
    lastReviewed: REVIEWED
  },
  {
    slug: "apr-vs-interest-rate",
    category: "basics",
    title: "APR vs Interest Rate: What the Difference Really Means",
    description:
      "The interest rate prices the loan; APR folds in points and certain fees. Learn what APR includes, when it misleads, and how to compare offers properly.",
    h1: "APR vs. interest rate: what each number tells you, and when APR misleads",
    answerSummary:
      "The interest rate is the annual cost of borrowing the principal, and it sets your monthly payment. APR — annual percentage rate — expresses the rate plus points, origination charges, and certain other loan costs as one yearly figure, so it runs higher. APR helps compare total cost across similar offers, but it assumes you keep the loan to maturity, which misleads borrowers who sell or refinance early.",
    sections: [
      {
        heading: "Two numbers, two jobs",
        paragraphs: [
          "The interest rate does one job: it sets how interest accrues on your balance, and with the term it fixes your principal-and-interest payment. It says nothing about what the loan cost you to obtain.",
          "APR does a different job. Under the Truth in Lending Act, lenders must disclose an annual percentage rate that folds the interest rate together with points, origination fees, mortgage broker fees, and certain other finance charges into one annualized figure. The CFPB's definition is compact: the interest rate is the cost to borrow the money each year; the APR reflects that rate plus the other charges of getting the loan. Because APR includes costs the rate ignores, APR is higher than the rate on almost every real loan — if the two are equal, the loan carried essentially no financed costs.",
          "The gap between the two numbers is itself information. Two offers can carry the same interest rate while one shows a noticeably higher APR: that loan is charging more to originate — more points, more fees — for the same monthly payment. Conversely, an offer whose rate is lower but whose APR is higher than a competitor's is telling you the attractive rate was purchased with upfront money. Reading rate and APR as a pair, rather than fixating on either, is the fastest sanity check available before you ever open the fee itemization."
        ]
      },
      {
        heading: "What APR includes — and what it leaves out",
        paragraphs: [
          "APR generally captures the charges paid to obtain credit: discount points, origination charges, underwriting and processing fees, mortgage insurance, and most lender-side costs. It generally excludes charges you would owe regardless of financing, such as title insurance premiums, recording fees, and — importantly for Florida — property taxes, homeowners, wind, and flood insurance. Two loans with identical APRs can therefore sit inside transactions with very different cash-to-close numbers.",
          "The place all of this is standardized is the Loan Estimate, the three-page disclosure every mortgage applicant receives within three business days of applying. Page 3 shows the APR alongside two companions that are often more useful: total interest percentage, and the 'in five years' figure showing total dollars paid in the first five years. Comparing those line items across Loan Estimates is the honest version of rate shopping."
        ]
      },
      {
        heading: "When APR misleads: the short-hold problem",
        paragraphs: [
          "APR's central assumption is that you keep the loan for its full term. Upfront costs are spread across the entire schedule, so a loan with heavy points and a low rate shows a flattering APR over a full amortization. But most mortgages do not live that long — homes sell, loans refinance. If you keep the loan only a few years, upfront costs are spread over a short window in reality, and the loan that looked cheaper by APR can easily be the more expensive one you actually experienced.",
          "The practical rule: the shorter your expected hold, the less APR should drive your decision, and the more you should favor low upfront cost even at a somewhat higher rate. The longer your expected hold, the more paying upfront for a lower rate can earn its keep. APR quietly assumes the longest possible hold, which is why it flatters point-heavy offers.",
          "APR is also less informative on adjustable-rate mortgages, where the disclosed figure rests on assumptions about future index values that no one can promise, and on loans you plan to pay down aggressively, which shortens the effective hold the same way a sale does."
        ]
      },
      {
        heading: "How to actually compare offers",
        paragraphs: [
          "Get Loan Estimates for the same loan type, term, and rate-lock period, generated in the same narrow time window — pricing moves day to day, so quotes from different days are not comparable. Then read them side by side. Focus on two lines: the interest rate, which sets your payment, and the origination charges in Section A of page 2, which are the cost of obtaining that rate from that lender. Third-party costs like appraisal and title will appear on every estimate and largely wash out of the comparison; the loan costs are where offers genuinely differ.",
          "Be equally careful about what is not a Loan Estimate. Rate advertisements, prequalification worksheets, and emailed quotes carry no accountability — an advertised rate may assume a pristine credit profile, a low loan-to-value ratio, and points that are only mentioned in a footnote. The Loan Estimate exists precisely because informal quotes were unauditable; insist on it before treating any number as an offer.",
          "TRACT's role as a broker is exactly this comparison: we shop your one file across multiple wholesale lenders and put the resulting offers next to each other on equal assumptions. We arrange the loan; the lender prices and makes it — which is why insisting on comparable disclosures, rather than a single quoted rate, is the discipline that protects you."
        ],
        bullets: [
          "Match the assumptions: same program, same term, same lock period, same day",
          "Compare interest rate and total loan costs (Loan Estimate, section D) separately, not blended",
          "Use the five-year cost figure on page 3 as a mid-horizon tiebreaker",
          "Ask what the rate would be at zero points, so you can see the pricing tradeoff cleanly",
          "Treat APR as a cross-check for long holds, not the headline"
        ]
      },
      {
        heading: "The bottom line",
        paragraphs: [
          "Neither number is 'the truth' alone. The interest rate tells you the payment; the APR tells you the cost of the loan if you keep it forever; the Loan Estimate tells you everything in between. Decide your likely hold period first, then let that horizon pick which number matters most. A refinance break-even calculation applies the same logic whenever you are weighing upfront cost against monthly savings."
        ]
      }
    ],
    faqs: [
      {
        question: "Why is the APR higher than the interest rate?",
        answer:
          "Because APR adds the cost of obtaining the loan — points, origination and certain other finance charges — on top of the interest rate, then expresses the combined total as one annual rate. A meaningfully higher APR relative to the rate signals heavier upfront loan costs."
      },
      {
        question: "Is the loan with the lower APR always the better deal?",
        answer:
          "No. APR assumes you hold the loan to maturity. If you are likely to sell or refinance within a few years, a loan with a lower APR but higher upfront costs can cost you more in practice than a higher-APR loan with minimal fees. Match the comparison to your expected time in the loan."
      },
      {
        question: "Does APR include property taxes and homeowners insurance?",
        answer:
          "No. APR reflects the cost of the credit itself. Property taxes, homeowners insurance, flood and wind premiums, and HOA dues sit outside APR entirely, which is why a Florida payment can be far larger than any APR-based mental math suggests."
      },
      {
        question: "What document should I use to compare mortgage offers?",
        answer:
          "The Loan Estimate. It is standardized across all lenders, itemizes loan costs in fixed sections, and includes comparison figures — APR, total interest percentage, and five-year cost — designed specifically for side-by-side shopping."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is the difference between a mortgage interest rate and an APR?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-mortgage-interest-rate-and-an-apr-en-135/"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "Loan Estimate Explainer",
        url: "https://www.consumerfinance.gov/owning-a-home/loan-estimate/"
      }
    ],
    related: [
      { href: "/resources/discount-points-explained", label: "Discount points, explained" },
      { href: "/calculators/refinance-break-even", label: "Refinance break-even calculator" },
      { href: "/resources/rate-lock-explained", label: "Rate locks, explained" },
      { href: "/plan", label: "Build your mortgage plan" }
    ],
    publishedAt: PUBLISHED,
    lastReviewed: REVIEWED
  },
  {
    slug: "discount-points-explained",
    category: "basics",
    title: "Mortgage Discount Points: When Buying Down the Rate Works",
    description:
      "Discount points are prepaid interest that lower your rate. Break-even math tells you when points are a genuine investment and when they are a fee in costume.",
    h1: "Discount points: buying the rate down, and knowing when it is worth it",
    answerSummary:
      "Discount points are an upfront fee paid at closing to lower a mortgage's interest rate — prepaid interest, in effect. One point equals one percent of the loan amount. Points make sense when you keep the loan well past the break-even month, where accumulated monthly savings exceed the upfront cost; they work against you if you sell or refinance early. Always compare offers at the same point structure.",
    sections: [
      {
        heading: "What a point is",
        paragraphs: [
          "A discount point is a defined unit: one percent of the loan amount, paid at closing, in exchange for a reduction in the interest rate. Fractional points work the same way at proportional cost. The CFPB describes the trade plainly — points lower your interest rate in exchange for paying more at closing — and the reverse trade exists too: lender credits raise your rate in exchange for reduced closing costs. Rate and upfront cost sit on a single slider, and points and credits are simply names for moving along it in each direction.",
          "How much rate reduction one point buys is not fixed. It varies by lender, program, and market conditions, and it is not linear — the second point often buys less improvement than the first. The only way to know the trade on your file is to see the same lender's pricing at several point levels on the same day.",
          "Keep permanent points distinct from a temporary buydown. A temporary buydown — the structures often marketed as 2-1 or 1-0 — deposits money at closing to subsidize the payment for the first year or two, after which the full note rate applies for the rest of the term. It changes what you pay early; it does not change the loan. Discount points change the note rate itself, permanently. The two are priced differently, fit different situations, and are frequently confused in marketing, so make sure any quote states plainly which one it contains."
        ]
      },
      {
        heading: "Break-even thinking",
        paragraphs: [
          "The evaluation is one division. The points cost a known number of dollars at closing. The lower rate saves a known number of dollars each month. Upfront cost divided by monthly savings equals the break-even point in months. Keep the loan longer than that and the points were an investment with a real return; exit the loan sooner — by selling, refinancing, or paying it off — and you paid for years of rate reduction you never used.",
          "Break-even horizons on real quotes commonly land several years out, which is exactly why honest point analysis starts with your life plans rather than the pricing sheet. How long do you expect to own this home? How likely is a refinance if pricing improves? A first home you expect to outgrow argues against points; a long-term home with a rate you would happily keep for decades argues for them. Our refinance break-even calculator runs the identical math for any upfront-cost-versus-monthly-savings decision.",
          "Two refinements sharpen the picture. First, money spent on points is money not spent elsewhere — not in your emergency fund, not reducing the balance as a larger down payment — so the true comparison includes what else those dollars could do. Second, points may be tax-deductible as prepaid interest in some circumstances; the IRS sets the rules, and a tax professional, not a loan file, is the place to confirm how they apply to you."
        ]
      },
      {
        heading: "When points are a fee in costume",
        paragraphs: [
          "The legitimate version of points is a transparent trade you chose after seeing the zero-point price. The costumed version is a quote where points were included silently to make the rate look impressive — the advertised number gets the attention, and the cost that produced it lives in the fine print. Neither the rate nor the points are dishonest individually; presenting the rate without the cost is.",
          "The defense is procedural, not adversarial. Ask every lender for the same quote two ways: at zero points, and at your requested rate with the exact point cost stated in dollars. The Loan Estimate makes this auditable — points appear in Section A of page 2, in both percentage and dollar form, and they are one of the charges that generally cannot increase at closing absent a valid change of circumstance. If a quoted rate assumed points you were never told about, the Loan Estimate is where the costume comes off."
        ],
        bullets: [
          "Always ask for the zero-point rate as your baseline",
          "Get the point cost in dollars, not just 'a great rate'",
          "Compare offers at the same point structure — rate-to-rate comparisons across different point levels are meaningless",
          "Run the break-even against your realistic hold period, not the loan term"
        ]
      },
      {
        heading: "Points on a purchase vs. a refinance",
        paragraphs: [
          "On a purchase, points compete with your down payment and reserves for the same closing-table dollars, and sellers or builders sometimes offer credits that can fund a buydown — worth evaluating with the same break-even math, since a credit spent on points is a credit not spent on other closing costs. On a refinance, points raise the very cost hurdle the refinance must clear to make sense, so they demand a longer expected hold to justify themselves.",
          "There is also a portfolio-level consideration people miss: points concentrate your bet on the current pricing environment. If market pricing improves substantially after you buy points, the natural move — refinancing — is exactly the move that forfeits the unrecovered portion of what you paid. Borrowers who would refinance eagerly at the first opportunity should be structurally skeptical of points; borrowers at a rate they would keep through most plausible futures are the ones for whom points genuinely pay.",
          "As a broker, TRACT arranges loans across multiple wholesale lenders, which means we can show you the same rate-versus-points slider from several sources at once. We do not set the pricing — each lender does — but putting the structures side by side is precisely how a fee in costume gets recognized before you pay it."
        ]
      }
    ],
    faqs: [
      {
        question: "How much does one discount point cost?",
        answer:
          "One point costs one percent of the loan amount by definition — the dollar figure scales with your loan size. How much rate reduction that point buys varies by lender, loan program, and market conditions, and it is quoted on your specific file rather than fixed by any rule."
      },
      {
        question: "Are discount points ever refundable if I sell early?",
        answer:
          "No. Points are paid at closing and are not refunded if you exit the loan early. Selling or refinancing before your break-even point means the points cost more than the interest they saved, which is why your expected time in the loan is the deciding input."
      },
      {
        question: "Are mortgage points tax-deductible?",
        answer:
          "Sometimes. Points are prepaid interest and may be deductible, in the year paid or spread over the loan's life, depending on the loan purpose and IRS rules in effect. Confirm your situation with a tax professional rather than assuming the deduction."
      },
      {
        question: "What is the difference between discount points and origination points?",
        answer:
          "Discount points buy a lower interest rate. Origination charges compensate for making the loan and buy you nothing on the rate. Both appear in Section A of the Loan Estimate, which is why reading that section beats relying on the word 'points' alone."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What are discount points and lender credits and how do they work?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-are-discount-points-and-lender-credits-and-how-do-they-work-en-136/"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "Loan Estimate Explainer",
        url: "https://www.consumerfinance.gov/owning-a-home/loan-estimate/"
      }
    ],
    related: [
      { href: "/calculators/refinance-break-even", label: "Break-even calculator" },
      { href: "/resources/apr-vs-interest-rate", label: "APR vs. interest rate" },
      { href: "/calculators/rate-impact", label: "Rate impact calculator" },
      { href: "/contact", label: "Talk through a pricing decision" }
    ],
    publishedAt: PUBLISHED,
    lastReviewed: REVIEWED
  },
  {
    slug: "rate-lock-explained",
    category: "basics",
    title: "What Is a Mortgage Rate Lock? Periods, Extensions, Risk",
    description:
      "A rate lock freezes your quoted rate for a set period while your loan closes. Learn lock periods, extensions, float-downs, and how to avoid expiration risk.",
    h1: "Rate locks: what they are, how long they last, and where the risk hides",
    answerSummary:
      "A rate lock is a lender's commitment that your quoted interest rate will not change between the lock date and closing, provided you close within the period and your application stays the same. Locks typically run in windows on the order of 30 to 60 days, longer for a cost. Extensions past expiration usually cost money, so aligning the lock period with a realistic closing date is the real skill.",
    sections: [
      {
        heading: "What a lock actually promises",
        paragraphs: [
          "Between application and closing, market pricing moves daily. A rate lock takes that risk off your shoulders for a defined window: the lender commits that the locked rate and points will carry through to closing. The CFPB's description captures both the promise and its conditions — the rate holds if you close within the period and nothing material changes on your application.",
          "That second condition matters as much as the first. A lock freezes the price of a specific deal: your credit profile, the property, the appraised value, the loan amount, the program, the documented income. Change an ingredient — the appraisal comes in low, the loan amount shifts, a credit score drops before closing — and the lender can reprice to match the new deal. A lock is not immunity from your own file; it is immunity from the market.",
          "Your lock terms appear on page 1 of the Loan Estimate: whether the rate is locked, and until what date and time. If that box says the rate is floating, you do not have a lock, no matter what was said on the phone. Ask for written lock confirmation the day you lock, and check three fields: the rate, the points at that rate, and the expiration date. A lock is a contract, and contracts are read, not assumed.",
          "Note what a lock does not cover: it freezes the loan's pricing, not the transaction's other moving parts. Appraisal turn times, insurance placement, association approvals, and the other party's readiness all live outside the lock — which is why the lock decision is inseparable from the calendar management around it."
        ]
      },
      {
        heading: "Lock periods, and pricing the calendar",
        paragraphs: [
          "Locks are sold in standard windows — commonly on the order of 30, 45, or 60 days, with longer locks available for new construction and slower transactions. Longer windows cost more, either in rate or in fees, because the lender is absorbing more market risk. That creates a genuine optimization: a lock longer than you need overpays for insurance, while a lock shorter than your real timeline sets up an extension fee later.",
          "The right answer comes from the contract, not from optimism. Count from lock date to the closing date in your purchase contract, then add margin for the predictable frictions — appraisal scheduling, condo association documents, insurance placement. Florida transactions carry some distinctive timeline risks worth pricing in: condo and association document review, wind and flood insurance placement during storm season, and the possibility that a named storm pauses closings while insurers suspend binding new coverage. A lock that expires two days before a storm-delayed closing is an expensive lesson."
        ]
      },
      {
        heading: "Extensions, expirations, and float-downs",
        paragraphs: [
          "If closing slips past the lock date, most lenders offer paid extensions in small increments, priced per day or per block of days. Who pays depends on why the delay happened and what was negotiated — sometimes the lender absorbs a delay it caused. If the lock fully expires, relocking generally happens at the worse of current pricing or your old pricing, which is exactly the outcome the lock existed to prevent.",
          "A float-down is a separate feature some lenders offer, at a cost or by policy: if market pricing improves meaningfully after you lock, you can reset to a better rate once under defined conditions — typically requiring an improvement beyond some threshold. It is worth asking about before you lock, because it changes the psychology: with no float-down, locking is a one-way door, and borrowers sometimes float dangerously long waiting for a bottom no one can call. A lock is bought certainty. Treat the decision as budgeting, not market timing."
        ],
        bullets: [
          "Extensions: available but priced — small delays are affordable, expirations are not",
          "Expiration: relock risk at current market, potentially worse than your original terms",
          "Float-down: optional, lender-specific, usually conditional on a meaningful market improvement",
          "Change of circumstances: a lock does not survive material changes to the application"
        ]
      },
      {
        heading: "When to lock",
        paragraphs: [
          "There is no reliable way to time the market, so the defensible framework is personal: lock when you have a rate at which the deal works for your budget and an accurate view of your closing timeline. Locking early buys certainty for the entire escrow period; floating chases improvement while carrying the risk of the opposite. Borrowers who cannot afford the payment at a worse rate have no business floating — the downside is a deal that dies, and that asymmetry is the whole analysis.",
          "Refinances deserve one extra note: with no purchase contract forcing a date, refinance timelines drift, and drifting is how refinance locks expire. Decide your acceptable pricing before you apply, lock when it appears, and then treat the closing like it has a contract deadline even though it does not. A refinance that saves money at the locked terms and then leaks it back through extension fees has defeated its own purpose.",
          "TRACT's role is the mechanics: as a broker, we arrange your loan and lock your rate with the wholesale lender you choose — we do not set the pricing behind the lock. What we control is matching the lock period to the real calendar, monitoring the expiration date, and raising extensions before they become emergencies. Rate locks fail far more often on logistics than on markets."
        ]
      }
    ],
    faqs: [
      {
        question: "Does a rate lock cost money?",
        answer:
          "Standard-length locks are typically built into the pricing rather than charged as a separate fee. Longer lock periods, extensions, and float-down features generally do carry a cost, in fees or in slightly different pricing, because the lender takes on more market risk."
      },
      {
        question: "What happens if my rate lock expires before closing?",
        answer:
          "You will usually need to pay for an extension or relock the loan, and relocking commonly lands at the less favorable of your old pricing and today's pricing. The practical defense is choosing a lock period with margin beyond your contract closing date and tracking the expiration actively."
      },
      {
        question: "Can my locked rate change anyway?",
        answer:
          "Yes, if the deal itself changes. A lock holds the market still, not your application. A different loan amount, a low appraisal, a credit change, or a program switch lets the lender reprice to match the new facts. Keep your file stable between lock and closing."
      },
      {
        question: "Should I float and wait for better pricing?",
        answer:
          "Only if you could genuinely accept the payment at worse pricing too. Floating is a two-sided bet, and no one can call the market's direction over your escrow window. If the locked rate makes the deal work, most borrowers are better served by certainty than by the chase."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What's a lock-in or a rate lock on a mortgage?",
        url: "https://www.consumerfinance.gov/ask-cfpb/whats-a-lock-in-or-a-rate-lock-on-a-mortgage-en-143/"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "Loan Estimate Explainer",
        url: "https://www.consumerfinance.gov/owning-a-home/loan-estimate/"
      }
    ],
    related: [
      { href: "/resources/apr-vs-interest-rate", label: "APR vs. interest rate" },
      { href: "/mortgage/purchase", label: "Purchase loans" },
      { href: "/plan", label: "Build your mortgage plan" },
      { href: "/resources/how-mortgage-brokers-work", label: "How mortgage brokers work" }
    ],
    publishedAt: PUBLISHED,
    lastReviewed: REVIEWED
  },
  {
    slug: "amortization-explained",
    category: "basics",
    title: "Mortgage Amortization: Why Early Payments Favor Interest",
    description:
      "Amortization is the schedule that retires your mortgage. See why early payments are mostly interest and how extra principal payments bend the whole curve.",
    h1: "Amortization: why your early payments are mostly interest, and how to bend the curve",
    answerSummary:
      "Amortization is the schedule by which a mortgage is repaid in equal installments, each split between interest and principal. Interest is charged on the remaining balance, so early payments — when the balance is largest — are mostly interest, and the split shifts toward principal over time. Extra principal payments shrink the balance ahead of schedule, cutting total interest and shortening the loan without changing the required payment.",
    sections: [
      {
        heading: "The machine behind the payment",
        paragraphs: [
          "A fully amortizing fixed-rate mortgage is engineered around one constraint: the same payment every month, sized so the final payment retires the balance exactly at the end of the term. Each month, interest is computed on the remaining balance; the payment covers that interest first, and whatever is left over reduces principal.",
          "That ordering explains everything people find strange about their statements. In month one the balance is at its maximum, so the interest charge is at its maximum, so the principal portion is at its minimum. Every payment lowers the balance slightly, which lowers the next month's interest charge, which frees a slightly larger slice for principal. The CFPB's description of paying down a mortgage is exactly this: part of each payment pays interest, part pays principal, and the principal share grows over time as the balance falls.",
          "The result is the famous curve. Equity built from loan paydown accrues slowly in the early years and accelerates late. On long terms, the crossover month — where a payment finally contains more principal than interest — arrives many years in. This is not a lender trick; it is arithmetic on a declining balance. But it has real consequences for anyone deciding how long to keep a loan."
        ]
      },
      {
        heading: "Term length changes the shape",
        paragraphs: [
          "Stretching the same balance over a longer term lowers the required payment but tilts each payment further toward interest and delays the crossover. Shorter terms invert the trade: higher payments, faster principal, dramatically less total interest. Neither is universally right — the shorter term's higher required payment is a hard obligation, while a longer term with voluntary extra payments can approximate the same interest savings while preserving flexibility.",
          "This is also why the early-mostly-interest fact matters for short holds. Sell or refinance a few years into a long term and you will have paid substantial interest while retiring little principal; your equity at that point comes mostly from your down payment and price appreciation, not from the schedule. Amortization rewards time in the loan.",
          "Refinancing has an amortization cost people rarely price: a new loan restarts the clock. Refinance a loan that is several years old into a fresh full-length term and your payments return to the steep, interest-heavy end of the curve — even at improved pricing, part of the monthly saving is an illusion created by stretching the remaining balance over more years. Comparing a refinance honestly means matching the new term to your remaining term, or at least computing total remaining interest both ways rather than comparing payments alone."
        ]
      },
      {
        heading: "How extra principal bends the curve",
        paragraphs: [
          "An extra payment marked 'apply to principal' does not change your required payment or your due date. It does something quieter and more powerful: it shrinks the balance on which every future month's interest is computed. Each subsequent payment then contains less interest and more principal than the original schedule called for, and the effect compounds monthly until the loan ends early.",
          "Timing matters. A dollar of extra principal in year two kills more future interest than the same dollar in year twenty-two, because it has more months of compounding left to work through. Small, regular extra payments early in a loan punch far above their weight; our amortization calculator will show the full schedule with and without them, including the new payoff date and total interest saved.",
          "Biweekly payment schemes are the packaged version of this idea: paying half the monthly amount every two weeks produces twenty-six half-payments a year — the equivalent of thirteen monthly payments instead of twelve — and that one extra annual payment shortens the loan meaningfully. You do not need a paid program to get the effect; dividing one monthly payment by twelve and adding that amount to each month's payment as extra principal achieves the same result without fees or third-party enrollment.",
          "Mechanics worth knowing: confirm the servicer applies extras to principal rather than holding them as a prepayment of the next installment, and check your loan for any prepayment penalty — most standard loans have none, but the note is the authority. Extra principal also does not lower your required monthly payment; the schedule ends sooner instead. A recast — where the lender re-amortizes the reduced balance over the remaining term for a lower payment — is a separate, lender-specific option."
        ],
        bullets: [
          "Extra principal reduces every future interest charge, not just one month's",
          "Earlier dollars save more than later dollars",
          "The required payment stays the same; the loan just ends sooner",
          "Verify application to principal on your statement, and check the note for prepayment terms"
        ]
      },
      {
        heading: "The exceptions: loans that do not amortize this way",
        paragraphs: [
          "Not every mortgage follows the clean curve. Interest-only periods pay no principal at all, so the balance stands still until the interest-only window ends. Negative amortization — rare in today's mainstream market — occurs when a payment does not even cover the month's interest, so the shortfall is added to the balance and the debt grows despite payments being made. Adjustable-rate loans re-amortize at each rate adjustment, recalculating the payment to retire the current balance over the remaining term at the new rate.",
          "Knowing which machine your loan runs on is the point of reading the note. As a broker, TRACT arranges loans and walks through exactly this mechanics conversation before you commit — the payment number matters, but the schedule behind it determines what you actually pay over the years you hold the loan."
        ]
      }
    ],
    faqs: [
      {
        question: "Why is so much of my payment going to interest?",
        answer:
          "Because interest is charged on your remaining balance, and early in a loan the balance is near its peak. As payments gradually reduce the balance, the interest portion of each payment shrinks and the principal portion grows. The split is set by arithmetic, not by lender discretion."
      },
      {
        question: "Do extra payments lower my monthly payment?",
        answer:
          "Not by default. Extra principal shortens the loan and reduces total interest, but the required payment stays the same. Lowering the payment on the same loan requires a recast, where the servicer re-amortizes the reduced balance over the remaining term, or a refinance into a new loan."
      },
      {
        question: "Is it better to pay extra principal or to shorten my loan term?",
        answer:
          "A shorter term locks in the discipline and typically carries different pricing, but the higher payment is mandatory. Voluntary extra principal on a longer term achieves similar interest savings with flexibility to stop in a tight month. The right choice depends on how much you value the flexibility versus the commitment."
      },
      {
        question: "What is negative amortization?",
        answer:
          "A situation where the payment is smaller than the interest accruing, so the unpaid interest is added to the loan balance and the debt grows even though payments are being made. It is uncommon in mainstream mortgages today, but any loan with payment options or deferral features deserves a careful read for it."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "How does paying down a mortgage work?",
        url: "https://www.consumerfinance.gov/ask-cfpb/how-does-paying-down-a-mortgage-work-en-1943/"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is negative amortization?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-negative-amortization-en-103/"
      }
    ],
    related: [
      { href: "/calculators/amortization", label: "Amortization calculator" },
      { href: "/calculators/mortgage-payment", label: "Mortgage payment calculator" },
      { href: "/resources/fixed-vs-arm", label: "Fixed vs. ARM" },
      { href: "/mortgage/refinance", label: "Refinance options" }
    ],
    publishedAt: PUBLISHED,
    lastReviewed: REVIEWED
  },
  {
    slug: "ltv-explained",
    category: "basics",
    title: "What Is LTV? Loan-to-Value, Pricing, and Mortgage Insurance",
    description:
      "Loan-to-value compares your loan to the property's value. LTV drives pricing and mortgage insurance, and combined LTV adds second liens to the picture.",
    h1: "Loan-to-value (LTV): the ratio that drives your pricing and your mortgage insurance",
    answerSummary:
      "Loan-to-value, or LTV, is the loan amount divided by the property's value — the lower of price or appraised value on a purchase, the appraised value on a refinance. LTV measures the lender's cushion if the home must be sold, so higher LTV generally means higher pricing and, on conventional loans above 80 percent, private mortgage insurance. Combined LTV adds second mortgages and HELOCs to the ratio.",
    sections: [
      {
        heading: "The definition, precisely",
        paragraphs: [
          "LTV is a fraction: the mortgage amount over the property's value, expressed as a percentage. The value in the denominator is not whichever number is convenient — on a purchase, lenders use the lower of the contract price and the appraised value; on a refinance, the appraisal carries the weight alone. The CFPB defines it as the measure comparing the amount you are financing against the value of the property securing the loan.",
          "The complement of LTV is your equity. A lower LTV means you hold more of the property's value and the lender is exposed to less of it. That single number summarizes, better than almost any other, how protected the lender is if the loan goes wrong and the property must be sold to recover it — which is why so much of mortgage pricing and program eligibility keys off it.",
          "One consequence of the lower-of rule surprises buyers: a low appraisal raises your effective LTV even though your down payment did not change, because the denominator shrank. That can change your pricing, your mortgage insurance, or the deal itself — and it is why appraisal contingencies exist."
        ]
      },
      {
        heading: "Why LTV drives pricing",
        paragraphs: [
          "Lenders price risk, and LTV is a primary risk axis. At low LTV, a market downturn still leaves the property worth more than the debt; at high LTV, a modest decline puts the loan underwater. Conventional pricing reflects this through loan-level price adjustments that vary with LTV and credit score in combination — the same borrower can see meaningfully different pricing at different down payment levels, and the steps are not smooth: crossing certain LTV thresholds moves you between pricing tiers.",
          "This is why a broker models your scenario at multiple down payment levels rather than assuming more down is always proportionally better. Sometimes a small additional amount down crosses a tier boundary and improves pricing noticeably; sometimes it buys almost nothing. TRACT arranges loans across multiple wholesale lenders and does not set these adjustments — each lender and the agency grids do — but knowing where the tier lines sit is exactly the kind of structuring a broker exists to do.",
          "LTV also gates what kinds of transactions are available at all. Cash-out refinances carry lower maximum LTVs than rate-and-term refinances; investment properties and second homes carry lower maximums than primary residences; and some programs at the highest LTVs add requirements — reserves, homebuyer education, pricing overlays — that vanish a few points lower. The ratio is not just a price dial; it is a gate that opens and closes entire options."
        ]
      },
      {
        heading: "LTV and mortgage insurance",
        paragraphs: [
          "On conventional loans, the well-known threshold is 80 percent. Finance more than 80 percent of the value and the lender will generally require private mortgage insurance, which protects the lender — not you — if the loan defaults. PMI cost varies with LTV, credit score, and other factors, and it is not permanent: under the Homeowners Protection Act you can request cancellation when the balance reaches 80 percent of the original value, and servicers must terminate it automatically at 78 percent for loans in good standing, as the CFPB outlines.",
          "Government-backed programs run different machinery worth naming precisely: FHA loans carry their own mortgage insurance premiums with their own duration rules regardless of a conventional-style 80 percent line, and VA loans carry no monthly mortgage insurance at all, substituting an upfront funding fee for most borrowers. The 80 percent rule is a conventional-loan fact, not a law of nature."
        ]
      },
      {
        heading: "Combined LTV: when second liens join the math",
        paragraphs: [
          "Add a second mortgage or a home equity line of credit and the lender computes combined LTV — all liens together, divided by the value. A first mortgage at a comfortable LTV can sit inside a much less comfortable CLTV once a HELOC is drawn against the same property. Programs set separate maximums for LTV and CLTV, and for lines of credit some lenders also look at HCLTV, which counts the full credit limit rather than the drawn balance.",
          "CLTV appears in real decisions more often than the acronym suggests: piggyback structures that split financing between a first and second loan to manage the first mortgage's LTV, cash-out refinances that must fit within program LTV caps, and later home-equity borrowing that is limited by the CLTV headroom your first mortgage left behind."
        ],
        bullets: [
          "LTV: first mortgage ÷ property value",
          "CLTV: all mortgage liens ÷ property value",
          "HCLTV: liens counting full line limits ÷ property value",
          "Each program sets its own maximums for these ratios"
        ]
      },
      {
        heading: "Managing your LTV",
        paragraphs: [
          "Your levers are the numerator and the denominator. Down payment size sets your starting LTV; amortization and extra principal payments lower it over time; and appreciation lowers it without your help, though only an appraisal or valuation the lender accepts makes appreciation official for purposes like PMI removal. Before choosing a down payment, it is worth mapping where the pricing tiers and the mortgage insurance line sit for your scenario — our affordability and mortgage payment calculators frame the tradeoff, and a conversation can pin down the tier boundaries for your actual file.",
          "A Florida-specific footnote: LTV measures the loan against the property's value, not against your total monthly cost. Two properties at identical prices and identical LTVs can carry wildly different insurance and association expenses, so a strong LTV does not by itself mean a comfortable loan. Underwriting will check both — the ratio for collateral risk, and your debt-to-income for payment risk — and a well-structured Florida file respects both constraints from the first conversation."
        ]
      }
    ],
    faqs: [
      {
        question: "What is a good LTV?",
        answer:
          "Lower is stronger, but the meaningful lines are structural: 80 percent LTV is where conventional loans generally require private mortgage insurance, and pricing improves in steps as LTV falls through the tiers lenders use. Many programs allow much higher LTVs — the ratio affects cost and requirements more than simple approval."
      },
      {
        question: "Does the appraisal change my LTV?",
        answer:
          "Yes. On a purchase, lenders use the lower of price and appraised value, so a low appraisal raises your effective LTV without your down payment changing. On a refinance, the appraisal is the denominator outright, which makes it the single most important number in the transaction."
      },
      {
        question: "How do I get rid of PMI?",
        answer:
          "For conventional loans, the Homeowners Protection Act lets you request cancellation when your balance reaches 80 percent of the home's original value, subject to conditions like a good payment history, and requires automatic termination at 78 percent for loans in good standing. FHA mortgage insurance follows its own rules and often persists regardless of LTV, which is a common reason borrowers later refinance."
      },
      {
        question: "What is the difference between LTV and CLTV?",
        answer:
          "LTV counts only the first mortgage against the property's value. CLTV counts every mortgage lien — first, second, and home equity lines — against the same value. A lender evaluating a second lien or a HELOC will underwrite to CLTV limits, not just the first mortgage's LTV."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is a loan-to-value ratio and how does it relate to my costs?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-loan-to-value-ratio-and-how-does-it-relate-to-my-costs-en-121/"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is private mortgage insurance?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-private-mortgage-insurance-en-122/"
      }
    ],
    related: [
      { href: "/calculators/affordability", label: "Affordability calculator" },
      { href: "/resources/what-is-piti", label: "What is PITI?" },
      { href: "/mortgage/conventional", label: "Conventional loans" },
      { href: "/mortgage/fha", label: "FHA loans" }
    ],
    publishedAt: PUBLISHED,
    lastReviewed: REVIEWED
  },
  {
    slug: "title-insurance-florida",
    category: "basics",
    title: "Title Insurance in Florida: Owner's vs Lender's Policies",
    description:
      "Owner's title insurance protects your equity; lender's protects the loan. What a Florida title search finds, and why who pays varies by county custom.",
    h1: "Title insurance in Florida: owner's vs. lender's policies, and who customarily pays",
    answerSummary:
      "Title insurance protects against defects in a property's ownership history — forged deeds, unknown heirs, undisclosed liens — discovered after purchase. A lender's policy, required on virtually every mortgage, protects only the loan balance. An owner's policy, optional but strongly recommended, protects the buyer's equity for as long as they own the home. In Florida, who customarily pays for the owner's policy varies by county and is negotiable.",
    sections: [
      {
        heading: "What title insurance is — and how it differs from other insurance",
        paragraphs: [
          "Most insurance looks forward: it covers bad events that have not happened yet. Title insurance looks backward. It covers defects that already exist in the chain of ownership — a forged signature on a decades-old deed, an heir who never signed off on a sale, a contractor's lien that never got released, an error in the public records — that surface after you own the home. You pay a single premium at closing, and coverage lasts as long as the insured interest exists.",
          "Two distinct policies travel together at a closing. The lender's policy protects the lender, up to the loan balance, and virtually every mortgage requires one; as the CFPB notes, it protects the lender's security interest, not your equity. The owner's policy protects you — your down payment and your growing equity — and it is optional. Declining it means that if a covered defect emerges, the lender's exposure is insured and yours is not: you could satisfy the loan through the lender's coverage and still lose everything you had put into the home."
        ]
      },
      {
        heading: "What a title search actually finds",
        paragraphs: [
          "Before any policy issues, a title agent or attorney searches the public records: the chain of deeds, mortgages and their satisfactions, judgments and liens against past owners, probate records, easements, and restrictions. In Florida the search routinely surfaces items with local flavor — code enforcement liens from a past owner's violations, open or expired permits in some municipalities, homeowners association liens, and unpaid municipal utility balances that attach to the property.",
          "Most of what a search finds gets fixed before closing: liens are paid from seller proceeds, old mortgages are formally satisfied, estates are cleared. The policy exists for what the search cannot see — forgery, fraud, recording errors, missing heirs. Search and policy are complements: the search cures the visible defects, the insurance stands behind the invisible ones.",
          "Florida regulates the title industry at the state level: title insurers and agents are subject to Florida's insurance code, and title insurance contracts are governed by Part XIII of Chapter 627, Florida Statutes, with premium rates promulgated under state rule rather than set freely by each agent. What varies between title agents is therefore less the promulgated premium than the associated closing, search, and settlement fees — which are itemized on your Loan Estimate and Closing Disclosure and are fair game to compare."
        ]
      },
      {
        heading: "Who pays in Florida: custom, county by county",
        paragraphs: [
          "Florida has no statewide rule assigning the owner's title premium to buyer or seller — it is a matter of local custom and contract negotiation, and the custom genuinely varies by county. In much of the state, the seller customarily pays for the owner's policy and selects the title agent; in several counties — commonly including Miami-Dade and Broward — the buyer customarily pays and chooses. These are defaults people expect, not requirements: the purchase contract controls, and the standard Florida contract forms have checkboxes for exactly this allocation.",
          "Treat any statement about who pays as a starting point for negotiation rather than a fact about your deal. In a strong buyer's market, sellers absorb costs custom would assign to buyers, and vice versa. What matters is that the contract says clearly who pays for which policy and who selects the agent — and that you read the line items on your Closing Disclosure against what was negotiated. The buyer always retains the right to shop for their own title services where the buyer is paying; your Loan Estimate's list of services you can shop for makes that explicit."
        ]
      },
      {
        heading: "Practical guidance for Florida buyers",
        paragraphs: [
          "Buy the owner's policy. Against the scale of a home purchase, a one-time premium protecting your entire equity position for your whole period of ownership is among the better risk trades in the transaction — and unlike the lender's policy, no one will force you to make it. Ask about the simultaneous-issue rate: when owner's and lender's policies issue together at closing, the combined pricing is typically far better than buying either separately later.",
          "Ask whether a municipal lien search is being ordered alongside the title search. In Florida this separate search checks city and county records for unrecorded liabilities — open code enforcement cases, unpermitted work, utility balances — that a standard title search of recorded documents can miss, and standard policies may not cover. It is inexpensive relative to what it catches, and experienced Florida closers treat it as routine.",
          "Finally, guard the money itself. Wire fraud aimed at real estate closings is a persistent, well-documented threat: criminals impersonate title agents by email and redirect closing funds. Confirm wire instructions by phone using a number you obtained independently — never one from the wiring email — and be suspicious of any last-minute change to instructions. TRACT arranges the financing side of Florida closings and works alongside title agents daily; we do not sell title insurance, but we will make sure the title line items on your Loan Estimate are ones you have actually examined rather than merely initialed."
        ],
        bullets: [
          "Lender's policy: required, protects the loan balance only",
          "Owner's policy: optional, protects your equity for as long as you own",
          "Premiums: promulgated by state rule in Florida; agent fees vary and can be shopped",
          "Who pays: county custom sets the default; the contract sets the answer"
        ]
      }
    ],
    faqs: [
      {
        question: "Is owner's title insurance required in Florida?",
        answer:
          "No. Lenders require a lender's policy to protect the loan, but the owner's policy is the buyer's choice. Skipping it leaves your down payment and equity uninsured against title defects that surface later, which is why most Florida real estate professionals recommend buying it, typically at a discounted simultaneous-issue rate alongside the lender's policy."
      },
      {
        question: "Who pays for title insurance in Florida?",
        answer:
          "It varies by county custom and is always negotiable in the contract. In many Florida counties the seller customarily pays for the owner's policy and picks the title agent, while in several others — Miami-Dade and Broward are commonly cited — the buyer customarily pays. The purchase contract, not the custom, is what binds the parties."
      },
      {
        question: "How long does title insurance last?",
        answer:
          "An owner's policy lasts as long as you or your heirs hold an interest in the property, with the single premium paid at closing. A lender's policy lasts for the life of that specific loan, which is why a refinance requires a new lender's policy even though your owner's policy continues."
      },
      {
        question: "What does a title search find that insurance then covers?",
        answer:
          "The search finds recorded, curable items — liens, judgments, unsatisfied mortgages, probate gaps — which are typically resolved before closing. The insurance covers what no search can reliably detect: forgeries, fraud, recording errors, and unknown heirs. The two work together rather than substituting for each other."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is owner's title insurance?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-owners-title-insurance-en-164/"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is lender's title insurance?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-lenders-title-insurance-en-163/"
      },
      {
        publisher: "Florida Senate",
        title: "Florida Statutes, Chapter 627, Part XIII — Title Insurance Contracts",
        url: "https://www.flsenate.gov/Laws/Statutes/2024/Chapter627/Part_XIII"
      }
    ],
    related: [
      { href: "/calculators/closing-cost", label: "Closing cost calculator" },
      { href: "/locations/florida", label: "Florida mortgage lending" },
      { href: "/resources/what-is-piti", label: "What is PITI?" },
      { href: "/mortgage/purchase", label: "Purchase loans" }
    ],
    publishedAt: PUBLISHED,
    lastReviewed: REVIEWED
  },
  {
    slug: "mortgage-servicing-explained",
    category: "basics",
    title: "Mortgage Servicing: Why Loans Get Sold and Your Rights",
    description:
      "Your mortgage will probably change hands. What servicers do, why loans are sold, and the RESPA transfer rules — notices and grace periods — that protect you.",
    h1: "Mortgage servicing: your loan will probably be sold, and here is what protects you",
    answerSummary:
      "A mortgage servicer is the company that collects payments, manages escrow, and handles day-to-day administration of a loan — often not the lender that made it. Loans and servicing rights are bought and sold routinely, and federal RESPA rules protect borrowers through transfers: written notice from both servicers, unchanged loan terms, and a 60-day window in which payments sent to the old servicer cannot be treated as late.",
    sections: [
      {
        heading: "Lender, owner, servicer: three roles, often three companies",
        paragraphs: [
          "The company that originated your loan, the investor that owns it, and the servicer that administers it can be three different entities — and over a loan's life, usually are. Most conventional loans are sold into the secondary market, commonly to Fannie Mae or Freddie Mac, shortly after closing; that sale is what replenishes lending capital and keeps the 30-year fixed-rate mortgage widely available. Separately from who owns the debt, the right to service it — collect payments, manage escrow, answer your calls — is itself an asset that is bought and sold between servicing companies.",
          "The CFPB's definition is the practical one: your servicer is the company that sends your statements and handles the day-to-day management of the loan. It processes payments, administers the escrow account and pays your taxes and insurance from it, produces your annual statements, and manages options if you fall behind. You do not choose your servicer, and it can change more than once. What never changes with a transfer is the deal itself: your rate, payment, and loan terms are set by your note, and no sale or transfer alters them."
        ]
      },
      {
        heading: "Why loans change hands",
        paragraphs: [
          "Selling loans is how the mortgage market funds itself. A lender that kept every loan it made would run out of money to lend; selling the loan to investors recycles the capital into the next mortgage. Servicing rights trade for their own economics — servicers earn a fee from each loan they administer, and portfolios of those rights are valuable assets that companies buy, sell, and consolidate.",
          "None of this involves the borrower's consent, and none of it is a signal about you or your loan. A transfer is not a downgrade, a warning, or an opportunity for anyone to change your terms. It is logistics — but logistics with enough room for error that federal law wraps specific protections around the handoff."
        ]
      },
      {
        heading: "The transfer rules that protect you",
        paragraphs: [
          "The Real Estate Settlement Procedures Act and its implementing rule, Regulation X, govern servicing transfers. When servicing moves, you are entitled to written notice — the outgoing servicer generally must notify you at least 15 days before the effective date, and the incoming servicer no later than 15 days after, though the notices are often combined. The notices state the transfer date and the new servicer's contact and payment information.",
          "The most practically important protection is the 60-day grace window: for 60 days after the transfer, a payment sent on time to your old servicer may not be treated as late, and no late fee may be charged because the payment went to the wrong place mid-handoff. Regulation X also obligates servicers to maintain escrow disbursements — your taxes and insurance keep getting paid through the transition — and gives you formal channels, error-resolution and information requests, that a servicer must acknowledge and answer within defined timeframes if something goes wrong.",
          "These rules exist because handoffs are where paperwork gets lost. Autopay set up with the old servicer typically does not follow you; escrow histories occasionally transfer with errors; a payment made the week of the transfer can float between systems. The law assumes some of this will happen and makes sure you do not bear the cost."
        ],
        bullets: [
          "Written notice from both servicers around the transfer date",
          "60 days in which payments to the old servicer cannot be treated as late",
          "Loan terms are untouchable: rate, payment, and note terms do not change",
          "Escrow obligations continue through the transfer",
          "Formal error-resolution rights with servicer response deadlines under Regulation X"
        ]
      },
      {
        heading: "What to do when your loan transfers",
        paragraphs: [
          "Treat the transfer notice as a short checklist rather than junk mail. Verify the new servicer is genuine before redirecting money — transfer season is a favorite window for payment-redirection scams, so confirm using contact information from the official notice or your old servicer's website, not from an unexpected email. Re-establish autopay with the new servicer, confirm your escrow balance carried over intact, and keep records from the months surrounding the transfer: statements, confirmation numbers, and the notices themselves.",
          "Then watch the first two statements. If a payment goes missing or escrow looks wrong, invoke the formal process — a written error notice to the servicer triggers Regulation X deadlines that a phone call does not. And if a servicer fails its obligations, the CFPB accepts complaints and forwards them to the company with a required response.",
          "Florida borrowers have one extra transfer-season chore: insurance. If you switch homeowners, wind, or flood carriers — common in Florida's market — the new servicer needs the new policy details promptly, because a servicer that believes coverage lapsed can purchase force-placed insurance on your behalf, typically at a higher cost and with narrower protection than a policy you choose. Confirm after any transfer that your current carriers, policy numbers, and the servicer's mortgagee clause information all match.",
          "TRACT is a broker: we arrange loans through wholesale lenders and do not service them, so we have no stake in where your servicing lands. What we tell every closing client is the same — expect at least one transfer over the life of the loan, expect it to be uneventful, and know the 60-day rule so that if the handoff wobbles, you know the cost is not yours to absorb."
        ]
      }
    ],
    faqs: [
      {
        question: "Can my interest rate or payment change when my loan is sold?",
        answer:
          "No. A sale of the loan or a transfer of servicing changes who administers the loan, not the loan itself. Your rate, principal-and-interest payment, and note terms are fixed by your loan documents. The escrow portion of your payment can still change over time, but only because taxes or insurance changed — not because of the transfer."
      },
      {
        question: "What if I sent my payment to the old servicer after a transfer?",
        answer:
          "For 60 days after a servicing transfer, federal rules prohibit treating an on-time payment sent to the old servicer as late. The servicers are expected to route the payment correctly. Keep proof of the payment, and if a late fee appears anyway, dispute it in writing to trigger the servicer's formal error-resolution obligations."
      },
      {
        question: "Why did my mortgage get sold so soon after closing?",
        answer:
          "Because selling closed loans into the secondary market — often to Fannie Mae or Freddie Mac — is how lenders replenish the capital to make the next loan. It is routine, frequently happens within weeks of closing, and says nothing about you or the quality of your loan."
      },
      {
        question: "How do I find out who services my mortgage?",
        answer:
          "Your monthly statement names the servicer, and the notices sent at any transfer name the new one. If you are unsure, your most recent statement's payment address and phone number are the operative contact — and the CFPB provides guidance on identifying your servicer if records are unclear."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is a mortgage servicer?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-mortgage-servicer-en-198/"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "My loan was transferred to a new servicer. What do I need to do?",
        url: "https://www.consumerfinance.gov/ask-cfpb/my-loan-was-transferred-to-a-new-servicer-what-do-i-need-to-do-en-215/"
      },
      {
        publisher: "eCFR",
        title: "12 CFR Part 1024 — Real Estate Settlement Procedures Act (Regulation X)",
        url: "https://www.ecfr.gov/current/title-12/chapter-X/part-1024"
      }
    ],
    related: [
      { href: "/resources/what-is-piti", label: "What is PITI?" },
      { href: "/resources/how-mortgage-brokers-work", label: "How mortgage brokers work" },
      { href: "/mortgage/refinance", label: "Refinance options" },
      { href: "/contact", label: "Ask a question" }
    ],
    publishedAt: PUBLISHED,
    lastReviewed: REVIEWED
  },
  {
    slug: "fixed-vs-arm",
    category: "basics",
    title: "Fixed vs ARM: How Adjustable-Rate Mortgages Work Now",
    description:
      "Modern ARMs are built from an index, a margin, and caps. How today's adjustable-rate mortgages actually work, and who they genuinely fit — and who they don't.",
    h1: "Fixed vs. ARM: how adjustable-rate mortgages actually work now, and who they fit",
    answerSummary:
      "A fixed-rate mortgage keeps one interest rate for its entire term. An adjustable-rate mortgage starts with a fixed introductory period — commonly five, seven, or ten years — then adjusts periodically using a published index plus a fixed margin, with caps limiting the first adjustment, each later one, and lifetime movement. ARMs genuinely fit borrowers whose expected time in the loan is shorter than the fixed period.",
    sections: [
      {
        heading: "The fixed-rate baseline",
        paragraphs: [
          "A fixed-rate mortgage is the simplest financial product most people will ever own: one rate, one principal-and-interest payment, for the whole term. Its virtue is that all interest-rate risk sits with the lender and the investor — if market pricing rises for the next thirty years, your loan does not care, and if it falls, you can refinance. That one-way option is a large part of what you are paying for.",
          "The cost of that certainty is that the fixed rate on a long loan is typically priced above the introductory rate on an ARM in ordinary market conditions, though the relationship between the two varies with the yield curve and there have been periods when the gap was thin or absent. Whether the certainty is worth the price is precisely the fixed-versus-ARM question, and it cannot be answered without knowing how long you expect to keep the loan."
        ]
      },
      {
        heading: "The anatomy of a modern ARM: index, margin, caps",
        paragraphs: [
          "Today's typical ARM is a hybrid, described by two numbers like 5/6 or 7/6: a fixed period of five or seven years, then adjustments every six months for the remainder of the term. When the fixed period ends, the new rate is not chosen by anyone — it is computed. The lender takes a published index, most commonly SOFR-based since the industry's move away from LIBOR, and adds the margin: a fixed number of percentage points written into your note at closing that never changes. Index plus margin, rounded per the note, subject to the caps, is your new rate.",
          "The caps are the safety architecture, and the CFPB's breakdown matches what you will see in a note: an initial adjustment cap limiting the first reset, a subsequent (periodic) cap limiting each adjustment after that, and a lifetime cap limiting how far the rate can ever rise above the starting rate. Cap structures are quoted as a triple — the note spells out each number — and they differ across lenders and programs, which makes them a genuine comparison point rather than boilerplate. Many notes also set a floor, so the rate cannot fall without limit either.",
          "At each adjustment, the loan re-amortizes: the payment is recalculated to retire the remaining balance over the remaining term at the new rate. The worst-case arithmetic is knowable in advance — apply the caps to your starting rate and compute the payment at the maximums. A borrower who cannot absorb the fully-capped payment is not a borrower with a risk tolerance question; they are a borrower for whom the ARM is mispriced insurance."
        ],
        bullets: [
          "Index: a published market rate, commonly SOFR-based, that moves over time",
          "Margin: a fixed add-on set in your note — compare this across offers",
          "Initial / periodic / lifetime caps: the limits on each reset and on the loan overall",
          "Re-amortization: each adjustment recalculates the payment on the remaining balance and term"
        ]
      },
      {
        heading: "Who ARMs genuinely fit",
        paragraphs: [
          "The clean case is a hold shorter than the fixed period. A buyer confident they will sell within five years, a household with a known relocation horizon, a borrower planning a payoff event — for these, a 7/6 ARM's introductory pricing buys years of savings against a fixed rate they would never have used the tail of. The savings during the fixed period are certain; the adjustable years may never arrive.",
          "The honest caveat is that plans are probabilistic. People who intended to move stay; refinancing out of an ARM before the first reset depends on pricing and personal circumstances at that future date, and neither is promised. So the sturdier framing is capacity, not intention: an ARM fits when the fixed period covers your likely hold and your budget could absorb the capped worst case if life kept you in the loan. Jumbo borrowers meet this test more often than most, which is why ARMs are disproportionately common in jumbo lending.",
          "The mismatch case is equally clear. A buyer stretching to qualify, planning to stay indefinitely, with no slack for a higher payment, is holding risk they cannot afford to realize — the introductory savings are real, but they are compensation for carrying the adjustment risk, not free money."
        ]
      },
      {
        heading: "Choosing, concretely",
        paragraphs: [
          "Put a fixed offer and an ARM offer side by side and price three things: the payment difference during the fixed period, the worst-case payment after full adjustment under the caps, and your realistic probability of still holding the loan when the fixed period ends. The introductory savings times the fixed-period months is your certain gain; the capped payment is your bounded downside; your hold estimate weights them.",
          "Know also how you will be qualified. Lenders generally do not underwrite an ARM at its introductory rate alone — depending on the program, qualification runs at a higher figure, such as the note rate plus a cushion or the fully indexed rate. That protects you from a version of the old teaser-rate trap, but it also means an ARM does not necessarily stretch your buying power the way its lower initial payment suggests.",
          "TRACT arranges both fixed and adjustable loans across multiple wholesale lenders — we do not set the index, the margins, or the caps, but margins and cap structures differ between lenders on otherwise similar ARMs, and surfacing those differences is exactly what shopping a file means. Bring your timeline; the right structure usually falls out of it."
        ]
      }
    ],
    faqs: [
      {
        question: "What do the numbers in a 5/6 or 7/6 ARM mean?",
        answer:
          "The first number is the fixed period in years — five or seven years at the introductory rate. The second is the adjustment frequency after that, in months: a 6 means the rate resets every six months, computed as the current index value plus your note's fixed margin, subject to the caps."
      },
      {
        question: "How high can an ARM's rate actually go?",
        answer:
          "Your note answers this precisely. The initial cap limits the first adjustment, the periodic cap limits each one after, and the lifetime cap sets the ceiling above your starting rate. Compute the payment at the lifetime cap before signing — if that payment would break your budget, the ARM does not fit regardless of the introductory savings."
      },
      {
        question: "Can I refinance an ARM before it adjusts?",
        answer:
          "Often, yes — many ARM borrowers refinance or sell before the first reset. But refinancing depends on the pricing environment, your equity, and your qualification at that future moment, none of which are promised today. Sound ARM planning treats a future refinance as an option, not as the plan's foundation."
      },
      {
        question: "Are today's ARMs the same product that caused problems in 2008?",
        answer:
          "Structurally, no. The problem products of that era often combined teaser rates, negative amortization, and qualification at the introductory payment. Post-crisis rules require ability-to-repay underwriting, and mainstream ARMs today are fully amortizing hybrids with defined caps, qualified at conservative assumptions rather than at the teaser."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is an adjustable-rate mortgage?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-an-adjustable-rate-mortgage-en-100/"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "With an adjustable-rate mortgage (ARM), what are rate caps and how do they work?",
        url: "https://www.consumerfinance.gov/ask-cfpb/with-an-adjustable-rate-mortgage-arm-what-are-rate-caps-and-how-do-they-work-en-1951/"
      }
    ],
    related: [
      { href: "/resources/amortization-explained", label: "Amortization, explained" },
      { href: "/resources/rate-lock-explained", label: "Rate locks, explained" },
      { href: "/mortgage/jumbo", label: "Jumbo loans" },
      { href: "/calculators/mortgage-payment", label: "Mortgage payment calculator" }
    ],
    publishedAt: PUBLISHED,
    lastReviewed: REVIEWED
  },
  {
    slug: "how-mortgage-brokers-work",
    category: "basics",
    title: "How Mortgage Brokers Work: Broker vs Banker vs Lender",
    description:
      "Brokers arrange loans from many wholesale lenders; bankers and direct lenders fund their own. Who does what, how brokers are paid, and honest tradeoffs.",
    h1: "How mortgage brokers work: broker vs. banker vs. direct lender, honestly",
    answerSummary:
      "A mortgage broker arranges loans but does not lend: the broker takes one application, shops it across multiple wholesale lenders, and manages the file to closing, while the lender underwrites and funds the loan. Mortgage bankers and direct lenders fund loans themselves. Brokers are compensated by either the lender or the borrower — never both on one loan — under federal rules barring compensation tied to loan terms.",
    sections: [
      {
        heading: "Three channels, and who actually does what",
        paragraphs: [
          "The CFPB's distinction is the place to start: a lender is a financial institution that makes loans directly to you; a broker does not lend money. A broker's product is access and process — one application and one credit file, presented to multiple wholesale lenders, with the broker structuring the file, comparing the resulting pricing and programs, and shepherding the chosen loan through underwriting to closing. The lender behind the scenes makes the credit decision and funds the money.",
          "A mortgage banker originates and funds loans with its own or borrowed capital, then typically sells them into the secondary market. A direct lender — the umbrella term covering banks, credit unions, and non-bank lenders — funds from its own accounts and may keep the servicing or sell it. A retail loan officer at any of these institutions offers that institution's programs and pricing; the menu is the house menu.",
          "No channel is inherently virtuous. All three close loans every day, all three are subject to the same federal consumer protections on disclosures and ability-to-repay, and the same standardized Loan Estimate makes their offers directly comparable. The differences are structural: whose menu, whose pipeline, and who gets paid how."
        ]
      },
      {
        heading: "How brokers are compensated",
        paragraphs: [
          "Broker compensation is federally regulated under Regulation Z's loan originator compensation rules, and three features of those rules are worth knowing. First, on any given loan the broker is paid either by the lender or by the borrower — not both. Second, compensation may not be based on the loan's terms: a broker cannot legally earn more for placing you in a higher rate or a costlier product, a rule written specifically to kill the steering incentives of the pre-2008 era. Third, the compensation appears on your Loan Estimate and Closing Disclosure, in dollars, where you can read it.",
          "In lender-paid arrangements the wholesale lender pays the broker a pre-set percentage of the loan amount, fixed by agreement in advance rather than negotiated deal by deal. In borrower-paid arrangements you pay the broker's fee directly and the lender pays nothing. Each structure interacts differently with pricing on a given file, which is a legitimate question to ask your broker to walk through on your actual numbers.",
          "Loan officers at banks and direct lenders are compensated under the same anti-steering rules; their pay is internal to the lender's pricing rather than a separate disclosed line. Neither arrangement is hidden money — but the broker's is the more visible of the two on your disclosures."
        ]
      },
      {
        heading: "Honest pros and cons of each channel",
        paragraphs: [
          "The broker's advantages are breadth and portability. One file shops many lenders, which matters most when your scenario is not vanilla — self-employment income, condos with association complexities, investor property, recent credit events — because program niches differ across wholesale lenders, and a file declined or priced poorly at one can be strong at another without starting over. The broker's limits are real too: brokers do not control underwriting or funding timelines, they cannot make exceptions on another company's credit policy, and broker access does not include every lender — some institutions do not operate a wholesale channel at all.",
          "The direct lender's advantages are control and integration. Underwriting, closing, and funding live under one roof, which can mean speed and accountability in one place; an established banking relationship sometimes carries pricing or process benefits; and some portfolio lenders can hold unusual loans on their own balance sheet that fit no agency box. The limits mirror the strengths: the menu is one institution's programs and pricing, and if your file hits a policy wall, the answer is a new application somewhere else — often with a retail cost structure priced above the same lender's wholesale channel, though not universally.",
          "The mortgage banker sits between: funds its own loans like a direct lender, sells them like a broker's wholesale partners, and offers a menu wider than a single portfolio but narrower than a brokered marketplace."
        ],
        bullets: [
          "Broker: widest menu, one credit file shopped broadly, disclosed compensation; does not control underwriting or funding",
          "Direct lender / bank: one-roof control and accountability; one institution's menu and credit policy",
          "Mortgage banker: funds its own loans, resells them; menu in between",
          "All channels: same federal disclosures, same Loan Estimate, directly comparable offers"
        ]
      },
      {
        heading: "How to choose — and how to verify anyone",
        paragraphs: [
          "Match the channel to the file. A straightforward W-2 purchase may close well through any channel, and the deciding factors are pricing and the person handling it. A complex file benefits from breadth — that is the brokered channel's home turf. Whichever channel you use, get a Loan Estimate on the same assumptions from more than one source at least once; it is the only comparison that is standardized by design, and it costs you nothing but an hour.",
          "Verify the humans. Every mortgage loan originator — broker or retail — carries a unique NMLS identifier, and the NMLS Consumer Access database lets you confirm licensure, employment history, and any regulatory actions for both individuals and companies, free. In Florida, mortgage brokers and lenders are licensed under Chapter 494, Florida Statutes, administered by the Office of Financial Regulation.",
          "For transparency: TRACT is a mortgage brokerage. We arrange loans through wholesale lenders; we do not make loans, approve them, or set their prices, and our compensation is disclosed on your Loan Estimate. We think the brokered channel's breadth earns its place for most Florida files — and when a specific file would be better served elsewhere, saying so is part of the job."
        ]
      }
    ],
    faqs: [
      {
        question: "Does using a mortgage broker cost more?",
        answer:
          "Not inherently. Broker compensation is paid by either the lender or the borrower, is disclosed in dollars on the Loan Estimate, and cannot legally be based on your loan's terms. Whether a brokered offer beats a retail offer varies file by file — which is exactly why comparing Loan Estimates on identical assumptions is the honest test."
      },
      {
        question: "Do brokers approve loans?",
        answer:
          "No. Brokers arrange loans: they structure the application, shop it to wholesale lenders, and manage the process. The lender underwrites the file, makes the credit decision, and funds the loan. A broker's value is access, structuring, and comparison — not the approval itself, which always belongs to the lender."
      },
      {
        question: "Is a mortgage banker the same as a broker?",
        answer:
          "No. A mortgage banker funds loans with its own or borrowed capital and typically sells them after closing; it is a lender. A broker never funds the loan. The distinction matters because it determines whose credit policy governs your file and how the originator's compensation is structured and disclosed."
      },
      {
        question: "How do I check whether a broker or loan officer is licensed?",
        answer:
          "Look them up on NMLS Consumer Access, the free national database, using their name or NMLS ID — every legitimate originator has one and must provide it. The record shows licensure status, employers, and regulatory history. Florida licensing for mortgage brokers and lenders is administered by the state's Office of Financial Regulation."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What's the difference between a mortgage broker and a mortgage lender?",
        url: "https://www.consumerfinance.gov/ask-cfpb/whats-the-difference-between-a-mortgage-broker-and-a-mortgage-lender-en-130/"
      },
      {
        publisher: "eCFR",
        title: "12 CFR 1026.36 — Loan originator compensation (Regulation Z)",
        url: "https://www.ecfr.gov/current/title-12/chapter-X/part-1026/subpart-E/section-1026.36"
      },
      {
        publisher: "NMLS",
        title: "NMLS Consumer Access",
        url: "https://www.nmlsconsumeraccess.org/"
      }
    ],
    related: [
      { href: "/plan", label: "Build your mortgage plan" },
      { href: "/contact", label: "Talk to TRACT" },
      { href: "/resources/apr-vs-interest-rate", label: "APR vs. interest rate" },
      { href: "/mortgage/self-employed", label: "Self-employed borrowers" }
    ],
    publishedAt: PUBLISHED,
    lastReviewed: REVIEWED
  }
];
