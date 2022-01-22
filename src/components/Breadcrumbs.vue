<template>
  <q-breadcrumbs class="q-ml-md q-mt-lg q-mb-xs text-h6">
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
</template>

<script>
export default {
  name: 'BreadCrumbs',
  props: {
    userUuid: String,
    collection: Object,
    movie: Object,
    chapter: Object
  },
  data () {
    return {
      breadcrumbs: null
    }
  },
  created: function () {
    const breadcrumbs = []

    breadcrumbs.push({
      id: 0,
      label: this.collection.title,
      to: '/' + this.userUuid
    })

    if (this.movie !== null) {
      breadcrumbs.push({
        id: 1,
        label: this.movie.title,
        to:
          '/' + this.userUuid + '/movies/' + this.movie.id
      })
    }

    if (this.movie !== null && this.chapter !== null) {
      breadcrumbs.push({
        id: 2,
        label: this.chapter.title,
        to:
          '/' +
          this.userUuid +
          '/movies/' +
          this.movie.id +
          '/' +
          this.chapter.id
      })
    }

    breadcrumbs[breadcrumbs.length - 1].to = null

    this.breadcrumbs = breadcrumbs
  }
}
</script>
