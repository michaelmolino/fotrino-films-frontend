<template>
  <q-card flat bordered class="comments">
    <q-card-section>
      <div id="commento"></div>
      <div v-if="!loggedIn" class="q-light text-dark">Please login to view/post comments.</div>
    </q-card-section>
  </q-card>
</template>

<script>
import { onMounted, watch } from 'vue'

export default {
  props: {
    loggedIn: Boolean,
    privateId: String
  },

  setup(props) {
    const loadCommento = () => {
      const script = document.getElementById('commento-script')

      if (script) {
        script.parentNode.removeChild(script)
      }
      const s = document.createElement('script')
      s.id = 'commento-script'
      s.defer = true
      s.setAttribute('data-auto-init', 'false')
      s.setAttribute('data-page-id', props.privateId)
      s.setAttribute('data-css-override', '/css/commento-overrides.css')
      s.src = 'https://cdn.commento.io/js/commento.js'
      document.head.appendChild(s)
    }

    const waitForCommento = () => {
      return new Promise((resolve, reject) => {
        (function check() {
          if (window.commento && typeof window.commento.main === 'function') {
            return resolve(window.commento)
          }
          requestAnimationFrame(check)
        })()
      })
    }

    const initCommento = async () => {
      loadCommento()

      const old = document.getElementById('commento')
      if (old) {
        const newEl = old.cloneNode(false)
        newEl.setAttribute('data-page-id', props.privateId)
        old.parentNode.replaceChild(newEl, old)
      }

      const commento = await waitForCommento()
      if (!props.loggedIn) return
      commento.main()
      const interval = setInterval(() => {
        const loginEl = document.querySelector('.commento-login-text')
        if (loginEl) {
          loginEl.textContent = 'You can currently view comments, but to post a comment, please click here to log in to our comment system. Since we use single sign-on (SSO), you won\'t need to enter a password.'
          loginEl.style.textAlign = 'center'
          clearInterval(interval)
        }
      }, 200)
    }

    onMounted(() => {
      initCommento()
    })

    watch(() => [props.privateId, props.loggedIn], () => initCommento())
  }
}
</script>

<style scoped>
.comments {
  width: 100%;
  max-width: 720px;
  min-width: 240px;
}

:deep(#commento-login ~ #commento-textarea-super-container-root) {
  display: none !important;
}
</style>
