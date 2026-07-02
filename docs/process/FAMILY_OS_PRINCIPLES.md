# Family OS Principles

These principles govern product, architecture, engineering, and documentation decisions.

## Household-First
Family OS exists to help a real household operate better. Prefer practical workflows, clear ownership, and shared context over abstract platform complexity.

## Security-First
Household data is private. Authentication, authorization, RLS, secrets handling, token handling, and production-data safety are release gates, not follow-up polish.

## AI Assists Humans
AI should draft, summarize, inspect, and recommend. Humans retain authority over plans, decisions, data changes, and external actions.

## Modular Architecture
Modules should be independently understandable and evolve behind clear boundaries. Shared platform concepts belong in shared docs, hooks, services, context, or UI primitives.

## Simple Over Clever
Prefer clear flows, explicit data ownership, and ordinary React/Supabase patterns. Add abstraction only when it removes real duplication or risk.

## Documentation Is Part Of The Product
Docs are not commentary after the fact. They are the operating manual for humans, ChatGPT, Codex, and future releases.

## Scalable Design
Every feature should leave room for more household members, more modules, stricter roles, larger data sets, and future automation.

## Accessibility
Family OS should remain usable on mobile, desktop, keyboard, and assistive technologies. Accessible labels, focus states, readable contrast, and stable layouts are expected.

## Maintainability
Future engineers should be able to read the code and docs, understand why decisions were made, and validate changes without archaeology.

## Incremental Evolution
Prefer small validated releases over broad rewrites. Defer work explicitly and preserve compatibility during migrations.

## Repository Documentation Is Authoritative
When chat history, memory, and repository docs conflict, update and follow repository docs. Durable decisions belong in version-controlled documentation.
