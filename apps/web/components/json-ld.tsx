import { serializeJsonLd } from "@tract/seo";

/**
 * Server-rendered JSON-LD. The serializer escapes `<`, so a value containing a
 * closing script tag cannot break out of the block.
 */
export function JsonLd({ value }: { value: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(value) }}
    />
  );
}
