<template>
  <div class="q-pb-md">
    <q-card v-if="profile" flat class="profile-card">
      <q-card-section>
        <q-img :src="profilePic" class="width250x" :ratio="1" fit="cover" :alt="safeName || safeEmail">
          <q-badge class="bg-accent q-pa-md" floating transparent>
            <q-icon :name="providerIcon" />
          </q-badge>
          <div class="absolute-bottom text-center">
            <div class="ellipsis">{{ safeName }}</div>
            <div class="ellipsis">{{ safeEmail }}</div>
          </div>
        </q-img>
      </q-card-section>
      <q-card-section>
        <div class="flex no-wrap">
          <div class="fit">
            <div class="ellipsis text2">Joined {{ joinedText }}</div>
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
    <q-skeleton v-else type="rect" animation="pulse" class="width250x" />
  </div>

</template>

<script setup>
import { computed } from 'vue'
import { daysSince as _daysSince } from '@javascript/library.js'

const props = defineProps({
  profile: { type: Object, default: null },
  mediaCount: { type: Number, default: 0 }
})

const profilePic = computed(() => props.profile?.profile_pic || undefined)
const providerIcon = computed(() => `fab fa-${props.profile?.identity_provider}`)
const joinedText = computed(() => {
  const created = props.profile?.created
  return created ? _daysSince(created) : 'unknown'
})
const safeName = computed(() => props.profile?.name || '')
const safeEmail = computed(() => props.profile?.email || '')
</script>

<style scoped>
.profile-card {
  display: inline-block;
  width: auto;
}
</style>
