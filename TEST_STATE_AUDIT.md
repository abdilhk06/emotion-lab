# Test State Audit

## Cause

The test flow used shared browser keys:

- `emotionlab_test_answers`
- `emotionlab_test_hobbies`
- `emotionlab_test_result`

Those keys were not scoped to the authenticated user. In one browser, a newly registered or newly logged-in account could read the previous account's in-progress answers, selected hobbies, or local fallback result before Supabase returned user-specific rows.

## Final Strategy

Test-flow browser state is now namespaced by Supabase auth user id:

- `emotionlab_test_answers:{user.id}`
- `emotionlab_test_hobbies:{user.id}`
- `emotionlab_test_result:{user.id}`

The test, hobbies, loading, and post-test results pages resolve the current authenticated user before reading or writing local fallback state. Legacy unscoped keys are removed when test pages run and at login, register, and logout boundaries.

Existing users can still resume their own in-progress test from their user-scoped keys. New users start with empty answers, hobbies, and local results.

Supabase private result reads in `/test/results`, `/results`, and `/dashboard` filter `test_results` by `.eq("user_id", user.id)`. Test completion writes `test_results` and `user_hobbies` with the same current `user.id`.
