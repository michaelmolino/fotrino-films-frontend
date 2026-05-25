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
- Keep route/store derivation logic in one place.

1. Use stable view model objects for repeated UI blocks

- Build `*Cards` arrays with stable keys and all render props precomputed.
- Keep template loops simple (`v-for="card in ..."`).

1. Keep behavior handlers named and centralized

- Use named functions for redirects, click handlers, and watchers.
- Avoid inline lambdas in templates where behavior is non-trivial.

1. Separate routing guards from rendering logic

- Keep redirect and not-found guard logic in watchers/functions in script.
- Keep template focused on rendering by state.

## Standard Structure

For root-level components, follow this layout:

1. Imports
2. Route/store/composable setup
3. Derived view model (`contentState`, `displayState`, `*Cards`, counts)
4. Named behavior helpers (`redirect`, `findByParams`, etc.)
5. Watchers/guards
6. Thin template using state and cards

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

export function useExampleRootViewModel({ loading, entity, route, items }) {
  const contentState = computed(() => {
    if (loading.value) return 'loading'
    return entity.value?.publicId === route.params.id ? 'ready' : 'not-found'
  })

  const itemCards = computed(() => {
    return items.value.map((item, index) => ({
      id: item.id,
      item,
      to: `/m/${item.publicId}/${item.slug}`,
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
3. Move list/item derivations into computed card arrays.
4. Replace inline route/path assembly with helper functions in script/composable.
5. Replace inline template behavior with named handlers.
6. Keep or add stable `data-cy` selectors.
7. Verify imports for all composition API utilities used (`computed`, `ref`, etc.).
8. Re-run related Cypress specs after refactor.

## Notes For This Repository

These patterns are already used in channel roots and related composables:

- `ChannelRoot` + `useChannelRootViewModel`
- `AlbumRoot` + `useAlbumRootViewModel`
- `MediaRoot` + `useMediaRootViewModel`

Use those files as canonical examples when adding or refactoring components in this folder.
