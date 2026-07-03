# Pool

## Purpose
The Pool module is the Pool Care Assistant. It tracks water tests, treatments, equipment, maintenance, notes, parties, weather context, and action history so the household can answer: what does the pool need, why does it matter, and what should happen next?

## Release 1.4.0 Scope
- Pool health dashboard.
- Water test logging for FC, CC, pH, TA, CYA, salt, temperature, source, SWG, pump runtime, weather notes, heavy use, and notes.
- Rule-based recommendations with amount, timing, retest guidance, explanation, confidence, and safety note.
- Treatment and maintenance timeline.
- Equipment inventory for pump, salt cell, filter, heater, robot cleaner, Betta skimmer, solar cover, and test kit.
- Recurring Pool maintenance reminders.
- Quick Add targets and Universal Search coverage.
- Owner/adult write access with viewer read-only UI behavior.

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
