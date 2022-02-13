<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">New Collection</div>
      </q-card-section>

      <q-card-section>
        <q-input
          :color="$q.dark.isActive ? 'white' : 'secondary'"
          label="Title"
          dense
          autofocus
          v-model="title"
        />
        <q-input
          :color="$q.dark.isActive ? 'white' : 'secondary'"
          readonly
          label="Slug"
          dense
          autofocus
          v-model="slug"
        />
        <q-card-section>
          <q-checkbox
            color="secondary"
            v-model="useProfilePhoto"
          />
          Use profile photo for collection cover
          <q-uploader
            v-if="!useProfilePhoto"
            :class="$q.dark.isActive ? 'fit bg-dark' : 'fit bg-white'"
            flat
            label="Cover"
            color="secondary"
            hide-upload-btn
            accept=".jpg, image/*"
            @added="added"
            @removed="cover = null"
          />
          <div class="q-pt-md" v-if="!useProfilePhoto">
            <q-icon
              name="lightbulb"
              :class="$q.dark.isActive ? 'text-white' : 'text-secondary'"
              size="md"
            />
            Cover photos should be square!
          </div>
        </q-card-section>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          color="secondary"
          label="OK"
          @click="createCollection({ title: title, cover: cover })"
          :disabled="title.length <= 2 || (!cover && !useProfilePhoto)"
          :loading="uploading"
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
  name: 'NewCollection',

  emits: [...useDialogPluginComponent.emits],

  data () {
    return {
      title: '',
      useProfilePhoto: true,
      cover: null,
      uploading: false
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
        return this.title.replace(/[^0-9a-zA-Z]+/g, '-').substring(0, 32)
      }
    }
  },

  methods: {
    createCollection (data) {
      let p2
      if (!this.useProfilePhoto) {
        this.uploading = true

        const from = new Image()
        from.src = URL.createObjectURL(data.cover)

        const _cover = document.createElement('canvas')
        _cover.height = 320
        _cover.width = 320

        p2 = reducer.toBlob(this.cover, { max: 320 })
      } else {
        this.cover = null
        p2 = Promise.resolve()
      }

      const p1 = this.$store.dispatch('collection/createCollection', {
        title: data.title,
        filename: this.cover?.name
      })

      Promise.all([p1, p2])
        .then(results => {
          if (!this.useProfilePhoto) {
            return this.$axios.put(
              results[0].data.presignedCoverPutUrl,
              results[1]
            )
          }
          return Promise.resolve()
        })
        .then(() => {
          return this.$store.dispatch('collection/fetchCollections')
        })
        .then(() => {
          this.onOKClick()
        })
        .catch(error => {
          console.log(error)
          this.onOKClick()
        })
    },
    added (files) {
      this.cover = files[0]
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
