<template>
  <div class="q-pa-md flex flex-center" data-cy="help-page">
    <q-card flat bordered class="q-pa-xl card-terms" data-cy="help-card">
      <div class="text-h4 text-center q-mb-md" data-cy="help-title">Frequently Asked Questions</div>
      <div class="text-caption text-center q-mb-lg">Helpful answers to common questions about Fotrino Films</div>
      <q-list bordered data-cy="help-faq-list">
        <q-expansion-item
          data-cy="help-item-about"
          group="faq"
          label="What is Fotrino Films?"
          :model-value="selectedItem === 'about'"
          header-class="text-bold"
          @update:model-value="value => onItemToggle('about', value)">
          <q-card>
            <q-card-section>
              Fotrino Films is a video hosting platform built for sharing personal content with family and friends.
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-separator />
        <q-expansion-item
          data-cy="help-item-different"
          group="faq"
          label="What makes it different from other video platforms?"
          header-class="text-bold"
          :model-value="selectedItem === 'different'"
          @update:model-value="value => onItemToggle('different', value)">
          <q-card>
            <q-card-section data-cy="help-answer-different">
              <div>
                Fotrino Films is meant to be simple, private, and ad-free. It is not built around
                discovery, monetization, or engagement metrics, so there are no ads, recommendation
                algorithms, or tracking designed to keep people watching. The focus is on giving you a
                secure place to host your videos and share them directly with the people you choose.
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
          :model-value="selectedItem === 'opensource'"
          @update:model-value="value => onItemToggle('opensource', value)">
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
          :model-value="selectedItem === 'privacy'"
          @update:model-value="value => onItemToggle('privacy', value)">
          <q-card>
            <q-card-section>
              <div>
                By default, your content is only available to people who have the direct link to your
                channel. It is not indexed by search engines, and the URLs are not easy to guess.
                That said, anyone you share a link with can pass it along, so it is best to share
                only with people you trust.
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
          :model-value="selectedItem === 'production'"
          @update:model-value="value => onItemToggle('production', value)">
          <q-card>
            <q-card-section>
              It is usable today, but it is still primarily a personal project built for me and my family.
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-separator />
        <q-expansion-item
          data-cy="help-item-mobilesupport"
          group="faq"
          label="Does it work on mobile?"
          header-class="text-bold"
          :model-value="selectedItem === 'mobilesupport'"
          @update:model-value="value => onItemToggle('mobilesupport', value)">
          <q-card>
            <q-card-section>
              Fotrino Films works on modern browsers across desktop, tablet, and mobile devices.
              Watching videos on mobile is fully supported. Uploading is more reliable on desktop;
              if you upload from a phone or tablet, you will need to keep the device awake until
              the upload finishes.
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-separator />
        <q-expansion-item
          data-cy="help-item-download"
          group="faq"
          label="Are videos protected by DRM, and can they be downloaded?"
          header-class="text-bold"
          :model-value="selectedItem === 'download'"
          @update:model-value="value => onItemToggle('download', value)">
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
          :model-value="selectedItem === 'buffering'"
          @update:model-value="value => onItemToggle('buffering', value)">
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
          :model-value="selectedItem === 'facebook'"
          @update:model-value="value => onItemToggle('facebook', value)">
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
          :model-value="selectedItem === 'login'"
          @update:model-value="value => onItemToggle('login', value)">
          <q-card>
            <q-card-section>
              At the moment, sign-in relies on third-party identity providers such as Google. That
              approach helps offload account security to providers that are better equipped to handle
              authentication safely. No content or viewing data is shared beyond what is needed to
              support login, and additional sign-in options may be added over time.
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-separator />
        <q-expansion-item
          data-cy="help-item-filesize"
          group="faq"
          label="Is there a file size limit for uploads?"
          header-class="text-bold"
          :model-value="selectedItem === 'filesize'"
          @update:model-value="value => onItemToggle('filesize', value)">
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
        <q-expansion-item
          data-cy="help-item-terminology"
          group="faq"
          label="What do channels, projects, and media mean?"
          header-class="text-bold"
          :model-value="selectedItem === 'terminology'"
          @update:model-value="value => onItemToggle('terminology', value)">
          <q-card>
            <q-card-section>
              <ul>
                <li>
                  A channel is the top-level space where your content lives. Most people only need
                  one, but you can create more than one if you want to keep things separate.
                </li>
                <li>
                  Projects live inside channels and help you organize your media. You can think of
                  them like albums or folders.
                </li>
                <li>
                  Media refers to the individual video or audio files inside a project.
                </li>
              </ul>
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
const selectedItem = computed(() => route.query.item)

onMounted(() => {
  if (!selectedItem.value) {
    router.replace({
      query: {
        ...route.query,
        item: 'about'
      }
    })
  }
})

function onItemToggle(item, isOpen) {
  const nextItem = isOpen ? item : undefined
  if (selectedItem.value === nextItem) return

  const query = { ...route.query }
  if (nextItem) {
    query.item = nextItem
  } else {
    delete query.item
  }

  router.replace({ query })
}
</script>

<style scoped>
.card-terms {
  max-width: 800px;
  width: 100%;
}
</style>
