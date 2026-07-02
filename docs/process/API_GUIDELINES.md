# API Guidelines

This document governs Vercel API routes, Supabase RPCs, and frontend service contracts.

## API Types
- Frontend Supabase calls for simple single-row/table operations protected by RLS.
- Supabase RPCs for multi-step database operations or security-sensitive invariants.
- Vercel API routes for server-only secrets, third-party OAuth/token work, AI calls, and external APIs.

## Naming
- Use `familyos_<verb>_<object>` for Supabase RPCs.
- Use clear route names under `api/` for Vercel functions.
- Use domain names, not implementation names, in exported hooks/services.

## Validation
- Validate required inputs at the boundary.
- Normalize emails, IDs, statuses, dates, and roles before writes.
- Use database constraints for invariants that must survive frontend bugs.

## Authorization
- Do not trust frontend role state.
- RPCs and API routes must verify current user, household membership, role, and record ownership as applicable.
- RLS must protect direct table access.

## Error Handling
- Return user-safe messages to the frontend.
- Preserve actionable detail for developer summaries without exposing secrets.
- Use consistent `{ ok, data, error }`-style shapes in hooks/services where practical.

## RPC Conventions
- Use explicit parameters.
- Set narrow `search_path`.
- Qualify ambiguous columns in PL/pgSQL.
- Revoke broad execution and grant only required roles.
- Validate invalid, expired, duplicate, unauthorized, and cross-household cases.

## Vercel API Conventions
- Keep server-only secrets out of React.
- Validate origin when route access should be limited.
- Avoid logging request bodies that may contain private household data.
- Treat external API failures as recoverable user-facing states.

## Documentation
New or changed API/RPC behavior should update relevant module, architecture, database, RLS, and release docs.
