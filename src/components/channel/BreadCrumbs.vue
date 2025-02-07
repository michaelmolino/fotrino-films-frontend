<template>
  <span>
    <q-item>
      <q-item-section side v-if="$q.screen.gt.xs">
        <q-avatar>
          <img :src=this.channel.cover :alt="this.channel.title">
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
      <q-item-label caption>By {{ channel.ownername }}</q-item-label>
      </q-item-section>
    </q-item>
  </span>
</template>

<script>
export default {
  name: 'BreadCrumbs',

  props: {
    channel: Object,
    project: Object,
    media: Object,
    private: Boolean
  },

  computed: {
    breadcrumbs: {
      get() {
        let _breadcrumbs = []

        _breadcrumbs.push({
          id: 0,
          label: this.channel.title,
          to: '/' + this.channel.uuid + '/' + this.channel.slug
        })

        if (this.project?.id) {
          _breadcrumbs.push({
            id: 1,
            label: this.project.title,
            to:
              '/' +
              this.channel.uuid +
              '/' +
              this.channel.slug +
              '/' +
              this.project.slug
          })
        }

        if (this.project?.id && this.media?.id) {
          _breadcrumbs.push({
            id: 2,
            label: this.media.title,
            to:
              '/' +
              this.channel.uuid +
              '/' +
              this.channel.slug +
              '/' +
              this.project.slug +
              '/' +
              this.media.slug
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
