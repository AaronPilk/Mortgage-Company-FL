import type { Metadata } from "next";
import Link from "next/link";
import { Disclosure, Prose, Section, SectionHeading } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";

/**
 * The on-page buyer's guide — deliberately noindex.
 *
 * The indexable landing at /florida-buyers-guide is what ranks and captures the
 * lead; this is the guide itself, delivered to anyone who requests it (and
 * readable directly). It is noindex so it does not compete with the landing page
 * for the same query and so the two pages are not near-duplicate content.
 *
 * Every figure that changes — a tax rate, an insurance premium, a program limit —
 * is deferred to its primary source rather than stated here (invariant 6). The
 * guide teaches how the pieces work and links to the tools and program pages that
 * carry the current specifics.
 */

export const metadata: Metadata = pageMetadata({
  title: "Florida Home-Buying Guide",
  description:
    "The full first-time buyer's guide for Florida: affordability, the real monthly cost, down-payment help, loan options, credit, and the closing process.",
  path: "/florida-buyers-guide/guide",
  noIndex: true
});

const GUIDE_AS_OF = "August 2026";

export default function FloridaBuyersGuidePage() {
  return (
    <Section width="narrow" pad="head" orbs>
      <SectionHeading
        as="h1"
        eyebrow="Your guide"
        title="Buying your first home in Florida"
        gradientWord="Florida"
        description="A plain-language walk through the whole path — what you can afford, what it really costs to own here, which loans and help exist, and how a purchase closes."
      />

      <nav
        aria-label="Guide contents"
        className="mt-8 rounded-2xl border p-6"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--purple)]">
          What&apos;s inside
        </p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-[var(--text-muted)]">
          <li>
            <a className="underline underline-offset-2" href="#afford">
              How much home you can actually afford
            </a>
          </li>
          <li>
            <a className="underline underline-offset-2" href="#monthly-cost">
              The real monthly cost: taxes, insurance, and flood
            </a>
          </li>
          <li>
            <a className="underline underline-offset-2" href="#down-payment">
              Down payments and Florida assistance
            </a>
          </li>
          <li>
            <a className="underline underline-offset-2" href="#loans">
              Choosing a loan: conventional, FHA, VA, USDA
            </a>
          </li>
          <li>
            <a className="underline underline-offset-2" href="#qualifying">
              Credit, DTI, and getting preapproved
            </a>
          </li>
          <li>
            <a className="underline underline-offset-2" href="#closing">
              Making an offer and the path to closing
            </a>
          </li>
          <li>
            <a className="underline underline-offset-2" href="#next">
              A plain-language glossary and your next step
            </a>
          </li>
        </ol>
      </nav>

      <div className="mt-10">
        <Prose>
          <h2 id="afford">How much home you can actually afford</h2>
          <p>
            Affordability is not a single number a website hands you — it is the overlap of what a
            lender will approve and what your own budget is comfortable carrying. Lenders look
            mostly at your debt-to-income ratio: your monthly debts, including the new housing
            payment, against your gross monthly income. Our{" "}
            <Link href="/resources/dti-explained">explainer on DTI</Link> covers how it works, and
            the <Link href="/calculators/debt-to-income">DTI calculator</Link> and{" "}
            <Link href="/calculators/affordability">affordability calculator</Link> let you try your
            own numbers privately, in your browser.
          </p>
          <p>
            The trap in Florida is thinking about the loan payment alone. What you can afford turns
            on the whole payment — principal, interest, taxes, and insurance, together called{" "}
            <Link href="/resources/what-is-piti">PITI</Link>. Because Florida&apos;s taxes and
            insurance can be a large share of that total, run a{" "}
            <Link href="/calculators/mortgage-payment">full payment estimate</Link> before you fall
            for a price, and start with the{" "}
            <Link href="/mortgage/first-time-home-buyers">first-time buyer overview</Link> for the
            bigger picture.
          </p>

          <h2 id="monthly-cost">The real monthly cost: taxes, insurance, and flood</h2>
          <p>
            This is the section that surprises new Florida buyers. Two costs move the monthly
            payment more than the interest rate often does: property insurance and property taxes.
            Start with{" "}
            <Link href="/resources/florida-homeowners-insurance-mortgage">
              Florida homeowners insurance
            </Link>
            , then understand that flood is a separate policy — whether a lender requires it depends
            on the specific property&apos;s{" "}
            <Link href="/resources/flood-zones-flood-insurance">flood zone</Link> on FEMA&apos;s
            current map. On an older home, a{" "}
            <Link href="/resources/wind-mitigation-inspection">wind mitigation inspection</Link> can
            change the premium meaningfully.
          </p>
          <p>
            Taxes have a Florida-specific twist. A seller&apos;s current tax bill is usually a poor
            guide to yours, because the assessed value{" "}
            <Link href="/resources/florida-property-taxes-reset">resets after a sale</Link>. The{" "}
            <Link href="/resources/homestead-exemption-florida">homestead exemption</Link> and the
            Save Our Homes cap then shape your bill going forward. We do not quote a millage rate
            here on purpose — it changes yearly and varies by county, so the county Property
            Appraiser is the source for the exact number. County pages such as{" "}
            <Link href="/florida-mortgage/hillsborough-county">Hillsborough</Link> and{" "}
            <Link href="/florida-mortgage/pinellas-county">Pinellas</Link> walk through the local
            reality and link that office directly.
          </p>

          <h2 id="down-payment">Down payments and Florida assistance</h2>
          <p>
            The down payment, not the monthly payment, is what stops most first-time buyers — and it
            is smaller than many people assume. How much you need depends on the loan program, not a
            single rule; our guide on{" "}
            <Link href="/resources/down-payment-how-much">how much to put down</Link> lays out the
            options. If some of your funds are a gift, the{" "}
            <Link href="/resources/gift-funds-rules">gift funds rules</Link> explain how that is
            documented.
          </p>
          <p>
            Florida also runs real programs that help. The state&apos;s housing agency and many
            counties offer{" "}
            <Link href="/florida-down-payment-assistance">down payment assistance</Link>, usually as
            a second mortgage that layers on top of your main loan. Income and price limits change
            and vary by county, so eligibility is a licensed officer&apos;s call against the current
            tables — but the money is worth asking about early, because funding is finite.
          </p>

          <h2 id="loans">Choosing a loan: conventional, FHA, VA, and USDA</h2>
          <p>
            There is no single best loan — there is the one that fits your credit, your down
            payment, and the property. The four common paths are{" "}
            <Link href="/mortgage/conventional">conventional</Link>,{" "}
            <Link href="/mortgage/fha">FHA</Link>, <Link href="/mortgage/va">VA</Link>, and{" "}
            <Link href="/mortgage/usda">USDA</Link>. Conventional loans let mortgage insurance come
            off as equity builds; FHA is more flexible on credit but carries its own insurance; VA
            offers eligible veterans strong terms with no required down payment; and USDA helps in
            eligible areas — more of Florida than you might expect.
          </p>
          <p>
            The most common first-time comparison is{" "}
            <Link href="/resources/conventional-vs-fha">conventional versus FHA</Link>, and it turns
            on your specific numbers rather than a rule of thumb. A licensed loan officer runs both
            for you; the program pages above explain who each one tends to fit and who should look
            elsewhere.
          </p>

          <h2 id="qualifying">Credit, DTI, and getting preapproved</h2>
          <p>
            Qualifying rests on three things working together: your{" "}
            <Link href="/resources/credit-score-mortgage">credit</Link>, your{" "}
            <Link href="/resources/dti-explained">debt-to-income ratio</Link>, and your down payment
            and reserves. No one of them decides the outcome alone. Before you shop seriously, get a{" "}
            <Link href="/resources/preapproval-vs-prequalification">preapproval</Link> — it sharpens
            your price range and makes your offer credible to a seller, and it is stronger than a
            quick prequalification because it rests on documented information.
          </p>
          <p>
            A preapproval is still conditional: it is not a commitment to lend, and the loan must
            still clear underwriting, the property must appraise and be insurable, and any
            conditions must be met. It is a planning tool, not a guarantee — which is exactly why it
            is worth getting early.
          </p>

          <h2 id="closing">Making an offer and the path to closing</h2>
          <p>
            Once your offer is accepted, you put down{" "}
            <Link href="/resources/earnest-money-florida">earnest money</Link> — a good-faith
            deposit held in escrow and credited to you at closing — and the loan process begins in
            earnest. Within three business days of applying you receive a{" "}
            <Link href="/resources/loan-estimate-explained">Loan Estimate</Link>, the standardized
            form that lets you compare lenders line by line.
          </p>
          <p>
            From there the lender orders an{" "}
            <Link href="/resources/home-appraisal-explained">appraisal</Link>,{" "}
            <Link href="/resources/title-insurance-florida">title work</Link> confirms clean
            ownership, and underwriting reviews everything. Before you sign, you get a{" "}
            <Link href="/resources/closing-disclosure-explained">Closing Disclosure</Link> at least
            three business days ahead so you can check the final numbers against your estimate. The{" "}
            <Link href="/resources/closing-timeline-florida">Florida closing timeline</Link> lays
            out the whole sequence and how long each step usually takes.
          </p>

          <h2 id="next">A plain-language glossary and your next step</h2>
          <p>
            If a term trips you up along the way, the{" "}
            <Link href="/mortgage-glossary">mortgage glossary</Link> defines the vocabulary in plain
            language, with the Florida-specific entries — homestead, flood insurance, millage,
            Citizens — that the national glossaries skip. When you are ready to turn this into your
            own numbers, run a scenario in the <Link href="/plan">planner</Link> or{" "}
            <Link href="/contact">talk it through with a licensed mortgage professional</Link>. No
            credit pull, no application, no obligation.
          </p>
        </Prose>
      </div>

      <p className="mt-8 text-xs text-[var(--text-muted)]">Current as of {GUIDE_AS_OF}.</p>

      <Disclosure
        headline="Education, not advice — and never an offer of credit."
        body="This guide explains how home buying and financing generally work in Florida. It is not financial, legal, or tax advice, not an offer of credit, a rate quote, or a preapproval, and program rules, tax figures, and insurance costs change and are property-specific. Confirm anything here against the responsible official source, and a licensed loan officer confirms what you actually qualify for. Wholesale Mortgage Lending arranges, but does not make, mortgage loans."
      />
    </Section>
  );
}
