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
