<template>
  <q-card flat bordered class="comments">
    <q-card-section>
      <div id="commentBoxContainer" class="hidden"></div>
      <div id = "loggedOutComments" class="hidden">
        <span v-if="commentCount === 1">This media has a comment! </span>
        <span v-if="commentCount > 1">This media has {{ commentCount }} comments! </span>
        You must be logged in to view or post comments.
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import commentBox from 'commentbox.io'
import { mapActions } from 'vuex'

export default {
  name: 'CommentsBox',

  props: {
    loggedIn: Boolean,
    privateId: String
  },

  data() {
    return {
      commentboxInstance: process.env.NODE_ENV === 'development' ? '5670497807237120-proj' : '5692452404985856-proj',
      commentCount: 0
    }
  },

  computed: {
    darkMode: {
      get() {
        return this.$q.dark.isActive
      }
    }
  },

  methods: {
    ...mapActions('account', ['getCommentboxToken']),

    clearOldCommentBox(old) {
      const div = document.getElementById(old)
      if (div) {
        div.remove()
      }
    },

    initCommentBox(dark) {
      const container = document.getElementById('commentBoxContainer')
      container.classList.remove('hidden')

      const loggedOutDiv = document.getElementById('loggedOutComments')
      loggedOutDiv.classList.add('hidden')

      const newDiv = document.createElement('div')
      newDiv.id = this.privateId
      newDiv.className = 'commentbox'
      container.appendChild(newDiv)

      commentBox(this.commentboxInstance, {
        textColor: dark ? '#fff' : '#000',
        createBoxUrl(boxId, pageLocation) {
          pageLocation.href = window.location.origin + '/private/' + boxId
          pageLocation.search = ''
          return pageLocation.href
        },
        onCommentCount: (count) => {
          this.commentCount = Number(count) || 0
          if (!this.loggedIn) {
            container.classList.add('hidden')
            loggedOutDiv.classList.remove('hidden')
          }
        },
        singleSignOn: {
          autoSignOn: true,
          onSignOn: (onComplete, onError) => {
            this.getCommentboxToken()
              .then(token => {
                onComplete(token)
              })
              .catch(err => {
                onError(err)
              })
          },
          onSignOut: () => {
            this.$emit('logout')
          }
        }
      })
    }
  },

  watch: {
    privateId: {
      immediate: true,
      handler(newVal, oldVal) {
        this.clearOldCommentBox(oldVal)
        this.$nextTick(() => {
          this.initCommentBox(this.darkMode)
        })
      }
    },

    darkMode: {
      immediate: false,
      handler(newVal) {
        this.clearOldCommentBox(this.privateId)
        this.$nextTick(() => {
          this.initCommentBox(newVal)
        })
      }
    }
  }
}
</script>

<style scoped>
.comments {
  width: 100%;
  max-width: 720px;
  min-width: 240px;
}

.hidden {
  height: 0;
  overflow: hidden;
}
</style>
