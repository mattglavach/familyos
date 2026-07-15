# Dashboard

Release 3.2 adds a progressive Family Brief executive summary. Deterministic recommendations render independently and remain available during provider delay or outage. The summary routes to Family Assistant and never mutates records inline.

Release 2.1.0 made Home a configurable daily briefing. It leads with explicit Top Priorities by default, gives Schedule and Family Snapshot useful empty states, and allows device-local ordering of those three sections. Home remains an awareness and routing surface with no inline record mutation.

Release 1.8.4 removes the separate Needs Attention section. Family Snapshot owns compact Tasks, Calendar, Life Lists, Pool, Home, and meaningful Retirement summaries, with limited attention details embedded in their owning row. Life Lists remains visible when empty. Greeting weather is optional, cached, non-blocking, and hidden when household location or the weather service is unavailable. Shopping is not exposed.

## Purpose
The Dashboard is the command center for Family OS. It should summarize the most important information across modules and show upcoming tasks, reminders, finance snapshots, pool status, family events, and alerts.

## MVP Scope
- Summary view
- Add/edit records
- History list
- Basic reminders or notes
- Mobile-friendly layout

## Future Enhancements
- AI summaries
- Automated reminders
- Charts and trends
- Import/export
- Notifications

## Acceptance Criteria Template
- User can view module landing page.
- User can add a record.
- User can edit or delete where appropriate.
- Empty states are clear.
- Mobile layout works.
