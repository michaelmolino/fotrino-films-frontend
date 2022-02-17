<template>
  <div class="q-mt-sm text-center">
    <ActionButtonOpenChapter :collection="collection" :movie="movie" :chapter="chapter" />
    &nbsp;
    <q-btn round dense color="positive" icon="edit" disable>
      <q-tooltip>Edit Chapter</q-tooltip>
    </q-btn>
    &nbsp;
    <q-btn
      v-if="!chapter.deleted"
      round
      dense
      color="warning"
      icon="delete"
      @click="deleteChapter(collection.uuid, movie.id, chapter.id)"
      disable
    >
      <q-tooltip>Delete Chapter</q-tooltip>
    </q-btn>
    <q-btn
      v-if="chapter.deleted"
      round
      dense
      color="positive"
      icon="restore_from_trash"
      @click="unDeleteChapter(collection.uuid, movie.id, chapter.id)"
    >
      <q-tooltip>Restore Chapter</q-tooltip>
    </q-btn>
    &nbsp;
    <q-btn
      v-if="chapter.deleted"
      round
      dense
      color="negative"
      icon="delete_forever"
      disable
    >
      <q-tooltip>Delete Forever</q-tooltip>
    </q-btn>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  name: 'ActionBar-Chapter',

  components: {
    ActionButtonOpenChapter: defineAsyncComponent(() =>
      import('@components/account/ActionButtonOpen-Chapter.vue')
    )
  },

  props: {
    collection: Object,
    movie: Object,
    chapter: Object
  },

  methods: {
    editChapter (collectionUuid, movieId, chapterId, deleted) {
      console.log('Not yet supported.')
    },
    deleteMovie (collectionUuid, movieId, chapterId) {
      this.editChapter(collectionUuid, movieId, chapterId, true)
    },
    unDeleteMovie (collectionUuid, movieId, chapterId) {
      this.editChapter(collectionUuid, movieId, chapterId, false)
    }
  }
}
</script>
