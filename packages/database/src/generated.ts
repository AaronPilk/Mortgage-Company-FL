/**
 * Placeholder for generated database types.
 *
 * Regenerate with `pnpm db:types` once a Supabase project exists:
 *
 *   supabase gen types typescript --local > packages/database/src/generated.ts
 *
 * This file is committed so the package typechecks before a project is
 * provisioned. It is overwritten wholesale by the generator; do not hand-edit it.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<
      string,
      { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> }
    >;
    Views: Record<string, { Row: Record<string, Json> }>;
    Functions: Record<string, { Args: Record<string, Json>; Returns: Json }>;
    Enums: {
      app_role:
        | "consumer"
        | "agent"
        | "loan_officer"
        | "content_editor"
        | "compliance_reviewer"
        | "operations"
        | "admin";
    };
  };
};
