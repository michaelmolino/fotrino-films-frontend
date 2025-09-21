<template>
  <div v-if="channel?.uuid === $route.params.uuid && project" class="q-pa-md">

    <BreadCrumbs
      :channel="channel"
      :project="project"
      :media="media?.main ? null : media"
      :private="$route.params.privateId ? true : false"
    />

    <NothingText v-if="project.media?.length === 0" />

    <span v-if="project.media?.length > 0 || project.media.private_id">
      <PlyrPlayer :media="media" :artist="channel.ownername" class="q-py-md plyrplayer" />

      <MediaDescription :media="media" />

      <CommentsBox :loggedIn="!!profile.id" :privateId="media.private_id" class="q-my-md" />

      <span v-if="$route.params.uuid && project.media?.filter(ch => ch.id !== media.id)?.length > 0">
        <div class="q-pt-md text-h6">
          Related Content
        </div>
        <div class="row">
          <div
            class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 q-pa-sm"
            v-for="media in project.media?.filter(ch => ch.id !== media.id)"
            :key="media.id"
          >
            <MediaPreview
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
    CommentsBox: defineAsyncComponent(() =>
      import('@components/channel/CommentsBox.vue')
    ),
    NothingText: defineAsyncComponent(() =>
      import('@components/shared/NothingText.vue')
    )
  },

  computed: {
    profile: {
      get() {
        return this.$store.state.account.profile
      }
    },
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
        } else if (this.$route.params.privateId) {
          _project = this.channel?.project
        }
        if (this.channel && !_project) {
          this.$router.replace('/404')
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
          } else {
            _media = this.project?.media.find(ch => ch.main) || this.project?.media[0]
            this.$router.replace({
              params: { mediaSlug: _media?.slug }
            })
          }
        } else if (this.$route.params.privateId) {
          _media = this.channel.project.media
        }
        if (this.channel && this.project && this.project.media.length > 0 && !_media) {
          this.$router.replace('/404')
        }
        return _media
      }
    }
  }
}
</script>

<style scoped>
.plyrplayer {
  width: 100%;
  max-width: 720px;
  min-width: 240px;
}
</style>
