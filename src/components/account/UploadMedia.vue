<template>
    <span>
        <div v-if="profile?.id" class="q-pa-lg">
            <div v-if="$q.platform.is.mobile">
                <q-icon name="fas fa-mobile-screen-button" class="q-px-sm" size="sm" /> Mobile upload is not yet supported.
            </div>
            <div v-if="$q.platform.is.desktop">
                <div v-if="$q.platform.is.mac" class="q-py-sm"><q-icon name="fab fa-apple" class="q-px-sm" size="sm" /> Apple upload is not yet supported.</div>
                <div v-if="$q.platform.is.win" class="q-py-sm"><q-icon name="fab fa-windows" class="q-px-sm" size="sm" /> Windows upload is not yet supported.</div>
                <div v-if="$q.platform.is.linux" class="q-py-sm"><q-icon name="fab fa-linux" class="q-px-sm" size="sm" /> Linux upload is not yet supported.</div>
                <div v-if="!$q.platform.is.linux && !$q.platform.is.win && !$q.platform.is.mac" class="q-py-sm">
                    <q-icon name="fas fa-bug" class="q-px-sm" size="sm" /> Unknown platofrm. Upload is not supported.
                </div>
                <q-icon name="fas fa-desktop" class="q-px-sm" size="sm" /> Desktop upload is not yet supported.
            </div>
            <div v-if="!$q.platform.is.desktop && $q.platform.is.mobile">
                <q-icon name="fas fa-bug" /> Unknown platofrm. Upload is not supported.
            </div>
        </div>
        <NothingText v-else />
    </span>
  </template>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  name: 'UploadMedia',

  components: {
    NothingText: defineAsyncComponent(() =>
      import('@components/shared/NothingText.vue')
    )
  },

  computed: {
    profile: {
      get() {
        return this.$store.state.account.profile
      }
    }
  }
}
</script>
