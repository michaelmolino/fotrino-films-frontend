<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" persistent>
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
          v-model="newCollection.title"
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
          <q-checkbox
            color="secondary"
            v-model="newCollection.useProfilePhoto"
            size="md"
            @click="tick"
          />
          Use profile photo for collection cover
          <div v-if="!newCollection.useProfilePhoto">
            <q-uploader
              :class="$q.dark.isActive ? 'fit bg-dark' : 'fit bg-white'"
              flat
              label="Cover"
              color="secondary"
              hide-upload-btn
              accept=".jpg, image/*"
              @added="added"
              @removed="newCollection.cover = null"
            />
            <q-icon
              name="lightbulb"
              :class="$q.dark.isActive ? 'text-white' : 'text-secondary'"
              size="sm"
            />
            Cover photos should be square!
          </div>
        </q-card-section>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          color="secondary"
          label="OK"
          @click="createCollection"
          :disabled="!(newCollection.title.length > 2 && (newCollection.cover || newCollection.useProfilePhoto))"
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
  name: 'NewCollection',

  emits: [...useDialogPluginComponent.emits],

  data () {
    return {
      newCollection: {
        title: '',
        useProfilePhoto: true,
        cover: null
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
        return this.newCollection.title?.replace(/[^0-9a-zA-Z]+/g, '-').substring(0, 32)
      }
    }
  },

  methods: {
    createCollection () {
      this.newCollection.working = true

      const p1 = this.$store.dispatch('collection/createCollection', {
        title: this.newCollection.title,
        filename: this.newCollection.cover?.name
      })

      const p2 = !this.newCollection.useProfilePhoto
        ? reducer.toBlob(this.newCollection.cover, { max: 360 })
        : Promise.resolve(null)

      Promise.all([p1, p2])
        .then(results => {
          if (!this.newCollection.useProfilePhoto) {
            return this.$axios.put(
              results[0].data.presignedCoverPutUrl,
              results[1]
            )
          }
          return Promise.resolve()
        })
        .then(() => {
          this.onOKClick(this.newCollection)
        })
        .catch(error => {
          console.log(error)
          this.onOKClick(false)
        })
    },
    added (files) {
      this.newCollection.cover = files[0]
    },
    tick () {
      if (this.newCollection.useProfilePhoto === false) {
        this.newCollection.cover = null
      }
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
