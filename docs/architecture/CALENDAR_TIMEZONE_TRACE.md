# Calendar Timezone Trace

## Release 1.8 blocker resolution

### Confirmed root cause

FamilyOS preserved the Google provider timestamp but also carried a precomputed `event.time` string. Calendar cards, event details, Dashboard, Search, Notifications, and Household Context trusted that display string. A response or legacy in-memory event containing `start: 2026-07-11T18:00:00Z` and `time: 6:00 PM` therefore displayed the UTC clock value instead of formatting the preserved instant for Eastern time.

Recurring and non-recurring timed events used the same vulnerable rendering contract. All-day events use a separate date-only path.

### Representative boundary trace

| Boundary | Value after correction |
| --- | --- |
| Google Calendar display | `2:00 PM` Eastern |
| Provider `start.dateTime` | `2026-07-11T14:00:00-04:00` or equivalent `2026-07-11T18:00:00Z` |
| Provider timezone metadata | `America/New_York` when supplied; `UTC` is also accepted |
| Server synchronization | Preserves provider timestamp and calls the shared `Intl.DateTimeFormat` normalizer |
| Browser fallback | Preserves the same timestamp and calls the same normalizer |
| Supabase write | No Calendar event write exists |
| Supabase storage | Only connection/token metadata and `last_sync_at`; no event timestamp is stored |
| Supabase query result | Not applicable to events |
| JavaScript parsed instant | `2026-07-11T18:00:00.000Z` |
| Eastern date grouping | `2026-07-11` |
| Calendar card/detail | `2:00 PM` |
| Dashboard | `2:00 PM` |
| Global Search | `2:00 PM` |
| Notifications/Household Context | `2:00 PM` |

The application never manually subtracts four or five hours. `America/New_York` daylight-saving behavior is delegated to `Intl.DateTimeFormat`.

### Existing data impact

Current Calendar events are fetched live from Google and held in memory. There are no synchronized Calendar event rows to repair and no production-data rewrite is needed. Refreshing Calendar or reloading FamilyOS is sufficient after the corrected code is running. No migration or resynchronization job is required.

All-day `start.date` values remain exact date-only strings and never pass through timestamp parsing. Multi-day all-day event end dates remain provider date-only values.
