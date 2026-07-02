# Information Architecture

## Purpose
This document defines the product structure of Family OS. It describes where users should find household capabilities. Engineering folder structure is governed by `docs/process/PROJECT_STRUCTURE.md` and `docs/architecture/FOLDER_STRUCTURE.md`.

## Primary Navigation
The long-term product navigation should emphasize daily use first:

- Home
- Tasks
- Calendar
- Quick Add
- More

## Home
Home is the daily command center and morning briefing. It should show priorities, schedule, task load, family activity, quick actions, and household insights.

Home belongs first because every user should be able to open Family OS and understand the day without navigating.

## Tasks
Tasks is the shared action system for chores, reminders, responsibilities, and follow-up work.

Tasks belongs in primary navigation because creating, assigning, and completing work is one of the most frequent household activities.

## Calendar
Calendar is the household time layer. It should show today's schedule, upcoming commitments, school events, family events, and connected calendar status.

Calendar belongs in primary navigation because time conflicts and schedule visibility are daily needs. Release 1.0 may continue surfacing calendar primarily through Home if the dedicated Calendar module is not yet mature.

## Quick Add
Quick Add is the universal capture action for tasks, notes, reminders, events, shopping items, and future module records.

Quick Add belongs in primary navigation or a persistent action location because capture must be fast and available from anywhere.

## More
More contains important modules that do not need constant one-tap access for every daily session or are not yet mature enough for primary navigation.

Inside More:
- Household
- Home
- Finance
- Pool
- College
- Shopping
- Life Lists
- Meal Planning (future)
- Documents (future)
- Settings

## Household
Household contains family members, invitations, roles, active household switching, and household defaults.

It belongs inside More because membership management is important but less frequent than daily dashboard and task use. Owner workflows can be surfaced in Settings until a dedicated Household module exists.

## Home Module
The Home module covers the physical home: maintenance, systems, appliances, projects, yard, and future smart home status.

It belongs inside More because it is important but not always a daily workflow.

## Finance
Finance covers account snapshots, bills, savings, retirement, and household financial planning.

It belongs inside More because it contains sensitive, lower-frequency data and needs stricter permission design before becoming prominent.

## Pool
Pool covers water chemistry, maintenance, reminders, equipment, and seasonal operations.

It belongs inside More because it is seasonal and important for the household owner, but not a universal daily family workflow.

## College
College covers education planning, deadlines, savings, scholarships, and school milestones.

It belongs inside More because it is planning-oriented and relevant during specific life phases.

## Shopping
Shopping covers shared grocery and household purchase lists plus simple pantry inventory.

Release 1.2 promotes Shopping into More as the second Planning Platform module. Home should show only compact Shopping awareness and drill-downs; the module remains the action workspace.

## Life Lists
Life Lists cover books, movies, gifts, goals, bucket lists, ideas, places, activities, and custom lightweight collections.

Release 1.1 promotes Life Lists into More as a generic lifestyle planning module. Home should show only compact Life Lists awareness and drill-downs; the module remains the action workspace.

## Meal Planning (Future)
Meal Planning will cover meal plans, recipes, pantry, grocery generation, and family preferences.

It is future because it depends on shopping, recipe, and richer inventory design.

## Documents (Future)
Documents will cover document metadata, household records, warranties, school forms, medical documents, and future secure storage decisions.

It is future because it needs stronger security, permissions, retention, and storage design.

## Settings
Settings contains profile, app preferences, household defaults, calendar connection controls, local device data, and integration settings.

Settings belongs inside More long-term because it is a management surface, not a daily operating workflow. During Release 1.0, Settings may remain a primary tab if that is the existing validated implementation.

## Release 1.0 IA Position
Release 1.0 should not force the full long-term IA if implementation risk is high. It should align labels and behavior with this model while preserving existing functionality.
