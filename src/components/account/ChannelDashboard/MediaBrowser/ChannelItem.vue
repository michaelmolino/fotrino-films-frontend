<template>
  <q-expansion-item
    :label="channel.title"
    group="channels"
    expand-icon-toggle
    expand-separator
    switch-toggle-side
    :disable="channel.pending"
    @show="onExpand">
    <template #header>
      <ResourceActions
        :title="channel.title"
        :image="channel.cover"
        :pending="channel.pending"
        :deleted="channel.deleted"
        :undeletable="channel.deleted"
        :hasPending-children="hasPendingChildren"
        :link="getMediaLink('channel', channel.publicId)"
        :avatarSize="'48px'"
        :badge="channel.isAdmin"
        badgeIcon="security"
        :subtitle="channelSubtitle"
        :editable="true"
        :editDataCy="'edit-channel'"
        :deleteDataCy="'delete-channel'"
        @edit="openEditDialog"
        @delete="emitDeleteChannel"
        @undelete="emitUndeleteChannel" />
    </template>

    <div v-if="channelQuery.isLoading.value" class="q-pa-md text-grey-6 text-center">
      <q-spinner-dots size="24px" />
    </div>
    <AlbumItem
      v-else
      v-for="album in displayAlbums"
      :key="album.privateId"
      :album="album"
      :channel="displayChannel"
      data-cy="album-item"
      v-on="albumItemListeners"
      :getMediaLink="getMediaLink" />

    <!-- Edit Channel Dialog -->
    <q-dialog v-model="editDialog" no-backdrop-dismiss @before-hide="resetEditForm">
      <q-card style="min-width: 320px; width: 100%; max-width: 560px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Edit Channel</div>
        </q-card-section>

        <q-card-section>
          <EditableChannelFields
            :title="editForm.title"
            :cover-preview="editCoverPreview || channel.cover"
            :cover-file="editCoverFile"
            :cover-processing="editCoverProcessing"
            @update:title="editForm.title = $event"
            @update:coverFile="handleCoverFileSelected" />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" color="accent" v-close-popup data-cy="cancel-edit-channel" />
          <q-btn
            unelevated
            label="Save"
            color="accent"
            :disable="editCoverProcessing || !hasChanges"
            :loading="savingEdit"
            @click="saveEdit"
            data-cy="save-edit-channel" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-expansion-item>
</template>

<script setup>
import { computed, ref } from 'vue'
import ResourceActions from './ResourceActions.vue'
import AlbumItem from './AlbumItem.vue'
import EditableChannelFields from '@components/account/shared/EditableChannelFields.vue'
import { daysSince } from '@utils/date.js'
import { useImageSelectionProcessing } from '@composables/useImageFileProcessor.js'
import { useChannelStore } from 'src/stores/channel-store.js'

const props = defineProps({
  channel: Object,
  getMediaLink: Function
})

const channelStore = useChannelStore()
const hasBeenExpanded = ref(false)
const channelQuery = channelStore.useChannelQuery(
  computed(() => props.channel.publicId),
  hasBeenExpanded,
  {
    withPending: true,
    withSoftDeleted: true
  }
)

const deepChannel = computed(() => channelQuery.data.value?.data ?? null)
const displayChannel = computed(() => deepChannel.value || props.channel)
const displayAlbums = computed(() => displayChannel.value.albums || [])

function onExpand() {
  hasBeenExpanded.value = true
}

const emit = defineEmits([
  'deleteChannel',
  'undeleteChannel',
  'deleteAlbum',
  'undeleteAlbum',
  'deleteMedia',
  'undeleteMedia',
  'abortMedia',
  'editMedia',
  'editAlbum',
  'editChannel'
])

const hasPendingChildren = computed(() => {
  for (const album of displayAlbums.value) {
    if (album?.pending) {
      return true
    }
    for (const media of album?.media || []) {
      if (media?.pending) {
        return true
      }
    }
  }
  return false
})
const channelSubtitle = computed(() =>
  props.channel.created ? `Created: ${daysSince(props.channel.created, true)}` : ''
)

const albumItemListeners = {
  deleteAlbum: value => emit('deleteAlbum', value),
  undeleteAlbum: value => emit('undeleteAlbum', value),
  deleteMedia: value => emit('deleteMedia', value),
  undeleteMedia: value => emit('undeleteMedia', value),
  abortMedia: value => emit('abortMedia', value),
  editAlbum: value => emit('editAlbum', value),
  editMedia: value => emit('editMedia', value)
}

function emitDeleteChannel() {
  emit('deleteChannel', props.channel.publicId)
}

function emitUndeleteChannel() {
  emit('undeleteChannel', props.channel.publicId)
}

// Edit state
const editDialog = ref(false)
const editForm = ref({
  title: ''
})
const {
  selectedFile: editCoverFile,
  processing: editCoverProcessing,
  setAndCompressImage: processCoverFile,
  reset: resetCoverFile
} = useImageSelectionProcessing()
const editCoverPreview = ref(null)
const savingEdit = ref(false)

const hasChanges = computed(() => {
  return editForm.value.title !== props.channel.title || editCoverFile.value !== null
})

const openEditDialog = () => {
  editForm.value = {
    title: props.channel.title
  }
  resetCoverFile()
  editCoverPreview.value = null
  editDialog.value = true
}

const resetEditForm = () => {
  editForm.value = { title: '' }
  resetCoverFile()
  editCoverPreview.value = null
  savingEdit.value = false
}

const handleCoverFileSelected = async fileOrFiles => {
  const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
  if (!file) {
    resetCoverFile()
    editCoverPreview.value = null
    return
  }

  const { file: processedFile, previewUrl } = await processCoverFile(file)
  editCoverFile.value = processedFile
  editCoverPreview.value = previewUrl
}

const saveEdit = () => {
  savingEdit.value = true
  try {
    const payload = {
      channelPublicId: props.channel.publicId,
      title: editForm.value.title,
      coverFile: editCoverFile.value
    }
    emit('editChannel', payload)
    editDialog.value = false
  } finally {
    savingEdit.value = false
  }
}
</script>
