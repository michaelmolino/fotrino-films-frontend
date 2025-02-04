<template>
  <span>
    <q-item>
      <q-item-section side v-if="$q.screen.gt.xs">
        <q-avatar>
          <img :src=this.collection.cover :alt="this.collection.title">
        </q-avatar>
      </q-item-section>
      <q-item-section>
        <q-breadcrumbs>
        <template v-slot:separator>
          <q-icon size="1.5em" name="fas fa-chevron-right" color="primary" />
        </template>
        <q-breadcrumbs-el
          v-for="location in breadcrumbs"
          :class="$q.screen.gt.xs ? 'text-h5' : 'text-h6'"
          :key="location.id"
          :label="location.label"
          :to="location.to"
        />
        </q-breadcrumbs>
      <q-item-label caption>By {{ collection.ownername }}</q-item-label>
      </q-item-section>
    </q-item>
  </span>
</template>

<script>
export default {
  name: 'BreadCrumbs',

  props: {
    collection: Object,
    movie: Object,
    chapter: Object,
    private: Boolean
  },

  computed: {
    breadcrumbs: {
      get() {
        let _breadcrumbs = []

        _breadcrumbs.push({
          id: 0,
          label: this.collection.title,
          to: '/' + this.collection.uuid + '/' + this.collection.slug
        })

        if (this.movie?.id) {
          _breadcrumbs.push({
            id: 1,
            label: this.movie.title,
            to:
              '/' +
              this.collection.uuid +
              '/' +
              this.collection.slug +
              '/' +
              this.movie.slug
          })
        }

        if (this.movie?.id && this.chapter?.id) {
          _breadcrumbs.push({
            id: 2,
            label: this.chapter.title,
            to:
              '/' +
              this.collection.uuid +
              '/' +
              this.collection.slug +
              '/' +
              this.movie.slug +
              '/' +
              this.chapter.slug
          })
        }

        _breadcrumbs[_breadcrumbs.length - 1].to = null
        if (this.private) {
          _breadcrumbs = _breadcrumbs.slice(_breadcrumbs.length - 1, _breadcrumbs.length)
        }

        return _breadcrumbs
      }
    }
  }
}
</script>
