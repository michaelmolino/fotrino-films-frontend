# Components Readability Patterns

This folder uses a view-model-first component pattern to keep templates easy to scan and scripts easy to test.

The main goal is to make component intent obvious:

- What state is the UI in?
- What data shape does each rendered card/item need?
- Which handlers are responsible for interactions and navigation?

## Core Principles

1. Keep templates declarative

- Templates should mostly render precomputed values.
- Avoid heavy inline expressions, nested ternaries, and ad-hoc object creation in template props.

1. Use explicit UI states

- Prefer named state values such as `loading`, `ready`, `not-found`, `empty`, `redirecting`, `split`.
- Drive conditional rendering from a single computed state instead of multiple scattered conditions.

1. Move display derivations to view-model composables

- Put computed card/list shapes in composables like `useChannelRootViewModel`, `useAlbumRootViewModel`, `useMediaRootViewModel`.
- Keep route entity resolution and route guard orchestration in dedicated route composables.

1. Use stable view model objects for repeated UI blocks

- Build `*Cards` arrays with stable keys and all render props precomputed.
- Keep template loops simple (`v-for="card in ..."`).

1. Keep behavior handlers named and centralized

- Use named functions for redirects, click handlers, and watchers.
- Avoid inline lambdas in templates where behavior is non-trivial.

1. Separate routing guards from rendering logic

- Keep redirect and not-found guard logic in `use*RouteOrchestrator` (or named script helpers for simple cases).
- Keep template focused on rendering by state.

## Standard Structure

For root-level components, follow this layout:

1. Imports
2. Route/store/composable setup (loader + `routeContext`)
3. Route entity derivation (`use*RouteEntities`)
4. Derived view model (`contentState`, `displayState`, `*Cards`, counts)
5. Named behavior helpers (`redirect`, etc.)
6. Route guard orchestration (`use*RouteOrchestrator`) + local UI-only watchers
7. Thin template using state and cards

## Route Composition Split

For route-driven roots, keep responsibilities explicit:

- `useChannelLoader`: load channel-level data and finder helpers.
- `use*RouteEntities`: resolve route targets (album/media) from `routeContext` and loaded data.
- `use*RootViewModel`: compute render-ready state and card arrays.
- `use*RouteOrchestrator`: enforce redirects/not-found behavior and navigation flow.

This split keeps rendering concerns independent from navigation policy.

## Recommended Naming

- State names: `contentState`, `displayState`
- Boolean gates: `showEmptyContent`, `showRelatedContent`, `showFeaturedSection`
- Lists for rendering: `albumCards`, `mediaCards`, `relatedCards`, `allMediaCards`
- Counters: `albumCount`, `allCount`, `featuredMediaCount`

## Template Rules

Do:

- Keep each branch easy to read (`v-if`/`v-else-if`/`v-else` by state name).
- Render precomputed card props.
- Keep `data-cy` selectors stable and explicit.

Avoid:

- Inline sorting/filtering/mapping in template.
- Route comparisons or null checks repeated in many places.
- String/path assembly in template expressions.

## View-Model Example Pattern

```js
// useExampleRootViewModel.js
import { computed } from 'vue'
import { resolveMediaCanonicalPathForContext } from '@utils/channel-route.js'

export function useExampleRootViewModel({ loading, entity, routeContext, items }) {
  const contentState = computed(() => {
    if (loading.value) return 'loading'
    return entity.value && routeContext.value.hasTarget ? 'ready' : 'not-found'
  })

  function getItemPath(item) {
    return resolveMediaCanonicalPathForContext({
      context: routeContext.value,
      canonicalPath: item.canonicalPath
    })
  })

  const itemCards = computed(() => {
    return items.value.map((item, index) => ({
      id: item.id,
      item,
      to: getItemPath(item),
      priority: index === 0 ? 'high' : 'auto'
    }))
  })

  const showEmptyContent = computed(() => itemCards.value.length === 0)

  return {
    contentState,
    itemCards,
    showEmptyContent
  }
}
```

## Component Example Pattern

```vue
<template>
  <div>
    <LoadingSkeleton v-if="contentState === 'loading'" />

    <template v-else-if="contentState === 'ready'">
      <div v-for="card in itemCards" :key="card.id">
        <ItemPreview :item="card.item" :to="card.to" :priority="card.priority" />
      </div>
      <NothingText v-if="showEmptyContent" text="No content available." />
    </template>

    <NothingText v-else text="Not found." />
  </div>
</template>
```

## Migration Checklist

When refactoring an existing component:

1. Identify all UI states currently expressed with scattered conditions.
2. Introduce `contentState` (and `displayState` if needed).
3. Extract route context + route entity selection into `use*RouteEntities` where applicable.
4. Move list/item derivations into computed card arrays.
5. Replace inline route/path assembly with helper functions in script/composable.
6. Move redirect/not-found policy into `use*RouteOrchestrator` where applicable.
7. Replace inline template behavior with named handlers.
8. Keep or add stable `data-cy` selectors.
9. Verify imports for all composition API utilities used (`computed`, `ref`, etc.).
10. Re-run related Cypress specs after refactor.

## Notes For This Repository

These patterns are already used in channel roots and related composables:

- `ChannelRoot` + `useChannelRootViewModel`
- `AlbumRoot` + `useAlbumRootViewModel`
- `MediaRoot` + `useMediaRootViewModel`
- `useAlbumRouteEntities` and `useMediaRouteEntities`
- `useChannelRootRouteOrchestrator`, `useAlbumRootRouteOrchestrator`, `useMediaRootRouteOrchestrator`

Use those files as canonical examples when adding or refactoring components in this folder.
