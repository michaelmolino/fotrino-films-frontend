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
    <div class="text-h6 q-pt-md">Channels</div>
    <div><q-btn to="/account/upload" flat no-caps icon="fas fa-cloud-arrow-up" label="Upload Media" /></div>
    <div><q-checkbox v-if="channels.length > 0" v-model="showDelete" label="Show delete button" color="negative" /></div>
    <q-tree
      v-if="channels.length > 0"
      accordion
      :nodes="channels"
      node-key="key"
      label-key="title"
      children-key="children"
      style="max-width: 720px;"
      :no-transition="!animate"
    >
    <template v-slot:default-header="tree">
        <div class="flex items-center">
          <div class="q-px-md">
            <q-btn v-if="showDelete" dense flat no-caps icon="fas fa-circle-minus" color="negative" @click="deleteResource(tree.node.poster ? 'project' : 'channel', tree.node.id)" class="q-px-sm" />
            <q-avatar>
              <img :src="tree.node.img" :alt="tree.node.title">
            </q-avatar>
          </div>
          <div>
            {{ tree.node.title }}
            <q-icon v-if="tree.node.pending" name="fas fa-clock" class="q-px-xs">
              <q-tooltip>
                Pending
              </q-tooltip>
            </q-icon>
          </div>
        </div>
      </template>
      <template v-slot:header-media="tree">
        <div class="flex items-center">
          <div class="q-px-md">
            <q-btn v-if="showDelete" dense flat no-caps icon="fas fa-circle-minus" color="negative" @click="deleteResource('media', tree.node.id)" class="q-px-sm" />
            <q-btn dense flat no-caps :icon="'img:' + tree.node.img" :alt="tree.node.title" :label="tree.node.title" :to="getMediaLink(tree.node.id)" :class="tree.node.pending ? 'cursor-not-allowed' : ''" />
            <q-icon v-if="tree.node.pending" name="fas fa-clock" class="q-px-xs">
              <q-tooltip>
                Pending
              </q-tooltip>
            </q-icon>
          </div>
        </div>
      </template>
    </q-tree>
    <NothingText v-if="channels.length === 0" text="Your media will appear here (once you have some)."/>
  </div>
  <q-dialog v-model="showTerms" backdrop-filter="contrast(40%)">
      <q-card>
        <q-card-section style="max-height: 50vh" class="scroll">
          <Terms />
        </q-card-section>
        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="OK" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
</template>

<script>
import { defineAsyncComponent, ref } from 'vue'
export default {
  name: 'Channel-Dashboard',

  components: {
    Terms: defineAsyncComponent(() =>
      import('@components/pages/Terms.vue')
    ),
    NothingText: defineAsyncComponent(() =>
      import('@components/shared/NothingText.vue')
    )
  },

  data() {
    return {
      showTerms: this.$route.query.showTerms === 'true',
      animate: ref(true),
      showDelete: ref(false)
    }
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

  watch: {
    channels(chs) {
      this.animate = new Blob([JSON.stringify(chs)]).size < 131072
    }
  },

  methods: {
    getMediaLink(mediaId) {
      for (const channel of this.channels) {
        for (const project of channel.projects) {
          const media = project.media.find((m) => m.id === mediaId)
          if (media) {
            if (!media.pending) {
              return '/' + [channel.uuid, channel.slug, project.slug, media.slug].join('/')
            } else {
              return ''
            }
          }
        }
      }
      return null
    },
    deleteResource(type, r) {
      this.$store.dispatch('channel/deleteResource', { type: type, id: r })
    }
  },

  created: function() {
    this.$store.dispatch('channel/getChannels', true)
  }
}
</script>
