<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">New Collection</div>
      </q-card-section>

      <q-card-section>
        <q-input
          :color="$q.dark.isActive ? 'white' : 'primary'"
          label="Title"
          dense
          autofocus
          v-model="title"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          color="primary"
          label="OK"
          @click="createCollection({ title: title })"
          :disabled="title.length <= 2"
        />
        <q-btn color="primary" label="Cancel" @click="onCancelClick" />
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
      title: ''
    }
  },

  methods: {
    createCollection (data) {
      this.$store
        .dispatch('collection/createCollection', { title: data.title })
        .then(() => {
          this.$store
            .dispatch('collection/fetchCollections')
        })
        .catch(error => {
          console.log(error)
        })
      this.onOKClick(data)
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
          title: data.title
        })
      },
      onCancelClick: onDialogCancel
    }
  }
}
</script>
