# Asset inventory

Last updated: 2026-08-17

## Canonical record

`apps/web/public/images/asset-manifest.json` is the source of truth for public product media. It records 32 local assets with rights class, source, generator, prompt version, default creation date, dimensions, transformation history, labels, alt text and owner-review state.

All property and product media is either:

- an OpenAI-generated synthetic fixture created for TRACT;
- a disclosed derivative of one of those fixtures; or
- a local Playwright render of the repository-owned mortgage planner.

No MLS, property portal, scraped, remote-hotlinked or third-party listing media is present. The prior duplicate `property-demos` runtime tree was consolidated into the canonical paths; the previous files remain recoverable from Git history and the generation originals remain outside the public runtime.

## Inventory

| Family     | Count | Public use                                                                                            |
| ---------- | ----: | ----------------------------------------------------------------------------------------------------- |
| Home       |     3 | Hero property proof, Vision preview, rendered mortgage-planner result                                 |
| Properties |     8 | Seven synthetic Florida property examples plus a second bungalow gallery crop                         |
| Vision     |     7 | Renovation, addition and land before/concept pairs plus report cover                                  |
| RendProp   |     8 | Guided capture, living-room cleanup/staging, kitchen enhancement, floor-plan candidate and tour cover |
| Agents     |     2 | Toolkit and intentionally non-scannable open-house QR-style concept                                   |
| Social     |     4 | Default, properties, Vision and RendProp 1200-by-630 previews                                         |

## Visual QA

- Renovation: camera, bungalow footprint, roof, openings and surroundings remain materially matched; changes are cosmetic.
- Addition: the source structure and viewpoint remain recognizable; the added one-story wing is labeled as a concept and not as permitted work.
- Land: field, track and tree context remain matched; no parcel or setback lines are baked into the image.
- Living-room cleanup: only movable clutter is removed; walls, windows, flooring, fan, furniture shell and room geometry remain visible.
- Living-room staging: the room shell and viewpoint remain stable while movable furniture is replaced; the result is labeled virtually staged.
- Kitchen enhancement: exposure and white balance change while objects, edges and the visible scuff near the refrigerator remain.
- Floor plan: contains no measurements or scale and is labeled not for measurement, appraisal, survey or construction.
- Phone capture: no face, readable personal information, brand logo or source-property address is visible.

Desktop and 390-pixel mobile checks found no broken images, framework overlays, console errors or page-level horizontal overflow on the six critical presentation routes. Lazy media was scrolled into view and decoded before review. A forced 404 test confirms the shared media component renders a bounded accessible fallback.

## Delivery rules

- Public photography and concepts are repository-local WebP; social previews are optimized palette PNG.
- `next/image` receives intrinsic dimensions and responsive `sizes`; only the first-screen hero media is eager.
- All product labels, values and alteration disclosures are HTML rather than generated pixels.
- `next.config.ts` still permits no remote image host.
- Manifest entries remain `reviewed: false` until owner/compliance review; the current review is an agent visual-QA pass, not approval to describe fixtures as real properties or completed work.
