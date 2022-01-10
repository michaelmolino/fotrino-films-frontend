<template>
  <div class="q-pa-md" style="max-width: 720px">
    <q-list bordered>
      <q-expansion-item
        group="faq"
        label="What is Fotrino Films?"
        default-opened
        header-class="text-bold"
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
      >
        <q-card>
          <q-card-section>
            Fotrino Films is not designed for monetisation of videos or
            commercial purposes. There are no ads, no algorithms, and no content
            discovery. We also don't segment your users, track users, or harvest
            or sell personal data. You simply upload the content you want to
            share and give the link to people you know.
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-separator />
      <q-expansion-item
        group="faq"
        label="Is my content public or private?"
        header-class="text-bold"
      >
        <q-card>
          <q-card-section>
            By default, your content is available to anyone that has the link to
            your specific collection of movies. Your movies should not appear in
            search engines and the URL to your videos is impossible for someone
            to guess or discover via brute force. The only way to discover your
            videos is for someone to be given the link. If you want to revoke
            access, you have the ability to change the link however this revokes
            access for everyone - there is no way to selectively allow/disallow
            access (yet!).
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-separator />
      <q-expansion-item
        group="faq"
        label="Is it free?"
        header-class="text-bold"
      >
        <q-card>
          <q-card-section>
            Right now Fotrino Films is not publicly available at all, however,
            when it is, it will not be free to host videos. As it is designed
            for small users and families, pricing will be kept as low as
            possible.
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-separator />
      <q-expansion-item
        group="faq"
        label="Is it ready to use?"
        header-class="text-bold"
      >
        <q-card>
          <q-card-section>
            As a viewer, if you were invited to view a video, you can trust that
            it will be availble for you. It is not ready for arbitrary users to
            upload content. At the moment, it's mostly a personal project for me
            and my family.
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-separator />
      <q-expansion-item
        group="faq"
        label="Does it work on mobile?"
        header-class="text-bold"
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
      >
        <q-card>
          <q-card-section>
            All content is hosted with an enterprise storage provider and
            utilises a global CDN to minimise latency and maximise bandwith.
            Videos are streamed using adaptive bitrate streaming to ensure you
            have an optimal viewing experience regardless of the size of your
            device or speed on your internet connection. The resolution will
            change as your conditions change. If you still experience poor
            quality or buffering, you are likely in an area with very poor
            signal.
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-separator />
      <q-expansion-item
        group="faq"
        label="Why can I only login with Google or Facebook?"
        header-class="text-bold"
      >
        <q-card>
          <q-card-section>
            Using third party identity providers is safer and helps protect you
            from hackers and other online threats. No information about your
            content or usage of Fotrino Films is shared with third parties other
            than what is required to negotiate the login session. More identity
            providers will be supported in the future including Github,
            Instagram, Microsoft Live, and Reddit.
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-separator />
      <q-expansion-item
        group="faq"
        label="What's the point of logging in?"
        header-class="text-bold"
      >
        <q-card>
          <q-card-section>
            There is no need to login to view content - login is only required
            to upload and manage your content. These features are currently in
            development and not yet available to the public.
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-separator />
    </q-list>
  </div>
</template>

<script>
import { useMeta } from 'quasar'
import { setMetaData } from '../javascript/library.js'

export default {
  name: 'Home',
  setup () {
    const metaData = setMetaData(null, null)
    useMeta(() => {
      return metaData
    })
  }
}
</script>
