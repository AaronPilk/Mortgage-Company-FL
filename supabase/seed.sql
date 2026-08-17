-- Local development seed. Synthetic only.
--
-- Never seed a production project from this file and never place real borrower
-- information here. Everything below uses reserved example values.

insert into public.quota_policies (subject_kind, feature, period, request_limit, cost_limit_cents, concurrency_limit, enabled) values
  ('anonymous', 'vision_report', 'day', 1, 0, 1, false),
  ('consumer',  'vision_report', 'day', 3, 300, 1, true),
  ('agent',     'vision_report', 'day', 10, 1000, 2, true),
  ('staff',     'vision_report', 'day', 50, 5000, 4, true),
  ('platform',  'vision_report', 'day', null, 10000, null, true),
  ('consumer',  'rendprop_media', 'day', 0, 0, 0, false),
  ('agent',     'rendprop_media', 'day', 5, 2000, 1, false),
  ('platform',  'rendprop_media', 'day', null, 5000, null, false)
on conflict (subject_kind, feature, period) do nothing;

insert into public.property_entities (id, normalized_address, address_line_1, city, state_code, postal_code, county_name, latitude, longitude, property_type, bedrooms, bathrooms, living_area_sqft, lot_area_sqft, year_built, source_quality)
values ('00000000-0000-4000-8000-0000000000b1', '1200 example bay dr tampa fl 33602', '1200 Example Bay Dr', 'Tampa', 'FL', '33602', 'Example County', 27.9506, -82.4572, 'Single Family Residence', 3, 2, 1840, 8400, 1994, 'user_supplied')
on conflict do nothing;

insert into public.listing_records (property_id, provider, provider_record_key, standard_status, list_price_cents, attribution_text, is_fixture, published)
values ('00000000-0000-4000-8000-0000000000b1', 'fixture', 'FX-TPA-0001', 'active', 42900000, 'Sample data. Not sourced from any MLS.', true, false)
on conflict (provider, provider_record_key) do nothing;
