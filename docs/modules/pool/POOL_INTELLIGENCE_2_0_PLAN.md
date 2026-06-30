# Pool Intelligence 2.0 Plan

## Vision
Pool Intelligence 2.0 turns pool care into an explainable decision-support workflow. It should help the household understand current water status, what to do next, why the recommendation is being made, and how confident Family OS is in the advice.

## Goals
- Move Pool into Household Context without disrupting existing usage.
- Create a durable Pool Profile for permanent configuration.
- Make assumptions visible and editable.
- Preserve readings, treatments, maintenance, equipment, and cost history.
- Provide explainable recommendations with confidence scoring.
- Support quick daily testing first, then expand into AI-assisted prediction and automation.

## User Experience
- Mobile-first daily entry for common tests and observations.
- Clear current status with next action and confidence.
- Separate permanent pool facts from editable operating assumptions.
- Show trend context before recommending chemical or runtime changes.
- Link recommendations to inputs, assumptions, missing data, and history.

## Pool Profile
Permanent configuration should include:
- Saltwater pool
- Raised spa
- Solar cover
- Pentair Intellicenter
- Intellichlor IC40
- WhisperFlo VST
- Pump, filter, SWG, heater, and other equipment details
- Pool volume, shape, surface, and climate when known
- Taylor K-2006 and Taylor K-1766 test kits

## Editable Assumptions
Initial assumptions should include:
- Salt target approximately 3400-3600 ppm
- FC target based on CYA
- pH target
- TA target, currently approximately 90
- CH target
- CYA target with manual CYA testing
- Pump runtime, typically approximately 10 hours/day
- SWG percentage
- SWG minimum RPM approximately 1900
- Normal operating speed approximately 2200 RPM
- Preferred chemicals
- Testing schedule
- Vacation defaults
- Party/swimmer load adjustment rules
- Weather impact rules

## Known Pool Configuration
- Saltwater pool
- Pentair Intellicenter
- Intellichlor IC40
- WhisperFlo VST
- SWG minimum RPM approximately 1900
- Normal operating speed approximately 2200 RPM
- Typical runtime approximately 10 hours/day
- Salt target approximately 3400-3600 ppm
- FC target based on CYA
- Manual CYA testing
- pH tends to rise
- TA approximately 90
- Raised spa
- Solar cover
- Party/swimmer load matters
- Weather impacts recommendations
- Taylor K-2006
- Taylor K-1766
- Manual entry first
- Quick daily testing workflow

## Daily Workflow
- Open Pool from the dashboard or module tab.
- Enter quick readings such as FC, pH, salt, temperature, and notes.
- Mark context such as party/swimmer load, rain, heat, or solar cover usage.
- Review current status, confidence, and next action.
- Save treatments or maintenance performed.
- Defer or dismiss recommendations with a reason when appropriate.

## Equipment
- Track equipment type, model, install date, status, notes, and maintenance history.
- Start with manual equipment records.
- Later integrations can read from Pentair Intellicenter if feasible and safe.

## Maintenance
- Track cleaning, brushing, filter work, basket cleaning, equipment checks, and seasonal tasks.
- Connect recurring maintenance to the shared task framework when the module is household-aware.

## Chemical Tracking
- Track readings, recommended treatments, actual treatments, chemical products, dosage, and cost.
- Keep recommendations separate from actions actually taken.
- Require safety guardrails for chemical interactions and uncertain readings.

## Treatment History
- Preserve timestamped treatment records.
- Link treatments to the readings and recommendations that caused them.
- Support trend analysis after treatment, including expected versus actual effect.

## Dashboard
- Show current pool status, latest reading age, highest priority action, and confidence.
- Include warnings for stale readings, out-of-range values, or missing CYA.
- Keep dashboard actions short and link to the full Pool workflow.

## AI Recommendations
- Explain what changed, why it matters, and what to do next.
- Include inputs used, assumptions used, confidence, risk, alternatives, and missing information.
- Lower confidence when CYA is stale, readings are missing, or weather/swimmer load is unknown.

## Decision Intelligence
- Follow `docs/architecture/DECISION_ENGINE_STANDARD.md`.
- Recommendations should cover chemistry, runtime, SWG output, maintenance, weather, vacation mode, and party mode.
- Recommendations should be auditable after treatment or maintenance is logged.

## Safety Guardrails
- Do not recommend unsafe chemical combinations.
- Ask for retesting when readings conflict or imply a high-risk correction.
- Identify when professional pool service advice may be needed.
- Make uncertainty visible before suggesting large chemical additions.

## Confidence Scoring
- High confidence: recent complete readings, current CYA, known runtime/SWG settings, no conflicting data.
- Medium confidence: enough recent data for a conservative recommendation, but one important input is old or estimated.
- Low confidence: stale readings, missing CYA, unknown treatment history, unusual weather, or conflicting values.

## Implementation Phases

### Phase 1 - Household Migration
- Move Pool reads and writes to Household Context.
- Preserve legacy `user_id` behavior during migration.
- Validate locally before RLS changes.

### Phase 2 - Profile And Assumptions
- Add Pool Profile UI and storage.
- Add editable assumptions using the shared assumption standard.
- Show missing profile and assumption fields.

### Phase 3 - History
- Normalize readings, treatments, maintenance, equipment, and cost history.
- Connect history to dashboard and recommendation context.

### Phase 4 - Decision Intelligence
- Implement structured recommendation output.
- Add confidence scoring, alternatives, missing data, and risk if ignored.

### Phase 5 - AI Assistance
- Add AI summaries, trend interpretation, weather impact, vacation mode, party mode, and predictive maintenance.

### Phase 6 - Automation
- Add reminders, recurring workflows, optional equipment integrations, and Family Command Center recommendations.
