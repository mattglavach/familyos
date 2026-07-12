# Pool

Release 2.1.1 stabilizes partial Pool Test saves. A valid date and at least one chemistry or water measurement are required; every other value is optional, numeric zero is valid, and blank optional values normalize to `null`. Invalid fields are identified directly, failed writes retain the form, duplicate submissions are blocked, successful writes refresh Pool data immediately, and Pool entry forms use the shared compact responsive grid pattern.

Release 2.2.0 removes historical `NOT NULL` drift from optional Pool Test weather and appearance fields. Both authenticated entry paths are regression-tested against real Supabase persistence, including numeric zero, decimal values, ownership, immediate activity/status refresh, full browser reload, duplicate prevention, failure retention, and authenticated cleanup of only the created test row.

The production release preflight also found that production had missed the Release 1.7 `test_context` and `water_appearance` columns. The idempotent Release 2.2 corrective migration adds those canonical text columns only when absent, retains the required `Routine` test-context default, and leaves weather and appearance nullable. No Pool permissions or ownership behavior changes.

Release 1.8.4 keeps the consolidated Pool Status and promotes Pool into primary bottom navigation. History combines tests, treatments, cleaning, and maintenance in compact cards with visible accessible Edit/Delete actions. History no longer uses swipe gestures, and deletion requires confirmation. Equipment and Maintenance retain their existing workflows.

## Release 1.8 Optimization Contract

The `familyos.pool-context` contract is version 2.0. It retains compatibility fields while adding profile summary, latest complete test, freshness, chemistry status, pending retests, chlorine-demand summary, pH-rise summary, maintenance and equipment status, open Pool Tasks, data-completeness flags, deterministic attention items, trend summaries, and explicit safety constraints.

Trend states distinguish rising, falling, stable, insufficient, stale, and irregular records. These are observed history, not predictions. Chlorine-demand intervals contaminated by treatments are excluded. Neither summary changes SWG output or generates a dose by itself. All actions remain human-confirmed.

## Release 1.7 Operations Contract
FamilyOS owns the Pool profile, measurements, treatment/equipment history, targets, deterministic calculations, safety constraints, timing rules, status, trends, linked Tasks, and structured context. ChatGPT may explain, interpret, plan, diagnose, and optimize, but is not the source of dosage, compatibility, or swim-safety rules. The `familyos.pool-context` v1.0 contract supplies scoped profile, history, equipment, open Tasks, warnings, recommendations, and data-quality context.

## Purpose
The Pool module is the Pool Care Assistant. It tracks water tests, treatments, equipment, maintenance, notes, parties, weather context, and action history so the household can answer: what does the pool need, why does it matter, and what should happen next?

Release 1.8.4 completes Confirm and Log by prefilling the existing editable chemical form and saving only after explicit confirmation. Review with ChatGPT generates a reusable, privacy-filtered context prompt for preview and copy; it never transmits automatically and external advice cannot update Pool records.

## Release 1.4.0 Scope
- Pool health dashboard.
- Water test logging for FC, CC, pH, TA, CYA, salt, temperature, source, SWG, pump runtime, weather notes, heavy use, and notes.
- Rule-based recommendations with amount, timing, retest guidance, explanation, confidence, and safety note.
- Treatment and maintenance timeline.
- Equipment inventory for pump, salt cell, filter, heater, robot cleaner, Betta skimmer, solar cover, and test kit.
- Recurring Pool maintenance reminders.
- Quick Add targets and Universal Search coverage.
- Owner/adult write access with viewer read-only UI behavior.

## Pool Test Contract
- New Pool Test creation allows partial logs from both the Pool module drawer and Quick Add.
- Quick Add and the Pool module share the same Pool Test validation and row-building helpers so optional chemistry values, context fields, and timestamps are submitted consistently to `pool_readings`.
- `ph` and `free_chlorine` are optional. When supplied, all numeric fields are range-checked before insert.
- Empty logs are blocked; users must provide at least one tested value, note, rain context, or party/heavy-use context.
- Party uses `pool_readings.recent_heavy_usage`; Rain is represented in `pool_readings.recent_weather_notes`.

## Production Bug Notes
- July 6, 2026: fixed a Quick Add Pool Test regression where the create path could drift from the Pool module's required FC/pH form contract. Automated coverage now verifies pH rendering, missing-pH validation, and successful Pool Test creation.
- July 6, 2026: fixed a local-only persistence regression where failed Supabase writes could appear temporarily in Pool history through shared table-hook fallback state. Pool Test saves now depend on confirmed Supabase insert/update success, and failed writes remain visible as errors instead of success.
- July 6, 2026: updated Pool Test behavior after production feedback so partial tests no longer require FC or pH, CC appears directly after FC, Party/Rain context is visible in both create flows, Quick Add close buttons have safer hit targets, and reloaded partial readings remain visible in history/advisor status.

## Future Enhancements
- AI Pool Coach explanations.
- Pentair, Home Assistant, Weather, Taylor, and pool-store imports.
- Charts and trends.
- Import/export.
- Notifications.
- Image upload/OCR.

## Non-Goals
- Automatic chemical dosing.
- Automatic equipment control.
- Live Pentair or Home Assistant integration.
- Finance, Health, or AI platform implementation.

## Acceptance Criteria Template
- User can view module landing page.
- User can add a record.
- User can edit or delete where appropriate.
- Empty states are clear.
- Mobile layout works.
