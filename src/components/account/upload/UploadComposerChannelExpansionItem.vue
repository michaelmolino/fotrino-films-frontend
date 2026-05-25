<template>
  <div class="expansion-wrapper" :class="wrapperClass">
    <q-expansion-item
      :model-value="isSectionOpen"
      @update:model-value="onSectionModelUpdate"
      icon="apps"
      label="Channel"
      :header-class="expansionHeaderClass"
      class="q-mb-sm"
      :disable="isBlocked">
      <div class="q-pa-md composer-content-panel">
        <div class="text-overline q-mb-sm">Choose Channel</div>
        <div class="composer-choice-grid q-mb-md">
          <q-card
            v-for="channelCard in channelCards"
            :key="channelCard.key"
            flat
            bordered
            class="composer-choice-card"
            :class="channelCard.className"
            @click="onSelectExistingChannel(channelCard.channel)">
            <q-card-section class="row items-center q-col-gutter-sm no-wrap">
              <div class="col-auto">
                <q-avatar size="38px">
                  <q-img v-if="channelCard.channel.cover" :src="channelCard.channel.cover" fit="cover" />
                  <q-icon v-else name="apps" color="grey-7" />
                </q-avatar>
              </div>
              <div class="col">
                <div class="text-body2 ellipsis">{{ channelCard.channel.title }}</div>
                <div class="text-caption text-grey-6">Existing channel</div>
              </div>
            </q-card-section>
          </q-card>

          <q-card
            flat
            bordered
            class="composer-choice-card"
            :class="newChannelCardClass"
            @click="onSelectNewChannelCard">
            <q-card-section class="row items-center q-col-gutter-sm no-wrap">
              <div class="col-auto">
                <q-avatar size="38px" color="grey-2" text-color="grey-8" icon="add" />
              </div>
              <div class="col">
                <div class="text-body2">Create New Channel</div>
                <div class="text-caption text-grey-6">Set title and cover</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div v-if="showNewChannelForm">
          <q-input
            outlined
            :color="inputColor"
            class="q-pb-md"
            clearable
            :model-value="channelTitle"
            label="Channel Title *"
            data-cy="upload-channel-title"
            @clear="onChannelTitleClear"
            @blur="onRestoreDefaultChannelTitle"
            @update:model-value="onChannelTitleUpdate" />

          <div class="text-overline q-mb-xs">Channel Cover</div>
          <div class="composer-control-stack q-pb-sm">
            <q-btn-toggle
              unelevated
              no-caps
              class="q-mb-md"
              :model-value="coverType"
              color="primary"
              toggle-color="accent"
              :options="coverTypeOptions"
              @update:model-value="onChannelCoverTypeUpdate" />

            <q-file
              v-if="showCoverUploadInput"
              outlined
              label="Channel Cover (Image)"
              :model-value="coverFile"
              accept="image/*"
              class="q-mb-md full-width"
              color="accent"
              data-cy="upload-channel-cover-file"
              @update:model-value="onChannelCoverFileUpdate">
              <template #prepend>
                <q-icon name="image" @click.stop.prevent />
              </template>
              <template #append>
                <q-icon
                  name="close"
                  @click.stop.prevent="clearChannelCoverFile"
                  class="cursor-pointer" />
              </template>
            </q-file>

            <div class="composer-cover-preview-row">
              <q-avatar size="96px" class="composer-cover-preview">
                <q-img
                  v-if="channelEditorCoverSrc"
                  :src="channelEditorCoverSrc"
                  fit="cover"
                  loading="lazy"
                  decoding="async" />
                <q-icon v-else name="person" color="grey-7" />
              </q-avatar>
            </div>
          </div>
        </div>
      </div>
    </q-expansion-item>
    <q-tooltip v-if="isBlocked" anchor="center left" self="center right">
      Select a video file first.
    </q-tooltip>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const emit = defineEmits([
  'section-toggle',
  'select-existing-channel',
  'select-new-channel-card',
  'channel-title-update',
  'restore-default-channel-title',
  'channel-cover-type-update',
  'channel-cover-file-update'
])

const props = defineProps({
  activeSection: { type: String, default: null },
  mediaFile: { type: [File, Object], default: null },
  expansionHeaderClass: { type: String, required: true },
  inputColor: { type: String, required: true },
  payload: { type: Object, required: true },
  channels: { type: Array, required: true },
  coverFile: { type: [File, Object], default: null },
  channelEditorCoverSrc: { type: String, default: null }
})

const coverTypeOptions = [
  { label: 'Profile Photo', value: 'profile' },
  { label: 'Upload Photo', value: 'new' }
]

const isBlocked = computed(() => !props.mediaFile)
const isSectionOpen = computed(() => props.activeSection === 'channel')
const wrapperClass = computed(() => ({ 'is-blocked': isBlocked.value }))
const selectedPublicId = computed(() => props.payload.publicId?.value)
const showNewChannelForm = computed(() => props.payload.channelMode === 'create')
const channelTitle = computed(() => props.payload.title)
const coverType = computed(() => props.payload.coverType)
const showCoverUploadInput = computed(() => coverType.value === 'new')
const skipNextRestoreOnBlur = ref(false)
const channelCards = computed(() => {
  return (props.channels || []).map(channel => ({
    key: `channel-${channel.publicId}`,
    channel,
    className: {
      'is-selected': props.payload.channelMode === 'existing' && selectedPublicId.value === channel.publicId
    }
  }))
})
const newChannelCardClass = computed(() => ({
  'is-selected': props.payload.channelMode === 'create',
  'is-disabled': props.payload.channelMode === 'create'
}))

function onSectionModelUpdate(value) {
  emit('section-toggle', value)
}

function onSelectExistingChannel(channel) {
  emit('select-existing-channel', channel)
}

function onSelectNewChannelCard() {
  emit('select-new-channel-card')
}

function onChannelTitleUpdate(value) {
  emit('channel-title-update', value)
}

function onRestoreDefaultChannelTitle() {
  if (skipNextRestoreOnBlur.value) {
    skipNextRestoreOnBlur.value = false
    return
  }
  emit('restore-default-channel-title')
}

function onChannelTitleClear() {
  skipNextRestoreOnBlur.value = true
}

function onChannelCoverTypeUpdate(value) {
  emit('channel-cover-type-update', value)
}

function onChannelCoverFileUpdate(value) {
  emit('channel-cover-file-update', value)
}

function clearChannelCoverFile() {
  emit('channel-cover-file-update', null)
}
</script>

<style scoped>
.expansion-wrapper.is-blocked {
  cursor: not-allowed;
}

.composer-content-panel {
  border: 1px solid var(--q-grey-3);
  border-top: 0;
  border-radius: 0 0 8px 8px;
  background: color-mix(in srgb, var(--q-grey-1) 56%, white);
}

.composer-choice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.composer-choice-card {
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.composer-choice-card:hover {
  border-color: var(--q-grey-5);
}

.composer-choice-card.is-selected {
  border-color: var(--q-primary);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--q-primary) 30%, transparent);
}

.composer-choice-card.is-disabled,
.composer-choice-card.is-disabled * {
  cursor: not-allowed;
}

.composer-choice-card.is-disabled:hover {
  border-color: var(--q-primary);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--q-primary) 30%, transparent);
}

.composer-control-stack {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: max-content;
  max-width: 100%;
}

.composer-cover-preview-row {
  display: flex;
  justify-content: center;
  width: 100%;
}

.composer-cover-preview {
  border: 1px solid var(--q-grey-4);
  overflow: hidden;
}
</style>
