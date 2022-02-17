<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" persistent>
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">New Chapter</div>
      </q-card-section>

      <q-card-section>
        <q-input
          :color="$q.dark.isActive ? 'white' : 'secondary'"
          label="Title"
          dense
          autofocus
          v-model="newChapter.title"
        />
        <q-input
          :color="$q.dark.isActive ? 'white' : 'secondary'"
          readonly
          label="Slug"
          dense
          autofocus
          v-model="slug"
        />
        <q-card-section class="q-py-sm">
          <q-uploader
            :class="$q.dark.isActive ? 'fit bg-dark' : 'fit bg-white'"
            no-thumbnails
            flat
            label="Media"
            color="secondary"
            hide-upload-btn
            accept=".mp4, .mov, .mkv, .mp3, audio/*, video/*"
            @added="addedMedia"
            @removed="newChapter.media = null"
          />
          <q-uploader
            :class="$q.dark.isActive ? 'fit bg-dark' : 'fit bg-white'"
            no-thumbnails
            flat
            label="Preview"
            color="secondary"
            hide-upload-btn
            accept=".jpg, image/*"
            @added="addedPreview"
            @removed="newChapter.preview = null"
          />
          <q-icon
            name="lightbulb"
            :class="$q.dark.isActive ? 'text-white' : 'text-secondary'"
            size="sm"
          />
          Previews should be landscape
          <br>
          <q-icon
            name="lightbulb"
            :class="$q.dark.isActive ? 'text-white' : 'text-secondary'"
            size="sm"
          />
          Previews should have an aspect ratio of 16:9
        </q-card-section>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          color="secondary"
          label="Not Yet Supported"
          @click="createChapter"
          :disable="newChapter.title.length < 3 || !newChapter.preview || true"
          :loading="working"
        />
        <q-btn color="secondary" label="Cancel" @click="onCancelClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent } from 'quasar'
const reducer = require('image-blob-reduce')()

export default {
  name: 'newChapter',

  emits: [...useDialogPluginComponent.emits],

  data () {
    return {
      newChapter: {
        title: '',
        media: null,
        preview: null
      },
      working: false
    }
  },

  computed: {
    profile: {
      get () {
        return this.$store.state.account.profile
      }
    },
    slug: {
      get () {
        return this.newChapter.title?.replace(/[^0-9a-zA-Z]+/g, '-').substring(0, 32)
      }
    }
  },

  methods: {
    createChapter () {
      this.newChapter.working = true

      const p1 = this.$store.dispatch('collection/createChapter', {
        collection: this.$route.params.uuid,
        title: this.newChapter.title,
        filename: this.newChapter.Preview?.name
      })

      const p2 = reducer.toBlob(this.newChapter.preview, { max: 720 })

      Promise.all([p1, p2])
        .then(results => {
          return this.$axios.put(
            results[0].data.presignedPreviewPutUrl,
            results[1]
          )
        })
        .then(() => {
          this.onOKClick(this.newChapter)
        })
        .catch(error => {
          console.log(error)
          this.onOKClick(false)
        })
    },
    addedMedia (files) {
      this.newChapter.preview = files[0]
    },
    addedPreview (files) {
      this.newChapter.media = files[0]
    }
  },

  setup () {
    const {
      dialogRef,
      onDialogHide,
      onDialogOK,
      onDialogCancel
    } = useDialogPluginComponent()

    return {
      dialogRef,
      onDialogHide,
      onOKClick (data) {
        onDialogOK()
      },
      onCancelClick: onDialogCancel
    }
  }
}
</script>
