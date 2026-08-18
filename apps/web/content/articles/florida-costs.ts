import type { Article } from "./types";

/**
 * Florida carrying-cost cluster. This is the site's core differentiator: the
 * gap between a Florida payment estimate and a Florida payment reality is
 * almost always insurance, taxes, or a district assessment, and every article
 * here exists to close that gap before a borrower signs a contract.
 */
export const FLORIDA_COSTS_ARTICLES: Article[] = [
  {
    slug: "florida-homeowners-insurance-mortgage",
    category: "florida-costs",
    title: "How Homeowners Insurance Shapes Your Florida Mortgage",
    description:
      "Every lender requires homeowners insurance, and Florida premiums are priced on the building itself. How that premium shapes the loan size you can support.",
    h1: "Why homeowners insurance shapes what you can borrow in Florida",
    answerSummary:
      "Homeowners insurance affects a Florida mortgage twice. Every lender requires coverage to be in place before closing, and the premium counts inside your debt-to-income ratio, so a high premium shrinks the loan size your income can support. Because Florida premiums are priced on the building itself — the roof, the openings, the construction type, the location — the specific house you choose can change what you are able to borrow.",
    sections: [
      {
        heading: "Insurance is a lending requirement, not an option",
        paragraphs: [
          "A mortgage is a loan secured by a building, and the lender's collateral only holds its value if the building is protected. That is why, as the Consumer Financial Protection Bureau explains, lenders generally require proof of homeowners insurance before a loan can close, and why most servicers collect the premium monthly through an escrow account and pay the insurer directly.",
          "The requirement does not end at closing. If coverage lapses during the loan, the servicer can buy force-placed insurance on your behalf — coverage that protects the lender's interest, typically costs more, and gets billed to you. In Florida, where carriers periodically non-renew policies or leave markets, keeping continuous, lender-acceptable coverage is an active part of owning a financed home."
        ]
      },
      {
        heading: "Florida premiums are priced on the building",
        paragraphs: [
          "In much of the country, a homeowners quote is a rounding error in the monthly payment. In Florida it is a structural line item, and it is priced on the physical facts of the specific house. Two homes on the same street, at the same price, can carry very different premiums.",
          "Underwriters look hardest at the features that determine how a house performs in wind, water, and everyday failure modes:"
        ],
        bullets: [
          "Roof: age, material, geometry, and how the roof deck and trusses are attached — the single biggest driver of a Florida quote.",
          "Openings: whether windows, doors, and garage doors have impact protection or rated shutters.",
          "Construction: masonry versus frame, and the building-code era the home was built under.",
          "Location: distance to the coast, wind exposure, and the claims history of the surrounding area.",
          "Systems: the age and condition of electrical, plumbing, and HVAC on older homes, usually documented through a four-point inspection."
        ]
      },
      {
        heading: "Where the premium lands in your numbers",
        paragraphs: [
          "Lenders qualify you on the full monthly housing expense — principal, interest, taxes, and insurance, plus any association dues — measured against your income as a debt-to-income ratio. The insurance premium sits inside that housing expense, so every additional dollar of premium is a dollar of monthly capacity that cannot service loan principal.",
          "This is why the same borrower, with the same income and the same down payment, can support a larger loan on a newer concrete-block home with a recent roof than on an older frame home near the coast. The insurance quote is not a detail to sort out after the contract; it is part of the affordability math from the first showing."
        ]
      },
      {
        heading: "How to shop for a home with insurance in mind",
        paragraphs: [
          "The practical move is to treat an insurance quote like a second appraisal — something you obtain early, on the specific property, before your inspection period runs out."
        ],
        bullets: [
          "Get a property-specific quote from a licensed insurance agent during the inspection period, not after.",
          "Ask the seller for existing wind mitigation and four-point inspection reports; they often transfer useful information even if you re-inspect.",
          "Compare candidate homes on total monthly carrying cost, not list price.",
          "Confirm whether the home also needs separate flood coverage — a standard homeowners policy excludes flood damage."
        ]
      },
      {
        heading: "Where TRACT fits in",
        paragraphs: [
          "TRACT is a mortgage broker: we arrange financing through wholesale lenders, and we do not make loans, approve them, or set their prices. We are also not an insurance agency, so we do not advise on coverage — that is a licensed insurance agent's job. What we do is make sure the real premium for the real house is in your qualification numbers early, so an insurance surprise does not resurface days before closing as a debt-to-income problem. If you are budgeting for a Florida purchase, start with the full payment picture rather than the sticker price."
        ]
      }
    ],
    faqs: [
      {
        question: "Does homeowners insurance count in my debt-to-income ratio?",
        answer:
          "Yes. Lenders qualify you on the full housing payment, which includes the insurance premium along with principal, interest, and property taxes. A higher premium raises that payment and can reduce the loan amount your income supports."
      },
      {
        question: "Can a mortgage fall through because of insurance?",
        answer:
          "A loan cannot close without acceptable coverage in place, so if a home proves difficult or very expensive to insure — often because of roof age or older systems — the financing timeline is at risk. Quoting insurance during the inspection period protects you from discovering this late."
      },
      {
        question: "Does the lender choose my insurance company?",
        answer:
          "No. You select the carrier and coverage with a licensed insurance agent. The lender sets minimum requirements — such as coverage sufficient to protect the collateral and a carrier meeting its financial-strength standards — and verifies proof of coverage before closing."
      },
      {
        question: "Is flood insurance part of a homeowners policy?",
        answer:
          "No. Standard homeowners policies exclude flood damage. If the home sits in a FEMA-designated high-risk flood zone, a federally backed lender must require separate flood coverage, which adds its own premium to the monthly carrying cost."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is homeowner's insurance? Why is homeowner's insurance required?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-homeowners-insurance-why-is-it-important-en-162/"
      },
      {
        publisher: "Florida Department of Financial Services",
        title: "Homeowners' Insurance: A Toolkit for Consumers",
        url: "https://www.myfloridacfo.com/docs-sf/consumer-services-libraries/consumerservices-documents/understanding-coverage/consumer-guides/english---homeowners-insurance-toolkit.pdf"
      }
    ],
    related: [
      { href: "/calculators/debt-to-income", label: "Debt-to-income calculator" },
      { href: "/resources/wind-mitigation-inspection", label: "Wind mitigation inspections" },
      {
        href: "/resources/roof-age-insurance-mortgage",
        label: "Roof age, insurance, and your mortgage"
      },
      { href: "/locations/florida", label: "Getting a mortgage in Florida" },
      { href: "/plan", label: "Build your buying plan" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "wind-mitigation-inspection",
    category: "florida-costs",
    title: "Wind Mitigation Inspections: How They Cut Florida Premiums",
    description:
      "A wind mitigation inspection documents how a home resists hurricane winds. Florida law requires insurers to credit verified features on your premium.",
    h1: "What a wind mitigation inspection documents — and why it changes your premium",
    answerSummary:
      "A wind mitigation inspection documents the features of a home that resist hurricane wind damage: the roof covering, roof deck attachment, roof-to-wall connections, roof shape, secondary water resistance, and opening protection. Florida law requires insurers to offer premium credits for verified features and to accept a uniform inspection form, so the report can lower the windstorm portion of a homeowners premium — and with it, the monthly payment your lender counts.",
    sections: [
      {
        heading: "What the inspection actually is",
        paragraphs: [
          "A wind mitigation inspection is a short, standardized survey of how a house is built to resist wind. A qualified inspector — the categories of professionals authorized to perform it are set out in section 627.711, Florida Statutes — examines the roof system and openings and records the findings on a uniform mitigation verification inspection form that every Florida residential insurer must accept.",
          "The inspection usually takes under an hour. It is not a pass-fail exam and it is not a condition report; it is an inventory of protective features, each of which maps to a credit on the windstorm portion of a homeowners premium."
        ]
      },
      {
        heading: "The features it documents",
        paragraphs: [
          "The form works through the parts of a house that decide whether wind gets in and whether water follows it:"
        ],
        bullets: [
          "Roof covering: whether the shingles, tiles, or metal panels were installed to current Florida Building Code standards.",
          "Roof deck attachment: how the decking is nailed to the trusses — nail size and spacing matter.",
          "Roof-to-wall connection: toe nails, clips, single wraps, or double wraps anchoring the roof structure to the walls.",
          "Roof geometry: a hip roof sheds wind better than a gable and earns a distinct credit.",
          "Secondary water resistance: a sealed roof deck or underlayment that limits water intrusion if the covering fails.",
          "Opening protection: impact-rated windows and doors, or rated shutters, protecting every opening including the garage door."
        ]
      },
      {
        heading: "Why the report changes your premium",
        paragraphs: [
          "Florida law requires insurers to offer discounts, credits, or rate differentials for construction techniques that reduce hurricane wind loss, and to notify policyholders that those savings exist — that is the point of section 627.711 and the Department of Financial Services' consumer guide on mitigation discounts. The credits apply to the windstorm portion of the premium, which in much of Florida is the largest portion.",
          "The size of each credit varies by carrier, territory, and policy form, so no article can honestly tell you a number. What is structural, and worth acting on, is the mechanism: verified features must be credited, and unverified features earn nothing. A house may already have clips or a sealed deck; without the form on file, the insurer prices as if it does not."
        ]
      },
      {
        heading: "What it means for your mortgage",
        paragraphs: [
          "Because lenders qualify you on the full housing payment, an insurance premium reduced by mitigation credits flows directly into your numbers: a lower premium means a lower escrow payment, which means more room in your debt-to-income ratio for principal and interest.",
          "The efficient move for a buyer is to order the wind mitigation inspection alongside the general home inspection during the contract's inspection period. The completed form goes to your insurance agent before the policy is bound, so the first premium — the one your lender underwrites — already reflects the credits. Under the statute, the completed form remains valid for five years, so a recent report from the seller can sometimes be reused; your insurance agent can confirm."
        ]
      },
      {
        heading: "When it is worth doing",
        paragraphs: [
          "For most single-family homes in wind-rated territories, the inspection is inexpensive relative to the credits it can unlock, and it is worth pricing on almost any purchase. It matters most for homes built to modern code, re-roofed recently, or retrofitted with opening protection — the features are likely present and simply need documentation. TRACT arranges financing rather than insurance, so we will not tell you what to insure; we will tell you that the documented premium belongs in your qualification file before you commit to a payment."
        ]
      }
    ],
    faqs: [
      {
        question: "Is a wind mitigation inspection required to get a mortgage?",
        answer:
          "No. Lenders require insurance, not this inspection. It is voluntary — but because insurers must credit the verified features it documents, skipping it can mean paying a higher premium than the house deserves, which raises the payment your lender counts."
      },
      {
        question: "Who can perform a wind mitigation inspection?",
        answer:
          "Section 627.711, Florida Statutes, lists the professionals authorized to complete the uniform form, including licensed home inspectors, general or building contractors, building code inspectors, architects, and engineers with the relevant qualifications."
      },
      {
        question: "How long is the inspection form good for?",
        answer:
          "Under section 627.711, Florida Statutes, a completed uniform mitigation verification form is valid for five years. If the seller has a recent form, ask for it — your insurance agent can confirm whether it can still be used."
      },
      {
        question: "Will an older home benefit?",
        answer:
          "Often, yes — especially if it has been re-roofed under modern code or had shutters or impact openings added. The inspection documents features whenever they exist. If none are present, the report costs little and doubles as a roadmap for which retrofits would earn credits."
      }
    ],
    sources: [
      {
        publisher: "Florida Senate",
        title:
          "Section 627.711, Florida Statutes — Notice of premium discounts for hurricane loss mitigation; uniform mitigation verification inspection form",
        url: "https://www.flsenate.gov/Laws/Statutes/2024/627.711"
      },
      {
        publisher: "Florida Legislature",
        title: "Section 627.711, Florida Statutes (Online Sunshine)",
        url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0600-0699/0627/Sections/0627.711.html"
      },
      {
        publisher: "Florida Department of Financial Services",
        title: "Premium Discounts for Hurricane Loss Mitigation: A Guide for Consumers",
        url: "https://www.myfloridacfo.com/docs-sf/consumer-services-libraries/consumerservices-documents/understanding-coverage/consumer-guides/premium-discounts-for-hurricane-loss-mitigation.pdf"
      }
    ],
    related: [
      {
        href: "/resources/florida-homeowners-insurance-mortgage",
        label: "How insurance shapes your Florida mortgage"
      },
      { href: "/resources/four-point-inspection", label: "The four-point inspection" },
      { href: "/calculators/mortgage-payment", label: "Mortgage payment calculator" },
      { href: "/locations/florida", label: "Getting a mortgage in Florida" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "flood-zones-flood-insurance",
    category: "florida-costs",
    title: "Florida Flood Zones and Flood Insurance for Home Buyers",
    description:
      "FEMA flood zones decide when a lender must require flood insurance. What the zones mean, NFIP vs private coverage, and how to check a home before you offer.",
    h1: "Flood zones and flood insurance: what Florida buyers need to know",
    answerSummary:
      "FEMA maps every community into flood zones that describe flood risk. When a home sits in a high-risk zone — a Special Flood Hazard Area — lenders making federally backed or federally regulated loans must require flood insurance for the life of the loan. Coverage comes through the National Flood Insurance Program or private carriers, and because standard homeowners policies exclude flood damage, the premium is a separate carrying cost to budget before you offer.",
    sections: [
      {
        heading: "What flood zones are",
        paragraphs: [
          "FEMA publishes Flood Insurance Rate Maps that divide every participating community into zones by flood risk. Zones beginning with A or V are Special Flood Hazard Areas — the high-risk designation, with V zones adding coastal wave hazard. Zone X and similar designations mark moderate-to-minimal risk areas outside the hazard boundary.",
          "The maps are public. FEMA's Flood Map Service Center lets you look up any address, and floodsmart.gov — the National Flood Insurance Program's consumer site — explains what each designation means. Checking the zone takes minutes and belongs in your diligence on any Florida property, because so much of the state sits near water that maps, not intuition, are the only reliable guide."
        ]
      },
      {
        heading: "When a lender must require flood insurance",
        paragraphs: [
          "Federal law ties mandatory flood coverage to the maps. If the building securing a federally backed or federally regulated mortgage sits in a Special Flood Hazard Area in a community that participates in the NFIP, the lender must require flood insurance in an amount that protects the loan, and must keep requiring it for the life of the loan. The premium is typically escrowed with your taxes and homeowners insurance, so it lands inside the monthly payment your lender counts when qualifying you.",
          "Two wrinkles matter for buyers. First, maps change: a remapping after closing can newly place a home in a hazard area and trigger a coverage requirement mid-loan, or remove one. Second, mapping is about the building's position; if a lender's determination looks wrong, FEMA has processes — such as a Letter of Map Amendment — for correcting how a specific structure is mapped. Your insurance agent or surveyor can walk you through those."
        ]
      },
      {
        heading: "NFIP versus private flood coverage",
        paragraphs: [
          "The National Flood Insurance Program is the federal program, run by FEMA, that makes flood insurance broadly available through participating carriers; floodsmart.gov is its consumer front door. NFIP pricing reflects each property's own flood risk characteristics, and NFIP policies carry program-defined coverage limits.",
          "A private flood market also operates in Florida and may offer different limits, terms, or pricing for a given home. Lenders can accept qualifying private policies as satisfying the mandatory purchase requirement. Which option fits a particular house and buyer is a coverage decision for a licensed insurance agent — TRACT arranges financing and does not advise on insurance — but the financing-relevant point is simple: the chosen policy's premium goes into your housing expense either way."
        ]
      },
      {
        heading: "What this means when buying in Florida",
        paragraphs: [
          "Treat the flood zone as part of the price of the house. A home in a Special Flood Hazard Area is not a mistake to avoid — much of Florida's most desirable housing sits in one — but its true monthly cost includes a flood premium that a nearly identical home a few streets away may not carry."
        ],
        bullets: [
          "Look up the address in FEMA's Flood Map Service Center before you write an offer.",
          "Get a property-specific flood quote during the inspection period, alongside your homeowners quote.",
          "Ask whether an elevation certificate exists for the home; it can inform rating.",
          "Remember that flooding is not confined to mapped hazard areas — coverage outside them is optional but available, and floodsmart.gov notes that flooding happens everywhere."
        ]
      },
      {
        heading: "Budgeting the full payment",
        paragraphs: [
          "For qualification, a required flood premium behaves exactly like homeowners insurance: it sits in your debt-to-income ratio and moves your maximum loan size. The buyers who get surprised are the ones who budgeted from a listing's estimated payment, which rarely includes flood. Run your affordability numbers with every real carrying cost in them, and the closing table holds no surprises."
        ]
      }
    ],
    faqs: [
      {
        question: "Is flood insurance included in my homeowners policy?",
        answer:
          "No. Standard homeowners policies exclude flood damage. Flood coverage is a separate policy, purchased through the National Flood Insurance Program or a private carrier, with its own premium."
      },
      {
        question: "Can a flood insurance requirement appear after I close?",
        answer:
          "Yes. FEMA periodically remaps communities. If a remapping places your home in a Special Flood Hazard Area, a lender on a federally backed or regulated loan must require coverage from that point forward, and your escrow payment will adjust to include it."
      },
      {
        question: "Do I need flood insurance if I pay cash?",
        answer:
          "No law requires it without a qualifying mortgage. It becomes a pure risk decision: the flood zone describes the hazard whether or not a lender is involved, and homeowners policies will not cover flood losses. A licensed insurance agent can help you weigh it."
      },
      {
        question: "What does Zone X mean?",
        answer:
          "Zone X marks areas of moderate to minimal flood risk outside the Special Flood Hazard Area. Lenders do not have to require flood insurance there, but coverage remains available and is often less expensive — worth pricing, since flood claims also occur outside mapped hazard areas."
      }
    ],
    sources: [
      {
        publisher: "FloodSmart / National Flood Insurance Program",
        title: "Flood Zones and Maps",
        url: "https://www.floodsmart.gov/flood-zones-and-maps"
      },
      {
        publisher: "FEMA",
        title: "FEMA Flood Map Service Center",
        url: "https://msc.fema.gov/portal/home"
      },
      {
        publisher: "FloodSmart / National Flood Insurance Program",
        title: "The National Flood Insurance Program",
        url: "https://www.floodsmart.gov/"
      }
    ],
    related: [
      { href: "/resources/escrow-accounts-florida", label: "How escrow accounts work in Florida" },
      {
        href: "/resources/florida-homeowners-insurance-mortgage",
        label: "How insurance shapes your Florida mortgage"
      },
      { href: "/calculators/affordability", label: "Affordability calculator" },
      { href: "/locations/florida", label: "Getting a mortgage in Florida" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "four-point-inspection",
    category: "florida-costs",
    title: "The Four-Point Inspection: What Florida Insurers Look For",
    description:
      "Florida insurers often require a four-point inspection — roof, electrical, plumbing, HVAC — before covering an older home. What it checks and why it matters.",
    h1: "The four-point inspection: why Florida insurers demand it on older homes",
    answerSummary:
      "A four-point inspection is a short report on the four systems insurers care most about: roof, electrical, plumbing, and heating and air conditioning. Florida carriers commonly require it before writing a policy on an older home because those systems drive most non-hurricane claims. For a buyer with a mortgage, the report can decide whether lender-acceptable coverage is available at a workable price — which in turn decides whether the purchase closes on schedule.",
    sections: [
      {
        heading: "What the four points are",
        paragraphs: [
          "The inspection is exactly what its name says — a snapshot of four systems, prepared by a licensed inspector for an insurance underwriter:"
        ],
        bullets: [
          "Roof: age, material, remaining life, and any evidence of leaks or deterioration.",
          "Electrical: panel brand and condition, wiring type, and hazards such as certain legacy panels or aluminum branch wiring that many carriers treat as uninsurable until remediated.",
          "Plumbing: supply and drain line materials — some discontinued materials, such as polybutylene, are a common reason carriers decline — plus the water heater's age and condition.",
          "HVAC: the age and working order of the heating and cooling systems."
        ]
      },
      {
        heading: "Why insurers demand it on older homes",
        paragraphs: [
          "Aging systems generate claims: water losses from failed supply lines, fires from overloaded panels, interior damage from worn roofs. Underwriters want evidence about the specific house, not the year it was built, so they ask for a current report before binding coverage on older properties.",
          "The clearest public benchmark is Citizens Property Insurance Corporation, Florida's state-created insurer, which requires a four-point inspection with applications for properties above an age threshold it publishes. Private carriers set their own cutoffs and forms, but the pattern is the same across the market: the older the home, the more likely a completed four-point report stands between an application and a bound policy."
        ]
      },
      {
        heading: "How it differs from your home inspection",
        paragraphs: [
          "A buyer's home inspection is a comprehensive condition report produced for you, covering everything from grading to appliances. A four-point is a brief underwriting document produced for an insurer, limited to the four systems and often on a carrier-specified form. One does not substitute for the other.",
          "In practice the same licensed inspector can usually produce both during a single visit, and often adds a wind mitigation form as a third document in the same hour. Ordering them together during the inspection period is the standard Florida play: one appointment yields the buyer's diligence report, the insurer's underwriting report, and the documentation for premium credits."
        ]
      },
      {
        heading: "What it means for your mortgage timeline",
        paragraphs: [
          "Every financed purchase needs proof of acceptable insurance before closing, and on an older home the four-point report is frequently the gate to getting a policy issued at all. A finding — an aging roof, a flagged panel — can mean the carrier declines, surcharges, or conditions coverage on repairs. Any of those outcomes, discovered late, threatens the closing date and can change the payment your lender underwrites.",
          "Discovered early, the same finding is negotiating material: a seller credit, a repair before closing, or a renovation loan structure can resolve it. TRACT arranges financing and is not an insurance agency, so the coverage decisions belong to you and your licensed insurance agent — but sequencing the four-point early is a financing decision, and it is one we push every Florida buyer of an older home to make."
        ]
      },
      {
        heading: "If the report comes back rough",
        paragraphs: [
          "A rough four-point is information, not a dead end. Some findings are inexpensive to remediate relative to the coverage they unlock; some justify renegotiating the contract; some genuinely mean walking away from a house whose true carrying cost is higher than its price suggested. The report's job is to move that discovery from after closing — when it becomes your problem alone — to inside the inspection period, when every option is still open."
        ]
      }
    ],
    faqs: [
      {
        question: "Do lenders require a four-point inspection?",
        answer:
          "Not directly — the requirement comes from insurers. But lenders require insurance, so when a carrier will not bind coverage on an older home without a four-point report, the inspection becomes a practical prerequisite for closing the loan."
      },
      {
        question: "Who orders and pays for it?",
        answer:
          "Typically the buyer, through a licensed home inspector, during the contract's inspection period. It is usually inexpensive, especially bundled with the general home inspection and a wind mitigation inspection in a single visit."
      },
      {
        question: "What happens if a system fails the report?",
        answer:
          "Carriers respond differently: some decline, some exclude or surcharge, some bind coverage conditioned on repairs within a set window. Early discovery lets you negotiate repairs or credits with the seller, or structure financing that funds the fix, before the closing date is at risk."
      },
      {
        question: "Does a newer home need one?",
        answer:
          "Usually not. Carriers generally reserve the requirement for homes past a published age threshold — Citizens states its own on its inspections page. Your insurance agent will tell you whether a specific carrier wants one for a specific house."
      }
    ],
    sources: [
      {
        publisher: "Citizens Property Insurance Corporation",
        title: "Inspections",
        url: "https://www.citizensfla.com/inspections"
      },
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is homeowner's insurance? Why is homeowner's insurance required?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-homeowners-insurance-why-is-it-important-en-162/"
      },
      {
        publisher: "Florida Department of Financial Services",
        title: "Homeowners' Insurance: A Toolkit for Consumers",
        url: "https://www.myfloridacfo.com/docs-sf/consumer-services-libraries/consumerservices-documents/understanding-coverage/consumer-guides/english---homeowners-insurance-toolkit.pdf"
      }
    ],
    related: [
      {
        href: "/resources/roof-age-insurance-mortgage",
        label: "Roof age, insurance, and your mortgage"
      },
      { href: "/resources/wind-mitigation-inspection", label: "Wind mitigation inspections" },
      { href: "/mortgage/purchase", label: "Purchase loans" },
      { href: "/plan", label: "Build your buying plan" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "roof-age-insurance-mortgage",
    category: "florida-costs",
    title: "Roof Age, Insurance, and Your Florida Mortgage",
    description:
      "In Florida, roof age can decide whether a home is insurable — and insurance is a condition of closing. What insurers weigh, and what Florida law limits.",
    h1: "Why roof age can decide whether a Florida home can be financed",
    answerSummary:
      "In Florida, roof age can determine whether a home can be insured, and insurance is a condition of every mortgage closing. Underwriters weigh the roof's age, material, and remaining useful life before binding a policy. Florida law limits how far they can take that: under section 627.7011, Florida Statutes, an insurer generally cannot refuse to write or renew a homeowners policy solely because of roof age when the roof has sufficient remaining useful life.",
    sections: [
      {
        heading: "The roof leads every Florida underwriting file",
        paragraphs: [
          "Florida property insurance is, to a first approximation, roof insurance. The roof is the component most exposed to hurricanes, the source of the water intrusion that follows wind damage, and the subject of a large share of claims and litigation. So carriers underwrite it first: its age, its material, its installation code era, and its documented condition.",
          "For a buyer, this means the roof is not just a maintenance item — it is a gate. A house that cannot get lender-acceptable insurance at a workable premium cannot close on schedule, whatever the appraisal says. Quoting insurance on the specific roof, during the inspection period, is how you find out which side of the gate a house is on."
        ]
      },
      {
        heading: "What Florida law says insurers cannot do",
        paragraphs: [
          "The Legislature drew a line on roof-age refusals. Under section 627.7011(5), Florida Statutes, an insurer may not refuse to issue or renew a homeowners policy on a residential structure solely because of roof age if the roof is less than fifteen years old. For older roofs, the statute lets the homeowner obtain an inspection by an authorized professional, and the insurer may not refuse solely because of age if that inspection shows the roof has five years or more of useful life remaining.",
          "Read the mechanics carefully: the statute constrains refusals based solely on age. Insurers can still decline for documented condition problems, and they still price on the roof they see. But for a well-maintained older roof, a current inspection attesting to remaining useful life is the tool the law gives you to keep coverage available. The statute's full text is on the Florida Senate and Online Sunshine sites; verify current language there, because Florida insurance law has moved quickly in recent sessions."
        ]
      },
      {
        heading: "How roof age plays into a purchase",
        paragraphs: [
          "On a financed purchase, roof age shows up in three places at once. The insurer underwrites it before binding coverage, often through a four-point inspection on older homes. The appraiser notes visible condition problems, and loan programs require the property to meet their standards — an actively leaking or end-of-life roof can draw a repair condition on the loan itself. And the premium the roof produces lands in your escrow payment and debt-to-income ratio, moving what you can borrow.",
          "The buyers who navigate this well move the roof conversation to the front of the transaction: they ask the roof's age in the first showing, request permits and re-roof documentation from the seller, and get a property-specific insurance quote before the inspection period expires."
        ]
      },
      {
        heading: "Material and documentation matter as much as age",
        paragraphs: [
          "Age alone understates the picture. Different coverings age differently — metal and tile systems generally serve longer than asphalt shingle, and carriers distinguish among them. Documentation moves outcomes too: a permitted re-roof establishes the age on paper, a roof inspection attests to remaining life for the statutory protection, and a wind mitigation form converts deck attachment and covering details into premium credits. A roof with paperwork is, for underwriting purposes, a different roof than the same one without it."
        ]
      },
      {
        heading: "The practical playbook",
        paragraphs: ["What we suggest Florida buyers do on any home where the roof is not new:"],
        bullets: [
          "Ask the listing agent for the roof's age and any re-roof permit before offering.",
          "Order the four-point and wind mitigation inspections with your home inspection.",
          "Get an insurance quote on the actual roof during the inspection period.",
          "If the roof is older but sound, ask your inspector about a roof inspection documenting remaining useful life, which supports the protection in section 627.7011, Florida Statutes.",
          "If replacement is unavoidable, negotiate — a seller credit, escrowed replacement, or a renovation loan can fund it. TRACT can walk you through financing structures; the coverage questions belong with a licensed insurance agent."
        ]
      }
    ],
    faqs: [
      {
        question: "Can an insurer refuse to cover a home just because the roof is old?",
        answer:
          "Florida law limits that. Under section 627.7011(5), Florida Statutes, an insurer may not refuse to write or renew a homeowners policy solely because of roof age when the roof is under the statutory age threshold, or when an authorized inspection shows at least five years of useful life remaining. Refusals for documented condition problems remain permitted."
      },
      {
        question: "Does the lender itself check roof age?",
        answer:
          "Lenders see the roof through the appraisal and program property standards — obvious leaks or an end-of-life roof can trigger repair conditions on the loan. The insurability check runs in parallel through the carrier, and the loan cannot close without acceptable coverage in place."
      },
      {
        question: "Should I negotiate a roof replacement into the purchase?",
        answer:
          "If the roof blocks affordable coverage, yes — it is a carrying-cost problem priced into the house. Options include a price reduction, a seller-paid replacement before closing, or a renovation loan that funds the work. The right structure depends on the contract timeline and the loan program."
      },
      {
        question: "Will a new roof lower my premium?",
        answer:
          "A new roof changes what underwriters price, and a wind mitigation inspection after re-roofing documents the code-compliant covering and deck attachment that Florida law requires insurers to credit. Ask a licensed insurance agent to quote the difference for the specific home — figures vary by carrier and territory."
      }
    ],
    sources: [
      {
        publisher: "Florida Senate",
        title:
          "Section 627.7011, Florida Statutes — Homeowners' policies; offer of replacement cost coverage and law and ordinance coverage",
        url: "https://www.flsenate.gov/Laws/Statutes/2024/627.7011"
      },
      {
        publisher: "Florida Legislature",
        title: "Section 627.7011, Florida Statutes (Online Sunshine)",
        url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0600-0699/0627/Sections/0627.7011.html"
      },
      {
        publisher: "Citizens Property Insurance Corporation",
        title: "Inspections",
        url: "https://www.citizensfla.com/inspections"
      }
    ],
    related: [
      { href: "/resources/four-point-inspection", label: "The four-point inspection" },
      { href: "/resources/wind-mitigation-inspection", label: "Wind mitigation inspections" },
      { href: "/mortgage/renovation", label: "Renovation loans" },
      { href: "/contact", label: "Talk to TRACT" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "citizens-property-insurance",
    category: "florida-costs",
    title: "What Citizens Property Insurance Means for Florida Buyers",
    description:
      "Citizens is Florida's state-created insurer of last resort. How eligibility, depopulation, and assessments work when the home you buy is insured by Citizens.",
    h1: "Citizens Property Insurance: how Florida's insurer of last resort works",
    answerSummary:
      "Citizens Property Insurance Corporation is the not-for-profit, state-created insurer the Florida Legislature established for property owners who cannot find coverage in the private market. It is built to be a last resort: eligibility rules steer applicants toward comparable private offers, a depopulation program moves policies back to private carriers, and policyholders accept exposure to surcharges and assessments after severe storm years. Buyers financing a Citizens-insured home should understand all three mechanics.",
    sections: [
      {
        heading: "What Citizens is and why it exists",
        paragraphs: [
          "Citizens describes itself plainly: the state's insurer of last resort, created by the Florida Legislature as a not-for-profit, tax-exempt government entity to cover people who are entitled to coverage in good faith but cannot obtain it in the private market. When private carriers tighten underwriting or leave territories — a recurring feature of Florida's market — Citizens is the backstop that keeps homes insurable and therefore financeable.",
          "For a buyer, the practical meaning is reassuring on its face: if the private market will not quote the house you are buying, coverage that satisfies your lender is still available. The rest of this article is about the strings attached."
        ]
      },
      {
        heading: "Eligibility is designed to push you private",
        paragraphs: [
          "Citizens is not meant to compete with private carriers, so eligibility is conditioned on the private market's response to your application. In concept: if a private carrier offers comparable coverage at a premium within a threshold set by Florida law, you may be ineligible for Citizens or required to accept the private offer. Citizens operates a clearinghouse that compares your application against participating private carriers for exactly this purpose.",
          "The thresholds and comparison rules are statutory and have been adjusted repeatedly, so treat the concept as stable and the numbers as something your licensed insurance agent confirms against Citizens' current published rules."
        ]
      },
      {
        heading: "Depopulation: your policy may be moved",
        paragraphs: [
          "Florida law requires Citizens to run a depopulation program that matches its policyholders with private insurers willing to assume their policies; every assuming carrier must be approved by the Florida Office of Insurance Regulation. If you hold a Citizens policy, you can receive assumption offers, and whether you may decline them depends on how the private offer's premium compares with your Citizens premium under the current statutory test.",
          "For a homeowner with a mortgage, a depopulation offer is not just an insurance event. A change of carrier or premium mid-loan flows into your escrow account at the next annual analysis and can move your monthly payment. Read assumption offers carefully and involve your insurance agent before the response deadline."
        ]
      },
      {
        heading: "Surcharges and assessments: the tail risk",
        paragraphs: [
          "Citizens' capacity to pay claims after a catastrophic season is backed by its power to levy charges. Citizens policyholders can face a policyholder surcharge when the corporation runs a deficit, and if deficits persist, emergency assessments can be levied more broadly — reaching insurance consumers across Florida's market, not only Citizens customers. Citizens publishes the current structure and caps on its assessments page.",
          "This is the honest trade of the last-resort market: availability in exchange for tail-risk exposure. When you budget a Citizens-insured home, the premium is the known cost; the assessment mechanism is the contingent one worth understanding before you rely on the coverage for decades."
        ]
      },
      {
        heading: "What this means for your mortgage",
        paragraphs: [
          "Lenders routinely accept Citizens coverage, so a Citizens-insured home is financeable in the ordinary way: the premium is escrowed, counted in your debt-to-income ratio, and verified before closing. TRACT arranges loans — we do not make or price them, and we are not an insurance agency — so our role is making sure the Citizens premium, and any pending depopulation offer on a home you are buying, is reflected in the payment you qualify on. If the seller's coverage is on Citizens, ask early whether your own application will be Citizens-eligible or routed to a private carrier at a different premium; that answer belongs in your numbers, not in your closing week."
        ]
      }
    ],
    faqs: [
      {
        question: "Do mortgage lenders accept Citizens insurance?",
        answer:
          "Yes, Citizens coverage is widely accepted for Florida mortgages. The premium is treated like any other homeowners premium: escrowed with the payment, included in qualification math, and verified before closing."
      },
      {
        question: "Can I just choose Citizens because it is cheaper?",
        answer:
          "Not necessarily. Eligibility depends on the private market's response — Florida law can make you ineligible when a comparable private offer falls within a statutory premium threshold. A licensed insurance agent runs that comparison; the current rules are published by Citizens."
      },
      {
        question: "What is depopulation and can it affect me mid-loan?",
        answer:
          "Depopulation is the program, required by Florida law, that moves Citizens policies to approved private insurers. If your policy is assumed or your premium changes, your escrow account adjusts at the next analysis, which can raise or lower your monthly payment."
      },
      {
        question: "What are Citizens assessments?",
        answer:
          "They are the charges Citizens can levy after severe deficits: a surcharge on its own policyholders, and if needed, emergency assessments spread across insurance consumers in Florida. Current percentages and caps change with law and circumstance — check Citizens' assessments page for the published figures."
      }
    ],
    sources: [
      {
        publisher: "Citizens Property Insurance Corporation",
        title: "Who We Are",
        url: "https://www.citizensfla.com/who-we-are"
      },
      {
        publisher: "Citizens Property Insurance Corporation",
        title: "Depopulation",
        url: "https://www.citizensfla.com/depopulation"
      },
      {
        publisher: "Citizens Property Insurance Corporation",
        title: "Assessments",
        url: "https://www.citizensfla.com/assessments"
      }
    ],
    related: [
      {
        href: "/resources/florida-homeowners-insurance-mortgage",
        label: "How insurance shapes your Florida mortgage"
      },
      { href: "/resources/escrow-accounts-florida", label: "How escrow accounts work in Florida" },
      { href: "/locations/florida", label: "Getting a mortgage in Florida" },
      { href: "/plan", label: "Build your buying plan" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "florida-property-taxes-reset",
    category: "florida-costs",
    title: "Why Florida Property Taxes Reset When You Buy a Home",
    description:
      "Save Our Homes caps protect the seller, not you. A sale resets the assessment to market value, so budgeting from the seller's tax bill understates your real bill.",
    h1: "Why the seller's property tax bill is not your property tax bill",
    answerSummary:
      "Florida reassesses a home when it changes hands. The Save Our Homes cap limits annual assessed-value growth only for the current homesteaded owner; a sale removes that accumulated benefit, and the property appraiser resets the assessment to market value for the year after purchase. Budgeting from the seller's tax bill can therefore understate your real bill — sometimes dramatically — so careful buyers and careful lenders estimate taxes from the purchase price instead.",
    sections: [
      {
        heading: "How Florida assesses property",
        paragraphs: [
          "Each January, county property appraisers determine every property's just value — essentially market value — and then apply any assessment limitations and exemptions to reach taxable value. Local taxing authorities set millage rates through the public Truth in Millage process, and the tax bill is taxable value times those rates, plus any non-ad valorem assessments such as community development district charges. The Florida Department of Revenue's taxpayer pages lay out the full cycle.",
          "The structure matters for buyers because two of its pieces — the assessment limitation and the homestead exemption — attach to the owner, not the house. They do not ride along with the deed."
        ]
      },
      {
        heading: "What Save Our Homes does for the current owner",
        paragraphs: [
          "Under the Save Our Homes limitation in section 193.155, Florida Statutes, once a home has a homestead exemption, its assessed value cannot rise each year by more than three percent or the change in the Consumer Price Index, whichever is lower — regardless of what the market does. Over a long tenure in an appreciating market, the gap between market value and capped assessed value grows large. That accumulated gap is the owner's Save Our Homes benefit.",
          "This is why a longtime owner of a valuable home can be paying taxes on an assessed value far under what the home would sell for. The system is working as designed — for them."
        ]
      },
      {
        heading: "What the sale does",
        paragraphs: [
          "When the property changes ownership, the limitation resets. The property appraiser reassesses the home at just value as of January first following the sale, the seller's accumulated benefit disappears, and your taxes are computed from a market-value assessment going forward. You then start your own clock: file for your homestead exemption, and the Save Our Homes cap begins limiting increases from your new, higher base.",
          "If you are moving from a previous Florida homestead, portability may soften the reset: the Department of Revenue explains that you can transfer some or all of your prior Save Our Homes benefit to the new homestead by filing the transfer form with your homestead application within the statutory window. Portability helps repeat Florida homesteaders; it does nothing for first-time buyers or arrivals from out of state."
        ]
      },
      {
        heading: "Where budgets go wrong",
        paragraphs: [
          "The failure mode is mechanical. A listing shows the seller's most recent tax bill — a bill computed on a capped assessment and the seller's exemptions. A buyer, or a hurried estimate, projects that bill forward. The first post-reset bill arrives computed on the purchase-price-level assessment, and it can be a multiple of the number in the listing.",
          "With a mortgage, the surprise compounds: your escrow account was funded at the old figure, so the higher bill produces an escrow shortage, and your monthly payment rises to cover both the correct taxes and the shortfall repayment. Nothing about the loan changed — the tax estimate was simply wrong from the start."
        ]
      },
      {
        heading: "How to budget it correctly",
        paragraphs: [
          "The correction is straightforward and worth doing before you write an offer:"
        ],
        bullets: [
          "Estimate taxes from your purchase price and the local millage, not from the seller's bill. Most county property appraiser sites offer a buyer tax estimator for exactly this reason.",
          "Subtract only the exemptions you will hold — and remember your homestead exemption and any portability apply beginning with the first assessment year you qualify.",
          "Check the bill for non-ad valorem assessments, which do not reset but also do not go away.",
          "Ask TRACT to run qualification and escrow numbers on the reassessed estimate, so the loan is sized against the taxes you will actually pay."
        ]
      }
    ],
    faqs: [
      {
        question: "Will my property taxes match the seller's tax bill?",
        answer:
          "Usually not. The seller's bill reflects their capped assessed value and exemptions, which end at the sale. Your bill will be computed from a reassessment at market value as of January first after your purchase, with only your own exemptions applied."
      },
      {
        question: "When does the reassessment take effect?",
        answer:
          "The property appraiser reassesses at just value as of January first following the change of ownership. Your first full tax bill on the new assessment often arrives the year after closing — which is exactly when under-funded escrow accounts discover the gap."
      },
      {
        question: "Does portability help me as a buyer?",
        answer:
          "Only if you are moving from a prior Florida homestead. Portability lets you transfer accumulated Save Our Homes benefit to a new Florida homestead by filing the required forms with the county property appraiser within the statutory window. First-time buyers and out-of-state arrivals start from the full reassessed value."
      },
      {
        question: "How should taxes be estimated for my loan?",
        answer:
          "From the purchase price and local millage — not the seller's bill. Ask for the estimate your qualification is based on. TRACT runs Florida files this way so the debt-to-income math and the initial escrow deposit reflect the post-sale reality."
      }
    ],
    sources: [
      {
        publisher: "Florida Department of Revenue",
        title: "Property Tax Information for Taxpayers",
        url: "https://floridarevenue.com/property/Pages/Taxpayers.aspx"
      },
      {
        publisher: "Florida Department of Revenue",
        title: "Save Our Homes Assessment Limitation and Portability Transfer (PT-112)",
        url: "https://floridarevenue.com/property/Documents/pt112.pdf"
      },
      {
        publisher: "Florida Department of Revenue",
        title: "Property Tax Exemptions and Additional Benefits",
        url: "https://floridarevenue.com/property/Pages/Taxpayers_Exemptions.aspx"
      }
    ],
    related: [
      { href: "/resources/homestead-exemption-florida", label: "The Florida homestead exemption" },
      { href: "/resources/escrow-accounts-florida", label: "How escrow accounts work in Florida" },
      { href: "/calculators/affordability", label: "Affordability calculator" },
      { href: "/locations/florida", label: "Getting a mortgage in Florida" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "homestead-exemption-florida",
    category: "florida-costs",
    title: "Florida Homestead Exemption: Filing, Savings, Portability",
    description:
      "Florida's homestead exemption trims your primary home's taxable value and starts the Save Our Homes cap. Filing with your county, deadlines, and portability.",
    h1: "The Florida homestead exemption: what it does and how to claim it",
    answerSummary:
      "Florida's homestead exemption removes part of a primary residence's assessed value from property taxation and, just as importantly, starts the Save Our Homes cap that limits future assessment growth. You apply with the county property appraiser using Form DR-501, generally by March first of the qualifying year, and owners moving between Florida homesteads can transfer accumulated Save Our Homes savings through portability. It applies only to your permanent residence — never to second homes or rentals.",
    sections: [
      {
        heading: "What the exemption actually exempts",
        paragraphs: [
          "The homestead exemption reduces the assessed value on which your property taxes are computed, for a home you own and occupy as your permanent residence as of January first. Florida structures it in tiers — a base exemption plus an additional exemption on higher assessed-value bands, with part of the benefit not applying to school district taxes. The dollar amounts are set by law and have been adjusted over time, so check the Florida Department of Revenue's exemptions page for the current figures rather than trusting a number frozen in an article.",
          "Florida also layers additional exemptions on top for qualifying groups — seniors, veterans, people with disabilities, first responders — each with its own criteria and paperwork, all filed through the same county property appraiser."
        ]
      },
      {
        heading: "The quieter benefit: it starts the Save Our Homes clock",
        paragraphs: [
          "The exemption's headline is the reduction in taxable value, but its compounding benefit is that a homesteaded property becomes subject to the Save Our Homes assessment limitation. From your first homesteaded year, annual increases in assessed value are capped by law regardless of how fast the market moves, and the gap between market value and your capped assessment accumulates as a benefit you may later port to your next Florida home.",
          "That is why filing promptly matters even in a flat market: the cap can only protect you from years it was in force for."
        ]
      },
      {
        heading: "How and when to file",
        paragraphs: [
          "You file once, with the property appraiser in the county where the home sits — not with the state. The Department of Revenue's guidance is to submit all applications and documentation to the county property appraiser, and most counties now take filings online."
        ],
        bullets: [
          "Form: DR-501, the original application for homestead and related exemptions.",
          "Timing: you must own and occupy the home as your permanent residence on January first of the year you claim; the general filing deadline is March first.",
          "Proof: expect to show Florida residency evidence — driver license, voter registration, vehicle registration — tied to the property address.",
          "One homestead: the exemption applies to a single permanent residence; claiming it on a rental, second home, or two properties at once invites back taxes and penalties.",
          "Renewal: once granted it generally renews automatically while your use of the home is unchanged, but you must notify the appraiser if the property stops being your homestead."
        ]
      },
      {
        heading: "Portability: carrying your cap benefit to the next home",
        paragraphs: [
          "If you had a Florida homestead and are establishing a new one, you may transfer — port — some or all of your accumulated Save Our Homes benefit to the new home, lowering its assessed value from the start. Per the Department of Revenue, you file the Transfer of Homestead Assessment Difference, Form DR-501T, together with your DR-501, and you must establish the new homestead within the statutory window measured from when you abandoned the old one.",
          "Portability is a Florida-to-Florida benefit. It cannot import savings from another state, and it cannot inherit the seller's benefit — their cap history dies with their sale."
        ]
      },
      {
        heading: "What it means for your mortgage payment",
        paragraphs: [
          "Property taxes are usually escrowed, so the exemption reaches your monthly payment through the tax bill: a lower taxable value means a smaller escrow requirement once a bill reflecting your exemption is issued. Note the sequencing for new buyers — your first bills may precede your exemption taking effect, and your escrow analysis catches up afterward. TRACT arranges the loan and cannot file your exemption for you, but we flag the filing on every Florida homestead purchase we work on, because it is among the few carrying costs a borrower can lower with an hour of paperwork."
        ]
      }
    ],
    faqs: [
      {
        question: "Do second homes or rentals qualify for the homestead exemption?",
        answer:
          "No. It applies only to a home you own and occupy as your permanent residence as of January first. Investment property and part-time residences are excluded, and improperly claiming the exemption can trigger back taxes, penalties, and interest."
      },
      {
        question: "When should I file after buying?",
        answer:
          "As soon as you occupy the home as your permanent residence. You qualify based on your status on January first, and the general deadline to file with the county property appraiser is March first of that year. Filing early costs nothing and protects the deadline."
      },
      {
        question: "Does the seller's homestead exemption transfer to me?",
        answer:
          "No. Exemptions and the seller's Save Our Homes benefit end with their ownership, and the property is reassessed at market value after the sale. You must file your own application, and only a prior Florida homestead of your own can supply portability savings."
      },
      {
        question: "Will the exemption lower my monthly mortgage payment?",
        answer:
          "Indirectly, yes. Lower property taxes reduce what your escrow account must collect, and your servicer's annual escrow analysis adjusts the payment once the reduced bill arrives. The timing lags the filing, so budget on the pre-exemption figure until the analysis catches up."
      }
    ],
    sources: [
      {
        publisher: "Florida Department of Revenue",
        title: "Property Tax Exemptions and Additional Benefits",
        url: "https://floridarevenue.com/property/Pages/Taxpayers_Exemptions.aspx"
      },
      {
        publisher: "Florida Department of Revenue",
        title: "Save Our Homes Assessment Limitation and Portability Transfer (PT-112)",
        url: "https://floridarevenue.com/property/Documents/pt112.pdf"
      }
    ],
    related: [
      {
        href: "/resources/florida-property-taxes-reset",
        label: "Why Florida property taxes reset at sale"
      },
      { href: "/resources/escrow-accounts-florida", label: "How escrow accounts work in Florida" },
      { href: "/calculators/mortgage-payment", label: "Mortgage payment calculator" },
      { href: "/plan", label: "Build your buying plan" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "escrow-accounts-florida",
    category: "florida-costs",
    title: "How Escrow Accounts Work on Florida Mortgages",
    description:
      "Escrow folds taxes and insurance into your payment, trued up by an annual analysis. Why Florida escrow shortages are common and what to do when payments jump.",
    h1: "Escrow accounts in Florida: how they work and why shortages are common",
    answerSummary:
      "An escrow account folds property taxes and insurance premiums into the monthly mortgage payment: the servicer collects a prorated share each month and pays the bills when due. Federal rules require an annual analysis that trues the account up against actual bills. Florida escrow shortages are common because both inputs move — insurance premiums reprice at renewal and property taxes reset to market value after a sale — so the payment set at closing rarely holds through year two.",
    sections: [
      {
        heading: "How an escrow account works",
        paragraphs: [
          "When your loan has an escrow account — most Florida loans do, and some are required to — each monthly payment includes a slice of the year's expected property taxes and insurance premiums. The servicer holds those funds and, as the Consumer Financial Protection Bureau describes it, manages the account and pays the bills on your behalf when they come due. At closing you fund an initial deposit so the account can meet its first bills; the rules in Regulation X, at 12 CFR 1024.17, govern how much can be collected and allow a limited cushion against increases.",
          "The design goal is smoothing: instead of facing a large tax bill in the fall and an insurance renewal in one lump, you pay a level monthly amount and the servicer handles the timing."
        ]
      },
      {
        heading: "The annual escrow analysis",
        paragraphs: [
          "Once a year, the servicer must re-run the math: compare what the account collected and paid against what the coming year's bills will require. Regulation X prescribes the method and the outcomes. A meaningful surplus is returned to you; a shortage is collected, typically by spreading it over the following year's payments; a deficiency — where the account went negative — has its own repayment rules. You receive a statement showing the projections behind your new payment.",
          "Understand what the analysis is not: it is not a rate change. On a fixed-rate loan, principal and interest never move. When a Florida payment jumps at analysis time, the loan is doing exactly what it promised — the taxes and insurance riding along with it got more expensive."
        ]
      },
      {
        heading: "Why Florida shortages are so common",
        paragraphs: [
          "Escrow projections assume next year looks like last year. In Florida, it often does not, for reasons this resource library covers in depth:"
        ],
        bullets: [
          "Insurance repricing: Florida premiums are re-underwritten at renewal, and carrier changes, roof aging, and market conditions can move them substantially.",
          "The property tax reset: after a sale, the assessment resets to market value, so a first escrow funded from the seller's capped bill undershoots the real bill.",
          "New construction: the first bill may tax land only; the first full bill on the completed home can be several times larger, and escrow projections built on the land-only bill miss badly.",
          "Exemption timing: your homestead exemption may not apply until the year after purchase, so the earliest bills run high before relief arrives.",
          "Added assessments: flood coverage newly required by remapping, or non-ad valorem items like community development district charges, join the bill and the escrow requirement."
        ]
      },
      {
        heading: "What a shortage does to your payment",
        paragraphs: [
          "A shortage moves your payment twice at once: the escrow portion rises to match the new, higher bills going forward, and the past shortfall gets repaid, usually spread across the coming year. That is why the jump can feel outsized relative to the tax or premium change that caused it. Servicers generally offer the alternative of paying the shortage as a lump sum, which removes the repayment component but not the higher go-forward escrow.",
          "If the analysis looks wrong, check its inputs first — the projected tax and premium figures are printed on the statement. A misapplied exemption or an outdated premium is fixable, and the servicer must re-analyze with corrected figures."
        ]
      },
      {
        heading: "Budgeting so year two does not surprise you",
        paragraphs: [
          "The defense is to qualify and budget on realistic year-two numbers from the start: taxes estimated from your purchase price rather than the seller's bill, and a property-specific insurance quote rather than a placeholder. That is how TRACT structures Florida files — we arrange the loan, we do not make it, and the most useful thing a broker does on a Florida purchase is refuse to let an optimistic escrow estimate into the qualification math. If you want the full payment picture before you shop, start with a plan session."
        ]
      }
    ],
    faqs: [
      {
        question: "Why did my payment go up if my rate is fixed?",
        answer:
          "Because the escrow portion moved. Principal and interest are fixed; taxes and insurance are not. The annual escrow analysis raised your payment to cover higher bills and, if the account ran short, to repay the shortage — typically spread over the next twelve months."
      },
      {
        question: "Can I waive escrow and pay taxes and insurance myself?",
        answer:
          "Sometimes. Whether escrow can be waived depends on the loan program, the lender's rules, and the loan's characteristics — some loans require escrow by regulation. Where a waiver is available it may carry conditions or pricing adjustments, and you take on the timing of large bills yourself."
      },
      {
        question: "What should I expect on a new construction home?",
        answer:
          "Expect the largest escrow swing of any purchase type. Early bills may reflect land value only; the first full assessment on the completed home is far higher, and the escrow analysis that follows can raise the payment sharply. Budget from the completed home's estimated taxes, not the builder-era bill."
      },
      {
        question: "Is an escrow shortage a penalty or a servicer error?",
        answer:
          "Neither, usually. It means the bills exceeded the projections — routine in Florida after a purchase-year tax reset or an insurance repricing. Verify the analysis inputs, correct anything stale, and treat the new payment as the real carrying cost of the home."
      }
    ],
    sources: [
      {
        publisher: "Consumer Financial Protection Bureau",
        title: "What is an escrow or impound account?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-an-escrow-or-impound-account-en-140/"
      },
      {
        publisher: "eCFR",
        title: "12 CFR 1024.17 — Escrow accounts (Regulation X)",
        url: "https://www.ecfr.gov/current/title-12/chapter-X/part-1024/subpart-B/section-1024.17"
      }
    ],
    related: [
      {
        href: "/resources/florida-property-taxes-reset",
        label: "Why Florida property taxes reset at sale"
      },
      { href: "/resources/cdd-fees-explained", label: "CDD fees explained" },
      { href: "/calculators/mortgage-payment", label: "Mortgage payment calculator" },
      { href: "/mortgage/purchase", label: "Purchase loans" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  },
  {
    slug: "cdd-fees-explained",
    category: "florida-costs",
    title: "CDD Fees Explained: Florida Community Development Districts",
    description:
      "Many newer Florida communities carry CDD assessments on the tax bill — bond repayment plus operations. What a CDD is and how to budget for one before you buy.",
    h1: "CDD fees explained: the assessment on the tax bill in newer Florida communities",
    answerSummary:
      "A community development district, or CDD, is a special-purpose local government created under chapter 190, Florida Statutes, to finance a new community's infrastructure — roads, utilities, stormwater, amenities — with bonds repaid through assessments on each home. Those assessments appear as non-ad valorem line items on the annual property tax bill, so they raise the true carrying cost of homes in many newer Florida communities and belong in any affordability calculation.",
    sections: [
      {
        heading: "What a CDD is",
        paragraphs: [
          "Florida's Uniform Community Development District Act — chapter 190, Florida Statutes — lets developers of large new communities establish a special-purpose district with its own governing board and the power to issue bonds. The bonds pay for the infrastructure that makes the community livable on day one: roads, water and sewer, stormwater systems, and often clubhouses, pools, and landscaping.",
          "Instead of burying those costs in home prices, the district spreads them across the homes as assessments collected over time. That is the entire mechanism behind the CDD fee: you are repaying a share of the neighborhood's construction loan, plus funding its ongoing operations."
        ]
      },
      {
        heading: "How the assessment is structured",
        paragraphs: [
          "A CDD assessment typically has two components, and the difference matters when you budget:"
        ],
        bullets: [
          "Debt service: your home's share of the district's bond repayment. It amortizes over the bond term, eventually ends, and on many lots can be paid off early in a lump sum — some current owners already have.",
          "Operations and maintenance: the annual cost of running district facilities. It continues indefinitely and is set by the district board each year.",
          "Collection: both components usually appear on the annual property tax bill as non-ad valorem assessments — charges based on benefit rather than property value, which the Florida Department of Revenue distinguishes from ad valorem taxes.",
          "No reset, no relief: CDD assessments are not affected by the homestead exemption or Save Our Homes, and they do not reset at sale — they simply continue on their own schedule."
        ]
      },
      {
        heading: "How CDD fees hit a mortgage budget",
        paragraphs: [
          "Because the assessment rides on the property tax bill, a servicer escrowing your taxes collects the CDD amounts with them — the fee is inside your monthly payment whether or not you ever think about it. It likewise belongs in qualification: the housing expense your lender measures against your income should reflect the real tax bill, CDD lines included.",
          "The comparison-shopping consequence is the important one. Two similar homes at the same price, one in a CDD community and one not, do not cost the same per month. The CDD home may also offer amenities the other cannot; the point is not that CDDs are bad, but that the fee is part of the price and should be compared as such."
        ]
      },
      {
        heading: "Questions to ask before buying in a CDD community",
        paragraphs: [
          "The details vary by district and even by lot, so ask for specifics in writing:"
        ],
        bullets: [
          "What is the total annual CDD assessment on this lot, and how does it split between debt service and operations?",
          "How many years remain on the bond debt, and has this lot's share already been paid off by a prior owner?",
          "What has the operations assessment done over the past several years — flat, rising, or spiky?",
          "What do the assessments fund, and are major amenity expansions or refinancings planned?",
          "Is there also a homeowners association? CDD and HOA are separate obligations, and many communities carry both."
        ]
      },
      {
        heading: "CDD versus HOA — and where TRACT fits",
        paragraphs: [
          "A CDD is a unit of special-purpose government with statutory powers, including assessment collection through the tax bill; an HOA is a private association billing dues directly. They fund different things, are enforced differently, and can coexist on the same house. When both exist, both belong in your monthly math.",
          "TRACT arranges Florida mortgages — we do not make or price loans — and CDD diligence is one of the places a Florida-focused broker earns its keep: we make sure district assessments are captured in the tax figure your qualification and escrow are built on, so the community's amenities do not arrive with a payment surprise. Run candidate homes through an affordability calculation with the full tax bill, CDD included, before you fall in love with the clubhouse."
        ]
      }
    ],
    faqs: [
      {
        question: "Is a CDD fee the same thing as HOA dues?",
        answer:
          "No. A CDD is a special-purpose government created under chapter 190, Florida Statutes, collecting assessments through the property tax bill; an HOA is a private association billing dues separately. A single community can have both, and each belongs in your monthly budget."
      },
      {
        question: "Do CDD fees ever go away?",
        answer:
          "Partially. The debt-service component ends when the district's bonds are repaid — and on some lots a prior owner has already paid it off. The operations and maintenance component continues as long as the district runs facilities, at a level its board sets each year."
      },
      {
        question: "Do CDD assessments count in my debt-to-income ratio?",
        answer:
          "They should, because they are part of the property's recurring carrying cost collected with the tax bill. Ask whether the tax figure in your qualification reflects the full bill, including non-ad valorem assessments — that is how TRACT prepares Florida files."
      },
      {
        question: "Can I pay off a CDD assessment early?",
        answer:
          "Many districts allow the bond portion tied to a lot to be prepaid in a lump sum, which removes the debt-service line from future bills but not the operations line. The district's management office can quote the payoff figure for a specific lot."
      }
    ],
    sources: [
      {
        publisher: "Florida Senate",
        title: "Chapter 190, Florida Statutes — Community Development Districts",
        url: "https://www.flsenate.gov/Laws/Statutes/2024/Chapter190"
      },
      {
        publisher: "Florida Legislature",
        title: "Chapter 190, Florida Statutes (Online Sunshine)",
        url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0100-0199/0190/0190.html"
      },
      {
        publisher: "Florida Department of Revenue",
        title: "Property Tax Information for Taxpayers",
        url: "https://floridarevenue.com/property/Pages/Taxpayers.aspx"
      }
    ],
    related: [
      { href: "/resources/escrow-accounts-florida", label: "How escrow accounts work in Florida" },
      {
        href: "/resources/florida-property-taxes-reset",
        label: "Why Florida property taxes reset at sale"
      },
      { href: "/calculators/affordability", label: "Affordability calculator" },
      { href: "/locations/florida", label: "Getting a mortgage in Florida" }
    ],
    publishedAt: "2026-08-18",
    lastReviewed: "2026-08-18"
  }
];
