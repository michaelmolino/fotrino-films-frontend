<template>
  <div>
    <q-card v-if="profile" flat class="profile-card modern-profile-card">
      <div class="text-h5 text-weight-bold">Profile</div>
      <div class="profile-row">
        <q-avatar size="80px" class="profile-avatar">
          <img :src="profilePic" :alt="safeName || safeEmail" />
          <q-badge class="bg-accent" floating>
            <q-icon :name="providerIcon" />
          </q-badge>
        </q-avatar>
        <div class="profile-info">
          <div class="profile-title-row">
            <span class="text-weight-medium text-h6 ellipsis">{{ safeName }}</span>
            <span
              v-if="profile.country"
              class="flag-emoji q-ml-sm"
              :title="getCountry(profile.country).name">
              {{ getCountry(profile.country).flag }}
            </span>
          </div>
          <div class="text-grey-6 text-caption ellipsis">{{ safeEmail }}</div>
          <div class="text-grey-6 text-caption q-mt-xs">Joined {{ joinedText }}</div>
          <div class="text-grey-6 text-caption q-mt-xs" data-cy="video-count">
            {{ mediaCount }} videos
          </div>
        </div>
      </div>
    </q-card>
    <q-skeleton v-else type="rect" animation="pulse" class="width250" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { daysSince } from '@utils/date.js'
import { getCountry } from '@utils/countries.js'

const props = defineProps({
  profile: { type: Object, default: null },
  mediaCount: { type: Number, default: 0 }
})

const profilePic = computed(() => props.profile?.profile_pic || undefined)
const providerIcon = computed(() => `fab fa-${props.profile?.identity_provider}`)
const joinedText = computed(() => {
  const created = props.profile?.created
  return created ? daysSince(created) : 'unknown'
})
const safeName = computed(() => props.profile?.name || '')
const safeEmail = computed(() => props.profile?.email || '')
</script>

<style scoped>
.profile-card.modern-profile-card {
  max-width: 800px;
  width: 100%;
  margin-left: 0;
  margin-right: 0;
  text-align: left;
  padding-left: 2rem;
  padding-right: 2rem;
}
.profile-row {
  display: flex;
  align-items: center;
  gap: 24px;
}
.profile-avatar {
  position: relative;
}
.profile-info {
  flex: 1;
  min-width: 0;
}
.profile-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
