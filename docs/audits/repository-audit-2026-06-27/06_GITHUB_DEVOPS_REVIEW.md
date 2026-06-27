# GitHub And DevOps Review

Audit date: 2026-06-27

## GitHub Repo Setup Review

Present:

- `.github/pull_request_template.md`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/copilot-instructions.md`

Missing or not visible locally:

- `.github/workflows/`
- Dependabot config.
- Code owners.
- Security policy.
- Release workflow.
- Branch protection settings cannot be verified from local files.

## Actions / CI-CD Review

No GitHub Actions workflows exist in the repository. This is a major readiness gap because `package.json` already provides useful checks:

- `pnpm run lint`
- `pnpm run build`
- `pnpm run check`

Recommended first workflow:

- Trigger on pull request and push to main.
- Use pnpm.
- Install dependencies with lockfile.
- Run `pnpm run lint`.
- Run `pnpm run build`.
- Upload build logs only on failure if needed.

## PR / Issue Template Review

Strengths:

- Basic PR and issue templates exist.
- This is enough for early development.

Needed improvements:

- PR template should require verification checkboxes for lint/build.
- PR template should require database migration notes when schema changes occur.
- Bug report should ask for environment, auth state, Supabase configured/not configured, and browser/device.
- Feature request should ask for module, data model changes, privacy impact, and docs updates.

## Branching / Release Readiness

Current release readiness is low:

- No release workflow exists.
- No versioning process is documented beyond `package.json` version.
- No deployment checklist appears to be enforced.
- No changelog automation exists.

Docs exist under `docs/development/RELEASE_PROCESS.md` and `docs/releases/`, but actual GitHub automation is missing.

## Secrets / Environment Handling

Strengths:

- `.env.example` exists.
- `README.md` correctly says `ANTHROPIC_API_KEY` is server-only.
- `api/brief.js` reads `ANTHROPIC_API_KEY` from server env.
- Frontend variables use the required CRA `REACT_APP_*` prefix.

Risks:

- `.env.local` exists locally and should remain untracked.
- No secret scanning config or GitHub secret scanning readiness is documented.
- No CI step validates that required env vars are documented.
- API route CORS relies on origins but does not require user auth.

## Dependabot / Security Scanning Readiness

Missing:

- `.github/dependabot.yml`
- `npm audit` or equivalent scheduled check.
- CodeQL or dependency review workflow.

Recommendation: add Dependabot for npm/pnpm dependencies and GitHub Actions dependency review once CI exists.

