# Life Lists

## Purpose
Life Lists are generic household collections for things family members want to do, watch, read, visit, buy, remember, or plan.

## Release 1.1 Scope
- First-class Life Lists module under More.
- Generic list and item framework rather than hardcoded media, travel, gift, or shopping types.
- Fast create flows for lists and list items through Universal Quick Add.
- Universal Search results for lists and list items.
- Home dashboard awareness card with up to five recent or favorite list signals.

## Data Model
`life_lists` stores collection metadata:
- `name`, `description`, `category`
- `household_id`, `user_id`, `owner_user_id`
- `visibility`: `personal`, `household`, or `shared`
- `color`, `icon`, `favorite`, `archived`, `sort_order`
- `created_at`, `updated_at`

`life_list_items` stores entries inside a list:
- `title`, `description`
- `priority`: `low`, `med`, or `high`
- `status`: `planned`, `in_progress`, `completed`, `someday`, `deferred`, or `archived`
- `favorite`, `assigned_to_person_id`, `tags`, `link_url`, `image_url`
- `completed_at`, `archived`, `sort_order`
- `created_at`, `updated_at`

## Permissions
- Active household members can read household/shared lists.
- Personal lists are visible only to their owner.
- Owners and adults can create and manage household/shared lists and items.
- Any signed-in active member can create personal lists.
- Backend RLS enforces these rules; UI controls mirror them.

## Deferred Work
- Recommendation engines, ratings, reviews, and external media/book/travel APIs.
- Push, email, SMS, or assignment notifications.
- Rich image upload/storage.
- Dedicated category templates.
