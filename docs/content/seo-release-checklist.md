# SEO release checklist

Run before flipping any page from `noindex` to `index`.

## Automated

- [ ] `pnpm content:lint` clean
- [ ] `pnpm test` clean — includes the program content contract
- [ ] Route registered in `apps/web/content/routes.ts` with an indexation decision
- [ ] Canonical resolves and is stable
- [ ] Title within 60 characters, description within 165, both unique
- [ ] Internal links resolve
- [ ] Page appears in `/sitemap.xml`

## Manual

- [ ] Content satisfies every point in the editorial policy
- [ ] Author and reviewer named and visible
- [ ] Reviewed date accurate; next review date set
- [ ] Every claim traced to a primary source and re-verified as current
- [ ] No rate, fee, limit, approval, or savings claim without substantiation
- [ ] Structured data mirrors visible content exactly
- [ ] FAQ markup present only if the page renders those exact questions
- [ ] Images have alt text describing content, not stuffed with keywords
- [ ] Open Graph image renders correctly
- [ ] Compliance approval recorded where required

## Validate externally

- [ ] Schema Markup Validator
- [ ] Google Rich Results Test

Valid markup does not entitle anyone to a rich result. Do not promise one.

## After publishing

- [ ] Search Console indexing status checked
- [ ] Analytics event firing correctly with no prohibited parameter
- [ ] Internal links added from related pages
- [ ] Next review date on the calendar with an owner
