<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" persistent>
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
          v-model="newMovie.title"
        />
        <q-input
          :color="$q.dark.isActive ? 'white' : 'secondary'"
          label="Sub Title"
          dense
          autofocus
          v-model="newMovie.subTitle"
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
            flat
            label="Poster"
            color="secondary"
            hide-upload-btn
            accept=".jpg, image/*"
            @added="added"
            @removed="newMovie.poster = null"
          />
          <q-icon
            name="lightbulb"
            :class="$q.dark.isActive ? 'text-white' : 'text-secondary'"
            size="sm"
          />
          Posters should be portrait
          <br>
          <q-icon
            name="lightbulb"
            :class="$q.dark.isActive ? 'text-white' : 'text-secondary'"
            size="sm"
          />
          Posters should have an aspect ratio of 2:3
        </q-card-section>
      </q-card-section>

      <q-card-actions align="right">
        <!-- <q-btn
          color="secondary"
          label="OK"
          @click="createMovie"
          :disabled="newMovie.title.length < 3 || newMovie.subTitle.length < 3 || !newMovie.poster"
          :loading="working"
        /> -->
        <q-btn
          color="secondary"
          label="Not Yet Implemented"
          :disabled="true"
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
  name: 'NewMovie',

  emits: [...useDialogPluginComponent.emits],

  data () {
    return {
      newMovie: {
        title: '',
        subTitle: '',
        poster: null
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
        return this.newMovie.title?.replace(/[^0-9a-zA-Z]+/g, '-').substring(0, 32)
      }
    }
  },

  methods: {
    createMovie () {
      this.newMovie.working = true

      const p1 = this.$store.dispatch('collection/createMovie', {
        collection: this.$route.query.uuid,
        title: this.newMovie.title,
        subTitle: this.newMovie.subTitle,
        filename: this.newMovie.poster?.name
      })

      const p2 = reducer.toBlob(this.newMovie.poster, { max: 720 })

      Promise.all([p1, p2])
        .then(results => {
          return this.$axios.put(
            results[0].data.presignedCoverPutUrl,
            results[1]
          )
        })
        .then(() => {
          this.onOKClick(this.newMovie)
        })
        .catch(error => {
          console.log(error)
          this.onOKClick(false)
        })
    },
    added (files) {
      this.newMovie.poster = files[0]
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
