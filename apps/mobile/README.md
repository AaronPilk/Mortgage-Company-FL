# apps/mobile

A documented reservation, not a second launch application. Nothing is installed
here on purpose — a large native dependency tree in the first web build costs
install time and CI minutes for something nobody runs yet.

## Why Expo later rather than React Native Web now

See ADR-001. The launch product depends on server-rendered public pages,
metadata, sitemaps, structured data, crawl control, and Core Web Vitals. Next.js
does that natively. Expo becomes the right tool when the product needs camera
guidance, resumable background upload, push notification, and app-store
distribution — which is RendProp.

## Safe to share

| Package                | Why                                                     |
| ---------------------- | ------------------------------------------------------- |
| `@tract/mortgage-math` | Pure functions, no platform dependency                  |
| `@tract/schemas`       | Zod schemas and validation                              |
| `@tract/domain`        | Roles, events, provenance, redaction                    |
| `@tract/analytics`     | Event vocabulary and the personal-data guard            |
| `@tract/tokens`        | Typed design tokens mirroring the CSS custom properties |

## Not shareable

`@tract/seo` is web-only. `@tract/ui-web` is web-only. Anything importing
`server-only` is server-only.

## Rules

The native client calls documented versioned API endpoints. It must never import
Next.js server code, and it must never hold the service-role key.

## Milestones

1. Expo project with shared domain packages and the design tokens.
2. Authentication against the same Supabase project.
3. Calculators, sharing the math package.
4. RendProp capture: permissions, guidance overlay, quality checks.
5. Resumable background upload with local checksums.
6. Job status and push notification.
7. App-store submission, which brings its own review requirements.
