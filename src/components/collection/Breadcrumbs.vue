<template>
  <q-item dense>
    <q-item-section side>
      <q-avatar>
        <img :src=this.collection.cover>
      </q-avatar>
    </q-item-section>
    <q-item-section>
      <q-breadcrumbs class="text-h5">
      <template v-slot:separator>
        <q-icon size="1.5em" name="chevron_right" color="primary" />
      </template>
      <q-breadcrumbs-el
        v-for="location in breadcrumbs"
        :key="location.id"
        :label="location.label"
        :to="location.to"
      />
      </q-breadcrumbs>
    <q-item-label caption>By {{ collection.ownername }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script>
export default {
  name: 'BreadCrumbs',

  props: {
    collection: Object,
    movie: Object,
    chapter: Object
  },

  computed: {
    breadcrumbs: {
      get() {
        const _breadcrumbs = []

        _breadcrumbs.push({
          id: 0,
          label: this.collection.title,
          to: '/' + this.collection.uuid + '/' + this.collection.slug
        })

        if (this.movie.id !== null) {
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

        if (this.movie.id !== null && this.chapter.id !== null) {
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

        return _breadcrumbs
      }
    }
  }
}
</script>
