/**
 * Inline links inside content strings.
 *
 * Articles, glossary entries and program pages are typed data with plain-string
 * paragraphs, so a link in the middle of a sentence needs a small markup. The
 * syntax is the Markdown one, limited to on-site paths: `[anchor text](/path)`.
 * Anything that is not a root-relative path stays literal text, so an external
 * URL can never be smuggled into a paragraph this way; outbound references
 * belong in `sources`, where they are labelled as sources.
 *
 * Pure functions, no React, so the unit test and the content linter can read
 * the same grammar the renderer uses.
 */

export type InlineSegment =
  { kind: "text"; text: string } | { kind: "link"; text: string; href: string };

// The anchor cannot contain brackets and the path cannot contain whitespace or
// parentheses, so a stray bracket in prose never matches. "//host" is refused
// too: it is a protocol-relative URL to another site, not an on-site path.
const INLINE_LINK = /\[([^[\]]+)\]\((\/(?!\/)[^()\s]*)\)/g;

export function parseInlineLinks(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(INLINE_LINK)) {
    const start = match.index;
    if (start > cursor) segments.push({ kind: "text", text: text.slice(cursor, start) });
    segments.push({ kind: "link", text: match[1] ?? "", href: match[2] ?? "" });
    cursor = start + match[0].length;
  }
  if (cursor < text.length) segments.push({ kind: "text", text: text.slice(cursor) });
  return segments;
}

/** Every inline link in a string, in order. */
export function inlineLinks(text: string): { text: string; href: string }[] {
  return parseInlineLinks(text).flatMap((segment) =>
    segment.kind === "link" ? [{ text: segment.text, href: segment.href }] : []
  );
}

/** The string as a reader sees it: anchors kept, markup removed. */
export function stripInlineLinks(text: string): string {
  return parseInlineLinks(text)
    .map((segment) => segment.text)
    .join("");
}
