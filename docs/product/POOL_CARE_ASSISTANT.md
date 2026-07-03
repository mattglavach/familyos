# Pool Care Assistant

## Purpose
Pool should become a Pool Care Assistant, not only a chemistry tracker.

The product question is:

> What does my pool need, why does it matter, and what should I do next?

This is a future Home Platform flagship submodule. Release 1.3.2 documents the direction only. It does not add Pool code, database tables, migrations, UI, integrations, or AI behavior.

## Product Position
Pool belongs under the future Home Platform because it combines home equipment, seasonal care, safety, maintenance history, and future connected-device context.

The assistant should help a household owner make safe, understandable care decisions. It should explain readings in plain English, recommend the next action, and track what changed over time.

## Initial Future Scope

### Action Engine
Inputs:
- FC.
- CC.
- pH.
- TA.
- CYA.
- Salt.
- Water temperature.
- SWG percent.
- Pump runtime.
- Recent chemical additions.
- Weather notes.
- Party or heavy-use notes.
- Rain, heat, and vacation context.

Outputs:
- Recommended action.
- Chemical amount.
- Timing.
- Retest guidance.
- Confidence level.
- Plain-English explanation.
- Safety note.

### Treatment History
Track:
- Test readings.
- Chemicals added.
- SWG changes.
- Pump changes.
- Filter cleaning.
- Weather events.
- Parties and heavy use.
- Notes.
- Water clarity observations.

Views:
- Timeline.
- Last 7 days.
- Last 30 days.
- By chemical.
- By reading.
- By action.

### Equipment Maintenance
Track:
- Pump.
- SWG.
- Filter.
- Heater.
- Cleaner or robot.
- Skimmer.
- Solar cover.
- Betta skimmer.
- Test kits and reagents.

Fields:
- Equipment name.
- Type.
- Brand and model.
- Install date.
- Last serviced.
- Next maintenance due.
- Warranty notes.
- Manual or document link.
- Notes.

## Future AI Pool Coach
The future AI layer may answer:
- What should I do today?
- Explain this reading.
- Prepare for party mode.
- Prepare for vacation mode.
- Prepare for heavy rain.
- Why is chlorine dropping?
- What changed this week?

AI rules:
- AI recommends, explains, and prioritizes.
- AI never silently doses chemicals.
- AI shows confidence and safety notes.
- A human confirms every chemical or treatment action.

## Home Awareness
Future Home signals should stay compact:
- Pool looks good.
- Test pH today.
- Add acid tonight.
- Filter cleaning due.
- Salt low.
- Water temperature high.
- Retest tomorrow.

Home should summarize only. Pool remains the action workspace.

## Future Quick Add
Do not expose these capture targets until the Pool module is ready:
- Pool reading.
- Chemical added.
- Maintenance action.
- Pool note.

## Future Integrations
Future integrations may include:
- Pentair.
- Home Assistant.
- Weather.
- Manual Taylor test kit entry.
- Pool store test result or photo upload.

Each integration requires separate product, security, data, and validation review before implementation.

## Deferred In Release 1.3.2
- Pool module code.
- Pool tables or migrations.
- Pool UI changes.
- Chemical calculators.
- AI recommendations.
- External integrations.
- Photo upload, OCR, or pool store parsing.
