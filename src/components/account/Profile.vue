<template>
  <div>
    <q-card v-if="profile.id && !creator?.id" flat style="max-width: 250px">
      <q-card-section>
        <div class="text-h6">
          <q-icon :name="'fab fa-' + profile.identity_provider" />
          {{ profile.name }}
        </div>
      </q-card-section>
      <img :src="profile.profile_pic" :alt="profile.name" />
      <q-card-section>
        <div class="text-subtitle2">{{ profile.email }}</div>
      </q-card-section>
    </q-card>

    <div v-if="!profile.id && !creator?.id" class="q-py-md">
      Not logged in!
    </div>

    <q-card v-if="creator?.id" flat style="max-width: 250px">
      <q-card-section>
        <div class="text-h6">
          <q-icon :name="'fab fa-' + profile.identity_provider" />
          {{ profile.name }}
        </div>
      </q-card-section>
      <img :src="profile.profile_pic" :alt="profile.name" />
      <q-card-section>
        <div class="text-subtitle2">{{ profile.email }}</div>
      </q-card-section>
    </q-card>

  </div>
</template>

<script>
export default {
  name: 'Profile-Page',

  props: {
    creator: Object
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
