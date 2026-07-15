# AI Workspace

## Release 3.2: Family Assistant

The navigation entry is now Family Assistant. It directly requests server-side, permission-scoped advisory responses instead of requiring users to copy prompts. Users can ask household questions, run a weekly planning review, select context modules, see source and evidence indicators, review structured recommendations, provide feedback, and open editable proposed actions in the owning FamilyOS workflow.

Family Assistant keeps only the current on-screen session history. It never changes a record from a model response. A proposed action must be reviewed, confirmed for handoff, validated by the owning module, and saved through that module's normal permission-controlled workflow. When AI is disabled or unavailable, deterministic FamilyOS findings remain available.

Release 2.10.1 adds a concise first-use explanation, seven household starter prompts, and plain-language Ask, Plan, and Take Action intent. All generated changes remain proposals. The owning FamilyOS form and explicit user approval remain the only record-write boundary.

The Release 2.0.0 AI Workspace is reached through More and is the single active prompt-generation surface. It provides suggested questions, Ask FamilyOS, prompt preview, Copy Prompt, device-local recent prompt metadata, and optional pasted-response review.

Copy is the default and only sharing behavior. FamilyOS does not transmit prompts, authenticate providers, store conversation history, or accept AI output into the database automatically. Response Review identifies possible tasks, calendar events, reminders, shopping items, and Pool recommendations. Marking an item accepted records only the current-screen review state; manual record creation remains a separate explicit action.

Release 2.1.0 adds device-local favorite prompts, recent-prompt reuse, collapsible preview sections, and guided review for Tasks, Calendar, Pool, Life Lists, and Financial Planning. Review opens the established destination form with suggested values. The user must still validate the proposal and press the normal save action. No suggestion writes automatically.
