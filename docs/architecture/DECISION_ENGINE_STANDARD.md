# Decision Engine Standard

The Decision Engine is the shared recommendation model used by every flagship Family OS module. It makes recommendations explainable, comparable, and auditable across Pool, Finance, Retirement, College, and the Family Command Center.

## Recommendation Fields

Every recommendation should contain:
- Recommendation
- Why
- Inputs Used
- Assumptions Used
- Confidence Score
- Impact
- Risk if Ignored
- Alternative Options
- Missing Data
- Timestamp
- Related Recommendations
- Future Automation Opportunities

## Field Guidance

### Recommendation
State the action clearly. The recommendation should be specific enough for the household to act on.

### Why
Explain the reasoning in plain language. Include the trend, threshold, rule, or planning concern that led to the recommendation.

### Inputs Used
List current data and historical data used, including dates and freshness.

### Assumptions Used
List relevant assumptions and link back to their editable records when available.

### Confidence Score
Use a consistent confidence scale. A practical starting point is:
- High: complete recent data, stable assumptions, low ambiguity.
- Medium: enough data to act, but some uncertainty or older inputs.
- Low: important data is missing, stale, contradictory, or based mostly on defaults.

### Impact
Describe the expected benefit, avoided risk, cost implication, or planning outcome.

### Risk If Ignored
Describe what may happen if no action is taken.

### Alternative Options
Offer reasonable alternatives when timing, cost, risk, or preference may vary.

### Missing Data
Identify data that would improve recommendation quality.

### Timestamp
Record when the recommendation was generated and, when relevant, when it expires or should be reviewed.

### Related Recommendations
Connect dependent or competing recommendations across the same module or other modules.

### Future Automation Opportunities
Describe how the recommendation could later become a reminder, recurring workflow, import, notification, or automated action.

## Examples

### Pool
- Recommendation: Increase SWG output or runtime for the next two days.
- Why: Free chlorine is trending below the target implied by the current CYA assumption and swimmer load is expected to be high.
- Inputs Used: Latest FC reading, CYA value, pump runtime, SWG percentage, party/swimmer load, weather forecast.
- Assumptions Used: FC target based on CYA, normal operating speed, SWG minimum RPM, salt target.
- Confidence Score: Medium if CYA is manually tested but recent; Low if CYA is stale.
- Impact: Reduces algae risk and avoids larger chemical correction later.
- Risk if Ignored: FC may fall below safe operating range.
- Alternative Options: Add liquid chlorine, extend runtime, reduce swimmer load, or retest first.
- Missing Data: Current CYA and combined chlorine if not recently entered.
- Future Automation Opportunities: Suggest runtime changes after weather or party events.

### Finance
- Recommendation: Move excess checking balance above the operating buffer to high-yield savings.
- Why: Cash balance exceeds the household buffer assumption and near-term expenses do not require the surplus.
- Inputs Used: Account balances, upcoming bills, cash-flow forecast, emergency fund target.
- Assumptions Used: Operating buffer, emergency fund target, expected monthly spending.
- Confidence Score: Medium if transactions are current; Low if account sync is stale.
- Impact: Improves interest earned without reducing bill coverage.
- Risk if Ignored: Idle cash earns less and may hide planning gaps.
- Alternative Options: Apply surplus to debt, investment contributions, or upcoming goals.
- Missing Data: Untracked upcoming expenses or account refresh status.
- Future Automation Opportunities: Monthly sweep recommendation.

### Retirement
- Recommendation: Re-run the retirement scenario with updated healthcare and Social Security assumptions.
- Why: Current projections depend on assumptions that have not been reviewed recently.
- Inputs Used: Retirement balances, contribution rates, target retirement age, spending goal.
- Assumptions Used: Inflation, healthcare cost growth, Social Security claiming age, withdrawal rate.
- Confidence Score: Medium if balances are current; Low if major assumptions are stale.
- Impact: Improves confidence in retirement readiness planning.
- Risk if Ignored: Long-term projections may overstate readiness.
- Alternative Options: Review only healthcare assumptions first or compare two retirement ages.
- Missing Data: Latest benefit estimate and healthcare premium estimate.
- Future Automation Opportunities: Quarterly scenario refresh.

### College
- Recommendation: Prioritize FAFSA preparation and scholarship deadline tracking for the active student.
- Why: Upcoming deadlines affect aid eligibility and application quality.
- Inputs Used: Student year, target schools, application deadlines, savings balance, expected family contribution assumptions.
- Assumptions Used: College inflation, annual contribution target, scholarship probability, application timeline.
- Confidence Score: Medium if school list is current; Low if deadlines are incomplete.
- Impact: Reduces missed-aid risk and improves planning visibility.
- Risk if Ignored: Missed deadlines may reduce available aid.
- Alternative Options: Focus first on top-choice schools or need-based aid documents.
- Missing Data: Final school list, FAFSA readiness, scholarship requirements.
- Future Automation Opportunities: Weekly college planning brief and deadline reminders.
