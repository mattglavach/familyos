# Release 0.6A.1 Post-Vite Verification

## Summary

Release 0.6A.1 verified the local Vite migration readiness after the CRA-to-Vite infrastructure sprint.

The local Vite development server starts on `http://localhost:3000`, local Supabase REST is reachable, the unauthenticated FamilyOS shell renders, and the browser console captured no warnings or errors on that shell. `pnpm run build` and `pnpm run check` both pass.

Signed-in workflow verification was resumed with a local-only Supabase Auth test user. Password login, session persistence, sign-out, sign-back-in, Dashboard rendering, Tasks rendering, task creation, task edit/delete UI controls, Home Maintenance zero-state add, and Home Maintenance create/delete UI controls were verified.

Release 0.6A.3 reran Calendar OAuth after Google Cloud was updated to authorize `http://localhost:3000` and `http://127.0.0.1:3000`. The previous `origin_mismatch` error is resolved. Google now accepts the localhost origin and opens the Google sign-in flow for `familyos`, but the in-app browser flow does not complete back to FamilyOS. After retrying, the browser lands on a blank `https://accounts.google.com/gsi/transform` page, so no Calendar token reaches the app.

## Environment Results

| Area | Result | Notes |
| --- | --- | --- |
| Branch | Pass | Verified on `feature/household-foundation`. |
| Vite dev server | Pass | Vite served the app at `http://localhost:3000`. |
| Local Supabase | Pass | Local REST endpoint on `127.0.0.1:54321` returned HTTP 200. |
| Environment variables | Pass | Required browser-visible values are present as `VITE_*` in ignored local `.env.local`. Temporary `REACT_APP_*` fallback remains supported by app config. |
| Missing environment variables | Pass | No required browser-visible Supabase or Google Calendar env value was missing. |
| Production deployment | Not tested | Deployment is intentionally out of scope for this local verification sprint. |

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
| Google Calendar connect | Blocked | Previous `origin_mismatch` is resolved. Google accepts `http://localhost:3000` and opens sign-in, but the in-app browser flow lands on blank `https://accounts.google.com/gsi/transform` before returning a token to FamilyOS. |
| Google Calendar events / empty state | Blocked | Requires a completed Google Identity Services token flow. No token reached FamilyOS during 0.6A.3 verification. |
| Google Calendar disconnect/sign-out | Blocked | Requires an active Calendar connection. |
| Visual QA: auth shell | Pass | No broken layout, missing styles, or missing controls observed on the unauthenticated shell. |
| Visual QA: signed-in screens | Pass | Signed-in Dashboard, Tasks, task modal, maintenance modal, and swipe action states rendered without obvious broken layout or missing icons. |
| `pnpm run build` | Pass | Vite build completed successfully. |
| `pnpm run check` | Pass | ESLint and Vite build completed successfully. |

## Validation Results

- `pnpm run build`: Passed.
- `pnpm run check`: Passed.
- Known Vite warning: one generated JavaScript chunk is larger than 500 kB after minification. This is an existing code-splitting concern and not a build failure.

## Remaining Issues

- Google Calendar live OAuth verification remains blocked. The previous Google Cloud `origin_mismatch` configuration issue is fixed, but the in-app browser does not complete the Google Identity Services popup/transform flow back to FamilyOS.
- Password reset verification should be run only with an approved test email and explicit confirmation because it sends an auth email.

## Known Technical Debt

- The current application still builds as a large single JavaScript chunk. Future module splitting or route-level dynamic imports should address the Vite chunk warning.
- Legacy `REACT_APP_*` fallback support should be removed after deployed and local environments have fully migrated to `VITE_*`.
- Signed-in verification now depends on a local-only bootstrapped test user. Keep that setup documented and never commit local credentials.

## Production Readiness Assessment

Not production-ready for merge or release tagging based on this verification sprint alone.

The Vite infrastructure, core signed-in authentication path, Tasks UI controls, and Home Maintenance UI controls are functioning locally. Production readiness should still wait until Google Calendar OAuth is verified in a browser environment that completes the Google Identity Services token flow.

## Merge Readiness Assessment

NOT READY TO MERGE.

Reasons:

- Required Calendar signed-in verification could not be completed.
- Google Calendar live behavior remains unverified after the Vite migration because the Google Identity Services flow opens but does not complete back to FamilyOS in the in-app browser.
- This is not a Vite, Supabase, Tasks, or Home Maintenance blocker. The previous Google Cloud origin blocker is resolved.

## Recommended Next Prompt

Rerun Calendar OAuth in a normal Chrome browser session against `http://localhost:3000`, using the same local Vite server and Google OAuth client. Verify connect, events-or-empty-state, disconnect, reconnect if practical, and console state. If Chrome completes successfully while the in-app browser does not, document the in-app browser limitation and mark the feature branch merge-ready from an application perspective.
