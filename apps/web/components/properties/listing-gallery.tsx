import Image from "next/image";
import type { ListingSummary } from "@tract/integrations";
import { GalleryPlaceholder, PlaceholderTile } from "./gallery-placeholder";

/**
 * The gallery slot on a sample listing.
 *
 * A photograph is the single most persuasive thing a listing page can show, and
 * these records are invented — so adding one raises the labelling requirement
 * rather than relaxing it. Three rules follow from that and none of them are
 * cosmetic:
 *
 * 1. The image is company-generated and served from this repository. It is not
 *    an MLS photograph, a portal image, or stock, so nothing here depends on a
 *    display agreement we do not have.
 * 2. The label sits on the image and in its caption, not only in the page's
 *    sample-data banner, because an image is what gets screenshotted and
 *    forwarded away from the banner that qualified it.
 * 3. A record without an image keeps the placeholder. A generic house photo
 *    attached to an arbitrary record would imply a likeness that does not exist.
 *
 * `ImageBadge` is emitted by this component rather than passed in, so a caller
 * cannot render the picture and omit the label.
 */

function ImageBadge() {
  return (
    <span
      className="absolute left-3 top-3 rounded-md border px-2 py-1 text-[0.7rem] font-bold uppercase tracking-wide"
      style={{
        background: "var(--surface)",
        borderColor: "var(--color-warning)",
        color: "var(--text)"
      }}
    >
      Illustrative image — not a real property
    </span>
  );
}

/** The caption every fixture image carries, wherever it is rendered. */
export function SampleImageCaption({ attribution }: { attribution?: string | undefined }) {
  return (
    <p className="mt-3 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
      {attribution ??
        "Illustrative image generated for sample data. Not a photograph of a real property."}{" "}
      It was generated to illustrate this sample record, it does not depict a building that exists,
      and it is not an MLS or listing-portal photograph — those belong to the listing source and are
      only displayed under a data agreement.
    </p>
  );
}

/**
 * The card thumbnail. Fixed aspect ratio with explicit intrinsic dimensions, so
 * a card does not resize under the reader once the image arrives.
 */
export function ListingCardImage({ listing }: { listing: ListingSummary }) {
  const image = listing.primaryImage;
  if (image === undefined) return null;

  return (
    <div className="relative">
      <Image
        src={image.url}
        alt={image.alt ?? "Illustrative image generated for a sample property record"}
        width={image.width ?? 1600}
        height={image.height ?? 1000}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="aspect-[8/5] w-full rounded-t-2xl object-cover"
      />
      <ImageBadge />
    </div>
  );
}

/** The detail-page gallery. Falls back to the placeholder when there is no image. */
export function ListingGallery({ listing }: { listing: ListingSummary }) {
  const image = listing.primaryImage;
  if (image === undefined) return <GalleryPlaceholder listingKey={listing.listingKey} />;

  const patternId = `gallery-hatch-${listing.listingKey.replace(/[^A-Za-z0-9-]/g, "")}`;

  return (
    <figure className="m-0" aria-label="Illustrative image for a sample property record">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="relative col-span-2 sm:col-span-3 sm:row-span-2">
          <Image
            src={image.url}
            alt={image.alt ?? "Illustrative image generated for a sample property record"}
            width={image.width ?? 1600}
            height={image.height ?? 1000}
            sizes="(max-width: 640px) 100vw, 75vw"
            className="aspect-[8/5] w-full rounded-xl object-cover sm:h-full sm:min-h-[300px]"
          />
          <ImageBadge />
        </div>
        {/* The rest of a real gallery is absent, and is drawn as absent. */}
        <div className="aspect-[4/3]">
          <PlaceholderTile patternId={`${patternId}-1`} />
        </div>
        <div className="aspect-[4/3]">
          <PlaceholderTile patternId={`${patternId}-2`} />
        </div>
      </div>
      <figcaption>
        <SampleImageCaption attribution={image.attribution} />
      </figcaption>
    </figure>
  );
}
