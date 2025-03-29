<template>
  <div class="q-pb-md">
    <q-card flat class="profile-card">
      <q-card-section>
        <q-img :src="profile.profile_pic" class="width250x" :ratio="1 / 1" fit="cover">
          <q-badge class="bg-accent q-pa-md" floating transparent>
            <q-icon :name="profile.identity_provider !== 'hydra' ? 'fab fa-' + profile.identity_provider : 'fas fa-code'" />
          </q-badge>
          <div class="absolute-bottom text-center">
            <div class="ellipsis">{{ profile.name }}</div>
            <div class="ellipsis">{{ profile.email }}</div>
          </div>
        </q-img>
      </q-card-section>
      <q-card-section>
        <div class="flex no-wrap">
          <div class="fit">
            <div class="ellipsis text2">Joined {{ daysSince(profile.created) }}</div>
            <div class="ellipsis text2">{{ mediaCount }} videos</div>
          </div>
          <div class="q-pl-sm">
            <q-btn to="/account/upload" flat no-caps icon="fas fa-cloud-arrow-up">
              <q-tooltip>Upload Media</q-tooltip>
            </q-btn>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
import { daysSince } from '@javascript/library.js'

export default {
  name: 'ProfilePhoto',

  props: {
    profile: Object,
    mediaCount: Number
  },
  methods: {
    daysSince(date) {
      return daysSince(date)
    }
  }
}
</script>

<style scoped>
.profile-card {
  display: inline-block;
  width: auto;
}
</style>
