-- Staff content review requires source completeness, not only the content row.
-- Public readers retain the existing published-content-only policy.

create policy "staff read all content sources"
  on public.content_sources for select to authenticated
  using (public.is_staff());
