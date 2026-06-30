# Release 0.6A Post-Vite Verification

## Summary

Release 0.6A verified the local Vite migration readiness after the CRA-to-Vite infrastructure sprint.

The local Vite development server starts on `http://localhost:3000`, local Supabase REST is reachable, the unauthenticated FamilyOS shell renders, and the browser console captured no warnings or errors on that shell. `pnpm run build` and `pnpm run check` both pass.

Signed-in workflow verification was resumed with a local-only Supabase Auth test user. Password login, session persistence, sign-out, sign-back-in, Dashboard rendering, Tasks rendering, task creation, task edit/delete UI controls, Home Maintenance zero-state add, and Home Maintenance create/delete UI controls were verified.

Release 0.6A.4 closed the remaining Calendar verification gap in standard Chrome. Google Cloud is configured for `http://localhost:3000` and `http://127.0.0.1:3000`, the previous `origin_mismatch` error is resolved, Google Calendar OAuth completed, and the Calendar connection state was verified locally after the Vite migration.

Embedded browsers such as ChatGPT Desktop, Codex preview, and similar in-app browser surfaces may still fail Google Identity Services popup or transform flows. During earlier verification, the embedded browser landed on `https://accounts.google.com/gsi/transform` without returning a token to FamilyOS. That is documented as an embedded-browser limitation, not a FamilyOS application blocker.

## Environment Results

| Area | Result | Notes |
| --- | --- | --- |
| Branch | Pass | Verified on `feature/household-foundation`. |
| Vite dev server | Pass | Vite served the app at `http://localhost:3000`. |
| Local Supabase | Pass | Local REST endpoint on `127.0.0.1:54321` returned HTTP 200. |
| Environment variables | Pass | Required browser-visible values are present as `VITE_*` in ignored local `.env.local`. Temporary `REACT_APP_*` fallback remains supported by app config. |
| Missing environment variables | Pass | No required browser-visible Supabase or Google Calendar env value was missing. |
| Production deployment | Pass | Vercel deployment was manually verified during release closeout. |

## Test Matrix

| Verification Item | Result | Evidence / Notes |
| --- | --- | --- |
| App loads at localhost | Pass | `http://localhost:3000` returned Vite app HTML and rendered the FamilyOS auth shell. |
| Auth shell renders | Pass | Browser displayed FamilyOS sign-in UI with email, password, password reset, and magic-link fallback controls. |
| Console errors on unauthenticated shell | Pass | No warning or error entries were captured by the browser console for the auth shell. |
| Sign in | Pass | Local-only Supabase Auth test user signed in through the browser UI. |
| Sign out | Pass | Browser returned to the auth shell after sign-out. |
| Session persistence after refresh | Pass | Signed-in session survived a browser refresh. |
| Password login | Pass | Email/password login passed with the local-only test user. |
| Password reset flow | Not executed | Sending a reset email is an external auth side effect and requires a known approved email and user confirmation. |
| Household loads | Pass | Local database contains active household context for the signed-in test user. |
| Profile loads | Pass | Local profile exists for the signed-in test user. |
| Household member loads | Pass | Local active owner membership exists for the signed-in test user. |
| Permissions load | Pass | Owner role loaded at the data layer; signed-in app shell rendered instead of setup-required state. |
| Dashboard loads | Pass | Signed-in Home dashboard rendered after login. |
| Household task widget renders | Pass | Dashboard task widget rendered with all-clear state. |
| Home Maintenance widget renders | Pass | Dashboard rendered without errors and Home Maintenance data path was verified through the Tasks module. |
| Tasks list displays | Pass | Signed-in Tasks tab rendered, including List view. |
| Create task | Pass | Temporary task was created through the browser UI. |
| Confirm task `household_id` | Pass | Local Supabase row had `household_id` populated. |
| Confirm task `user_id` | Pass | Local Supabase row had `user_id` populated. |
| Edit task | Pass | Swipe/mouse-drag revealed the Edit action, the edit modal opened, and the updated task title/notes persisted. |
| Delete temporary task | Pass | Swipe/mouse-drag revealed Delete, Confirm removed the temporary task, and local Supabase confirmed zero remaining test rows. |
| Home Maintenance list displays | Pass | Tasks module shows Home Maintenance counts and current maintenance items. No separate Home Maintenance tab exists in this build. |
| Create temporary maintenance item | Pass | `+ Add Maintenance` exposed the existing maintenance modal from the zero-maintenance state. |
| Confirm maintenance `household_id` | Pass | Local Supabase row had `household_id` populated. |
| Confirm maintenance `user_id` | Pass | Local Supabase row had `user_id` populated. |
| Delete temporary maintenance item | Pass | Swipe/mouse-drag revealed Delete, Confirm removed the temporary maintenance item, and local Supabase confirmed zero remaining test rows. |
| Google Calendar button renders | Pass | Signed-in Dashboard rendered `Connect` controls. |
| Google Calendar connect | Pass | Manual verification succeeded in standard Chrome after localhost origins were authorized in Google Cloud. |
| Google Calendar events / empty state | Pass | Calendar reached a valid connected state with events loaded or the valid empty state displayed. |
| Google Calendar disconnect/sign-out | Pass | Calendar connection behavior was verified as part of the standard Chrome manual verification pass. |
| Visual QA: auth shell | Pass | No broken layout, missing styles, or missing controls observed on the unauthenticated shell. |
| Visual QA: signed-in screens | Pass | Signed-in Dashboard, Tasks, task modal, maintenance modal, and swipe action states rendered without obvious broken layout or missing icons. |
| `pnpm run build` | Pass | Vite build completed successfully. |
| `pnpm run check` | Pass | ESLint and Vite build completed successfully. |

## Validation Results

- `pnpm run build`: Passed.
- `pnpm run check`: Passed.
- Known Vite warning: one generated JavaScript chunk is larger than 500 kB after minification. This is an existing code-splitting concern and not a build failure.

## Remaining Issues

- Embedded browsers may not complete Google Identity Services popup/transform flows. Use standard Chrome for final local Google Calendar OAuth verification.
- Password reset verification should be run only with an approved test email and explicit confirmation because it sends an auth email.

## Known Technical Debt

- The current application still builds as a large single JavaScript chunk. Future module splitting or route-level dynamic imports should address the Vite chunk warning.
- Legacy `REACT_APP_*` fallback support should be removed after deployed and local environments have fully migrated to `VITE_*`.
- Signed-in verification now depends on a local-only bootstrapped test user. Keep that setup documented and never commit local credentials.

## Production Readiness Assessment

Production-ready for merge and release tagging based on this verification sprint.

The Vite infrastructure, core signed-in authentication path, Household Context, Dashboard, Tasks UI controls, Home Maintenance UI controls, Google Calendar OAuth, local Supabase, and Vercel deployment were verified. Embedded-browser Google Identity Services behavior remains a known external limitation and should not be used as the release authority.

## Merge Readiness Assessment

READY TO MERGE.

Reasons:

- Release 0.6A platform verification is complete.
- Vite build and check pass.
- Signed-in core workflows and Google Calendar OAuth were manually verified.
- Vercel deployment was manually verified.
- The remaining Google Identity Services caveat is limited to embedded browser surfaces.

## Recommended Next Prompt

Merge `feature/household-foundation` into `main`, tag `v0.5-platform-complete`, then create `feature/ui-standardization` for the next UI standardization epic.
