<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">New Movie</div>
      </q-card-section>

      <q-card-section>
        <q-input
          :color="$q.dark.isActive ? 'white' : 'secondary'"
          label="Title"
          dense
          autofocus
          v-model="title"
        />
      </q-card-section>
      <q-card-section>
        <q-input
          :color="$q.dark.isActive ? 'white' : 'secondary'"
          label="Sub-Title"
          dense
          v-model="subTitle"
        />
      </q-card-section>
      <q-card-section>
        <q-uploader
          :class="$q.dark.isActive ? 'fit bg-dark' : 'fit bg-white'"
          flat
          no-thumbnails
          url="/api/upload"
          :headers="[{name: 'X-CSRFToken', value: profile.csrf_token}]"
          label="Poster"
          field-name="movie_poster"
          color="secondary"
          hide-upload-btn
          auto-upload
          accept=".jpg, image/*"
          @uploaded="handleUpload"
          @removed="uploadRemoved"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          color="secondary"
          label="OK"
          @click="createMovie({ title: title, subTitle: subTitle, poster: poster })"
          :disabled="title.length <= 2 || subTitle.length <=2 || !poster"
        />
        <q-btn color="secondary" label="Cancel" @click="onCancelClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent } from 'quasar'

export default {
  name: 'NewMovie',

  emits: [...useDialogPluginComponent.emits],

  data () {
    return {
      title: '',
      subTitle: '',
      poster: false
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
    createMovie (data) {
      // this.$store
      //   .dispatch('collection/createMovie',
      //     {
      //       title: data.title,
      //       subTitle: data.subtitle,
      //       poster: data.poster
      //     }
      //   )
      //   .then(() => {
      //     this.$store
      //       .dispatch('collection/fetchCollection', this.$route.query.uuid)
      //       .catch(error => {
      //         console.log(error)
      //       })
      //   })
      //   .catch(error => {
      //     console.log(error)
      //   })
      this.onOKClick(data)
    },
    handleUpload (info) {
      this.poster = info.xhr.response
    },
    uploadRemoved () {
      this.poster = false
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
          subTitle: data.subTitle,
          poster: data.poster
        })
      },
      onCancelClick: onDialogCancel
    }
  }
}
</script>
