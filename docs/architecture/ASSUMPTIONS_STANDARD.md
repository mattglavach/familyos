# Assumptions Standard

Assumptions are explicit values Family OS uses to interpret data, calculate outcomes, and make recommendations. They must be visible, editable when appropriate, and traceable from every recommendation that depends on them.

## Assumption Fields

Every assumption should support:
- Name
- Description
- Value
- Unit
- Category
- Module
- Recommended default
- Recommended range
- Source
- Why it matters
- Validation rules
- Last updated
- Editable
- Used by recommendations

## Field Guidance

### Name
Use a short human-readable label, such as `Salt target`, `Retirement age`, or `Annual college inflation`.

### Description
Describe what the assumption represents and when the household should adjust it.

### Value And Unit
Store the value in a structured format and keep the unit explicit. Examples include `3500 ppm`, `10 hours/day`, `6 percent`, or `67 years`.

### Category And Module
Category groups assumptions inside the UI. Module identifies the owning module, such as Pool, Finance, Retirement, or College.

### Recommended Default And Range
Defaults and ranges should come from product logic, household history, trusted references, or user preference. Ranges should be advisory unless the value would break a calculation or safety rule.

### Source
Track whether the value came from user entry, system default, historical data, imported data, professional guidance, or AI suggestion.

### Why It Matters
Explain how the assumption affects recommendations, risk, cost, timing, or confidence.

### Validation Rules
Document required format, minimum, maximum, precision, dependency rules, and any warnings.

### Last Updated
Show when the assumption was last changed and use this to identify stale planning inputs.

### Editable
Editable assumptions can be changed by the household. Locked or derived assumptions should explain why they cannot be edited directly.

### Used By Recommendations
List or link to recommendation types that consume the assumption.

## UI Behavior

- Show assumptions in a dedicated module section, grouped by category.
- Display current value, unit, source, freshness, and confidence where relevant.
- Provide inline edit controls for simple values and a detail drawer for values that need explanation.
- Show recommended default and recommended range near the edit control.
- Flag stale, missing, out-of-range, and AI-suggested values.
- Allow users to reset an editable assumption to the recommended default.
- Avoid hiding assumptions behind AI output; recommendations must link back to the assumptions they used.

## AI Recommendation Flow

- AI prompts should receive only the assumptions needed for the requested recommendation.
- AI output should name the assumptions used and explain how they affected the recommendation.
- If an assumption is missing, stale, or outside the recommended range, AI should lower confidence and call that out.
- AI may suggest assumption updates, but user approval should be required before persisted values change.
- AI should distinguish household-specific assumptions from generic defaults.

## Governance

- Assumptions that affect safety, finances, or long-term planning should have stricter validation and clearer warnings.
- Module-specific assumptions should reuse common field names and categories where practical.
- Meaningful changes to assumption behavior should be documented in the module plan or architecture decisions.
