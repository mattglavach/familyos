# Meal Planning Architecture

## Release
Release 1.3 Meal Planning

## Scope
Meal Planning is the third Planning Platform module. It adds recipes, recipe ingredients, meal plans, meal assignments, Home awareness, Quick Add, Universal Search, and a reviewed Shopping integration.

Release 1.3 does not add nutrition tracking, Health workflows, AI recommendations, recipe APIs, barcode scanning, OCR, external recipe databases, cost optimization, restaurant integrations, comments, ratings, or social features.

## Data Model
- `meal_plans` stores personal, household, and shared planning containers.
- `recipes` stores personal, household, and shared recipe records.
- `recipe_categories` stores household category metadata.
- `recipe_ingredients` stores structured recipe ingredients and optional pantry/shopping links.
- `meal_assignments` stores dated meal slots inside a meal plan.

The schema includes future reference fields for nutrition, Health, and AI integrations without implementing those features.

## Shopping Integration
Meal Planning can review missing recipe ingredients and add selected items to Shopping.

Rules:
- Shopping lists are not changed automatically.
- The user must open the review drawer and confirm selected missing ingredients.
- Pantry-available ingredients are not selected as missing.
- Existing active, unpurchased shopping items with the same normalized name are treated as duplicates and skipped.
- Generated shopping items store recipe and meal-plan references for future traceability.
- Users may merge into an existing writable shopping list or create a new household/personal list based on role.

## Pantry Integration
Pantry awareness is intentionally simple:
- An ingredient is available when linked to an active pantry item, or when an active pantry item has a matching normalized name and quantity above zero without a reorder flag.
- Otherwise the ingredient is shown as missing.
- Release 1.3 does not attempt inventory depletion, unit conversion, substitutions, or recommendation logic.

## Permissions
- Personal meal plans and recipes are owner-only.
- Household/shared meal plans and recipes are readable by active household members.
- Household/shared meal plans, recipes, ingredients, and assignments are manageable by owners/adults.
- Viewers can create and manage their own personal meal plans and recipes, but cannot manage household/shared records.
- Recipe ingredients inherit recipe access.
- Meal assignments inherit meal-plan access.
