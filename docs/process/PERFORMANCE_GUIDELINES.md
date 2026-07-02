# Performance Guidelines

Family OS should stay fast on everyday phones and reliable on household-scale data.

## Frontend
- Keep initial bundle growth visible in build output.
- Prefer module-local imports over broad library imports when practical.
- Avoid unnecessary re-renders from oversized context state.
- Memoize only when it solves measured or obvious repeated work.
- Keep loading states stable to avoid layout shifts.

## Rendering
- Use lists/cards that scale to expected household data.
- Avoid expensive filtering/sorting in render when data grows.
- Keep charts simple and bounded on mobile.

## Data Fetching
- Fetch only columns needed for the screen where practical.
- Scope queries by active household/user.
- Avoid repeated fetch loops from unstable effects.
- Use explicit refresh after mutations when realtime is not required.

## Database
- Add indexes for common filters, joins, and status/date lookups.
- Validate query plans for high-volume or sensitive modules when needed.
- Avoid broad table scans in RPCs that will grow with household history.

## API
- Keep serverless routes focused.
- Cache external or expensive reads only when correctness permits.
- Avoid sending token material or oversized payloads to the frontend.

## Dependencies
- Consider bundle impact before adding UI or utility libraries.
- Remove unused dependencies during cleanup.
