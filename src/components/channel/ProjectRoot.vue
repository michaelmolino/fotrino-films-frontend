<template>
  <div class="q-pa-md">
    <template v-if="channel?.uuid === route.params.uuid && project">
      <BreadCrumbs
        :channel="channel"
        :project="project"
        :media="media?.main ? null : media"
        :private="!!route.params.privateId" />

      <NothingText
        v-if="!route.params.privateId && (project.media?.length || 0) === 0"></NothingText>

      <template v-else>
        <PlyrPlayer
          v-if="media"
          :media="media"
          :artist="channel?.ownername"
          class="q-py-md plyrplayer" />

        <MediaDescription v-if="media" :media="media" />

        <CommentsBox
          v-if="media?.comments_enabled"
          :loggedIn="!!profile?.id"
          :privateId="media?.private_id"
          class="q-my-md"
        />

        <template v-if="hasRelatedContent">
          <div class="q-pt-md text-h6">Related Content</div>
          <div class="row">
            <div
              v-for="related in relatedMedia"
              :key="related.id"
              class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 q-pa-sm">
              <MediaPreview
                :channel="channel"
                :project="project"
                :media="related"
                :to="`/${channel.uuid}/${channel.slug}/${project.slug}/${related.slug}`" />
            </div>
          </div>
        </template>
      </template>
    </template>

    <template v-else>
      <q-skeleton type="rect" class="q-mb-md skeleton-large" />
      <q-skeleton type="text" width="60%" />
      <q-skeleton type="text" width="40%" />
    </template>
  </div>
</template>

<script setup>
import BreadCrumbs from '@components/channel/BreadCrumbs.vue'
import MediaPreview from '@components/channel/MediaPreview.vue'
import PlyrPlayer from '@components/channel/PlyrPlayer.vue'
import MediaDescription from '@components/channel/MediaDescription.vue'
import CommentsBox from '@components/channel/CommentsBox.vue'
import { computed, watch, defineAsyncComponent, toRef } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
const NothingText = defineAsyncComponent(() => import('@components/shared/NothingText.vue'))
const store = useStore()
const route = useRoute()
const router = useRouter()

const profile = computed(() => store.state.account.profile)
const channel = toRef(store.state.channel, 'channel')

const project = computed(() => {
  let p
  // Find project by slug if uuid is present
  if (route.params.uuid) {
    p = channel.value?.projects?.find(p => p.slug === route.params.projectSlug) || null
  }
  // For privateId, use channel.project
  if (route.params.privateId && channel.value) {
    p = channel.value?.project || null
  }
  if (!p && channel.value) redirect('/404')
  return p
})

const media = computed(() => {
  const p = project.value
  if (!p) return null
  let m
  if (route.params.privateId) m = p.media || null
  else if (route.params.mediaSlug) {
    m = p.media?.find(m => m.slug === route.params.mediaSlug) || null
  } else {
    m = p.media?.find(m => m.main) || p.media?.[0] || null
  }
  if (!m) redirect('/404')
  return m
})

const relatedMedia = computed(() => {
  return (project.value?.media || []).filter(m => m.id !== media.value?.id)
})
const hasRelatedContent = computed(() => !!route.params.uuid && relatedMedia.value.length > 0)

function redirect(pathOrObj) {
  setTimeout(() => router.replace(pathOrObj), 0)
}

watch(
  project,
  newProject => {
    if (channel.value && !newProject && route.params.uuid) {
      redirect('/404')
    }
  },
  { immediate: true }
)

watch(
  media,
  newMedia => {
    if (channel.value && project.value && (project.value.media?.length || 0) > 0 && !newMedia) {
      redirect('/404')
    } else if (newMedia && !route.params.mediaSlug) {
      redirect({ params: { ...route.params, mediaSlug: newMedia.slug } })
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.plyrplayer {
  width: 100%;
  max-width: 720px;
  min-width: 240px;
}

.skeleton-large {
  width: 100%;
  max-width: 720px;
  height: 406px;
}
</style>
