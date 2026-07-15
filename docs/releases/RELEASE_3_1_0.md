# FamilyOS 3.1.0 Relationship OS

## Outcome

Release 3.1.0 expands FamilyOS from household operations into lightweight relationship awareness. It helps household members notice who may need attention, remember meaningful context, plan time together, and record moments without treating people as tasks.

## Features

- A Relationships module with profiles, categories, birthdays, favorites, interests, editable conversation topics, editable activity ideas, notes, priority, lifecycle status, and automatically maintained contact dates.
- A concise relationship dashboard covering transparent health, birthdays, attention, recent and planned activities, conversation and activity suggestions, and goals.
- One-tap quick logging for Conversation, Phone Call, Date Night, One-on-One, Family Activity, Meal Together, Visit, and Custom activity.
- Home Relationship Focus with at most three deduplicated recommendations and weekly Relationship Wins, People to Reach Out To, Upcoming Birthdays, and Suggested One-on-One Time.
- Relationship events in Household Timeline and relationship profile fields in global search.
- Responsive, keyboard-accessible, screen-reader-labeled, dark-theme-compatible interaction patterns using existing FamilyOS primitives.

## Architecture and Health Logic

Relationships owns its profiles, goals, and activities. Home, Search, and Timeline summarize or route to those records; they do not duplicate them. Health is deterministic and visible: High priority uses a 7-day contact guide, Medium 14 days, and Low 30 days. Recent activity and completed goals can raise a relationship from Good to Excellent; an exceeded guide or no contact history produces Needs Attention. Upcoming birthdays are supporting context and never an opaque score.

## Database and Migration

Migration `20260714010000_release_3_1_relationship_os.sql` adds `relationships`, `relationship_goals`, and `relationship_activities`, with household foreign keys, indexes, update triggers, RLS, member reads, and owner/adult writes. Follow-up migration `20260714020000_release_3_1_relationship_security_hardening.sql` explicitly revokes project-default anonymous privileges while retaining authenticated access through RLS. Both migrations are additive. No existing table or record is modified or removed, and no backfill is required.

Application rollback can redeploy v3.0.0 while retaining the additive tables. Database rollback should not drop the new tables after users have created relationship history.

## Validation

Local release gates passed: lint; declaration type checking; 37 unit suites and 148 tests; Release 2.9 through 3.1 migration safety assertions; 18 seed-safety tests; production build; bundle-safety scanning; and all 77 authenticated Playwright tests across desktop, 390px mobile, tablet, and dark mode. The browser flow covers relationship create/edit/archive, quick logging, health refresh, Home integration, Timeline deduplication, global search, responsive containment, and critical WCAG A/AA checks.

The dedicated non-production project passed all 24 migrations, authenticated Relationship OS CRUD, and explicit anonymous-access denial. Production schema and data backups were captured before applying both Release 3.1 migrations. Production then passed 24-version migration alignment, table/index/trigger/RLS policy inspection, and explicit anonymous-privilege revocation verification.

## Production

Commit `96153c3` was published from `main`. Vercel deployment `dpl_9LudwwSv6q4j4ovqvTY71YP5ZuFQ` reached READY and serves the production aliases from immutable deployment `familyos-10rg10n3l-glavach.vercel.app`. Desktop and 390px mobile sign-in, console monitoring, weather, and bundle-secret checks passed against the production alias and immutable deployment. Runtime observability shows only the existing non-blocking Node `url.parse()` deprecation warning on Calendar and Weather routes.
