<template>
  <div v-if="project">

    <BreadCrumbs
      :channel="channel"
      :project="project"
      :media="media.main ? null : media"
      :private="$route.params.privateId ? true : false"
    />

    <NothingText v-if="project.media?.length === 0" />

    <span v-else>
      <PlyrPlayer :media="media" :artist="channel.ownername" style="width: 100%; max-width: 720px; min-width: 240px;" class="q-py-md" />

      <MediaDescription :media="media" />

      <span v-if="$route.params.uuid && project.media?.filter(ch => ch.id !== media.id)?.length > 0">
        <div class="q-pt-md text-h6">
          Related Content
        </div>
        <div class="row">
          <div
            class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
            v-for="media in project.media?.filter(ch => ch.id !== media.id)"
            :key="media.id"
          >
            <MediaPreview
              :style="media.deleted ? 'filter: brightness(37.5%); max-width: 360px;' : 'max-width: 360px;'"
              :channel="channel"
              :project="project"
              :media="media"
              :to="'/' + channel.uuid + '/' + channel.slug + '/' + project.slug + '/' + media.slug"
            />
          </div>
        </div>
      </span>
    </span>

  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  name: 'ProjectRoot',

  components: {
    BreadCrumbs: defineAsyncComponent(() =>
      import('@components/channel/BreadCrumbs.vue')
    ),
    MediaPreview: defineAsyncComponent(() =>
      import('@components/channel/MediaPreview.vue')
    ),
    PlyrPlayer: defineAsyncComponent(() =>
      import('@components/channel/PlyrPlayer.vue')
    ),
    MediaDescription: defineAsyncComponent(() =>
      import('@components/channel/MediaDescription.vue')
    ),
    NothingText: defineAsyncComponent(() =>
      import('@components/shared/NothingText.vue')
    )
  },

  computed: {
    channel: {
      get() {
        return this.$store.state.channel.channel
      }
    },
    project: {
      get() {
        let _project = null
        if (this.$route.params.uuid) {
          _project = this.channel?.projects.find(
            m => m.slug === this.$route.params.projectSlug
          )
          if (this.channel?.id && this.$route.params.projectSlug && !_project) {
            this.$router.replace('/404')
          }
        } else if (this.$route.params.privateId) {
          _project = this.channel?.project
        }
        return _project
      }
    },
    media: {
      get() {
        let _media = null
        if (this.$route.params.uuid) {
          if (this.$route.params.mediaSlug) {
            _media = this.project?.media.find(
              ch => ch.slug === this.$route.params.mediaSlug
            )
          } else if (!this.$route.params.mediaSlug) {
            _media = this.project?.media.find(ch => ch.main) || this.project?.media[0]
            this.$router.replace({
              params: { mediaSlug: _media.slug }
            })
          }
          if (this.channel.id && !_media) {
            this.$router.replace('/404')
          }
        } else if (this.$route.params.privateId) {
          _media = this.channel.project.media
        }
        return _media
      }
    }
  }

}
</script>
