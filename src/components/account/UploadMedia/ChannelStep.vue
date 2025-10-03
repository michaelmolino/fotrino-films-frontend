<template>
  <div>
    <q-select
      outlined
      :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
      label="Channel *"
      :model-value="payload.uuid"
      @update:model-value="onUpdateUuid"
      :options="
        channels
          .map(({ uuid, title }) => ({ value: uuid, label: title }))
          .concat({ value: 0, label: 'New...' })
      "
      class="q-pb-lg" />
    <div>
      <q-input
        v-if="payload.uuid?.value === 0"
        outlined
        :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
        class="q-pb-md"
        :model-value="payload.title"
        label="Channel Title *"
        clearable
        @focus="clearDefaultChannelTitle"
        @blur="restoreDefaultChannelTitle"
        @update:model-value="onUpdateTitle" />
      <q-card flat bordered class="q-pb-md">
        <q-card-section>
          <div class="text-overline">Channel Cover</div>
          <q-radio
            v-if="payload.uuid?.value === 0"
            v-model="localCoverType"
            val="profile"
            label="Profile Photo"
            color="accent" /><br />
          <q-radio
            v-if="payload.uuid?.value === 0"
            v-model="localCoverType"
            val="new"
            label="Upload Photo"
            color="accent"
            class="q-pb-md" /><br />
          <q-file
            v-if="payload.uuid?.value === 0 && localCoverType === 'new'"
            label="Channel Cover (Image)"
            appendoutlined
            :model-value="coverFile"
            accept="image/*"
            color="accent"
            class="q-mb-md"
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
                !payload.uuid ||
                (payload.uuid &&
                  payload.uuid.value === 0 &&
                  payload.coverType === 'new' &&
                  !coverFile)
              "
              class="cursor-not-allowed width250x height250x"
              animation="none" />
            <q-img
              v-if="payload.uuid && payload.uuid.value !== 0"
              :src="channels.find(ch => ch.uuid === payload.uuid.value).cover"
              class="width250x"
              :ratio="1 / 1"
              fit="cover" />
            <q-img
              v-if="payload.uuid && payload.uuid.value === 0"
              :src="payload.coverType === 'profile' ? profile.profile_pic : coverThumb"
              class="width250x"
              :ratio="1 / 1"
              fit="cover" />
          </q-avatar>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
const props = defineProps({
  payload: Object,
  channels: Array,
  profile: Object,
  coverFile: [File, Array, null],
  coverThumb: [String, null],
  handleFile: Function
})
const emit = defineEmits(['update:payload', 'update:coverFile'])

const localCoverType = computed({
  get: () => props.payload.coverType,
  set: v => emit('update:payload', { ...props.payload, coverType: v })
})

function onUpdateUuid(val) {
  emit('update:payload', { ...props.payload, uuid: val })
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
  const current = props.payload?.uuid
  const hasCurrent = current && (current.value || current.value === 0)
  if (hasCurrent) return

  if (ch.length === 0) {
    emit('update:payload', { ...props.payload, uuid: { value: 0, label: 'New...' } })
  } else if (ch.length === 1) {
    const { uuid, title } = ch[0]
    emit('update:payload', { ...props.payload, uuid: { value: uuid, label: title } })
  } else {
    emit('update:payload', { ...props.payload, uuid: null })
  }
}

onMounted(() => ensureDefaultChannelSelection())
watch(
  () => (props.channels || []).length,
  () => ensureDefaultChannelSelection()
)
</script>
