export type PropertyMediaItem = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

const PROPERTY_MEDIA: Record<string, PropertyMediaItem[]> = {
  "FX-STP-0001": [
    {
      src: "/images/properties/fixture-st-pete-bungalow-01.webp",
      width: 1600,
      height: 1000,
      alt: "Synthetic St. Petersburg bungalow beneath mature tropical trees"
    },
    {
      src: "/images/properties/fixture-st-pete-bungalow-02.webp",
      width: 1200,
      height: 1000,
      alt: "Closer synthetic view of the bungalow porch and landscaping"
    }
  ],
  "FX-TPA-0002": [
    {
      src: "/images/properties/fixture-tampa-contemporary-01.webp",
      width: 1600,
      height: 1000,
      alt: "Synthetic contemporary Tampa home in warm natural light"
    }
  ],
  "FX-SRQ-0003": [
    {
      src: "/images/properties/fixture-sarasota-coastal-01.webp",
      width: 1600,
      height: 1000,
      alt: "Synthetic Sarasota coastal-influenced single-story home"
    }
  ],
  "FX-ORL-0004": [
    {
      src: "/images/properties/fixture-orlando-suburban-01.webp",
      width: 1600,
      height: 1000,
      alt: "Synthetic two-story Orlando suburban home"
    }
  ],
  "FX-JAX-0005": [
    {
      src: "/images/properties/fixture-jacksonville-duplex-01.webp",
      width: 1600,
      height: 1000,
      alt: "Synthetic Jacksonville duplex used for rental planning"
    }
  ],
  "FX-LOT-0006": [
    {
      src: "/images/properties/fixture-florida-lot-01.webp",
      width: 1600,
      height: 1000,
      alt: "Synthetic vacant Florida residential lot bordered by mature trees"
    }
  ],
  "FX-LND-0007": [
    {
      src: "/images/properties/fixture-florida-land-01.webp",
      width: 1600,
      height: 1000,
      alt: "Synthetic elevated view across a larger Florida land parcel"
    }
  ]
};

export function propertyMedia(listingKey: string): PropertyMediaItem[] {
  return PROPERTY_MEDIA[listingKey] ?? [];
}
