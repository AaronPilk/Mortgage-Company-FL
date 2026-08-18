# Asset manifest

**As of 2026-08-18.**

## The headline

**The site currently ships NO raster image assets. None.**

`apps/web/public/` contains exactly two directories — `brand/` and `og/` — and
**both are empty**. There is not a single `.png`, `.jpg`, `.jpeg`, `.webp`,
`.avif`, `.gif`, `.svg`, or `.ico` file anywhere in `apps/web`.

Everything visual on the site today is inline SVG, CSS, or a typographic
placeholder.

This is not a criticism of the build. It is a fact the next person needs before
they look at a page and assume the imagery is there.

---

## What exists

### Inline SVG, authored in components

Drawn in JSX, not loaded from a file. Nothing to serve, nothing to 404.

| File                                                     | SVG elements | What it draws                |
| -------------------------------------------------------- | -----------: | ---------------------------- |
| `apps/web/app/page.tsx`                                  |            4 | Home page illustrative marks |
| `apps/web/components/rendprop/frames.tsx`                |            3 | RendProp demo frames         |
| `apps/web/components/ui.tsx`                             |            2 | Shared UI icons              |
| `apps/web/components/wordmark.tsx`                       |            1 | The TRACT wordmark           |
| `apps/web/components/theme-toggle.tsx`                   |            1 | Light/dark toggle icon       |
| `apps/web/components/properties/gallery-placeholder.tsx` |            1 | Property photo placeholder   |

### CSS gradients and design tokens

`apps/web/app/globals.css` plus `@tract/tokens`. Gradients are used across the
calculator pages, the calculator index, and `/locations/florida`. Both light and
dark themes are defined (commit `f903d60`, "Give the site a visual language, in
both themes").

### SVG placeholders

`GalleryPlaceholder` stands in for property photography on `/properties` and
`/properties/[listingKey]`. There is no listing imagery, because there is no MLS
agreement and `images.remotePatterns` in `apps/web/next.config.ts` is empty.

---

## What is referenced in code but does not exist

**These paths are requested by the running application and currently return 404.** They are the concrete asset gap.

| Path                           | Referenced from                                            | Consequence today                                                                                           |
| ------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `/brand/icon-192.png`          | `apps/web/app/manifest.ts`                                 | PWA install icon missing.                                                                                   |
| `/brand/icon-512.png`          | `apps/web/app/manifest.ts`                                 | PWA install icon missing.                                                                                   |
| `/brand/icon-maskable-512.png` | `apps/web/app/manifest.ts`                                 | Maskable icon missing; Android install looks broken.                                                        |
| `/brand/wordmark.svg`          | `businessIdentity.logoPath` in `apps/web/lib/site.ts`      | The JSON-LD `Organization.logo` URL resolves to a 404.                                                      |
| `/og/default.png`              | `createMetadata` default in `packages/seo/src/metadata.ts` | Every page's `og:image` and `twitter:image` 404. Every social and chat share renders with no preview image. |

There is also **no favicon** — no `app/icon.*`, no `app/apple-icon.*`, no
`favicon.ico`.

The `og:image` gap is the highest-impact one. It applies to every page on the
site, including the pre-launch home page, and it is visible to anyone who pastes
a link anywhere.

---

## What is still needed

| Asset                                | Spec                                                                                                               | Priority |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | -------- |
| `public/og/default.png`              | 1200 × 630. The dimensions are already declared in `createMetadata`.                                               | High     |
| `public/brand/wordmark.svg`          | Vector wordmark. Should match `components/wordmark.tsx` so the served logo and the rendered one are the same mark. | High     |
| `public/brand/icon-192.png`          | 192 × 192                                                                                                          | High     |
| `public/brand/icon-512.png`          | 512 × 512                                                                                                          | High     |
| `public/brand/icon-maskable-512.png` | 512 × 512, maskable safe zone                                                                                      | High     |
| Favicon                              | `apps/web/app/icon.*` and `apple-icon.*`                                                                           | High     |
| Per-template OG images               | `createMetadata` accepts `imagePath` per page; only the default is missing today.                                  | Medium   |
| Property photography                 | Blocked on the MLS display agreement. `images.remotePatterns` is empty until then.                                 | Blocked  |
| Team and office photography          | Blocked on there being a licensed office and named, licensed people.                                               | Blocked  |

Theme colours are already declared in `apps/web/app/manifest.ts`
(`background_color`, `theme_color`) and should be matched by whatever is
produced.

---

## The labelling rule for generated or virtually-staged imagery

**This is a compliance rule, not a style guide. It applies to every image
produced by a model, and to every photograph altered by one.**

### The rule

1. **Every AI-generated or AI-altered image carries a visible disclosure label,
   rendered next to the image in the UI.** Not in EXIF. Not in a caption block
   two scrolls down. Not in a site-wide footnote. Next to the image, where the
   person looking at it will read it.

2. **The label, the AI flag, and the lineage are immutable once written.** In
   `rendprop_generated_assets`: `disclosure_label`, `ai_generated`,
   `source_asset_id`, `transformation`, `storage_key`, and `lineage` are frozen
   by the `rendprop_freeze_disclosure` trigger. Approval is the only field a
   later UPDATE may move. Without that, "approve" could quietly become "approve
   and relabel as a photograph".

3. **A generated asset cannot exist without a label.** Constraint
   `rendprop_generated_carries_a_label`:
   `check (not ai_generated or length(btrim(disclosure_label)) > 0)`.

4. **Approval is attributed.** Constraint `rendprop_approval_is_attributed`
   requires `approved_by` and `approved_at` on any asset in the `approved` state.

5. **Lineage is recorded, not implied.** `source_asset_id` is the primary input
   with `on delete restrict` — an original cannot be deleted out from under a
   derivative that claims to be a view of it. `lineage` carries every other
   contributing input, the model, and the prompt version.

6. **Virtual staging is disclosed as virtual staging specifically.** "Enhanced"
   is not an adequate label for furniture that is not in the room. Say what was
   done: `virtual_staging`, `clutter_cleanup`, `lighting_correction`,
   `still_enhancement`, `floor_plan`, `tour_sequencing`, `room_classification`.

7. **The same rule applies to sample data.** Every fixture listing is labelled
   sample data in the UI, `/api/v1/properties/search` returns
   `sampleData.containsSampleData` and per-record `isSampleData`, and no listing
   JSON-LD is emitted — because a crawler never sees a banner
   (`docs/handoff/DECISIONS.md` D-4 and D-5).

### Why it is written down here

Invariant 6: nothing claims an unestablished fact. An unlabelled generated
photograph of a property is a claim about that property. In a mortgage and real
estate context that is a misrepresentation to a consumer, and the fact that it
came from a model rather than a person does not change what it is.

The database enforces this rather than a convention, for the same reason
`listing_records` carries `check (not (is_fixture and published))`: configuration
drifts, environments get copied, and a guarantee that depends on someone
remembering is not a guarantee.

**No AI provider is configured today**, so no generated imagery exists yet. The
rule is recorded now, before the first one is produced, because it is far harder
to retrofit disclosure onto a library of images that already shipped.
