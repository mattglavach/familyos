# Pool Care Assistant

## Purpose
Pool should become a Pool Care Assistant, not only a chemistry tracker.

The product question is:

> What does my pool need, why does it matter, and what should I do next?

Release 1.4.0 implements the Pool Care Assistant foundation as the first Home Platform module. It adds a Pool action workspace, rule-based recommendations, water test logging, treatment history, equipment tracking, maintenance reminders, Home awareness, Quick Add, Universal Search, and schema foundations.

## Product Position
Pool belongs under the future Home Platform because it combines home equipment, seasonal care, safety, maintenance history, and future connected-device context.

The assistant should help a household owner make safe, understandable care decisions. It should explain readings in plain English, recommend the next action, and track what changed over time.

## Release 1.4.0 Scope

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

The Release 1.4.0 action engine is rule-based and configurable in `src/modules/pool/actionEngine.js`. It does not call an AI platform, dose chemicals, control equipment, or make silent changes.

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

## Quick Add
Release 1.4.0 exposes these capture targets:
- Pool Test.
- Chemical Added.
- Maintenance Completed.
- Pool Note.

## Future Integrations
Future integrations may include:
- Pentair.
- Home Assistant.
- Weather.
- Manual Taylor test kit entry.
- Pool store test result or photo upload.

Each integration requires separate product, security, data, and validation review before implementation.

## Deferred After Release 1.4.0
- Pentair live integration.
- Home Assistant integration.
- Weather integration.
- Taylor digital import.
- Pool Store test-result import.
- Image upload, OCR, or pool-store parsing.
- AI Pool Coach runtime.
- Automatic chemical dosing.
- Automatic equipment control.
