# Emotion Lab DB Audit

## App usage found

Supabase auth is used from the browser for signup, login, logout, and current-user checks. The app reads and writes these tables:

- `profiles`: `id`, `pseudo`, `bio`, `looking_for`, `study_level`, `is_visible`
- `test_results`: `user_id`, `mbti_code`, `mbti_name`, `big_five_scores`, `stress_score`, `balance_score`, `created_at`
- `user_hobbies`: `user_id`, `hobby`
- `buddy_requests`: `id`, `sender_id`, `receiver_id`, `message`, `status`, `created_at`
- `conversations`: `id`, `sender_id`, `receiver_id`
- `messages`: expected for the MVP navigation/messaging scope, although no message page currently writes it
- `resources`: optional; current resources are static React data

No RPC calls were found.

## Missing or risky pieces

- `test_results` and `user_hobbies` were missing, causing the reported Supabase errors.
- Signup only sends `pseudo` and `study_level` as auth metadata; without an auth trigger, `profiles` rows are not guaranteed.
- Buddy matching needs public reads of visible profiles, visible users' hobbies, and visible users' latest result summary.
- Buddy requests need participant-only reads and sender/receiver-only writes.
- Accepting a request could race and create duplicate conversations without a database-level unique pair rule.
- RLS must prevent users from reading private profiles, modifying other users' results/hobbies, or seeing requests/conversations/messages where they are not a participant.
- Indexes were needed for latest-result lookups, visible-profile directory queries, request tabs, conversation pair checks, and message timelines.

## Fix added

Run:

```sql
supabase/migrations/20260512220000_complete_multi_user_schema.sql
```

In Supabase, open SQL Editor, paste the file contents from the first line, and run it once. It uses `if not exists` for schema objects and `drop policy if exists` before recreating policies, so it can be rerun.

The migration creates or updates:

- `profiles`, `test_results`, `user_hobbies`, `buddy_requests`, `conversations`, `messages`, and optional `resources`
- profile creation trigger on `auth.users`
- `updated_at` triggers
- unique active buddy request pair index
- unique conversation pair index
- trigger that creates one conversation when a buddy request becomes `accepted`
- RLS policies for authenticated users

## Multi-user RLS model

- Profiles: users manage only their own profile; authenticated users can read visible profiles.
- Test results: users manage only their own results; authenticated users can read result summaries for visible profiles for matching.
- Hobbies: users manage only their own hobbies; authenticated users can read hobbies for visible profiles for matching.
- Buddy requests: only sender and receiver can read; sender can create pending requests to visible users; pending participants can move requests to allowed statuses.
- Conversations: only participants can read; inserts require an accepted buddy request and are protected by a unique unordered pair index.
- Messages: only conversation participants can read; only the authenticated sender can insert/update/delete their own messages.
- Resources: authenticated users can read published resources.

## App code impact

Current app queries match the migration column names. No UI or Supabase client changes were required.
