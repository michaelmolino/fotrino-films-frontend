<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">New Collection</div>
      </q-card-section>

      <q-card-section>
        <q-input
          :color="$q.dark.isActive ? 'white' : 'secondqry'"
          label="Title"
          dense
          autofocus
          v-model="title"
        />
        <!-- <q-card-section>
          <q-uploader
            :class="$q.dark.isActive ? 'fit bg-dark' : 'fit bg-white'"
            flat
            no-thumbnails
            url="/api/upload?type=cover"
            :headers="[{name: 'X-CSRFToken', value: profile.csrf_token}]"
            label="Cover"
            color="secondary"
            hide-upload-btn
            auto-upload
            accept=".jpg, image/*"
            @uploaded="handleUpload"
            @removed="uploadRemoved"
          />
        </q-card-section> -->
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          color="secondary"
          label="OK"
          @click="createCollection({ title: title, cover: cover })"
          :disabled="title.length <= 2"
        />
        <q-btn color="secondary" label="Cancel" @click="onCancelClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent } from 'quasar'

export default {
  name: 'NewCollection',

  emits: [...useDialogPluginComponent.emits],

  data () {
    return {
      title: '',
      cover: false
    }
  },

  computed: {
    profile: {
      get () {
        return this.$store.state.account.profile
      }
    }
  },

  methods: {
    createCollection (data) {
      this.$store
        .dispatch('collection/createCollection', { title: data.title, cover: data.cover })
        .then(() => {
          this.$store
            .dispatch('collection/fetchCollections')
        })
        .catch(error => {
          console.log(error)
        })
      this.onOKClick(data)
    },
    handleUpload (info) {
      this.cover = info.xhr.response
    },
    uploadRemoved () {
      this.cover = false
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
        onDialogOK({
          title: data.title,
          cover: data.cover
        })
      },
      onCancelClick: onDialogCancel
    }
  }
}
</script>
