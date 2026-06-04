<template>
  <div class="expansion-wrapper" :class="wrapperClass">
    <q-expansion-item
      :model-value="isSectionOpen"
      @update:model-value="onSectionModelUpdate"
      icon="folder"
      label="Album"
      :header-class="expansionHeaderClass"
      class="q-mb-sm"
      :disable="isBlocked">
      <div class="q-pa-md composer-content-panel">
        <div class="text-overline q-mb-sm">Choose Album</div>
        <div class="composer-choice-grid q-mb-md">
          <q-card
            v-for="albumCard in albumCards"
            :key="albumCard.key"
            flat
            bordered
            class="composer-choice-card"
            :class="albumCard.className"
            @click="onSelectExistingAlbum(albumCard.item)">
            <q-card-section class="row items-center q-col-gutter-sm no-wrap">
              <div class="col-auto">
                <q-avatar size="38px">
                  <q-img v-if="albumCard.item.poster" :src="albumCard.item.poster" fit="cover" />
                  <div
                    v-else
                    class="composer-color-swatch"
                    :style="albumCard.fallbackSwatchStyle" />
                </q-avatar>
              </div>
              <div class="col">
                <div class="text-body2 ellipsis">{{ albumCard.item.title }}</div>
                <div class="text-caption text-grey-6 ellipsis">{{ albumCard.subtitle }}</div>
              </div>
            </q-card-section>
          </q-card>

          <q-card
            flat
            bordered
            class="composer-choice-card"
            :class="newAlbumCardClass"
            @click="onSelectNewAlbumCard">
            <q-card-section class="row items-center q-col-gutter-sm no-wrap">
              <div class="col-auto">
                <q-avatar size="38px" color="grey-2" text-color="grey-8" icon="add" />
              </div>
              <div class="col">
                <div class="text-body2 ellipsis">Create New Album</div>
                <div class="text-caption text-grey-6 ellipsis">Set album details</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div v-if="showNewAlbumForm">
          <q-input
            outlined
            :color="inputColor"
            class="q-pb-md"
            clearable
            :model-value="albumTitle"
            label="Album Title *"
            data-cy="upload-album-title"
            @clear="onAlbumTitleClear"
            @blur="onRestoreDefaultAlbumTitle"
            @update:model-value="onAlbumTitleUpdate" />

          <q-input
            outlined
            :color="inputColor"
            class="q-pb-md"
            clearable
            :model-value="albumSubtitle"
            label="Album Subtitle"
            data-cy="upload-album-subtitle"
            @update:model-value="onAlbumSubtitleUpdate" />

          <div class="text-overline q-mb-xs">Album Poster</div>
          <div class="composer-control-stack q-pb-sm">
            <q-btn-toggle
              unelevated
              no-caps
              class="q-mb-md"
              :model-value="posterType"
              color="primary"
              toggle-color="accent"
              :options="posterTypeOptions"
              @update:model-value="onAlbumPosterTypeUpdate" />

            <q-file
              v-if="showPosterUploadInput"
              outlined
              label="Album Poster (Image)"
              :model-value="posterFile"
              accept="image/*"
              class="q-mb-md full-width"
              color="accent"
              data-cy="upload-album-poster-file"
              @update:model-value="onAlbumPosterFileUpdate">
              <template #prepend>
                <q-icon name="image" @click.stop.prevent />
              </template>
              <template #append>
                <q-icon
                  name="close"
                  @click.stop.prevent="clearAlbumPosterFile"
                  class="cursor-pointer" />
              </template>
            </q-file>

            <div class="composer-poster-with-action">
              <div class="composer-album-poster-preview">
                <AlbumPoster :album="albumEditorPreview" />
              </div>
              <q-btn
                v-if="showColorAction"
                flat
                no-caps
                class="q-mt-sm"
                :style="flatAccentBtnStyle"
                color="accent"
                icon="palette"
                label="Change Colour"
                @click="openAlbumColorDialog" />
            </div>
          </div>

          <q-dialog
            :model-value="albumColorDialog"
            v-if="showColorDialog"
            @update:model-value="onAlbumColorDialogUpdate">
            <q-card style="min-width: 300px">
              <q-card-section class="q-pb-none">
                <div class="text-subtitle1">Choose Poster Colour</div>
              </q-card-section>
              <q-card-section>
                <q-color
                  class="q-mt-sm"
                  :model-value="albumPosterColor"
                  format="hex"
                  default-view="palette"
                  @update:model-value="onAlbumPosterColorUpdate" />
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat label="Close" @click="closeAlbumColorDialog" />
              </q-card-actions>
            </q-card>
          </q-dialog>
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
import AlbumPoster from '@components/channel/shared/AlbumPoster.vue'

const emit = defineEmits([
  'section-toggle',
  'select-existing-album',
  'select-new-album-card',
  'album-title-update',
  'restore-default-album-title',
  'album-subtitle-update',
  'album-poster-type-update',
  'album-poster-file-update',
  'album-poster-color-update',
  'update:album-color-dialog'
])

const props = defineProps({
  activeSection: { type: String, default: null },
  mediaFile: { type: [File, Object], default: null },
  expansionHeaderClass: { type: String, required: true },
  inputColor: { type: String, required: true },
  payload: { type: Object, required: true },
  albums: { type: Array, required: true },
  posterFile: { type: [File, Object], default: null },
  albumEditorPreview: { type: Object, required: true },
  flatAccentBtnStyle: { type: Object, default: undefined },
  albumColorDialog: { type: Boolean, required: true }
})

const posterTypeOptions = [
  { label: 'Solid Colour', value: 'default' },
  { label: 'Upload Photo', value: 'new' }
]

const isBlocked = computed(() => !props.mediaFile)
const isSectionOpen = computed(() => props.activeSection === 'album')
const wrapperClass = computed(() => ({ 'is-blocked': isBlocked.value }))
const selectedAlbumId = computed(() => props.payload.album?.privateId?.value)
const showNewAlbumForm = computed(() => props.payload.album?.projectMode === 'create')
const albumTitle = computed(() => props.payload.album?.title)
const albumSubtitle = computed(() => props.payload.album?.subtitle)
const posterType = computed(() => props.payload.album?.posterType)
const albumPosterColor = computed(() => props.payload.album?.posterColor || '#000000')
const showPosterUploadInput = computed(() => posterType.value === 'new')
const showColorAction = computed(() => posterType.value === 'default')
const showColorDialog = computed(() => showNewAlbumForm.value && showColorAction.value)
const skipNextRestoreOnBlur = ref(false)
const albumCards = computed(() => {
  return (props.albums || []).map(item => ({
    key: `album-${item.privateId}`,
    item,
    subtitle: item.subtitle || 'Existing album',
    fallbackSwatchStyle: {
      backgroundColor: item.posterColor || '#000000'
    },
    className: {
      'is-selected':
        props.payload.album?.projectMode === 'existing' && selectedAlbumId.value === item.privateId
    }
  }))
})
const newAlbumCardClass = computed(() => ({
  'is-selected': props.payload.album?.projectMode === 'create',
  'is-disabled': props.payload.album?.projectMode === 'create'
}))

function onSectionModelUpdate(value) {
  emit('section-toggle', value)
}

function onSelectExistingAlbum(item) {
  emit('select-existing-album', item)
}

function onSelectNewAlbumCard() {
  emit('select-new-album-card')
}

function onAlbumTitleUpdate(value) {
  emit('album-title-update', value)
}

function onRestoreDefaultAlbumTitle() {
  if (skipNextRestoreOnBlur.value) {
    skipNextRestoreOnBlur.value = false
    return
  }
  emit('restore-default-album-title')
}

function onAlbumTitleClear() {
  skipNextRestoreOnBlur.value = true
}

function onAlbumSubtitleUpdate(value) {
  emit('album-subtitle-update', value)
}

function onAlbumPosterTypeUpdate(value) {
  emit('album-poster-type-update', value)
}

function onAlbumPosterFileUpdate(value) {
  emit('album-poster-file-update', value)
}

function clearAlbumPosterFile() {
  emit('album-poster-file-update', null)
}

function openAlbumColorDialog() {
  emit('update:album-color-dialog', true)
}

function closeAlbumColorDialog() {
  emit('update:album-color-dialog', false)
}

function onAlbumColorDialogUpdate(value) {
  emit('update:album-color-dialog', value)
}

function onAlbumPosterColorUpdate(value) {
  emit('album-poster-color-update', value)
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
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease;
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

.composer-color-swatch {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  border: 1px solid #000;
}

.composer-control-stack {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: max-content;
  max-width: 100%;
}

.composer-poster-with-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.composer-album-poster-preview {
  width: 220px;
}
</style>
