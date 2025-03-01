<template>
  <div v-if="profile?.id" class="q-pa-md">
    <q-img :src="profile.profile_pic" style="width: 250px" :ratio="1 / 1" fit="cover">
      <q-badge class="bg-accent q-pa-md" floating transparent>
        <q-icon :name="'fab fa-' + profile.identity_provider" />
      </q-badge>
      <div class="absolute-bottom text-center">
        <div class="ellipsis">{{ profile.name }}</div>
        <div class="ellipsis">{{ profile.email }}</div>
      </div>
    </q-img>
    <div class="text-h6 q-pt-md">
      Channels
    </div>
    <q-tree
      v-if="channels.length > 0"
      accordion
      no-connectors
      :nodes="channels"
      node-key="key"
      label-key="title"
      children-key="children"
    >
      <template v-slot:default-header="tree">
        <div class="flex items-center">
          <div class="q-px-lg">
            <q-avatar>
              <img :src=tree.node.img>
            </q-avatar>
          </div>
          <div>
            {{ tree.node.title }}
          </div>
        </div>
      </template>
      <template v-slot:header-media="tree">
        <div class="flex items-center">
          <div class="q-pl-md">
            <q-btn flat :icon="'img:' + tree.node.img" :label="tree.node.title" icon-right="link" :to="getMediaLink(tree.node.id)" />
          </div>
        </div>
      </template>
    </q-tree>
    <NothingText v-if="channels.length === 0" text="Click Account and upload some media to get started."/>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
export default {
  name: 'Channel-Dashboard',

  components: {
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
    channels: {
      get() {
        const channels = this.$store.state.channel.channels.map(channel => ({
          ...channel,
          key: channel.uuid,
          img: channel.cover,
          header: 'channel',
          body: 'channel',
          children: (channel.projects || []).map(project => ({
            ...project,
            key: channel.id + '-' + project.id,
            img: project.poster,
            header: 'project',
            body: 'project',
            children: (project.media || []).map(media => ({
              ...media,
              key: channel.id + '-' + project.id + '-' + media.id,
              img: media.preview,
              header: 'media',
              body: 'media'
            }))
          }))
        }))
        return channels
      }
    }
  },

  methods: {
    getMediaLink(mediaId) {
      for (const channel of this.channels) {
        for (const project of channel.projects) {
          const media = project.media.find((m) => m.id === mediaId)
          if (media) {
            return '/' + [channel.uuid, channel.slug, project.slug, media.slug].join('/')
          }
        }
      }
      return null
    }
  },

  created: function() {
    this.$store.cache.dispatch('channel/getChannels', true)
  }
}
</script>
