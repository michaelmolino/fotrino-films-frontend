<template>
  <div>
    <q-select
      outlined
      :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
      label="Channel *"
      :model-value="payload.publicId"
      @update:model-value="onUpdatePublicId"
      data-cy="upload-channel-select"
      :options="
        channels
          .map(({ publicId, title }) => ({ value: publicId, label: title }))
          .concat({ value: 0, label: 'New...' })
      "
      class="q-pb-lg" />
    <div>
      <q-input
        v-if="payload.publicId?.value === 0"
        outlined
        :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
        class="q-pb-md"
        :model-value="payload.title"
        label="Channel Title *"
        clearable
        data-cy="upload-channel-title"
        @focus="clearDefaultChannelTitle"
        @blur="restoreDefaultChannelTitle"
        @update:model-value="onUpdateTitle" />
      <q-card flat bordered class="q-pb-md">
        <q-card-section>
          <div class="text-overline">Channel Cover</div>
          <q-radio
            v-if="payload.publicId?.value === 0"
            v-model="localCoverType"
            val="profile"
            label="Profile Photo"
            color="accent" /><br />
          <q-radio
            v-if="payload.publicId?.value === 0"
            v-model="localCoverType"
            val="new"
            label="Upload Photo"
            color="accent"
            data-cy="upload-channel-cover-type-new"
            class="q-pb-md" /><br />
          <q-file
            v-if="payload.publicId?.value === 0 && localCoverType === 'new'"
            label="Channel Cover (Image)"
            appendoutlined
            :model-value="coverFile"
            accept="image/*"
            color="accent"
            class="q-mb-md"
            data-cy="upload-channel-cover-file"
            @update:model-value="onUpdateCoverFile">
            <template v-slot:prepend>
              <q-icon name="image" @click.stop.prevent />
            </template>
            <template v-slot:append>
              <q-icon
                name="close"
                @click.stop.prevent="emitUpdateCoverNull"
                class="cursor-pointer" />
            </template>
          </q-file>
          <q-avatar size="150px" class="q-pl-lg">
            <q-skeleton
              v-if="
                !payload.publicId ||
                (payload.publicId &&
                  payload.publicId.value === 0 &&
                  payload.coverType === 'new' &&
                  !coverFile)
              "
              class="cursor-not-allowed width250 height250"
              animation="none" />
            <q-img
              v-if="payload.publicId && payload.publicId.value !== 0"
              :src="selectedChannelCover"
              class="width250"
              :ratio="1 / 1"
              fit="cover"
              loading="lazy"
              decoding="async" />
            <q-img
              v-if="payload.publicId && payload.publicId.value === 0"
              :src="payload.coverType === 'profile' ? profile.avatar : coverThumb"
              class="width250"
              :ratio="1 / 1"
              fit="cover"
              loading="lazy"
              decoding="async" />
          </q-avatar>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
const props = defineProps({
  payload: { type: Object, required: true },
  channels: { type: Array, default: () => [] },
  profile: { type: Object, default: () => ({}) },
  coverFile: { type: [File, Array], default: null },
  coverThumb: { type: String, default: null },
  handleFile: { type: Function, default: null }
})
const emit = defineEmits(['update:payload', 'update:coverFile'])

const channelCoverByPublicId = computed(() => {
  const map = {}
  for (const channel of props.channels || []) {
    if (channel?.publicId) {
      map[channel.publicId] = channel.cover || null
    }
  }
  return map
})

const selectedChannelCover = computed(() => {
  const selectedPublicId = props.payload?.publicId?.value
  if (!selectedPublicId) return null
  return channelCoverByPublicId.value[selectedPublicId] || null
})

const localCoverType = computed({
  get: () => props.payload.coverType,
  set: v => emit('update:payload', { ...props.payload, coverType: v })
})

function onUpdatePublicId(val) {
  emit('update:payload', { ...props.payload, publicId: val })
}
function onUpdateTitle(val) {
  emit('update:payload', { ...props.payload, title: val })
}
function onUpdateCoverFile(fileOrFiles) {
  const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
  emit('update:coverFile', file)
  if (file && props.handleFile) props.handleFile(file, 'cover')
}
function emitUpdateCoverNull() {
  emit('update:coverFile', null)
}

function clearDefaultChannelTitle() {
  emit('update:payload', { ...props.payload, title: '' })
}
function restoreDefaultChannelTitle() {
  if (props.payload.title === '') emit('update:payload', { ...props.payload, title: 'My Channel' })
}

// Default selection behavior based on available channels:
// - 0 channels: default to New... (value 0)
// - 1 channel: default to that channel
// - >1 channels: leave blank to force explicit selection
function ensureDefaultChannelSelection() {
  const ch = Array.isArray(props.channels) ? props.channels : []
  const current = props.payload?.publicId
  const hasCurrent = current && (current.value || current.value === 0)
  if (hasCurrent) return

  if (ch.length === 0) {
    emit('update:payload', { ...props.payload, publicId: { value: 0, label: 'New...' } })
  } else if (ch.length === 1) {
    const { publicId, title } = ch[0]
    emit('update:payload', { ...props.payload, publicId: { value: publicId, label: title } })
  } else {
    emit('update:payload', { ...props.payload, publicId: null })
  }
}

onMounted(() => ensureDefaultChannelSelection())
watch(
  () => (props.channels || []).length,
  () => ensureDefaultChannelSelection()
)
</script>
