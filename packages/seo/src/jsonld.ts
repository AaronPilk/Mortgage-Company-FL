/**
 * JSON-LD builders.
 *
 * Every value here must correspond to something visible on the page and true
 * about the business. Unverified identity facts are represented as null and are
 * omitted from the graph rather than invented.
 */

export type BusinessIdentity = {
  legalName: string;
  brandName: string;
  siteUrl: string;
  logoPath: string;
  /** null until the license is issued and confirmed on NMLS Consumer Access. */
  nmlsId: string | null;
  companyLicenseId: string | null;
  telephone: string | null;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
  } | null;
  areaServed: string[];
  sameAs: string[];
};

type Node = Record<string, unknown>;

function omitEmpty(node: Node): Node {
  return Object.fromEntries(
    Object.entries(node).filter(([, value]) => {
      if (value === null || value === undefined) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    })
  );
}

/**
 * A mortgage broker is not a lender. The schema type must not imply otherwise,
 * and no LocalBusiness node is emitted until a real public address exists.
 */
export function organizationNode(identity: BusinessIdentity): Node {
  const hasPublicOffice = identity.address !== null;
  return omitEmpty({
    "@type": hasPublicOffice ? ["Organization", "FinancialService"] : "Organization",
    "@id": `${identity.siteUrl}#organization`,
    name: identity.legalName,
    alternateName: identity.brandName === identity.legalName ? null : identity.brandName,
    url: identity.siteUrl,
    logo: omitEmpty({
      "@type": "ImageObject",
      url: `${identity.siteUrl}${identity.logoPath}`
    }),
    telephone: identity.telephone,
    identifier: identity.nmlsId === null ? null : `NMLS #${identity.nmlsId}`,
    address:
      identity.address === null
        ? null
        : omitEmpty({ "@type": "PostalAddress", ...identity.address, addressCountry: "US" }),
    areaServed: identity.areaServed.map((name) => ({ "@type": "AdministrativeArea", name })),
    sameAs: identity.sameAs
  });
}

export function webSiteNode(identity: BusinessIdentity): Node {
  return {
    "@type": "WebSite",
    "@id": `${identity.siteUrl}#website`,
    url: identity.siteUrl,
    name: identity.brandName,
    publisher: { "@id": `${identity.siteUrl}#organization` },
    inLanguage: "en-US"
  };
}

export function webPageNode(input: {
  identity: BusinessIdentity;
  url: string;
  name: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
}): Node {
  return omitEmpty({
    "@type": "WebPage",
    "@id": `${input.url}#webpage`,
    url: input.url,
    name: input.name,
    description: input.description,
    isPartOf: { "@id": `${input.identity.siteUrl}#website` },
    datePublished: input.datePublished ?? null,
    dateModified: input.dateModified ?? null,
    inLanguage: "en-US"
  });
}

export function breadcrumbNode(items: { name: string; url: string }[]): Node {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export type ArticleInput = {
  url: string;
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  authorUrl?: string;
  reviewerName?: string;
  identity: BusinessIdentity;
};

export function articleNode(input: ArticleInput): Node {
  return omitEmpty({
    "@type": "Article",
    "@id": `${input.url}#article`,
    headline: input.headline.slice(0, 110),
    description: input.description,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: omitEmpty({
      "@type": "Person",
      name: input.authorName,
      url: input.authorUrl ?? null
    }),
    reviewedBy:
      input.reviewerName === undefined ? null : { "@type": "Person", name: input.reviewerName },
    publisher: { "@id": `${input.identity.siteUrl}#organization` },
    mainEntityOfPage: { "@id": `${input.url}#webpage` }
  });
}

export type FaqItem = { question: string; answer: string };

/**
 * Only emit FAQ markup when the page actually renders these exact questions and
 * answers. Valid markup does not entitle anyone to a rich result, and marking up
 * content the visitor cannot see is a structured-data policy violation.
 */
export function faqNode(items: FaqItem[], visibleOnPage: boolean): Node | null {
  if (!visibleOnPage || items.length === 0) return null;
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    }))
  };
}

/**
 * MortgageLoan describes the financial product concept on an educational page.
 * It must never carry a rate, an APR, or an amount presented as an available
 * offer, because no such offer exists until a lender extends one.
 */
export function mortgageLoanNode(input: {
  name: string;
  description: string;
  loanType: string;
  url: string;
  identity: BusinessIdentity;
}): Node {
  return {
    "@type": "MortgageLoan",
    name: input.name,
    description: input.description,
    loanType: input.loanType,
    url: input.url,
    // The broker arranges credit; the lender provides it. Neither is asserted here.
    provider: { "@id": `${input.identity.siteUrl}#organization` }
  };
}

export function graph(nodes: (Node | null)[], identity: BusinessIdentity): Node {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter((node): node is Node => node !== null),
    ...(identity.siteUrl === "" ? {} : {})
  };
}

/** Escape `<` so a JSON-LD block can never terminate its own script element. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
