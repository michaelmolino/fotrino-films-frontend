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
            Fotrino Films is a video content hosting platform. It is designed
            for users to be able to upload content and share it easily with
            family and friends.
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
              Fotrino Films is not designed for monetisation of videos or
              commercial purposes. There are no ads, no algorithms, and no
              content discovery. We also don't segment your users, track users,
              or harvest or sell personal data. You simply upload the content
              you want to share and give the link to people you know.
            </div>
            <div class="q-py-sm">
              Another way to think of it is most video platforms are designed
              for people who want to get paid to upload content. Fotrino Films
              is for people that want to pay to host their content without ads.
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
            The Fotrino Films frontend is open source and there is a link to the
            source code in the footer. I might open source the backend one day.
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
              By default, your content is available to anyone that has the link to
              your specific channel. Your content should not appear in
              search engines and the URL to your videos is impossible for someone
              to guess or discover via brute force. The only way to discover your
              videos is for someone to be given the link.
            </div>
            <div class="q-py-sm">
              If you'd like to share a specific media file without revealing the
              content from the rest of your channel, you can share a private link
              from the share icon located below the video preview. Important note:
              currently this leaks your channel ID. This will be fixed in the future.
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
            Yes! Mobile users can browse and watch content from their devices. Unfortunately, uploading media from mobile is not yet supported.
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
            Content is not protected by DRM. We do not officially support
            downloading videos, however it is certainly possible for a
            sophisticated user to do so provided the link has been shared with
            them.
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-separator />
      <q-expansion-item
        group="faq"
        label="I'm having problems with buffering or poor quality.  What can I do?"
        header-class="text-bold"
        :default-opened="$route.query.item === 'buffering'"
        @show="this.$router.replace({query: { item: 'buffering' }})"
        @hide="this.$router.replace({query: { }})"
      >
        <q-card>
          <q-card-section>
            All content is hosted with an enterprise storage provider and
            utilises a global CDN to minimise latency and maximise bandwith.
            Videos are streamed using adaptive bitrate streaming to ensure you
            have an optimal viewing experience regardless of the size of your
            device or speed of your internet connection. The resolution will
            change as your conditions change. If you still experience poor
            quality or buffering, you are likely in an area with very poor
            signal.
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
            The
            <q-btn
              flat
              dense
              icon="fab fa-facebook"
              label="Facebook Link Debugger"
              href="https://developers.facebook.com/tools/debug/"
            />
            is a tool tht allows you to manage how your link will appear on
            Facebook. You can use this tool to make sure you're happy with the
            preview before sharing.
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
            Using third party identity providers is safer and helps protect you
            from hackers and other online threats. No information about your
            content or usage of Fotrino Films is shared with third parties other
            than what is required to negotiate the login session. More identity
            providers will be supported in the future including Apple, GitHub,
            Microsoft, Live, and Amazon.
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
                The top level of Fotrino Films is a <strong>channel</strong>.
                If you have more than one channel, they are completely separate from each other.
                Most users will probably have just one channel, but you can make as many as you want.
              </li>
              <li>
                A channel can contain <strong>projects</strong>.
                Think of projects like folders for organising your content.
              </li>
              <li>
                A project contains <strong>media</strong>.
                Fotrino Films supports both Video and Audio files.
                You can select some of your media to be featured media to make navigation easier.
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
