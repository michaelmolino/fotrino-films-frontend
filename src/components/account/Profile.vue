<template>
  <div>
    <q-card v-if="profile.id" flat style="max-width: 250px">
      <img :src="profile.profile_pic" />
      <q-card-section>
        <div class="text-h6">
          <q-icon :name="'fab fa-' + profile.identity_provider" />
          {{ profile.name }}
        </div>
        <div class="text-subtitle2">{{ profile.email }}</div>
      </q-card-section>
    </q-card>
    <div v-if="!profile.id" class="q-py-md">
      Not logged in!
    </div>
  </div>
</template>

<script>
export default {
  name: 'Profile-Page',

  computed: {
    profile: {
      get () {
        return this.$store.state.account.profile
      }
    }
  }
}
</script>
