<template>
  <q-card flat bordered class="comments">
    <q-card-section>
      <div id="privateId" :class="loggedIn ? 'commentbox' : 'commentbox hidden'"></div>
      <div v-if="!loggedIn">
        <span v-if="commentCount === 1">This media has a comment! </span><span v-if="commentCount > 1">This media has comments! </span>You must be logged in to view or post comments.
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
      commentCount: 0
    }
  },

  methods: {
    ...mapActions('account', ['getProfile', 'getCommentboxToken'])
  },

  mounted() {
    commentBox('5692452404985856-proj', {
      onCommentCount: (count) => {
        this.commentCount = Number(count) || 0
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
          fetch('/api/account/logout', {
            method: 'GET'
          })
            .then(() => {
              this.getProfile()
            })
        }
      }
    })
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
