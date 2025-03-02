<template>
  <div style="max-width: 1023px" class="q-pa-md">
    <q-list bordered>
      <q-expansion-item
        group="faq"
        label="What is Fotrino Films?"
        :default-opened="!$route.query.item || $route.query.item === 'about'"
        header-class="text-bold"
        @show="this.$router.replace({query: { item: 'about' }})"
        @hide="this.$router.replace({query: { }})"
      >
        <q-card>
          <q-card-section>
            Fotrino Films is a platform for hosting video content, allowing users to upload media and share it easily with family and friends.
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-separator />
      <q-expansion-item
        group="faq"
        label="How is it different from other video hosts?"
        header-class="text-bold"
        :default-opened="$route.query.item === 'different'"
        @show="this.$router.replace({query: { item: 'different' }})"
        @hide="this.$router.replace({query: { }})"
      >
        <q-card>
          <q-card-section>
            <div>
              Fotrino Films focuses on private, ad-free video hosting. It’s not built for monetization or content discovery — there are no ads, algorithms, or data tracking. Unlike platforms designed to pay creators for views, Fotrino Films lets you pay to securely host your content and share it directly with people you know.
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-separator />
      <q-expansion-item
        group="faq"
        label="Is Fotrino Films open source?"
        header-class="text-bold"
        :default-opened="$route.query.item === 'opensource'"
        @show="this.$router.replace({query: { item: 'opensource' }})"
        @hide="this.$router.replace({query: { }})"
      >
        <q-card>
          <q-card-section>
            The frontend of Fotrino Films is open source. The backend might be open-sourced in the future.
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-separator />
      <q-expansion-item
        group="faq"
        label="Is my content public or private?"
        header-class="text-bold"
        :default-opened="$route.query.item === 'privacy'"
        @show="this.$router.replace({query: { item: 'privacy' }})"
        @hide="this.$router.replace({query: { }})"
      >
        <q-card>
          <q-card-section>
            <div>
              By default, your content is only accessible to those with the specific link to your channel. It is not indexed by search engines, and the URLs are not easily guessable. To share a specific media file privately, you can use the private link option from the share icon below the video preview, ensuring the rest of your channel remains undisclosed.
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-separator />
      <q-expansion-item
        group="faq"
        label="Is it ready to use?"
        header-class="text-bold"
        :default-opened="$route.query.item === 'production'"
        @show="this.$router.replace({query: { item: 'production' }})"
        @hide="this.$router.replace({query: { }})"
      >
        <q-card>
          <q-card-section>
            At the moment, it's mostly a personal project for me and my family.
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-separator />
      <q-expansion-item
        group="faq"
        label="Does it work on mobile?"
        header-class="text-bold"
        :default-opened="$route.query.item === 'mobilesupport'"
        @show="this.$router.replace({query: { item: 'mobilesupport' }})"
        @hide="this.$router.replace({query: { }})"
      >
        <q-card>
          <q-card-section>
            Yes!
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-separator />
      <q-expansion-item
        group="faq"
        label="Do videos have any DRM?  Can I download a video?"
        header-class="text-bold"
        :default-opened="$route.query.item === 'download'"
        @show="this.$router.replace({query: { item: 'download' }})"
        @hide="this.$router.replace({query: { }})"
      >
        <q-card>
          <q-card-section>
            Videos on Fotrino Films are not protected by DRM. While downloading videos is not officially supported, it is possible for advanced users to do so if they have your private link.
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-separator />
      <q-expansion-item
        group="faq"
        label="What can I do if I'm experiencing buffering or poor video quality?"
        header-class="text-bold"
        :default-opened="$route.query.item === 'buffering'"
        @show="this.$router.replace({query: { item: 'buffering' }})"
        @hide="this.$router.replace({query: { }})"
      >
        <q-card>
          <q-card-section>
            Fotrino Films uses a global CDN and adaptive bitrate streaming to optimize video quality based on your internet speed and device size. If you're experiencing buffering or poor quality, it may be due to a weak signal in your area. Ensure you have a stable connection for the best experience.
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-separator />
      <q-expansion-item
        group="faq"
        label="When I share a link on Facebook, I'm not getting a preview image.  What should I do?"
        header-class="text-bold"
        :default-opened="$route.query.item === 'facebook'"
        @show="this.$router.replace({query: { item: 'facebook' }})"
        @hide="this.$router.replace({query: { }})"
      >
        <q-card>
          <q-card-section>
            Uee the
            <q-btn
              flat
              dense
              icon="fab fa-facebook"
              label="Facebook Link Debugger"
              href="https://developers.facebook.com/tools/debug/"
            />
            to check and manage how your link appears on Facebook. This tool lets you confirm the preview image and other metadata before sharing your link.
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-separator />
      <q-expansion-item
        group="faq"
        label="Why can I only login with Google?"
        header-class="text-bold"
        :default-opened="$route.query.item === 'login'"
        @show="this.$router.replace({query: { item: 'login' }})"
        @hide="this.$router.replace({query: { }})"
      >
        <q-card>
          <q-card-section>
            Third-party identity providers, such as Google, enhance security by protecting you from hackers and other threats. No content or usage data is shared with third parties beyond what’s necessary for login. Additional identity providers, including Apple, GitHub, Microsoft, Live, and Amazon, will be supported in the future.
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-separator />
      <q-expansion-item
        group="faq"
        label="Terminology"
        header-class="text-bold"
        :default-opened="$route.query.item === 'terminology'"
        @show="this.$router.replace({query: { item: 'terminology' }})"
        @hide="this.$router.replace({query: { }})"
      >
        <q-card>
          <q-card-section>
            <ul>
              <li>
                Channels are the highest organizational level, with separate, independent spaces for each. Users typically have one, but multiple channels can be created.
              </li>
              <li>
                Projects are contained within channels and act as organizational folders for your media.
              </li>
              <li>
                Media (videos and audio files) are organized within projects. You can feature certain media for easier navigation.
              </li>
            </ul>
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-separator />
    </q-list>
  </div>
</template>

<script>
export default {
  name: 'Help-Page'
}
</script>
