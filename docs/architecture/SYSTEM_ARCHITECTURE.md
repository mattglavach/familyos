# System Architecture

## Current Target Stack
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- Vercel
- GitHub

## Architecture Pattern
Family OS should use a modular feature architecture.

Each module should have:
- Page or route
- Reusable components
- Supabase queries
- Validation
- Documentation
- Future AI hooks where useful

## Core Layers
- Process and documentation layer
- UI layer
- Feature/module layer
- Data access layer
- Supabase database
- Authentication and security
- Deployment pipeline

## Key Architectural Principles
- Keep modules independent where possible.
- Share common components.
- Avoid global state unless needed.
- Prefer explicit data flows.
- Design for future mobile use.

## Engineering Process Layer
`docs/process/` is the permanent engineering framework for releases, features, coding standards, architecture guidance, UI guidance, testing, documentation, git workflow, review, release checklists, and reusable prompts. Future architecture work should start from the process playbooks and then update this architecture documentation when durable decisions change.

Material architecture decisions should use `docs/architecture/decisions/ADR_TEMPLATE.md`. Lightweight decisions can be recorded in `docs/planning/DECISION_LOG.md`.
