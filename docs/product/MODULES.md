# Modules

## Purpose
This document defines the product purpose, maturity, release target, dependencies, and future expansion for each Family OS module.

## Module UX Standard
Modules are action-oriented work surfaces. They should prioritize search, filters, sorting, creation, editing, completion, and other direct actions over dashboard-style summary widgets.

Avoid dashboards inside modules. A module may include compact status context only when it helps the user act faster or filters/navigates into the work surface.

Frequent module forms should use speed-oriented controls such as segmented controls, chips, button groups, and smart defaults before falling back to dropdowns.

## Home
Purpose: Daily household awareness layer and morning briefing.

Current status: Active.

Release target: Release 1.0 core.

Dependencies: Tasks, calendar status, household context, family members, module summaries.

Future enhancements: AI summaries, custom widgets, smart home alerts, travel, birthdays, bills, and richer household insights.

Release 1.0.1 guidance: Home summarizes and drills into modules. It should not host household management, full calendar browsing, or task-dashboard controls.

## Tasks
Purpose: Shared household responsibilities, chores, reminders, and follow-up work.

Current status: Active MVP.

Release target: Release 1.0 core.

Dependencies: Household members, task schema, active household context, status feedback.

Future enhancements: Templates, recurring rule editor, routines, chores, reminders, notifications, and cross-module task creation.

Release 1.0.1 guidance: Tasks is the primary action work surface for household responsibilities. Search, filters, sorting, assignment, completion, editing, and quick creation take priority over dashboard-style metrics.

## Calendar
Purpose: Household time visibility and schedule context.

Current status: Partially active through dashboard and Google Calendar integration.

Release target: Release 1.0 support surface, not a broad new module unless implementation scope is approved.

Dependencies: Google Calendar connection, server-side event fetch, household context.

Future enhancements: household events, school calendars, shared reminders, conflict detection.

## Household
Purpose: Members, invitations, roles, active household switching, household defaults, and collaboration context.

Current status: Active through Settings.

Release target: Release 1.0 core through Settings/household management.

Dependencies: Supabase Auth, household foundation schema, invitation RPCs, RLS.

Future enhancements: Ownership transfer, owner recovery, granular permissions, child-safe views, audit history.

## Home Module
Purpose: Physical home systems, maintenance, assets, projects, yard, and future smart-home status.

Current status: Future/partial data model.

Release target: Deferred from Release 1.0.

Dependencies: Home asset schema, maintenance workflow, reminders, permissions.

Future enhancements: Maintenance schedules, warranties, appliance history, smart-home signals.

## Finance
Purpose: Household financial snapshot, bills, accounts, planning, and long-term financial visibility.

Current status: Partial module.

Release target: Deferred from Release 1.0 except existing stable visibility.

Dependencies: Sensitive permissions, data model, privacy review, dashboard insight rules.

Future enhancements: Bills, cash flow, net worth, budget alerts, retirement tie-ins.

## Pool
Purpose: Pool chemistry, maintenance, equipment, reminders, and seasonal operations.

Current status: Partial module.

Release target: Deferred from Release 1.0 except possible dashboard insight if already supported.

Dependencies: Pool test data, maintenance records, reminder model.

Future enhancements: Trend charts, chemical guidance, equipment schedule, seasonal open/close checklists.

## College
Purpose: College planning, deadlines, savings, scholarships, visits, and family education decisions.

Current status: Partial module.

Release target: Deferred from Release 1.0 except existing stable visibility.

Dependencies: Planning data model, document links, task reminders.

Future enhancements: Deadline tracker, scholarship tracker, college comparison, financial planning.

## Shopping
Purpose: Shared grocery and household shopping lists.

Current status: Future.

Release target: Deferred from Release 1.0.

Dependencies: Quick Add, list model, assignments, store/category design.

Future enhancements: Pantry links, meal plan generation, recurring staples.

## Meal Planning
Purpose: Meals, recipes, family preferences, grocery planning, and weekly food decisions.

Current status: Future.

Release target: Deferred from Release 1.0.

Dependencies: Shopping, recipes, inventory, family preferences.

Future enhancements: Recipe library, meal calendar, grocery generation, nutrition preferences.

## Life Lists
Purpose: Books, movies, gifts, goals, bucket lists, travel ideas, and personal/family wish lists.

Current status: Active MVP.

Release target: Release 1.1.

Dependencies: Generic Life Lists schema, household context, personal/shared visibility, Quick Add, Universal Search.

Future enhancements: Gift planning, holiday planning, travel ideas, recommendation engines, external enrichment APIs, ratings, reviews, and richer notifications.

Release 1.1 guidance: Life Lists is a generic action workspace for lightweight collections. Do not hardcode category-specific flows such as shopping, meal planning, movie databases, book APIs, travel APIs, ratings, or reviews.

## Documents
Purpose: Household document metadata, forms, warranties, records, and future secure storage.

Current status: Future/partial data model.

Release target: Deferred from Release 1.0.

Dependencies: Security review, storage model, permissions, search.

Future enhancements: Secure vault, expiration reminders, school and medical forms, warranty lookup.

## AI
Purpose: Assist with summaries, suggestions, planning, reminders, and natural-language access.

Current status: Future, with an existing AI brief endpoint foundation.

Release target: Deferred from Release 1.0.

Dependencies: Stable core workflows, privacy model, prompt governance, data access controls.

Future enhancements: Morning brief, weekly summary, recommendations, voice, automation.

## Settings
Purpose: Profile, household defaults, integrations, local device data, account/session controls, and management surfaces.

Current status: Active.

Release target: Release 1.0 core.

Dependencies: Auth, household context, calendar connection, user preferences.

Future enhancements: Notification preferences, privacy controls, advanced roles, device/session management.
