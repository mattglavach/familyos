# Architecture Decisions

## 2026-07-11: Provider timestamp is authoritative for Calendar display

Every timed Calendar surface must derive its display date and time from the preserved provider instant using the shared formatter with `timeZone: America/New_York`. Precomputed display strings are compatibility fields only and cannot override the timestamp. Provider offset, timezone, recurrence, and original-start metadata are retained. All-day dates remain date-only.

## 2026-07-11: Derive attention items and aggregate module context

Release 1.8 uses module-owned deterministic outputs aggregated by the Household Context Service. Attention items are derived because their validity follows source records and no external delivery channel requires a durable queue. This avoids duplicate state and a migration while leaving the contract compatible with future persistence. Human confirmation remains mandatory.

## 2026-07-11: Use service-role demo seeding and Playwright browser validation

FamilyOS uses a deterministic Supabase admin seed for one non-production demo identity and Playwright for authenticated browser smoke/regression coverage. The seed fails closed unless `FAMILYOS_ENV=test`, the exact target is configured, and remote use is separately authorized. Development auto-login is allowed only in CRA development mode on loopback hosts. Browser tests intentionally disable auto-login so real authentication remains covered. External Google Calendar data is not mutated by the seed.

Review hardening replaces membership-discovered deletion with a fixed demo household UUID and internal key, requires exact Supabase project-ref or URL authorization before admin-client creation, and compiles the dedicated development auto-login module out of optimized production bundles. `FAMILYOS_ENV=test` is now mandatory for every demo reset.

## 2026-07-11: Focus Home and use a hybrid Pool architecture
Home is limited to recurring operational systems, with Pool first and Garden next. FamilyOS owns persistent facts and deterministic rules; ChatGPT owns explanation and analysis through a versioned context object. Chemical calculations, compatibility, and swim-safety rules remain deterministic and human-reviewed. Pool uses Tasks as the single execution system. Broad Home asset management is excluded.

Record decisions that shape the product.

## Template

### Date

### Decision

### Context

### Options Considered

### Decision Rationale

### Tradeoffs

### Follow-up

## Decisions

### July 3, 2026

### Decision
Implement Pool Care Assistant with a local rule-based action engine and human-confirmed action audit history.

### Context
Release 1.4.0 makes Pool the first Home Platform module. The product goal is decision support: explain what the pool needs, why it matters, what amount/action is recommended, and when to retest. The release explicitly excludes AI platform behavior, Pentair/Home Assistant live integrations, automatic dosing, and automatic equipment control.

### Options Considered
- Keep the legacy Pool chemistry tracker and defer recommendations.
- Add an AI Pool Coach immediately.
- Add a deterministic rule engine with future AI-ready audit/context fields.

### Decision Rationale
A rule engine is inspectable, testable, and safer for chemical recommendations than an unvalidated AI runtime. Recommendation audit rows preserve traceability for confirmed actions and give a future AI Coach structured context without allowing silent automation.

### Tradeoffs
Release 1.4.0 recommendations are intentionally conservative and generic. Exact dosing still depends on product labels and local pool assumptions. Live equipment data, weather feeds, and AI explanations remain deferred until each integration has its own security and validation review.

### Follow-up
Validate the Pool migration/RLS in disposable/local Supabase, complete browser smoke for owner/adult/viewer flows, and design any future AI Coach or live integrations as separate releases.

### July 2, 2026

### Decision
Implement Release 1.1 Life Lists as a generic list and item framework instead of category-specific apps.

### Context
Life Lists must cover things the family wants to do, watch, read, visit, buy, remember, or plan. The release explicitly excludes shopping, meal planning, ratings, reviews, recommendation engines, and external media/book/travel APIs.

### Options Considered
- Build separate list types for movies, books, gifts, places, and bucket lists.
- Add a generic Life Lists module with category metadata and future-ready item fields.
- Defer Life Lists until category-specific requirements are fully known.

### Decision Rationale
A generic framework supports current and future lightweight collections without hardcoding domains or introducing external integrations. It also keeps Home as an awareness layer, while Life Lists remains the action workspace.

### Tradeoffs
Release 1.1 does not include category-specific templates, ratings, reviews, image upload storage, enrichment APIs, or recommendation logic. Those can be added later on top of the generic model if they become product priorities.

### Follow-up
Validate RLS in a disposable or staging Supabase environment before production migration, then consider notification events and richer category templates in a later release.

### July 2, 2026

### Decision
Use hashed invitation tokens and Supabase RPCs for Release 0.9 household invitations.

### Context
Release 0.9 introduces multi-member household collaboration. Invite links need to be shareable, but raw tokens must not be stored or exposed through normal table reads.

### Options Considered
- Store raw invitation tokens in `household_invitations`.
- Let the frontend create invitation rows directly.
- Store only token hashes and route create/accept/decline through security-definer RPCs.

### Decision Rationale
Hashed tokens reduce exposure if invitation rows are queried or logged. RPCs allow the database to enforce owner-only invitation administration, matching invite email, expiry, accepted/declined/revoked states, and membership activation without trusting frontend state.

### Tradeoffs
The first Release 0.9 implementation shows invite links once at creation time. Public sign-up and ownership transfer remain deferred, so invited users still need a valid Supabase account for the invited email.

### Follow-up
Design ownership transfer, owner recovery, and any future email-sending automation before making invitations fully self-service.

### Validation Update
Final Release 0.9 validation on July 2, 2026 confirmed the token-hash/RPC boundary against disposable local Supabase only. Owner-only controls are enforced by RPC/RLS and hidden in non-owner Settings views; public sign-up, ownership transfer, and broad module RLS conversion remain deferred.

### July 1, 2026

### Decision
Store Google Calendar connection ownership and token material only through server-side Release 0.8 calendar APIs.

### Context
Release 0.7 preserved the browser Google Identity Services token flow as a legacy fallback. Release 0.8 starts the secure replacement and must not expose refresh tokens to React or add new Google refresh-token storage in browser `localStorage`.

### Options Considered
- Keep the browser-only GIS token flow.
- Store OAuth refresh tokens directly from the frontend.
- Add a household-scoped server-side connection model and API foundation first.

### Decision Rationale
Calendar data can expose household routines and child locations, so long-lived credentials need backend ownership. A `calendar_connections` table scoped by `household_id` and `user_id`, plus Vercel API routes that only return safe metadata, provides the right boundary while keeping Release 0.8 small enough to validate.

### Tradeoffs
Release 0.8 now owns OAuth token exchange, token encryption, refresh, revoke, and normalized event reads on the server. The dashboard prefers the server event source whenever a server-side connection exists. The legacy browser fallback remains temporarily available for transition and deployed validation.

### Follow-up
Validate the server OAuth flow in Vercel with production environment variables, then remove the legacy browser fallback and older browser token cleanup paths.

### July 1, 2026

### Decision
Use a React household context as the Release 0.7 runtime boundary for active household, profile, membership, people, household settings, and user preferences.

### Context
Release 0.6C added the production household foundation without changing runtime app behavior. Release 0.7 needs visible app integration without replacing all module RLS policies or expanding product scope.

### Options Considered
- Keep each screen querying household data independently.
- Replace all module-table access and RLS with household-only behavior in one release.
- Add a shared household context and make table access household-aware while preserving user-owned compatibility.

### Decision Rationale
A shared household context gives every screen one active household source and reduces duplicated query logic. Household-aware table access starts writing `household_id` and `user_id` consistently while preserving existing production compatibility and avoiding a risky RLS replacement in the same release.

### Tradeoffs
The app still resolves only one active/default household and does not yet expose household switching or invitations. Existing module RLS remains staged through user ownership until a later validated migration.

### Follow-up
Add household switching and invitation flows after the single-household path is validated. Move Google Calendar tokens and sync reads server-side in a dedicated calendar security milestone.

### July 1, 2026

### Decision
Use `owner`, `adult`, `teen`, `child`, and `viewer` as the standard household role vocabulary for Release 0.6C.

### Context
Earlier household architecture docs used both `admin`/`adult` and `owner`/`adult` language. The Release 0.6C production migration draft needs one vocabulary before RLS and app household context work proceed.

### Options Considered
- Use `admin`, `adult`, `child`, and `guest`.
- Use only `owner` and `adult` for the first release.
- Use `owner`, `adult`, `teen`, `child`, and `viewer`.

### Decision Rationale
`owner` clearly describes membership and household-settings authority without implying every trusted adult is also the account owner. `adult` covers normal household operators. `teen`, `child`, and `viewer` reserve conservative future roles for child-safe and read-limited experiences without granting management rights.

### Tradeoffs
The first RLS draft must keep teen, child, and viewer permissions conservative until product flows and child-safe views are implemented. More nuanced permissions can be added later without renaming core roles.

### Follow-up
Dry-run the Release 0.6C household foundation migration and smoke-test RLS behavior for owner, adult, teen, child, viewer, and non-member users before production use.

### June 27, 2026

### Decision
Use manual Supabase email/password users as the primary FamilyOS login for the private household app.

### Context
Magic-link authentication created repeated email verification friction and triggered Supabase email rate limits during normal testing and use.

### Options Considered
- Keep magic links as the only login method.
- Add open public sign-up.
- Use manually-created Supabase email/password users with magic links as a fallback.

### Decision Rationale
Manual email/password users provide persistent, low-friction access for Matt and his wife without exposing public registration. Supabase session persistence keeps users signed in between app launches, while fallback magic links remain available for recovery.

### Tradeoffs
User creation and password resets are operational tasks in the Supabase dashboard for now. The optional client-side approved email list improves error messaging but is not a security control.

### Follow-up
Confirm Supabase public sign-up is disabled and create the two household users before production testing.

### June 27, 2026

### Decision
Define a shared Platform layer as the foundation for future Family OS modules.

### Context
Modules such as Pool, Finance, College, Home, Garden, Medical, Travel, Vehicles, and Pickleball need common people, assets, tasks, documents, events, notifications, AI context, and timeline concepts.

### Options Considered
- Build each module independently with its own task, reminder, document, and context model.
- Build shared platform objects first and let modules extend them.

### Decision Rationale
Shared platform objects reduce duplication, support a single Command Center, and give AI a consistent context model.

### Tradeoffs
The platform layer requires more up-front design discipline before module-specific implementation.

### Follow-up
Validate the current app and Supabase schema against the Platform docs before implementing the next module.
