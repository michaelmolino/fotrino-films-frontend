<template>
  <q-card flat bordered class="comments">
    <q-card-section>
      <div id="commentBoxContainer" v-if="loggedIn"></div>
      <div id="loggedOutComments" v-if="!loggedIn" class="q-pa-md text-center">
        <q-icon name="comment" color="grey-6" size="24px" class="q-mb-sm" />
        <div class="text-caption text-grey-7 q-mt-sm">You must be logged in to view or post comments.</div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useStore } from 'vuex'
import commentBox from 'commentbox.io'
import { logout } from '@utils/auth.js'

const props = defineProps({
  loggedIn: Boolean,
  privateId: String
})

const $q = useQuasar()
const store = useStore()
const commentCount = ref(0)
const commentboxInstance = process.env.NODE_ENV === 'development' ? '5670497807237120-proj' : '5692452404985856-proj'
const darkMode = computed(() => $q.dark.isActive)

function clearOldCommentBox(old) {
  const div = document.getElementById(old)
  if (div) div.remove()
}

function initCommentBox(dark) {
  const container = document.getElementById('commentBoxContainer')
  if (!container) return

  const newDiv = document.createElement('div')
  newDiv.id = props.privateId
  newDiv.className = 'commentbox'
  container.appendChild(newDiv)

  commentBox(commentboxInstance, {
    textColor: dark ? '#fff' : '#000',
    createBoxUrl(boxId, pageLocation) {
      pageLocation.href = window.location.origin + '/private/' + boxId
      pageLocation.search = ''
      return pageLocation.href
    },
    onCommentCount: (count) => {
      commentCount.value = Number(count) || 0
    },
    singleSignOn: {
      autoSignOn: true,
      onSignOn: (onComplete, onError) => {
        store.dispatch('account/getCommentboxToken')
          .then(token => onComplete(token))
          .catch(err => onError(err))
      },
      onSignOut: () => {
        logout(store)
      }
    }
  })
}

watch(() => props.privateId, (newVal, oldVal) => {
  clearOldCommentBox(oldVal)
  nextTick(() => {
    initCommentBox(darkMode.value)
  })
}, { immediate: true })

watch(darkMode, (newVal) => {
  clearOldCommentBox(props.privateId)
  nextTick(() => {
    initCommentBox(newVal)
  })
})
</script>

<style scoped>
.comments {
  width: 100%;
  max-width: 720px;
  min-width: 240px;
  background: var(--q-color-grey-1);
  border-radius: 8px;
}
</style>
