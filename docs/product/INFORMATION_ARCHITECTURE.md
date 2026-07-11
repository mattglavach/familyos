# Information Architecture

## Purpose
This document describes current and target product structure. Canonical module ownership and the current-versus-future distinction are governed by `docs/governance/FamilyOS_Project_Instructions.md`. Engineering folder structure is detailed in `docs/process/PROJECT_STRUCTURE.md` and `docs/architecture/FOLDER_STRUCTURE.md`.

## Current Primary Navigation
The implemented app shell emphasizes daily use through:

- Home
- Tasks
- Calendar
- Quick Add
- More

## Current Home Dashboard
The current Home tab is the daily dashboard and morning briefing. It should show priorities, schedule, task load, family activity, quick actions, and household insights.

It belongs first in the current shell because every user should be able to open Family OS and understand the day without navigating. In the approved target architecture this awareness layer is named Dashboard, while Home means the physical-home workspace.

## Tasks
Tasks is the shared action system for chores, reminders, responsibilities, and follow-up work.

Tasks belongs in primary navigation because creating, assigning, and completing work is one of the most frequent household activities.

## Calendar
Calendar is the household time layer. It should show today's schedule, upcoming commitments, school events, family events, and connected calendar status.

Calendar belongs in primary navigation because time conflicts and schedule visibility are daily needs. Release 1.0 may continue surfacing calendar primarily through Home if the dedicated Calendar module is not yet mature.

## Quick Add
Quick Add is the universal capture action for tasks, notes, reminders, events, shopping items, and future module records.

Quick Add is a current primary action because capture must be fast and available from anywhere. Long term it remains a cross-module capability rather than a business-domain module.

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
- Meal Planning
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

## Meal Planning
Meal Planning covers meal plans, recipes, pantry-aware ingredient review, reviewed Shopping list generation, and weekly household food decisions.

Release 1.3 promotes Meal Planning into More as the third Planning Platform module. Home should show only compact Meal Planning awareness and drill-downs; the module remains the action workspace. Nutrition tracking, Health workflows, AI recommendations, external recipe APIs, barcode/OCR, comments, ratings, and social features remain deferred.

## Documents (Future)
Documents will cover document metadata, household records, warranties, school forms, medical documents, and future secure storage decisions.

It is future because it needs stronger security, permissions, retention, and storage design.

## Settings
Settings contains profile, app preferences, household defaults, calendar connection controls, local device data, and integration settings.

Settings belongs inside More long-term because it is a management surface, not a daily operating workflow. During Release 1.0, Settings may remain a primary tab if that is the existing validated implementation.

## Approved Long-Term Architecture

The approved target module architecture is Dashboard, Calendar, Tasks, Life, Home, and Financial Planning. It is not fully implemented.

- Dashboard replaces the current Home label for the awareness layer.
- Life becomes the owner of lists, shopping, recurring household administration, and family reference information.
- Home becomes the physical-home workspace for property, maintenance, vendors, projects, pool, yard, appliances, equipment, repairs, service history, and documents.
- Financial Planning owns retirement, college planning, goals, assumptions, accounts, financial history, and scenarios.
- Quick Add remains a cross-module capture capability.
- More, Settings, and Household remain current navigation or management constructs until an approved release changes the shell.

Do not expose this target as implemented or rewrite historical release documentation to match it.
