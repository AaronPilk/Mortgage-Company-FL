import type { Metadata } from "next";
import Image from "next/image";
import { ANALYSIS_TYPE_META } from "@/components/vision/copy";
import { ConceptPair } from "@/components/vision/concept-media";
import {
  Badge,
  ButtonLink,
  Card,
  CtaPanel,
  Disclosure,
  FeatureStatus,
  Prose,
  Section,
  SectionHeading,
  Stat
} from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { publicFeatures } from "@/lib/env";

export const metadata: Metadata = pageMetadata({
  title: "TRACT Vision",
  description:
    "Model a renovation, rental, construction, or flip scenario in your browser. Every assumption visible, every gap named, no contact details to see the result.",
  path: "/vision",
  imagePath: "/images/og/vision.png",
  noIndex: true
});

/**
 * TRACT Vision.
 *
 * The scenario engine is deterministic arithmetic in `@tract/vision-model` — the
 * same class of tested, versioned functions that power the calculators. It needs
 * no AI provider, so it is not gated behind one: gating it would withhold a
 * working tool for the sake of a narrative layer that is not required to produce
 * a single figure.
 *
 * What the AI feature flag does gate is written narrative and imagery. Those are
 * off, and this page says so rather than implying a capability that is not there.
 */
export default function VisionPage() {
  const features = publicFeatures();

  return (
    <>
      <Section width="default" orbs pad="head">
        <SectionHeading
          as="h1"
          eyebrow="TRACT Vision"
          title="Model a property before you commit"
          gradientWord="before you commit"
          description="Renovation, addition, rental, construction, and flip scenarios — with every assumption on the same screen as the number it produced, and every gap named rather than papered over."
        />
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/vision/start" data-cta="vision-hero-start">
            Model a scenario
          </ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Talk it through with a person
          </ButtonLink>
        </div>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Free, immediate, and no contact details until after you have seen the result.
        </p>
      </Section>

      <Section width="default" pad="tight">
        <div className="grid gap-8 sm:grid-cols-3">
          <Stat
            value="8"
            label="Scenario types, from a kitchen refresh to land and new construction"
          />
          <Stat
            value="0"
            label="Figures presented as a single fake-precise number — everything is a range"
          />
          <Stat value="0" label="Contact details required to see your result" />
        </div>
      </Section>

      <Section width="default" tone="surface">
        <SectionHeading
          title="What it actually does"
          gradientWord="actually"
          description="It runs finance arithmetic on numbers you supply, and it is honest about the numbers you did not."
        />
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <h3 className="text-lg font-semibold text-[var(--text)]">Ranges, never a point</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
              Every scenario runs three times — one unfavourable set of assumptions, one middle, one
              favourable — and each end of the band is a coherent story rather than the worst corner
              of every input at once. If a range cannot honestly be produced, the figure is not
              shown.
            </p>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold text-[var(--text)]">
              Your inputs and our placeholders, kept apart
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
              The result lists what you entered, what the model assumed on your behalf, and which
              figures each one drove. Any assumption we supplied is marked{" "}
              <span className="font-medium text-[var(--text)]">
                modelled assumption — not market data
              </span>
              , because that is what it is.
            </p>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold text-[var(--text)]">
              A list of what nobody checked
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
              Zoning, permitting, flood zone, insurance availability, rent support, and the absence
              of comparable sales are named on every result, with the authority that can settle each
              one. A gap stated plainly is more useful than a plausible number nobody can trace.
            </p>
          </Card>
        </div>
      </Section>

      <Section width="default">
        <SectionHeading
          title="Eight scenarios it will model"
          description="Each asks for different numbers and produces different figures."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {ANALYSIS_TYPE_META.map((entry) => (
            <Card key={entry.type} as="article">
              <h3 className="font-semibold text-[var(--text)]">{entry.label}</h3>
              <p className="mt-1.5 text-sm text-[var(--text-muted)]">{entry.blurb}</p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                <span className="font-semibold text-[var(--text)]">Tells you:</span> {entry.answers}
              </p>
            </Card>
          ))}
        </div>
        <div className="mt-8">
          <ButtonLink href="/vision/start" data-cta="vision-types-start">
            Start with any of them
          </ButtonLink>
        </div>
      </Section>

      {/*
        Imagery, with the same rule the arithmetic gets: say what it is.

        These illustrate what a scenario type means. They are not Vision output —
        Vision produces no imagery at all today, which the section below says in
        as many words — and the altered half of each pair carries its disclosure
        in the layout, emitted by `ConceptVisual` rather than by this page, so it
        cannot be laid out away.
      */}
      <Section width="default">
        <SectionHeading
          title="What a concept image is, and is not"
          gradientWord="is not"
          description="Three of those scenarios, drawn as a before and an after. Every altered image says so on the image. None of these is Vision output — Vision computes figures and produces no imagery at all — and none of them depicts a real project, a real client, or a real address."
        />
        <div className="space-y-10">
          <ConceptPair
            kind="renovation"
            heading="Renovation"
            body="A cosmetic refresh on an older bungalow. What a scenario like this actually turns on is the cost you enter and the resale assumption you choose, not how the picture looks."
            before={{
              src: "/images/vision/renovation-before.webp",
              alt: "A dated single-storey Florida bungalow with a covered porch and tropical planting",
              width: 1440,
              height: 900
            }}
            after={{
              src: "/images/vision/renovation-after-concept.webp",
              alt: "The same bungalow illustrated with fresh paint, tidier planting and brighter trim",
              width: 1440,
              height: 900
            }}
          />
          <ConceptPair
            kind="addition"
            heading="Addition"
            body="A modest wing beside an existing house. Whether it may be built at all is a setback, zoning, and permitting question, and the model answers none of them — it lists them as unverified instead."
            before={{
              src: "/images/vision/addition-before.webp",
              alt: "A two-storey Florida house with an attached garage on a suburban lot",
              width: 1440,
              height: 900
            }}
            after={{
              src: "/images/vision/addition-after-concept.webp",
              alt: "The same house illustrated with a single-storey wing added to one side",
              width: 1440,
              height: 900
            }}
          />
          <ConceptPair
            kind="land_placement"
            heading="Land and new construction"
            body="A house placed on open ground. Access, utility capacity, wetland delineation, and permitted use decide whether that placement is even possible, and a picture cannot settle any of them."
            before={{
              src: "/images/vision/land-aerial.webp",
              alt: "Open Florida pasture with scattered oaks and a two-track sand drive",
              width: 1440,
              height: 900
            }}
            after={{
              src: "/images/vision/land-home-concept.webp",
              alt: "The same land illustrated with a single-storey house set back at the end of the drive",
              width: 1440,
              height: 900
            }}
          />
        </div>
      </Section>

      <Section width="narrow" tone="surface">
        <SectionHeading
          title="What it will never do"
          gradientWord="never"
          description="These are not caveats added at the end. They are the reason the tool is built the way it is."
        />
        <Prose>
          <ul>
            <li>
              It will not tell you a property is a good deal or a bad one, and it will not recommend
              that you buy, build, renovate, or sell anything.
            </li>
            <li>
              It will not produce an appraisal, a valuation, a broker price opinion, a construction
              bid, a zoning or permitting opinion, or an offer of credit.
            </li>
            <li>
              It will not invent a comparable sale, a construction cost per square foot, a market
              rent, or an after-repair value and present it as data. Where a real source would be
              needed, it uses a labelled placeholder you can change and lists it as unverified.
            </li>
            <li>
              It will not assert that a use is permitted, that a permit will issue, or that a
              property is outside a flood zone. Those come from the city, the county, and FEMA.
            </li>
            <li>
              It will not ask for a contact detail to show you a result, and it will not put your
              address, price, budget, rent, or income into an analytics event.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section width="narrow">
        <SectionHeading
          title="How the arithmetic works"
          description="The part that matters most is the part that is deliberately boring."
        />
        <Prose>
          <p>
            Every figure comes from tested, versioned functions in a package that has no network
            access, no clock, and no randomness — the same input produces the same output, forever.
            Money is held as integer cents and rates as basis points, so nothing drifts through
            rounding. The whole model runs in your browser in milliseconds and costs nothing to run,
            which is exactly why there is no reason to charge you an email address for it.
          </p>
          <p>
            A language model performs none of it. AI in Vision is reserved for written narrative and
            imagery around figures that were already computed, and it is switched off until it is
            configured — because a model that guesses at a number and a model that describes one are
            different things, and only the second is safe.
          </p>
        </Prose>
        <div className="mt-6 flex flex-wrap gap-3">
          <Badge tone="success">Scenario engine: available now</Badge>
          <FeatureStatus
            label="AI narrative and imagery"
            status={features.vision ? "coming_soon" : "off"}
          />
        </div>
      </Section>

      <Section width="default" pad="tight">
        {/*
          Generic Florida photography, and nothing more. It carries no alteration
          badge because nothing about it has been altered — but the caption still
          states what it is not, because a cover image is exactly the kind of
          picture a reader assumes belongs to somebody in particular.
        */}
        <figure className="m-0 mb-10 grid gap-6 sm:grid-cols-[minmax(0,20rem)_1fr] sm:items-center">
          <Image
            src="/images/vision/report-cover.webp"
            alt="A single-storey Florida bungalow with a covered porch, framed as a cover image"
            width={1200}
            height={900}
            sizes="(max-width: 640px) 100vw, 320px"
            className="aspect-[4/3] w-full rounded-2xl object-cover"
            style={{ boxShadow: "var(--shadow-float)" }}
          />
          <figcaption className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            <span className="font-semibold" style={{ color: "var(--text)" }}>
              If you want the write-up, ask for it after the result.
            </span>{" "}
            The scenario runs and displays without a contact detail; a written summary is something
            you request afterwards, once you have already seen the figures. The cover image above is
            generic photography chosen for this page — it is not a property anybody modelled, not a
            client&rsquo;s home, and not a report about a real address.
          </figcaption>
        </figure>
        <CtaPanel
          title="See your numbers first"
          body="Run the scenario, read the assumptions, look at what nobody has verified. Then decide whether it is worth a conversation."
          primary={{ href: "/vision/start", label: "Model a scenario", cta: "vision-footer-start" }}
          secondary={{ href: "/calculators", label: "Browse the calculators" }}
        />
      </Section>

      <Section width="narrow" pad="tight">
        <Disclosure
          headline="A scenario model, not advice."
          body="Vision produces models built from assumptions you choose and labelled placeholders we supply. Nothing it produces is an appraisal, a valuation, a broker price opinion, an offer of credit, or a guarantee of value, rent, cost, or return. Zoning, permitting, flood zone, and insurance availability must be verified with the applicable authority and are never asserted here."
        />
      </Section>
    </>
  );
}
