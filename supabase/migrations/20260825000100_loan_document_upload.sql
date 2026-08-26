-- TRACT borrower document upload — the metadata doors.
--
-- Document CONTENTS live in a private Supabase Storage bucket ('loan-docs'),
-- uploaded straight from the browser through a short-lived, server-minted signed
-- URL (the Worker never streams the bytes — Cloudflare's CPU budget forbids it).
-- Only METADATA lives here, in loan.loan_documents.
--
-- Two service-role doors, each verifying the borrower owns the file first:
--   * loan_add_document      — records a 'pending' row and returns its id, after
--                              the API route has validated content-type + size
--                              and derived a server-side storage key.
--   * loan_mark_document_uploaded — flips 'pending' → 'uploaded' once the browser
--                              confirms the PUT succeeded.
--
-- The bucket itself is provisioned out-of-band (it lives in the `storage`
-- schema, which the RLS test harness's plain Postgres does not have) and is
-- private: no anon/authenticated policy, so the ONLY way in or out is a signed
-- URL the server mints after an ownership check. Compliance unchanged: this is
-- document collection, never a credit decision (ECOA/Reg B); the bucket is the
-- GLBA/Safeguards-controlled store for borrower PII.

-- ---------------------------------------------------------------------------
-- public.loan_add_document — record a pending upload. service_role only.
-- ---------------------------------------------------------------------------

create or replace function public.loan_add_document(
  p_borrower_user_id uuid,
  p_loan_file_id uuid,
  p_requirement_id text,
  p_doc_type loan.document_type,
  p_storage_key text,
  p_content_type text,
  p_byte_size bigint
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_borrower_user_id is null then
    raise exception 'borrower is required';
  end if;

  -- The file must exist AND belong to this borrower. Belt and suspenders: the
  -- API route already checked, but the door checks again.
  if not exists (
    select 1 from loan.loan_files
    where id = p_loan_file_id and borrower_user_id = p_borrower_user_id
  ) then
    raise exception 'loan file not found for borrower';
  end if;

  insert into loan.loan_documents
      (loan_file_id, doc_type, requirement_id, storage_key, content_type, byte_size, upload_status)
    values
      (p_loan_file_id, p_doc_type, p_requirement_id, p_storage_key, p_content_type, p_byte_size, 'pending')
    returning id into v_id;

  insert into loan.access_log (loan_file_id, actor_user_id, action)
    values (p_loan_file_id, p_borrower_user_id, 'add_document');

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- public.loan_mark_document_uploaded — confirm the bytes landed. service_role.
-- ---------------------------------------------------------------------------

create or replace function public.loan_mark_document_uploaded(
  p_borrower_user_id uuid,
  p_document_id uuid
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_file uuid;
begin
  select d.loan_file_id into v_file
    from loan.loan_documents d
    join loan.loan_files f on f.id = d.loan_file_id
   where d.id = p_document_id
     and f.borrower_user_id = p_borrower_user_id;

  if v_file is null then
    raise exception 'document not found for borrower';
  end if;

  update loan.loan_documents
     set upload_status = 'uploaded', updated_at = now()
   where id = p_document_id;

  insert into loan.access_log (loan_file_id, actor_user_id, action)
    values (v_file, p_borrower_user_id, 'document_uploaded');
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants (invariant #5). Both are server doors: service_role only.
-- ---------------------------------------------------------------------------

revoke execute on function
  public.loan_add_document(uuid, uuid, text, loan.document_type, text, text, bigint)
  from public, anon, authenticated;
grant execute on function
  public.loan_add_document(uuid, uuid, text, loan.document_type, text, text, bigint)
  to service_role;

revoke execute on function public.loan_mark_document_uploaded(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.loan_mark_document_uploaded(uuid, uuid)
  to service_role;
