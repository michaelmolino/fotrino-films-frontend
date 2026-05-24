<template>
  <div class="q-pa-md flex flex-center" data-cy="help-page">
    <q-card flat bordered class="q-pa-xl card-terms" data-cy="help-card">
      <div class="text-h4 text-center q-mb-md" data-cy="help-title">Frequently Asked Questions</div>
      <div class="text-caption text-center q-mb-lg">
        Helpful answers to common questions about Fotrino Films
      </div>
      <q-list bordered data-cy="help-faq-list">
        <q-expansion-item
          data-cy="help-item-about"
          group="faq"
          label="What is Fotrino Films?"
          :default-opened="!selectedItem || selectedItem === 'about'"
          header-class="text-bold"
          @show="onItemSelect('about')">
          <q-card>
            <q-card-section>
              Fotrino Films is a video hosting platform built for sharing personal content with
              family and friends.
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-separator />
        <q-expansion-item
          data-cy="help-item-different"
          group="faq"
          label="What makes it different from other video platforms?"
          header-class="text-bold"
          :default-opened="selectedItem === 'different'"
          @show="onItemSelect('different')">
          <q-card>
            <q-card-section data-cy="help-answer-different">
              <div>
                Fotrino Films is meant to be simple, private, and ad-free. It is not built around
                discovery, monetization, or engagement metrics, so there are no ads, recommendation
                algorithms, or tracking designed to keep people watching. The focus is on giving you
                a secure place to host your videos and share them directly with the people you
                choose.
              </div>
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-separator />
        <q-expansion-item
          data-cy="help-item-opensource"
          group="faq"
          label="Is Fotrino Films open source?"
          header-class="text-bold"
          :default-opened="selectedItem === 'opensource'"
          @show="onItemSelect('opensource')">
          <q-card>
            <q-card-section data-cy="help-answer-opensource">
              The frontend is open source. The rest of the platform is not.
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-separator />
        <q-expansion-item
          data-cy="help-item-privacy"
          group="faq"
          label="Is my content public or private?"
          header-class="text-bold"
          :default-opened="selectedItem === 'privacy'"
          @show="onItemSelect('privacy')">
          <q-card>
            <q-card-section>
              <div>
                By default, your content is only available to people who have the direct link to
                your channel. It is not indexed by search engines, and the URLs are not easy to
                guess. That said, anyone you share a link with can pass it along, so it is best to
                share only with people you trust.
              </div>
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-separator />
        <q-expansion-item
          data-cy="help-item-production"
          group="faq"
          label="Is it ready to use?"
          header-class="text-bold"
          :default-opened="selectedItem === 'production'"
          @show="onItemSelect('production')">
          <q-card>
            <q-card-section>
              It is usable today, but it is still primarily a personal project built for me and my
              family.
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-separator />
        <q-expansion-item
          data-cy="help-item-mobilesupport"
          group="faq"
          label="Does it work on mobile?"
          header-class="text-bold"
          :default-opened="selectedItem === 'mobilesupport'"
          @show="onItemSelect('mobilesupport')">
          <q-card>
            <q-card-section>
              Fotrino Films works on modern browsers across desktop, tablet, and mobile devices.
              Watching videos on mobile is fully supported. Uploading is more reliable on desktop;
              if you upload from a phone or tablet, you will need to keep the device awake until the
              upload finishes.
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-separator />
        <q-expansion-item
          data-cy="help-item-download"
          group="faq"
          label="Are videos protected by DRM, and can they be downloaded?"
          header-class="text-bold"
          :default-opened="selectedItem === 'download'"
          @show="onItemSelect('download')">
          <q-card>
            <q-card-section>
              Videos on Fotrino Films do not use DRM. Downloads are not offered as a built-in
              feature, but someone with the private link and enough technical knowledge may still be
              able to save a copy.
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-separator />
        <q-expansion-item
          data-cy="help-item-buffering"
          group="faq"
          label="What should I do if I am seeing buffering or poor video quality?"
          header-class="text-bold"
          :default-opened="selectedItem === 'buffering'"
          @show="onItemSelect('buffering')">
          <q-card>
            <q-card-section>
              Fotrino Films uses adaptive streaming, so video quality adjusts based on your device
              and connection speed. If playback is buffering or looks blurry, the most common cause
              is an unstable or slow connection. If possible, switch to a stronger Wi-Fi or mobile
              signal and give the video a moment to settle. Some devices also start at a lower
              quality before stepping up automatically.
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-separator />
        <q-expansion-item
          data-cy="help-item-facebook"
          group="faq"
          label="Why is Facebook not showing a preview image for my link?"
          header-class="text-bold"
          :default-opened="selectedItem === 'facebook'"
          @show="onItemSelect('facebook')">
          <q-card>
            <q-card-section>
              Use the
              <q-btn
                flat
                dense
                :icon="`img:${facebookIcon}`"
                label="Facebook Link Debugger"
                href="https://developers.facebook.com/tools/debug/"
                aria-label="Open Facebook Link Debugger tool"
                target="_blank" />
              to refresh and inspect how Facebook reads your link. It can help pull in the preview
              image and confirm the metadata before you share it again.
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-separator />
        <q-expansion-item
          data-cy="help-item-login"
          group="faq"
          label="Can I create an account without using Google or another provider?"
          header-class="text-bold"
          :default-opened="selectedItem === 'login'"
          @show="onItemSelect('login')">
          <q-card>
            <q-card-section>
              At the moment, sign-in relies on third-party identity providers such as Google. That
              approach helps offload account security to providers that are better equipped to
              handle authentication safely. No content or viewing data is shared beyond what is
              needed to support login, and additional sign-in options may be added over time.
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-separator />
        <q-expansion-item
          data-cy="help-item-filesize"
          group="faq"
          label="Is there a file size limit for uploads?"
          header-class="text-bold"
          :default-opened="selectedItem === 'filesize'"
          @show="onItemSelect('filesize')">
          <q-card>
            <q-card-section>
              Large uploads are supported, but please keep them to reasonable sizes, such as under
              20GB. Extremely large uploads may trigger manual review and could put your content or
              account at risk if they appear abusive. If you have a legitimate need for larger
              uploads, contact support first.
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-separator />
      </q-list>
    </q-card>
  </div>
</template>

<script setup>
import facebookIcon from '@assets/icons/facebook.svg'
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineOptions({ name: 'Help-Page' })
const route = useRoute()
const router = useRouter()
const DEFAULT_HELP_ITEM = 'about'
const selectedItem = computed(() => route.query.item)

onMounted(() => {
  if (!selectedItem.value) {
    replaceSelectedItem(DEFAULT_HELP_ITEM)
  }
})

function onItemSelect(item) {
  if (selectedItem.value === item) return

  replaceSelectedItem(item)
}

function replaceSelectedItem(item) {
  router.replace({
    query: {
      ...route.query,
      item
    }
  })
}
</script>

<style scoped>
.card-terms {
  max-width: 800px;
  width: 100%;
}
</style>
