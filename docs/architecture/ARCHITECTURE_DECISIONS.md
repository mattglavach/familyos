# Architecture Decisions

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

### June 30, 2026

### Decision
Use shared module, assumptions, and decision engine standards for all flagship Family OS modules.

### Context
Pool, Finance, Retirement, College, and the Family Command Center need consistent patterns for profiles, editable assumptions, history, recommendations, AI explanations, dashboard widgets, household data access, and RLS.

### Options Considered
- Continue defining expectations inside each implementation prompt.
- Create reusable architecture standards before the module overhauls begin.

### Decision Rationale
Shared standards reduce duplicated planning, keep recommendations explainable across modules, and give future implementation work a stable reference point.

### Tradeoffs
Future modules need to conform to the standards or document why they differ. The standards will need updates as real module implementation exposes gaps.

### Follow-up
Use `MODULE_STANDARD.md`, `ASSUMPTIONS_STANDARD.md`, and `DECISION_ENGINE_STANDARD.md` for Release 0.6 shared platform work and Release 0.7 Pool Intelligence 2.0.

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
User creation remains an operational task in the Supabase dashboard. Password resets can be initiated from the FamilyOS sign-in screen, but still depend on Supabase Auth email delivery and correctly configured allowed redirect URLs. The optional client-side approved email list improves error messaging but is not a security control.

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
