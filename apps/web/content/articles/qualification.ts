import type { Article } from "./types";

/**
 * Qualifying cluster: how lenders actually evaluate a file — ratios, credit,
 * income documentation, and the situations (thin credit, past derogatory
 * events, self-employment) that make borrowers assume the answer is no before
 * anyone has looked. Figures that move (ratio limits, score minimums, waiting
 * periods) are attributed to the program source rather than stated as fact.
 */
export const QUALIFICATION_ARTICLES: Article[] = [
  {
    slug: "dti-explained",
    category: "qualification",
    title: "Front-End vs Back-End DTI: How Mortgage Ratios Work",
    description:
      "What debt-to-income ratio means in mortgage lending: front-end vs back-end DTI, which debts count, which income counts, and how underwriters run the math.",
    h1: "Debt-to-income ratio, explained: front-end, back-end, and what actually counts",
    answerSummary:
      "Debt-to-income ratio compares your monthly debt payments to your gross monthly income. The front-end ratio measures the proposed housing payment alone; the back-end ratio adds every other recurring debt, and it is the number underwriting cares about most. Minimum payments on the credit report count as debt; only stable, documented, continuing income counts as income. Program limits vary, so check the program source rather than a rule of thumb.",
    sections: [
      {
        heading: "What a debt-to-income ratio is",
        paragraphs: [
          "The Consumer Financial Protection Bureau defines debt-to-income ratio as all your monthly debt payments divided by your gross monthly income. Gross means before taxes and deductions — a point that surprises many borrowers, because the ratio is more forgiving than the math you do against your take-home pay.",
          "Lenders use DTI as a capacity measure: it answers whether the income you can document comfortably covers the payment you are asking to take on, alongside everything else you already owe. It is one of the most important numbers in a mortgage file, but it is not a score you carry around — it is recalculated for each loan, using that loan's proposed payment."
        ]
      },
      {
        heading: "Front-end vs back-end",
        paragraphs: [
          "The front-end ratio, sometimes called the housing ratio, divides the full proposed housing payment by gross monthly income. The housing payment is not just principal and interest: it includes property taxes, homeowners insurance, mortgage insurance if any, and association dues if any. In Florida, where insurance and taxes can be a large share of the payment, the front-end ratio often carries more weight in the math than borrowers expect.",
          "The back-end ratio — the total DTI — takes that same housing payment and adds all other recurring monthly obligations: car loans, student loans, credit card minimums, personal loans, court-ordered support, and payments on other real estate. Fannie Mae's Selling Guide frames the total ratio as the qualifying payment on the subject mortgage plus other long-term and significant short-term monthly debts, divided by the total income of all borrowers. When a lender talks about your DTI without qualification, they almost always mean the back-end number."
        ]
      },
      {
        heading: "What counts as debt",
        paragraphs: [
          "Underwriters work from the credit report first, then the application. The general rule: if an obligation recurs monthly and will continue for more than a short remaining term, it counts. Fannie Mae's Selling Guide section on monthly debt obligations spells out treatment for each type."
        ],
        bullets: [
          "Installment loans: the payment on the credit report counts; loans with only a few payments remaining may be excluded under conditions the program source defines.",
          "Revolving accounts: the minimum payment counts, even if you pay the balance in full each month.",
          "Student loans: counted even in deferment, using rules covered in our student loan guide.",
          "Alimony and child support: count when they will continue beyond a program-defined horizon.",
          "Other mortgages: the full housing expense on other properties, offset by documented rental income where the program allows.",
          "Utilities, phone bills, insurance on cars, and ordinary living expenses: generally not counted."
        ]
      },
      {
        heading: "What counts as income",
        paragraphs: [
          "Income has to clear a higher bar than debt: it must be documented, stable, and reasonably expected to continue. Base salary and hourly wages with a consistent history are the simplest case. Overtime, bonus, and commission income typically need a history showing the earnings are a pattern rather than a one-off, and an average is used rather than the most recent spike.",
          "Self-employment income is evaluated from tax returns rather than gross receipts — the qualifying number is closer to what you report after expenses than what your business collects. Rental income, retirement income, and support payments can count with the documentation each program describes. Income a lender cannot verify, or that is set to end, does not go into the denominator no matter how real it feels in your checking account."
        ]
      },
      {
        heading: "How the limits actually work",
        paragraphs: [
          "There is no single DTI cutoff for all mortgages. Each program publishes its own limits, automated underwriting systems evaluate the ratio alongside credit, reserves, and equity, and individual lenders can apply stricter overlays. A ratio that stops one file may pass in another with stronger compensating factors. Fannie Mae's Selling Guide publishes the ratio framework for conventional loans, and government programs publish their own — check the program source for the figure in force rather than relying on a number from an old article.",
          "The practical takeaway: your DTI is partly under your control. Paying down a card before applying, choosing a different price point, or documenting an income source properly can all move the ratio. As a broker, TRACT arranges loans through multiple wholesale lenders — we do not approve loans or set the limits, but we can line your numbers up against several programs to see where the math works. Our debt-to-income calculator lets you run the arithmetic yourself first."
        ]
      }
    ],
    faqs: [
      {
        question: "Is DTI calculated on gross or net income?",
        answer:
          "Gross income — before taxes and payroll deductions. The CFPB's definition and every major program's math use gross monthly income for wage earners. Self-employed borrowers are the notable exception in spirit: their qualifying income comes from tax returns after business expenses, which functions more like a net figure."
      },
      {
        question: "Do credit cards I pay off every month still count in my DTI?",
        answer:
          "Generally yes. Underwriting uses the minimum payment shown on the credit report at the time the report is pulled, regardless of your payoff habits. Some programs allow an account to be excluded if it is paid off and closed, or paid to zero, under conditions the program source defines."
      },
      {
        question: "Which matters more, the front-end or back-end ratio?",
        answer:
          "The back-end ratio drives most decisions on conventional loans, where automated underwriting evaluates total DTI alongside the rest of the file. Some programs and manual underwriting paths look at both ratios. In Florida, taxes and insurance can push the housing payment — and therefore both ratios — higher than the same price home elsewhere."
      },
      {
        question: "What is the maximum DTI for a mortgage?",
        answer:
          "It depends on the program, the underwriting method, and the rest of your file — credit, reserves, and down payment all interact with the ratio. Fannie Mae's Selling Guide publishes the conventional framework, and FHA, VA, and USDA publish their own. A broker can tell you where your specific numbers land across programs."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is a debt-to-income ratio?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-to-income-ratio-en-1791/"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B3-6-02, Debt-to-Income Ratios",
        url: "https://selling-guide.fanniemae.com/sel/b3-6-02/debt-income-ratios"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B3-6-05, Monthly Debt Obligations",
        url: "https://selling-guide.fanniemae.com/sel/b3-6-05/monthly-debt-obligations"
      }
    ],
    related: [
      { href: "/calculators/debt-to-income", label: "Debt-to-income calculator" },
      { href: "/calculators/affordability", label: "Affordability calculator" },
      { href: "/resources/student-loans-dti", label: "How student loans count in DTI" },
      { href: "/plan", label: "Build your mortgage plan" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "credit-score-mortgage",
    category: "qualification",
    title: "How Credit Scores Are Used in Mortgage Lending",
    description:
      "How mortgage lenders actually use credit scores: the tri-merge report, the representative score, pricing tiers, and why your app score differs from the lender's.",
    h1: "How credit scores really work in a mortgage file",
    answerSummary:
      "Mortgage lenders pull a tri-merge credit report combining all three bureaus, then derive a single representative score for the file using the method their program prescribes. That score feeds both eligibility and pricing: loan-level adjustments mean credit affects the cost of a loan, not just approval. The score a lender sees often differs from the one in your banking app, because mortgage lending uses specific scoring models.",
    sections: [
      {
        heading: "What a credit score is — and why you have many",
        paragraphs: [
          "The Consumer Financial Protection Bureau describes a credit score as a prediction of credit behavior — how likely you are to repay on time — computed from the information in your credit reports. The key word is reports, plural: each of the three nationwide bureaus holds its own file on you, and different scoring models read those files differently.",
          "That is why the number in your credit card app rarely matches the number a mortgage lender quotes. Consumer-facing scores often use different models than mortgage underwriting does. Neither is wrong; they are different instruments reading the same underlying history. What moves them is the same: payment history, balances relative to limits, age of accounts, recent applications, and derogatory events."
        ]
      },
      {
        heading: "The tri-merge report",
        paragraphs: [
          "For a mortgage, lenders order a tri-merge (three-file merged) credit report: one document combining your Equifax, Experian, and TransUnion files, each with its own score. Fannie Mae's Selling Guide requires lenders to request scores for each borrower from the approved score providers when ordering the merged report, and it defines which scoring model versions are acceptable — a list that has been evolving as the industry adopts updated models.",
          "The merged report matters because bureaus do not hold identical data. A collection may appear on one file and not another; a limit may be reported differently. Underwriting sees all of it at once, which is why a surprise sometimes appears at mortgage time that a single-bureau app never showed you."
        ]
      },
      {
        heading: "The representative score",
        paragraphs: [
          "Three bureaus and multiple borrowers still have to collapse into one number for eligibility and pricing. Each program defines how. Fannie Mae's Selling Guide describes determining a representative score for the loan — historically the middle score for a single borrower, with the guide now describing an average-median method across borrowers for certain underwriting paths. The mechanics are program-specific and have changed over time, so the guide itself is the authority on the method in force.",
          "Two practical consequences follow. First, one weak bureau does not sink a file by itself — the method is designed to smooth out single-bureau noise. Second, on a two-borrower application, the lower-scoring borrower's credit genuinely matters. Whether to include a co-borrower is a real decision, one we cover in our co-borrower guide."
        ]
      },
      {
        heading: "Scores drive pricing, not just approval",
        paragraphs: [
          "The common mental model — you either pass the credit check or you fail it — misses most of what scores actually do. On conventional loans, loan-level price adjustments tie the cost of the loan to a grid of credit score and loan-to-value combinations published by the agencies. Two neighbors with identical loans and different scores can pay measurably different amounts for the same money.",
          "This is why score tiers matter even well above any minimum. Moving from one pricing tier to the next can change the economics of a loan, and sometimes a short delay to let a balance report lower is worth more than any amount of shopping. Minimum score requirements exist too, and they vary by program and by lender overlay — check the program source rather than a remembered cutoff."
        ]
      },
      {
        heading: "What this means for your file",
        paragraphs: [
          "Because pricing is tiered, small improvements can have outsized value. The levers that move scores fastest are usually utilization — the share of each card limit you are using when the bureaus snapshot the balance — and avoiding new derogatory marks. Longer-term levers are time and clean payment history. TRACT is a mortgage broker, not a credit repair company: we do not fix credit reports, and no one can remove accurate information. What a broker can do is run your actual tri-merge results against multiple lenders' pricing and show you what a tier change would be worth before you commit."
        ],
        bullets: [
          "Do not open or close accounts mid-process without talking to your loan team.",
          "Dispute genuine errors before you apply, not during underwriting — active disputes can complicate a file.",
          "Checking your own credit is a soft inquiry and does not lower your score.",
          "Rate shopping among mortgage lenders is treated gently by scoring models — see our credit inquiries guide."
        ]
      }
    ],
    faqs: [
      {
        question: "Why is my mortgage credit score lower than the score in my app?",
        answer:
          "Different scoring models. Consumer apps typically show educational scores from one bureau; mortgage lenders pull a tri-merge report scored with the specific model versions their program accepts. The inputs are the same history, but the formulas and data snapshots differ, so gaps of tens of points in either direction are normal."
      },
      {
        question: "What credit score do I need to buy a house?",
        answer:
          "There is no universal number. Each program sets its own minimums, lenders can add stricter overlays, and the requirements change over time — Fannie Mae's Selling Guide and each government program's handbook publish the figures in force. Score also affects pricing above any minimum, so the better question is what your score qualifies you for and at what cost."
      },
      {
        question: "Does applying for a mortgage hurt my credit score?",
        answer:
          "A mortgage credit pull is a hard inquiry with a small, temporary effect. The CFPB notes that multiple mortgage inquiries within a shopping window are treated as a single inquiry by scoring models, so comparing several lenders does not multiply the impact."
      },
      {
        question: "Can TRACT fix my credit so I qualify?",
        answer:
          "No — TRACT is a mortgage broker, not a credit repair organization, and accurate negative information cannot be removed by anyone. What we can do is show you how lenders will read your report, which items actually affect eligibility and pricing, and whether disputing a genuine error or paying down a specific balance is worth doing before you apply."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is a credit score?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-credit-score-en-315/"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B3-5.1-01, General Requirements for Credit Scores",
        url: "https://selling-guide.fanniemae.com/sel/b3-5.1-01/general-requirements-credit-scores"
      }
    ],
    related: [
      {
        href: "/resources/mortgage-credit-inquiries",
        label: "Does rate shopping hurt your credit?"
      },
      { href: "/resources/co-borrower-vs-cosigner", label: "Co-borrower vs. cosigner" },
      { href: "/calculators/rate-impact", label: "Rate impact calculator" },
      { href: "/contact", label: "Talk to a loan advisor" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "self-employed-mortgage-docs",
    category: "qualification",
    title: "Self-Employed Mortgage Documents: What You Need",
    description:
      "The documents self-employed borrowers actually need for a mortgage: tax returns, P&L statements, how add-backs work, and how lenders read business income.",
    h1: "Self-employed and buying a home: the documents that actually matter",
    answerSummary:
      "Self-employed borrowers qualify on the income their tax returns support, not on gross revenue. Expect to provide personal and often business returns, a profit-and-loss statement, and business account context. Underwriters start from taxable income, then add back paper deductions like depreciation — so aggressive write-offs lower qualifying income, while add-backs recover some of it. Bank statement programs exist as an alternative documentation path through some wholesale lenders.",
    sections: [
      {
        heading: "Who counts as self-employed",
        paragraphs: [
          "Fannie Mae's Selling Guide treats anyone with a meaningful ownership interest in a business — the guide uses a specific ownership threshold — as self-employed for underwriting purposes. That sweeps in sole proprietors, single-member LLC owners, partners, S-corp shareholders, and many 1099 contractors, even people who think of themselves as ordinary workers with a side entity.",
          "The distinction matters because self-employment changes the documentation question from 'what does your employer say you earn' to 'what does your tax history show your business reliably produces.' Underwriters are evaluating two things at once: your income, and the stability of the business generating it."
        ]
      },
      {
        heading: "The core document stack",
        paragraphs: [
          "The exact list varies by program, business structure, and how long you have been self-employed, but the spine is consistent. Fannie Mae's Selling Guide describes the underwriting factors and documentation for self-employed borrowers, including the length-of-self-employment expectations and when business returns are required — and automated underwriting sometimes reduces the documentation burden for strong files."
        ],
        bullets: [
          "Personal federal tax returns, typically covering the most recent one to two years depending on the program and underwriting findings.",
          "Business federal tax returns for the same period when you own a corporation, S-corp, or partnership — plus K-1s showing your share.",
          "A year-to-date profit-and-loss statement, so the underwriter can see whether this year tracks the tax history.",
          "Business bank statements or other evidence the business is active and solvent, especially when returns are several months old.",
          "IRS transcripts: lenders commonly verify filed returns against IRS records, which you can preview yourself through the IRS Get Transcript service."
        ]
      },
      {
        heading: "How underwriters read your returns: add-backs",
        paragraphs: [
          "Here is the part that decides most self-employed files. Your qualifying income starts from what you reported to the IRS after expenses — not what your clients paid you. Every legitimate deduction that lowered your tax bill also lowered your qualifying income. This is the central tension of self-employed lending: the tax strategy that serves you in April works against you at mortgage time.",
          "Add-backs partially reverse this. Certain deductions are paper losses rather than cash leaving your pocket, and underwriting adds them back to income: depreciation is the classic example, along with amortization and other non-cash items the guidelines enumerate. One-time expenses documented as non-recurring may also be added back. Conversely, some items are deducted further — like debts the analysis shows the business cannot support. The cash-flow analysis worksheet a lender runs is more forgiving than your bottom-line taxable income, but it starts there.",
          "Declining income draws scrutiny. Two strong years followed by a weak year-to-date P&L raises the question of which number represents the future, and underwriters generally will not average in a trend they believe is heading down without an explanation that holds up."
        ]
      },
      {
        heading: "If the returns don't tell your real story",
        paragraphs: [
          "Some strong businesses look weak on tax returns by design. For those borrowers, bank statement loan programs offered by some wholesale lenders qualify income from business deposit history instead of returns. These are non-agency products with their own trade-offs — typically larger down payments and different pricing — but they exist precisely for the profitable-on-paper-thin business owner.",
          "The other lever is time and preparation. If a purchase is a year out, the return you are about to file is the one underwriting will lean on hardest, and a conversation with both your CPA and a loan advisor before filing can be worth real money. Writing off less means paying more tax and qualifying for more mortgage; only you and your accountant can price that trade, but you should make it knowingly."
        ]
      },
      {
        heading: "How TRACT fits in",
        paragraphs: [
          "Self-employed files are where broker access earns its keep. Different wholesale lenders read the same tax returns with different appetites, and the gap between one underwriter's income calculation and another's can decide a file. TRACT arranges loans across multiple lenders — agency programs and bank statement alternatives — and we run the income math up front, before your credit is pulled and before you fall in love with a house. We do not approve loans or set guidelines; we find the lender whose guidelines fit the business you actually run."
        ]
      }
    ],
    faqs: [
      {
        question: "How many years of self-employment do I need to get a mortgage?",
        answer:
          "Programs generally look for an established self-employment history, and Fannie Mae's Selling Guide describes both the standard expectation and the conditions under which a shorter history can work — for example, when the new business continues a prior salaried career in the same field. The exact requirements are program-specific, so treat the guide and your lender's overlays as the authority."
      },
      {
        question: "Do lenders use my gross revenue or my taxable income?",
        answer:
          "Neither exactly. Underwriting starts from the income your tax returns report after expenses, then adjusts: non-cash deductions like depreciation are added back, non-recurring items may be excluded, and unsupportable debts are subtracted. The result — the cash flow analysis — is usually higher than your taxable income and always lower than gross revenue."
      },
      {
        question: "What if my business writes off too much for me to qualify?",
        answer:
          "You have three honest paths: wait and file a return that deducts less (paying more tax in exchange for more qualifying income), use documented add-backs to recover non-cash deductions, or look at bank statement programs that qualify income from deposits instead of returns. Which path makes sense depends on your timeline and the numbers — this is a planning conversation, not a workaround."
      },
      {
        question: "Will the lender verify my returns with the IRS?",
        answer:
          "Commonly, yes. Lenders use IRS transcript verification to confirm the returns in the file match what was filed. You can pull your own transcripts through the IRS Get Transcript service beforehand — a worthwhile check, since an unprocessed or amended return can stall underwriting at the worst moment."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title:
          "Selling Guide B3-3.5-01, Underwriting Factors and Documentation for a Self-Employed Borrower",
        url: "https://selling-guide.fanniemae.com/sel/b3-3.5-01/underwriting-factors-and-documentation-self-employed-borrower"
      },
      {
        publisher: "Internal Revenue Service",
        title: "Get your tax records and transcripts",
        url: "https://www.irs.gov/individuals/get-transcript"
      }
    ],
    related: [
      { href: "/mortgage/self-employed", label: "Self-employed mortgage options" },
      { href: "/mortgage/bank-statement", label: "Bank statement loans" },
      { href: "/calculators/debt-to-income", label: "Debt-to-income calculator" },
      { href: "/resources/dti-explained", label: "How DTI works" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "employment-history-mortgage",
    category: "qualification",
    title: "Employment History for a Mortgage: The Two-Year Question",
    description:
      "What lenders really want from your employment history: the two-year concept, changing jobs mid-process, explaining gaps, and how new graduates qualify.",
    h1: "Employment history and your mortgage: what two years really means",
    answerSummary:
      "Lenders look for a two-year employment picture not as a rigid tenure rule but as evidence that your income is stable and likely to continue. Job changes are fine when they show progression in the same line of work; gaps need explanation, not apology; and new graduates can often count education in their field toward the history. Changing jobs mid-process is manageable if disclosed early — and disastrous if hidden.",
    sections: [
      {
        heading: "Where the two-year idea comes from",
        paragraphs: [
          "Nearly every mortgage program frames income review around a two-year history — tax documents, W-2s, and employment verification covering roughly that span. Fannie Mae's Selling Guide describes the principle behind it: lenders must determine that income is stable, predictable, and likely to continue, using history as the evidence. FHA's Single Family Housing Policy Handbook 4000.1 takes the same posture for government lending.",
          "What the two-year concept is not: a requirement that you hold one job, or even stay in one field, for two unbroken years. Underwriters are reading a story, not counting months on a single badge. Twenty-two months across two employers in the same profession with rising pay reads as strong. The same months scattered across unrelated gigs with falling pay reads as risk. The question is always continuity of income, not continuity of employer."
        ]
      },
      {
        heading: "Changing jobs before or during the process",
        paragraphs: [
          "A job change before you apply is usually a non-event when it is a move up or sideways in the same line of work — salaried to salaried, similar or better pay. Moves that change the character of the income need more care: salaried to commission-heavy, employee to contractor, or W-2 to self-employed can restart the history clock, because the new income type has no track record.",
          "Changing jobs after you apply but before you close is the scenario that quietly kills closings. Lenders re-verify employment shortly before funding, and a resignation discovered at the closing table is a genuine emergency. If a change is coming, tell your loan team immediately. Often it is workable — an offer letter and a first pay stub in the same field can carry a file — but only if underwriting knows in time to document it. What never works is hoping the verification call lands before the news does.",
          "One special case deserves mention: a new job that starts after closing. Some programs allow qualifying on a signed future employment contract under defined conditions. If you are relocating to Florida for work, this is a path to close before your start date rather than renting for months first — ask about it explicitly."
        ]
      },
      {
        heading: "Gaps in employment",
        paragraphs: [
          "Gaps are normal and underwriters know it. Layoffs, caregiving, illness, education, relocation — files clear underwriting with all of these every week. What a gap requires is a brief written explanation and, more importantly, evidence of stability since returning: time back at work, consistent pay, the picture of someone re-established rather than in transition. Programs differ on how much post-gap history they want, particularly for longer absences, and the program handbook is the authority on specifics.",
          "The tone of this part of the process bothers people, and it should not. A letter of explanation is not a confession — it is a document that lets the underwriter check a box that says the past is explained and the present is stable. Two or three factual sentences beat a page of apology every time."
        ]
      },
      {
        heading: "New graduates and career starters",
        paragraphs: [
          "If you finished school recently, you do not need to wait two years to buy. Programs generally allow education in your field to stand in for employment history: a nursing graduate three months into a hospital job can present transcripts plus an offer letter and pay stubs as a complete stability story. The same logic extends to documented vocational training and, in many cases, military service transitioning to civilian work in a related role.",
          "What new grads should expect is documentation of the bridge: transcripts or diploma, the employment offer, and evidence pay has actually started. Probationary periods at a new employer are generally not disqualifying by themselves, though individual lender overlays vary."
        ]
      },
      {
        heading: "How to prepare, whatever your history looks like",
        paragraphs: [
          "Gather your last two years of W-2s or tax returns, recent pay stubs, and dates for every employer — verification services will surface the history anyway, so the application should match it. Write down the one-line explanation for anything unusual before you are asked. And if your situation includes a change in progress — new job, new field, returning from a gap — have the conversation before applying, not after. TRACT arranges loans through many lenders, and the practical value in an employment-history question is knowing which lender's guidelines read your specific story most favorably. We can tell you that before anyone pulls credit."
        ]
      }
    ],
    faqs: [
      {
        question: "Do I need two years at the same job to get a mortgage?",
        answer:
          "No. Programs look for a stable two-year income picture, not two years with one employer. Job changes within the same field — especially with steady or rising pay — are generally fine. What draws scrutiny is a change in the type of income, like moving from salary to commission or to self-employment, because the new income form lacks history."
      },
      {
        question: "Can I change jobs while my mortgage is in process?",
        answer:
          "It is often workable, but only if you tell your loan team the moment it is in motion. Lenders re-verify employment just before closing, and an undisclosed change discovered then can stop a funding. With early notice, underwriting can typically document the new position — same field, comparable pay is the easy case — and keep the closing on track."
      },
      {
        question: "How do lenders treat an employment gap?",
        answer:
          "As something to document, not a disqualifier. Expect to provide a short written explanation and to show stability since returning to work. Longer gaps may require more time back on the job depending on the program — FHA's Handbook 4000.1 and Fannie Mae's Selling Guide each describe their own expectations, and lender overlays can add to them."
      },
      {
        question: "I just graduated — can school count as employment history?",
        answer:
          "Usually yes, when your job is in your field of study. Transcripts or a diploma plus an offer letter and pay stubs can present a complete income-stability story to underwriting. This is one of the most common paths for young professionals buying a first home shortly after starting their careers."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B3-3.1-01, General Income Information",
        url: "https://selling-guide.fanniemae.com/sel/b3-3.1-01/general-income-information"
      },
      {
        publisher: "U.S. Department of Housing and Urban Development",
        title: "FHA Single Family Housing Policy Handbook 4000.1",
        url: "https://www.hud.gov/hud-partners/single-family-handbook-4000-1"
      }
    ],
    related: [
      { href: "/mortgage/first-time-home-buyers", label: "First-time home buyer programs" },
      {
        href: "/resources/self-employed-mortgage-docs",
        label: "Self-employed documentation guide"
      },
      { href: "/plan", label: "Build your mortgage plan" },
      { href: "/locations/florida", label: "Buying in Florida" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "student-loans-dti",
    category: "qualification",
    title: "How Student Loans Count in Mortgage DTI",
    description:
      "How student loans really count in mortgage DTI: income-driven repayment plans, deferment and forbearance myths, and what the payment on your credit report means.",
    h1: "Student loans and your mortgage: how the debt actually counts",
    answerSummary:
      "Student loans count in your debt-to-income ratio even when you are not currently paying them. Underwriting uses the payment on your credit report or documented repayment terms; when no payment shows — as in deferment or forbearance — programs impute one using formulas in their guidelines. Income-driven repayment plans can help, because several programs accept the documented IDR payment, sometimes even a very low one, subject to program rules.",
    sections: [
      {
        heading: "The starting point: the debt counts",
        paragraphs: [
          "The most persistent myth in student-loan-and-mortgage folklore is that loans in deferment or forbearance do not count against you. They count. Every major program requires a monthly obligation for student debt in the DTI calculation regardless of whether a payment is currently due — the reasoning being that the debt is real and payments will eventually resume.",
          "What differs between programs — and what has genuinely changed over the years — is how that monthly figure gets determined when the credit report does not show a normal payment. This is where borrowers with identical balances can qualify very differently depending on program choice and paperwork."
        ]
      },
      {
        heading: "How the payment is determined",
        paragraphs: [
          "When your credit report shows an actual repayment payment, that number generally carries the day. The interesting cases are everything else. Fannie Mae's Selling Guide section on monthly debt obligations lays out the conventional hierarchy: use the credit report payment; if none is reported, the lender can calculate one — the guide describes a percentage-of-balance formula and a fully amortizing alternative based on documented terms. FHA, VA, and USDA each publish their own versions of this logic in their handbooks, and the details differ enough to change outcomes.",
          "The practical consequence: a large balance with no reported payment can generate a large imputed payment under a percentage-of-balance formula — sometimes far larger than what you would actually pay. Documentation is the antidote. Actual repayment terms, in writing from the servicer, usually beat an imputed number."
        ]
      },
      {
        heading: "Income-driven repayment plans",
        paragraphs: [
          "Income-driven repayment ties your federal loan payment to your income and family size, and the CFPB's student loan resources cover how these plans work from the borrower side. For mortgage purposes, IDR creates a genuinely favorable situation under several programs: when your credit report or servicer documentation shows the IDR payment, guidelines may allow underwriting to use it — and Fannie Mae's guide addresses even the case where the documented IDR payment is zero.",
          "The programs are not uniform here. Conventional guidelines and government handbooks treat low or zero IDR payments differently, and lender overlays add another layer. If you carry six figures of student debt on an income-driven plan, the choice of loan program may matter more to your approval than anything else in your file — this is precisely the situation where comparing programs through a broker changes the answer.",
          "One caution: IDR payments recertify annually and can change with your income. Underwriting uses the documented payment in effect, but your own budget should anticipate where the payment goes after recertification, especially in your first years of homeownership."
        ]
      },
      {
        heading: "Deferment, forbearance, and forgiveness myths",
        paragraphs: [
          "Three myths do most of the damage. First: 'my loans are deferred, so they don't count.' As covered — they count, and often at an imputed payment larger than your eventual real one. Second: 'I should put my loans in forbearance before applying so the payment disappears.' This backfires: the payment does not disappear from underwriting, and you may trade a small documented payment for a larger imputed one. Third: 'my loans will be forgiven, so the lender should ignore them.' Underwriting works from present obligations; anticipated forgiveness generally does not remove a debt from DTI until the program's documentation standard for imminent discharge is met.",
          "The honest strategy is the opposite of hiding the debt: surface the best documented payment you legitimately have. For many borrowers that means being in an active repayment or IDR status with paperwork in hand, rather than in an administrative status that forces the lender to a formula."
        ]
      },
      {
        heading: "Running your own numbers",
        paragraphs: [
          "Before you tour a single house, run your DTI both ways: with your documented student loan payment, and with a percentage-of-balance imputed payment. The spread between those two numbers is your paperwork's value in dollars of monthly obligation. Our debt-to-income calculator handles the arithmetic, and a TRACT advisor can map your actual servicer documentation against the programs of multiple wholesale lenders. TRACT arranges loans and does not set these guidelines — but knowing which guideline fits your loans is most of the game for student-debt-heavy files."
        ]
      }
    ],
    faqs: [
      {
        question: "Do deferred student loans count against my mortgage DTI?",
        answer:
          "Yes. Every major program includes student debt in DTI even during deferment or forbearance. When no payment appears on the credit report, the lender imputes one using the program's formula — often a percentage of the outstanding balance — which can exceed your eventual actual payment. Documented repayment terms usually produce a better number."
      },
      {
        question: "Will my income-driven repayment payment be used to qualify?",
        answer:
          "Often, yes — several programs accept a documented IDR payment, and conventional guidelines address even a documented zero payment. Programs and lender overlays differ, though, so the same IDR situation can qualify under one program and not another. Bring your servicer documentation; the written payment is what underwriting can use."
      },
      {
        question: "Should I pay off my student loans before buying a house?",
        answer:
          "Not automatically. The question is what the dollars do most efficiently: reducing DTI, funding a down payment, or staying as reserves. A small balance whose payment blocks your ratio may be worth eliminating; a large balance at a low documented payment often is not. Run the DTI math both ways before committing savings either direction."
      },
      {
        question: "Can I get a mortgage with six figures of student debt?",
        answer:
          "Borrowers do, regularly. What matters to underwriting is the monthly payment relative to your income, not the balance itself. A large balance on a documented income-driven plan can carry a modest DTI impact, while a smaller balance with no documentation can impute a heavier one. Program choice and paperwork drive the outcome."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B3-6-05, Monthly Debt Obligations",
        url: "https://selling-guide.fanniemae.com/sel/b3-6-05/monthly-debt-obligations"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "Paying for College",
        url: "https://www.consumerfinance.gov/paying-for-college/"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is a debt-to-income ratio?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-to-income-ratio-en-1791/"
      }
    ],
    related: [
      { href: "/calculators/debt-to-income", label: "Debt-to-income calculator" },
      { href: "/resources/dti-explained", label: "How DTI works" },
      { href: "/mortgage/first-time-home-buyers", label: "First-time home buyer programs" },
      { href: "/contact", label: "Talk to a loan advisor" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "collections-medical-debt-mortgage",
    category: "qualification",
    title: "Collections and Medical Debt in Mortgage Underwriting",
    description:
      "How mortgage underwriting treats collections and medical debt, when accounts must be paid, and why disputing during underwriting can stall your closing.",
    h1: "Collections, medical debt, and your mortgage file",
    answerSummary:
      "Collection accounts do not automatically stop a mortgage. Underwriting distinguishes medical from non-medical collections, weighs age and size, and only sometimes requires payoff — conventional guidelines set balance thresholds for certain files, while automated underwriting evaluates the whole picture. Medical debt receives notably gentler treatment throughout. Dispute genuine errors before you apply if possible; an active dispute during underwriting can force delays or manual review.",
    sections: [
      {
        heading: "What a collection means to an underwriter",
        paragraphs: [
          "A collection account is a debt reported as transferred to collections after non-payment. It signals past difficulty, and underwriting reads it in context: how old it is, how large, whether it is one event or a pattern, and what your credit looks like since. A years-old collection from a hard stretch, followed by clean history, is a different file than fresh collections landing monthly.",
          "If you are carrying collections, the first thing to hear is that files with collections close every day. This part of the process is mechanical, not moral — the guidelines ask specific questions about specific accounts, and the answers are usually manageable once you know what they are."
        ]
      },
      {
        heading: "When collections must be paid — and when they don't",
        paragraphs: [
          "The rules differ by program and by file. Fannie Mae's Selling Guide, in its DU credit report analysis section, describes when collections and charge-offs can remain open and when payoff is required — including balance thresholds that apply to certain transaction types, with different treatment for principal residences than for other properties. Automated underwriting weighs open collections as part of the overall risk assessment rather than applying a single yes/no rule.",
          "Government programs run their own logic: FHA's handbook describes when collections factor into a capacity analysis rather than requiring payoff outright. And individual lenders layer overlays on top of all of it. The practical takeaway: do not drain savings paying old collections before anyone has told you which ones, if any, the target program actually requires you to address. Paying the wrong account can even briefly refresh its activity date without helping your approval."
        ]
      },
      {
        heading: "Medical debt is treated differently",
        paragraphs: [
          "Medical collections occupy a special category across the credit system. Underwriting guidelines commonly distinguish medical from non-medical collections — conventional guidance excludes medical collections from certain payoff requirements that apply to other collection types. The credit bureaus have also changed how medical debt is reported over recent years, removing certain paid and small medical collections from reports entirely, and newer scoring models weigh medical items more lightly.",
          "The policy landscape around medical debt reporting has continued to shift, so the state of your own report is the thing to verify rather than assume. If a medical bill is wrong or was insurance's responsibility, the CFPB's dispute process gives you a defined path with the bureaus and the furnisher — and its debt collection resources describe your rights when collectors call."
        ]
      },
      {
        heading: "Disputes during underwriting: timing matters enormously",
        paragraphs: [
          "You have the legal right to dispute credit report errors at any time, and the CFPB publishes the exact process: dispute with the bureau, dispute with the furnisher, keep records. Exercise the right — but understand the timing interaction with a mortgage. Accounts flagged as disputed can complicate automated underwriting: guidelines describe when a disputed tradeline requires the lender to investigate, document, or re-run the file, and an unresolved dispute can push a loan to manual underwriting or pause it while the dispute completes.",
          "The clean sequence is: pull your reports early — months before applying if you can — dispute genuine errors, let the disputes resolve, then apply. If you discover an error mid-process, tell your loan team before filing anything; sometimes the right move is a documented correction through the lender's channels rather than a formal dispute flag landing in the middle of underwriting."
        ]
      },
      {
        heading: "A realistic path forward",
        paragraphs: [
          "If collections are part of your file, the honest playbook looks like this: get all three reports, identify what is accurate and what is not, dispute only genuine errors, and bring the rest to a loan conversation before deciding what to pay. TRACT is a broker — we arrange loans through multiple lenders and can tell you how specific programs will read your specific accounts. We are not a credit repair company, and anyone promising to remove accurate collections for a fee is selling something the law does not support. Accurate negative information ages off on its own schedule; what you control is everything you do from today forward."
        ],
        bullets: [
          "Get your reports from all three bureaus before applying — they often differ.",
          "Dispute errors early; avoid new dispute flags during underwriting without your loan team's input.",
          "Do not pay old collections preemptively — learn which ones the program actually requires addressed.",
          "Keep every settlement or payoff letter; underwriting will want the paper trail."
        ]
      }
    ],
    faqs: [
      {
        question: "Can I get a mortgage with collections on my credit report?",
        answer:
          "Often, yes. Whether collections must be paid depends on the program, the account type and size, and the property use — conventional guidelines set specific conditions, and medical collections receive gentler treatment than other types. Automated underwriting evaluates the whole file, so strong compensating factors matter. A loan advisor can tell you what your specific accounts require."
      },
      {
        question: "Do I have to pay off medical collections to qualify?",
        answer:
          "Frequently no. Underwriting guidelines commonly exclude medical collections from payoff requirements that apply to other collection types, and reporting changes have removed many paid and small medical collections from credit reports altogether. Check what actually appears on your current reports before assuming a medical bill is blocking you."
      },
      {
        question: "Should I dispute credit report errors before applying for a mortgage?",
        answer:
          "Yes — as early as possible, ideally months before you apply. You have a legal right to dispute errors with the bureaus and the furnisher, and the CFPB publishes the process. What you want to avoid is an unresolved dispute flag sitting on an account during underwriting, which can force additional documentation, manual review, or delay."
      },
      {
        question: "Will paying off an old collection raise my credit score?",
        answer:
          "Not reliably, and sometimes not at all — older scoring models may not reward payoff of an aged collection, while newer models ignore paid collections. Payoff decisions during a mortgage should be driven by what the program requires, not by score speculation. Get program guidance first, then decide which accounts are worth your cash."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B3-5.3-09, DU Credit Report Analysis",
        url: "https://selling-guide.fanniemae.com/sel/b3-5.3-09/du-credit-report-analysis"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "How do I dispute an error on my credit report?",
        url: "https://www.consumerfinance.gov/ask-cfpb/how-do-i-dispute-an-error-on-my-credit-report-en-314/"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "Debt collection",
        url: "https://www.consumerfinance.gov/consumer-tools/debt-collection/"
      }
    ],
    related: [
      { href: "/resources/credit-score-mortgage", label: "How credit scores are used" },
      {
        href: "/resources/waiting-periods-bankruptcy-foreclosure",
        label: "Waiting periods after major credit events"
      },
      { href: "/plan", label: "Build your mortgage plan" },
      { href: "/contact", label: "Talk to a loan advisor" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "thin-credit-nontraditional",
    category: "qualification",
    title: "Thin Credit File? Nontraditional Credit for a Mortgage",
    description:
      "How to qualify for a mortgage with little or no credit history: nontraditional tradelines like rent and utilities, and how programs underwrite without a score.",
    h1: "Qualifying with a thin credit file: nontraditional credit, explained",
    answerSummary:
      "A short or empty credit history is not a closed door. Mortgage programs publish paths for borrowers without usable credit scores, built on nontraditional tradelines — documented histories of rent, utilities, insurance, and other recurring payments made on time. Conventional and government programs each define which tradelines count and how many are needed. Paying bills reliably is the qualification; the paperwork proves it.",
    sections: [
      {
        heading: "Thin file, no file, and why it happens",
        paragraphs: [
          "A thin credit file means the bureaus hold too little information to generate a reliable score — few accounts, short history, or long inactivity. Some people have no file at all. The CFPB's consumer credit resources note that scores are predictions built from credit report data; with sparse data, no trustworthy prediction exists, so no score is produced.",
          "The population this describes is not who stereotype suggests. It includes young adults, recent immigrants with strong financial habits and no U.S. history, people who deliberately avoid debt and pay cash, and those returning to the mainstream after years away from credit. None of that is financial weakness — it is invisibility to one particular measurement system. Mortgage guidelines acknowledge this directly by defining alternatives."
        ]
      },
      {
        heading: "The nontraditional tradeline concept",
        paragraphs: [
          "A tradeline is simply a reported account history. Nontraditional credit substitutes documented histories of obligations you already pay for the credit card and loan accounts you do not have. The logic is the same as scoring: a person who has paid recurring obligations on time, month after month, has demonstrated the behavior a mortgage depends on."
        ],
        bullets: [
          "Housing: rent payments, verified through a landlord, management company, or twelve months of bank records — typically the most important tradeline.",
          "Utilities: electricity, water, gas, internet, and phone accounts in your name.",
          "Insurance: recurring premiums paid monthly or quarterly (not payroll-deducted).",
          "Recurring payments: childcare, tuition, storage, memberships — regular documented obligations.",
          "Savings behavior: some guidelines recognize a documented pattern of regular deposits as supporting evidence."
        ]
      },
      {
        heading: "How the programs actually handle it",
        paragraphs: [
          "Fannie Mae's Selling Guide publishes eligibility requirements for loans where borrowers lack traditional credit, describing when a nontraditional credit history must be established, how many tradelines are expected, over what history, and what documentation proves them. The guide also describes how such loans run through automated underwriting versus manual review, and it attaches homeownership education requirements in defined cases. FHA's Handbook 4000.1 contains its own nontraditional credit framework for government lending, historically an important path for exactly these borrowers.",
          "Two developments are worth knowing. First, rent payment history has been moving into the mainstream: automated underwriting systems can now consider documented rent payments from bank data for some files, with borrower permission. Second, newer scoring models are designed to score more people with less traditional data. The direction of travel favors the thin-file borrower — but the program guidelines in force, not the trend, govern your file.",
          "Expect nontraditional files to face some structural limits: certain programs restrict which transaction types and risk combinations are eligible without scores, and manual underwriting — a human reading the whole file — is more likely. Manual underwriting is slower and more document-hungry, not worse."
        ]
      },
      {
        heading: "Building your documentation now",
        paragraphs: [
          "If a purchase is even a year away, start assembling the record today. Pay rent in a traceable way — checks or transfers from your own account, not cash. Keep utility accounts in your name and current. Save twelve months of statements for everything recurring. If your landlord is an individual, ask now whether they will complete a verification of rent later; a management company's records make this easier.",
          "Consider building traditional credit in parallel, carefully: a secured card used lightly and paid in full, or reporting services that add rent to your bureau files, can move you from unscoreable to scored — which opens more program doors than nontraditional paths alone. What to avoid is the panic version: opening several accounts at once shortly before applying creates the look of credit-seeking without the aged history that helps."
        ]
      },
      {
        heading: "Where a broker fits",
        paragraphs: [
          "Thin-file lending is unevenly distributed: some lenders work these files well and some avoid them, and overlays vary widely. TRACT arranges loans through multiple wholesale lenders, which means we can match a nontraditional credit file to a lender that actually underwrites them rather than one that declines by default. We do not approve loans — but we can tell you before application which documentation you need, which programs fit, and whether a few months of preparation would change your options. For someone who has paid every bill on time for years, the goal is making that visible."
        ]
      }
    ],
    faqs: [
      {
        question: "Can I get a mortgage with no credit score at all?",
        answer:
          "Programs exist for exactly this case. Conventional guidelines and FHA's handbook both define paths using nontraditional credit — documented histories of rent, utilities, insurance, and other recurring payments — in place of scored tradelines. Expect more documentation and possibly manual underwriting, and expect some program-specific limits on eligible transactions."
      },
      {
        question: "Does paying rent on time help me qualify?",
        answer:
          "Yes — rent is typically the anchor tradeline in a nontraditional credit history, and documented rent payments can now also feed automated underwriting assessments for some files with your permission. Pay in a traceable way and keep records; twelve months of bank statements showing consistent rent payments is powerful paper."
      },
      {
        question: "Is it better to build a credit score first or use nontraditional credit?",
        answer:
          "If you have time, doing both serves you: a modest, well-managed traditional account or two moves you toward being scoreable, which opens more programs and pricing options, while your rent and utility record stands ready as supporting history. If you need to buy soon, the nontraditional path exists now. Avoid opening many accounts at once right before applying."
      },
      {
        question: "Will a thin credit file mean worse loan terms?",
        answer:
          "Not automatically, but options can be narrower: some programs restrict eligible transaction types without scores, manual underwriting is likelier, and fewer lenders participate, which is itself a pricing factor. This is a situation where comparing several lenders through a broker matters more than usual, because the spread between willing lenders can be wide."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title:
          "Selling Guide B3-5.4-01, Eligibility Requirements for Loans with Nontraditional Credit",
        url: "https://selling-guide.fanniemae.com/sel/b3-5.4-01/eligibility-requirements-loans-nontraditional-credit"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is a credit score?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-credit-score-en-315/"
      },
      {
        publisher: "U.S. Department of Housing and Urban Development",
        title: "FHA Single Family Housing Policy Handbook 4000.1",
        url: "https://www.hud.gov/hud-partners/single-family-handbook-4000-1"
      }
    ],
    related: [
      { href: "/mortgage/fha", label: "FHA loans" },
      { href: "/mortgage/first-time-home-buyers", label: "First-time home buyer programs" },
      { href: "/resources/credit-score-mortgage", label: "How credit scores are used" },
      { href: "/contact", label: "Talk to a loan advisor" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "co-borrower-vs-cosigner",
    category: "qualification",
    title: "Co-Borrower vs. Cosigner on a Mortgage: Key Differences",
    description:
      "Co-borrower vs. cosigner on a mortgage: who lives in the home, who owns it, whose credit and income count, who owes the debt, and how someone exits later.",
    h1: "Co-borrower or cosigner: what each role actually means on a mortgage",
    answerSummary:
      "A co-borrower shares the loan and usually the home's title; a cosigner shares the loan's liability without ownership. Both are fully responsible for the entire debt, both have the loan on their credit reports, and both borrowers' credit factors into the file — the weaker profile can shape eligibility and pricing. Occupancy matters too: programs treat occupant and non-occupant borrowers differently. Exiting later generally requires refinancing, selling, or a program-defined release.",
    sections: [
      {
        heading: "The two roles, precisely",
        paragraphs: [
          "The words get used loosely, so start with the precise versions. A co-borrower applies jointly, signs the note, and typically takes title to the property — an owner and a debtor. A cosigner (Fannie Mae's Selling Guide groups cosigners with guarantors) signs the note and accepts full liability but takes no ownership interest in the home — a debtor who is not an owner.",
          "A further split matters for qualifying: occupant versus non-occupant. An occupant co-borrower will live in the home; a non-occupant co-borrower — the classic case is a parent helping an adult child buy — signs and often takes title but lives elsewhere. Programs treat these differently: guidelines set distinct rules for how a non-occupant's income counts, and some underwriting paths apply different ratio or down payment math when the occupying borrower is not qualifying alone."
        ]
      },
      {
        heading: "Liability: the part people underestimate",
        paragraphs: [
          "Every signer of the note — co-borrower or cosigner, occupant or not — is liable for the entire payment, not a share of it. If the primary resident stops paying, the lender can pursue any signer for the full amount, and the late payments appear on every signer's credit report. The CFPB's guidance on co-signing is blunt about this: you are taking on the whole obligation, and a creditor cannot even require a spouse's signature when an applicant qualifies individually — signing someone else's loan is a choice, and it should be an informed one.",
          "The debt also follows every signer into their own future borrowing: the full mortgage payment lands in each signer's debt-to-income ratio. A parent who cosigns a child's mortgage may find their own refinance or next purchase constrained by a payment they never make. Some guidelines allow that debt to be excluded from the cosigner's DTI when someone else has documentably made the payments for a sustained period — but that is a conditional exception, not the default."
        ]
      },
      {
        heading: "Whose credit and income count",
        paragraphs: [
          "Income aggregates: a co-borrower's income joins the qualifying calculation, which is usually the whole point of adding one. Non-occupant income counts under conditions each program defines — this is where conventional and government programs genuinely differ, and where program selection can decide a file.",
          "Credit does not average away. Underwriting derives the file's representative credit score from all borrowers using the method the program prescribes, and every borrower must independently satisfy credit eligibility. Adding a co-borrower with strong income but a much weaker credit profile can lower the score used for pricing — meaning the help on the income side has a cost on the rate side. Sometimes the math favors adding the person; sometimes it favors qualifying on one income with the stronger profile alone. It is an arithmetic question, and worth actually computing both ways."
        ]
      },
      {
        heading: "Getting out later",
        paragraphs: [
          "Plan the exit before anyone signs, because exiting is harder than entering. Removing a borrower from the mortgage generally means one of three things: refinancing the loan in the remaining borrower's name alone (the remaining borrower must qualify solo at that time), selling the property and retiring the note, or — on some loans — a formal release process the servicer or program defines, which has its own qualification review. What does not work: a quitclaim deed. Deeds move ownership; they do not touch the note. A cosigner who 'signed off the house' via deed remains fully liable for the loan.",
          "Families entering these arrangements should also put the informal terms in writing — who pays what, what happens if someone wants out, how sale proceeds split. None of that is the lender's business, and all of it prevents the disputes that make the lender's business relevant."
        ]
      },
      {
        heading: "Choosing the right structure",
        paragraphs: [
          "The decision reduces to a few questions: Does the helper need to be on title? Does their income need to count, and does the target program allow it from a non-occupant? What does their credit profile do to the file's representative score? And what is the exit plan? Different programs answer these differently, which makes structure and program selection a joint decision. TRACT arranges loans across multiple lenders and can model the file both ways — with and without the additional borrower, across programs — before anyone commits their credit. We do not approve loans; we make sure the structure you pick is the one the math supports."
        ]
      }
    ],
    faqs: [
      {
        question: "What is the difference between a co-borrower and a cosigner?",
        answer:
          "Ownership. A co-borrower signs the note and typically takes title — owner and debtor. A cosigner signs the note without taking an ownership interest — debtor only. Liability is identical: each is responsible for the entire payment, and the loan appears on both credit reports either way."
      },
      {
        question: "Does a cosigner's credit score affect the mortgage?",
        answer:
          "Yes. Underwriting derives a representative score for the file from all signers using the program's method, and each must meet credit eligibility. A cosigner with a substantially weaker profile can affect pricing and approval even when their income is what makes the file work — so run the numbers with and without them before deciding."
      },
      {
        question: "Can a parent who doesn't live in the home help their child qualify?",
        answer:
          "Often, as a non-occupant co-borrower or cosigner. Programs differ on how non-occupant income counts and what other conditions apply — the differences between conventional and government programs here are real, and choosing the program that fits the family's structure is a large part of making it work."
      },
      {
        question: "How does a cosigner get off a mortgage later?",
        answer:
          "Usually by the remaining borrower refinancing alone, by sale of the property, or through a program-defined release process where available. Signing a deed does not do it — deeds transfer ownership, not loan liability. Agree on the exit plan in writing before anyone signs the original note."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title:
          "Selling Guide B2-2-04, Guarantors, Co-Signers, or Non-Occupant Borrowers on the Subject Transaction",
        url: "https://selling-guide.fanniemae.com/sel/b2-2-04/guarantors-co-signers-or-non-occupant-borrowers-subject-transaction"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "Does my spouse have to co-sign my mortgage loan?",
        url: "https://www.consumerfinance.gov/ask-cfpb/does-my-spouse-have-to-co-sign-my-mortgage-loan-en-359/"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B3-5.1-01, General Requirements for Credit Scores",
        url: "https://selling-guide.fanniemae.com/sel/b3-5.1-01/general-requirements-credit-scores"
      }
    ],
    related: [
      { href: "/resources/credit-score-mortgage", label: "How credit scores are used" },
      { href: "/calculators/debt-to-income", label: "Debt-to-income calculator" },
      { href: "/mortgage/refinance", label: "Refinancing options" },
      { href: "/plan", label: "Build your mortgage plan" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "waiting-periods-bankruptcy-foreclosure",
    category: "qualification",
    title: "Mortgage Waiting Periods After Bankruptcy or Foreclosure",
    description:
      "After bankruptcy, foreclosure, or a short sale, waiting periods apply before a new mortgage — and they vary by program, event, and circumstances. What to know.",
    h1: "Buying again after bankruptcy or foreclosure: how waiting periods work",
    answerSummary:
      "Major derogatory events — bankruptcy, foreclosure, deed-in-lieu, short sale — start waiting periods before a new mortgage, and the lengths differ by event, by program, and by underwriting path. Conventional and government programs publish their own timelines, and documented extenuating circumstances can shorten some of them. The clock is only half the requirement: re-established credit and stability since the event matter just as much. Check the program source for the periods in force.",
    sections: [
      {
        heading: "Why waiting periods exist",
        paragraphs: [
          "A bankruptcy or foreclosure tells a lender that, at some point, obligations became unpayable. Waiting periods exist because the predictive weight of that event fades with time and with evidence of recovery. They are not punishment — they are the guidelines' way of encoding 'show us the difficult chapter is closed.' Every major program builds them in, and every major program also builds in the recognition that circumstances differ.",
          "If you are on the other side of one of these events, the honest framing is this: the path back to a mortgage is defined, published, and walked successfully by many people every year. The task is knowing which clock applies to you, when it started, and what to build while it runs."
        ]
      },
      {
        heading: "The events, and how programs time them",
        paragraphs: [
          "The events guidelines treat as significant derogatory: Chapter 7 and Chapter 13 bankruptcy, foreclosure, deed-in-lieu of foreclosure, preforeclosure (short) sale, and substantial mortgage charge-offs. Fannie Mae's Selling Guide devotes a section to these — significant derogatory credit events, waiting periods, and re-establishing credit — including a summary table of the period for each event and rules for measuring the start date (discharge or dismissal date for bankruptcies; completion date for foreclosure events).",
          "We deliberately do not print a table of year counts here, because the numbers are program-specific, differ by event and by chapter of bankruptcy, carry special rules for events like multiple filings or a foreclosure discharged within a bankruptcy, and can change. Fannie Mae's table governs conventional conforming loans; FHA's Handbook 4000.1 publishes its own timelines for government lending, and VA and USDA publish theirs. The differences between programs are large enough that program selection is often the whole strategy: the same borrower can be years from eligibility under one program and much closer under another.",
          "Non-agency lenders add a further layer: some wholesale lenders offer non-QM programs with shorter seasoning requirements than the agencies publish, priced accordingly. These are real options for some files, with trade-offs a loan advisor should walk through candidly."
        ]
      },
      {
        heading: "Extenuating circumstances",
        paragraphs: [
          "The guidelines distinguish between financial mismanagement and one-time events beyond a borrower's control. Fannie Mae's guide defines extenuating circumstances as nonrecurring events — such as a serious illness, a job loss, a divorce, or a death in the household — that directly caused the sudden inability to pay, and it allows shortened waiting periods when the circumstance and its financial impact are documented: medical records, severance notices, court documents, the paper trail connecting cause to effect.",
          "Two honest cautions. First, the documentation standard is genuinely demanding — you are proving causation, not describing hardship. Second, lender overlays apply: not every lender entertains extenuating-circumstances files even where the program allows them. This is a case where a broker's knowledge of which lenders actually work these files is worth more than the guideline text itself."
        ]
      },
      {
        heading: "The clock is not the whole requirement",
        paragraphs: [
          "Reaching the end of a waiting period does not by itself produce an approval. The same guideline sections require re-established credit: a post-event history showing recovered stability. Underwriting after a derogatory event looks hard at what the file shows since — clean payments, responsibly managed new accounts, stable income and housing.",
          "Use the waiting years deliberately. Rebuild credit with a small number of well-managed accounts rather than none at all — an empty post-bankruptcy file is its own problem, because it shows no recovery pattern. Keep rent traceable and current. Build savings; entering the new application with reserves changes how the whole file reads. And keep every document from the event itself — discharge papers, final judgments, sale records — because underwriting will need the dates and details years later."
        ]
      },
      {
        heading: "Finding your actual date",
        paragraphs: [
          "The practical steps: pin down your event type and its completion or discharge date from the court and property records; identify which programs' clocks you have already satisfied — checking each program's published source for the period in force; and get a professional read on whether extenuating circumstances plausibly apply to your history. TRACT arranges loans across many lenders and programs, and this is a situation where that breadth matters: we can map your dates against conventional, FHA, VA, USDA, and non-QM timelines in one conversation. We do not approve loans or waive guidelines — but we can usually tell you, concretely, how close you are and what to do with the time between now and eligible."
        ]
      }
    ],
    faqs: [
      {
        question: "How long after bankruptcy can I get a mortgage?",
        answer:
          "It depends on the bankruptcy chapter, the program, and how the case ended — discharge versus dismissal can matter, and multiple filings have their own rules. Each program publishes its timeline: Fannie Mae's Selling Guide for conventional loans, FHA's Handbook 4000.1 and the VA and USDA handbooks for government programs. Documented extenuating circumstances can shorten some periods."
      },
      {
        question: "Is the waiting period different for a short sale than a foreclosure?",
        answer:
          "Programs distinguish among foreclosure, deed-in-lieu, and preforeclosure sale, and the timelines are not identical across events or programs — one program may treat two events alike where another separates them. The event type and its completion date determine which published clock applies, so identify both precisely from your records."
      },
      {
        question: "What counts as an extenuating circumstance?",
        answer:
          "Guidelines describe nonrecurring events beyond your control that directly caused the default — serious illness, job loss, divorce, a death in the household — documented well enough to prove the causal chain, not just the hardship. Where accepted, they can shorten waiting periods, but the documentation bar is high and individual lenders vary in their appetite for these files."
      },
      {
        question: "Once my waiting period is over, am I approved?",
        answer:
          "No — the period is a threshold, not a decision. Programs also require re-established credit after the event, and the full file still has to work: income, DTI, assets, and post-event payment history. Borrowers who spend the waiting years rebuilding credit and savings arrive at eligibility with a file that can actually close."
      }
    ],
    sources: [
      {
        publisher: "Fannie Mae",
        title:
          "Selling Guide B3-5.3-07, Significant Derogatory Credit Events — Waiting Periods and Re-establishing Credit",
        url: "https://selling-guide.fanniemae.com/sel/b3-5.3-07/significant-derogatory-credit-events-waiting-periods-and-re-establishing-credit"
      },
      {
        publisher: "U.S. Department of Housing and Urban Development",
        title: "FHA Single Family Housing Policy Handbook 4000.1",
        url: "https://www.hud.gov/hud-partners/single-family-handbook-4000-1"
      }
    ],
    related: [
      {
        href: "/resources/collections-medical-debt-mortgage",
        label: "Collections and medical debt"
      },
      { href: "/resources/credit-score-mortgage", label: "How credit scores are used" },
      { href: "/mortgage/fha", label: "FHA loans" },
      { href: "/contact", label: "Talk to a loan advisor" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "mortgage-credit-inquiries",
    category: "qualification",
    title: "Does Rate Shopping Hurt Your Credit? Mortgage Inquiries",
    description:
      "How mortgage credit inquiries really affect your score: hard vs. soft pulls, the rate-shopping window that counts multiple checks as one, and shopping smart.",
    h1: "Mortgage credit inquiries: what rate shopping really does to your score",
    answerSummary:
      "Shopping multiple mortgage lenders does not multiply damage to your credit. Scoring models treat mortgage inquiries made within a shopping window as a single inquiry — the CFPB describes a 45-day window for mortgage credit checks — because comparing lenders for one home is one borrowing decision. A single hard inquiry's effect is small and temporary, checking your own credit costs nothing, and failing to compare offers costs far more than any inquiry.",
    sections: [
      {
        heading: "Hard pulls, soft pulls, and what each does",
        paragraphs: [
          "A hard inquiry happens when a lender checks your credit to make a lending decision — a mortgage preapproval, a card application, an auto loan. It is recorded on your report, visible to other lenders, and factored into scores. A soft inquiry — checking your own credit, prequalification screens, account reviews by existing creditors — is recorded but does not affect your score at all.",
          "The CFPB is direct about the scale here: a hard inquiry has a small negative effect, and inquiries are among the least important factors in a score — far behind payment history and balances. The fear that a credit check will crater a score keeps people from shopping, and the fear is miscalibrated by an order of magnitude."
        ]
      },
      {
        heading: "The shopping window: many pulls, one inquiry",
        paragraphs: [
          "Scoring models are built to accommodate comparison shopping for a single large purchase. When multiple mortgage lenders check your credit within a defined window of time, scoring treats the cluster as a single inquiry. The CFPB's guidance on mortgage credit checks describes a 45-day window within which multiple mortgage checks are recorded as one inquiry for scoring purposes — the logic being that five preapprovals still mean one house and one loan.",
          "Details worth knowing: the deduplication is by loan type, so mortgage inquiries cluster with mortgage inquiries — a card application in the same month is separate and counts on its own. Different scoring model versions have used different window lengths historically, which is why the CFPB's description is the practical anchor: keep your mortgage shopping reasonably compact and the models treat it as the models intend."
        ]
      },
      {
        heading: "How to shop without hurting yourself",
        paragraphs: [
          "The strategy follows directly from the mechanics: decide when you are genuinely ready to transact, then do your comparison inside a compact stretch rather than spreading pulls across many months. A pull in January, another in April, and a third in July are three separate inquiries and — worse — three stale-dated conversations, since a months-old quote reflects a market that no longer exists.",
          "Concentrate the process. Get your documents together first, then engage your comparisons within the same few weeks, and compare Loan Estimates line by line — the standardized form exists precisely so offers can be read side by side. Note that working with a mortgage broker changes the arithmetic here: TRACT shops your scenario across many wholesale lenders from a single application and credit pull on our side, which is comparison shopping with less inquiry surface than serially applying to lender after lender. We arrange the loan; the lenders price and decide it — but you see the spread without repeating the process five times."
        ]
      },
      {
        heading: "What actually costs you money",
        paragraphs: [
          "The inquiry fear inverts the real risk. The measurable cost of a mortgage inquiry cluster is a few points for a limited time. The measurable cost of not comparing offers is a pricing difference you pay monthly for as long as you hold the loan — on a mortgage-sized balance, a small rate difference compounds into a sum that dwarfs any inquiry effect by orders of magnitude. Federal research and CFPB consumer guidance have repeatedly made this point: borrowers who compare multiple offers save real money, and many borrowers still do not shop at all.",
          "Where inquiries genuinely deserve caution is elsewhere: opening new credit accounts — not just inquiries, accounts — during a pending mortgage. New debt mid-process changes your DTI, can trigger re-underwriting, and is the classic self-inflicted closing delay. The rule of thumb: shop the mortgage freely inside your window; open nothing else until after you have the keys."
        ]
      },
      {
        heading: "Timing your credit pulls in the broader process",
        paragraphs: [
          "Sequence matters more than people expect. Check your own reports early — that is a soft pull, free of consequence — and resolve errors before any lender looks. Start hard pulls when you are within range of actually transacting: preapproval when you are ready to make offers, not eighteen months out. Remember, too, that a credit report used for a mortgage has a shelf life in underwriting, so a pull far in advance of your purchase gets repeated anyway. Our rate impact calculator shows what pricing differences translate to in payment terms, which is the number that should drive how seriously you shop. If you want the comparison done across many lenders at once, that is the job TRACT exists to do."
        ]
      }
    ],
    faqs: [
      {
        question: "How many points does a mortgage inquiry cost?",
        answer:
          "For most files, a hard inquiry has a small effect — the CFPB characterizes it as small and temporary, and inquiries sit near the bottom of scoring factor weightings, far behind payment history and utilization. Multiple mortgage inquiries inside the shopping window count as one, so the marginal cost of comparing additional lenders is essentially zero."
      },
      {
        question: "How long do I have to rate shop without extra credit impact?",
        answer:
          "The CFPB describes a 45-day window within which multiple mortgage credit checks are recorded as a single inquiry for scoring. Scoring model versions have differed on window length over the years, so the practical rule is to keep your serious comparison shopping compact — within the same few weeks — rather than engineering to the edge of any window."
      },
      {
        question: "Does getting prequalified hurt my credit?",
        answer:
          "Prequalification based on self-reported information with a soft pull does not affect your score. A preapproval that involves a hard credit pull registers as a mortgage inquiry — small effect, and deduplicated with other mortgage inquiries in the shopping window. Ask any lender which type of pull they use before authorizing it; they are required to have your permission."
      },
      {
        question: "Can I apply for a car loan or credit card while mortgage shopping?",
        answer:
          "The inquiry deduplication only clusters same-type inquiries, so an auto or card inquiry counts separately. More importantly, opening any new account during a pending mortgage changes your debt-to-income ratio and can force re-underwriting or delay closing. Hold all other credit activity until after the mortgage funds."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What happens when a mortgage lender checks my credit?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-exactly-happens-when-a-mortgage-lender-checks-my-credit-en-2005/"
      },
      {
        publisher: "Fannie Mae",
        title: "Selling Guide B3-5.3-09, DU Credit Report Analysis",
        url: "https://selling-guide.fanniemae.com/sel/b3-5.3-09/du-credit-report-analysis"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is a credit score?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-credit-score-en-315/"
      }
    ],
    related: [
      { href: "/calculators/rate-impact", label: "Rate impact calculator" },
      { href: "/resources/credit-score-mortgage", label: "How credit scores are used" },
      { href: "/mortgage/purchase", label: "Purchase loans" },
      { href: "/plan", label: "Build your mortgage plan" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  }
];
