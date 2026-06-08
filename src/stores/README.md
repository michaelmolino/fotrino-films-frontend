# Stores: Pinia + Colada Usage Guide

This project uses Pinia for domain orchestration and Colada for server-state queries.

The goal is a strict split:

- Colada owns API-backed read state (query data, loading state, error state, freshness).
- Pinia store methods own domain actions (mutations, command-style workflows, cache invalidation).
- UI components consume query results directly instead of mirrored store arrays/objects.

## Mental model

Use Colada when the value comes from an API and can be re-fetched.
Use Pinia state when the value is local UI or workflow state that the API does not own.

Examples of API state:

- account profile response
- admin users/jobs/reported-media lists
- channel route-resolve payloads
- expiring media sessions

Examples of local UI/workflow state:

- temporary form state
- in-flight flags local to a screen/composable
- filter mode persisted to localStorage
- one-off orchestration tokens and lifecycle counters

## What goes in a store

Keep these in stores:

- query option factories and query helpers used across screens
- mutation methods that call write endpoints
- explicit query invalidation after successful mutations
- strict input validation for mutation payloads

Do not keep these in stores:

- mirrored copies of Colada query data (for example users, jobs, channels arrays copied from query.data)
- defensive fallback shims that hide contract problems

## Query patterns

Preferred:

- Return useQuery(...) from store helpers.
- In components/composables, derive rows and loading from query.data and query.isLoading.
- For error-dependent display behavior, transform query.data at the query boundary.

Avoid:

- Watching query.data just to copy it into a Pinia ref.
- Using store-level duplicated data as the source of truth.

## Mutation patterns

Preferred:

- Wrap write calls with runMutation.
- Return mutationResult from store methods.
- Invalidate affected Colada keys immediately after successful writes.

Cancellation:

- Use a local CANCELLED sentinel and map user-cancelled errors to mutationResult({ ok: false, cancelled: true }).

## Expiring token/session resources

Some API responses are time-bounded (for example playback session URLs with expiresAt).

For those:

- Keep the fetch in a Colada query.
- Add explicit refresh scheduling logic based on the server expiry field.
- Add visibility-resume handling because mobile Safari can suspend timers while backgrounded/locked.
- Refresh the playback source in place when possible to avoid unnecessary full player teardown.

Colada handles caching and refetch triggers, but response-derived expiry schedules are app policy and must be implemented explicitly.

## Current repository conventions

- account-store.js: profile is query-backed; no mirrored profile copy.
- admin-store.js: list queries are query-backed; components consume query.data.
- channel-store.js: read queries plus mutation/invalidation orchestration.
- upload-store.js: command-style upload workflow mutations and invalidation.

## Quick checklist for new code

Before adding state or methods to a store, ask:

1. Is this server state? If yes, use Colada query data directly.
2. Is this a write action? If yes, implement as a Pinia store mutation method and invalidate affected queries.
3. Am I copying query.data into a store ref? If yes, remove that copy unless there is a proven need.
4. Is there an expiry timestamp in the payload? If yes, add explicit refresh scheduling and resume handling.

Keeping this split strict reduces stale data bugs, simplifies components, and keeps data ownership obvious.
