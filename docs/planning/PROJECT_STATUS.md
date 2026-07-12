# Project Status

Playwright authentication infrastructure now fails fast on missing or inconsistent test configuration and uses one freshly generated, gitignored authenticated state for desktop and mobile. Authenticated desktop Chromium and 390px mobile Chromium smoke tests pass against the approved non-production test environment.

Release 1.8.3 is the current local release candidate. Home adds a compact, data-driven Family Snapshot; Calendar removes duplicate refresh controls and displays timed events in the user's browser-local timezone; Pool incorporates its recommendation into the always-visible status and remembers collapsed detail preferences; and More no longer displays placeholder destinations. Release 1.8 architecture, Household Context Service, Pool data contracts, integrations, authentication, and database contracts remain unchanged.

Release 1.7 remains committed locally. Its additive Pool migration has not been applied by this work. Release 1.8 requires no new database columns because the Release 1.7 treatment traceability fields support retest notes and outcomes. No production, deployment, remote Git, tag, merge, or migration action has been performed.

Next product release: Release 1.9 Gardening Operations.
