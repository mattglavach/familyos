# Release Process

## Operating Model

Work in larger release work packages rather than small milestones.

Continue autonomously through a work package until one of these gates is reached:

- the release work package is complete;
- production approval is required;
- a secret, credential, API key, account login, or owner-specific data decision is required;
- a destructive or irreversible action requires approval;
- a blocker prevents safe continuation;
- a major architectural or product decision materially changes scope.

Document assumptions instead of asking when the choice is routine. Stop for decisions that affect production data, security, authentication, authorization, data integrity, or material product behavior.

## Before Release
- Review changed files.
- Confirm migrations.
- Run local build.
- Test key user flows.
- Update changelog.
- Update project status.

## Database Releases

Before production database changes:

- verify the production target project/ref;
- capture backup artifacts;
- verify the rollback path;
- verify migration ordering;
- run validation SQL before and after migration;
- run app smoke tests when the schema affects runtime behavior.

If production validation fails, stop. Document root cause, impact, rollback recommendation, and repair recommendation before continuing.

For staged database releases where production is behind the repository baseline, add a dedicated baseline-alignment migration and validate it against a disposable production-drift clone before applying the target release migration. Apply migrations explicitly by file in the approved order; do not rely on broad migration push commands when old local-only migrations exist in the repository.

## Release Notes
Each release should include:
- New features
- Fixes
- Known issues
- Next priorities

## Completion Report

Release work packages should close with:

- executive summary;
- completed work;
- commits created;
- files changed;
- database changes;
- documentation updated;
- tests and validation results;
- known issues and technical debt;
- remaining risks;
- production readiness;
- recommended next release or work package.
