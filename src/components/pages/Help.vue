<template>
  <div style="max-width: 1023px">
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
            <div>
              Fotrino Films is not designed for monetisation of videos or
              commercial purposes. There are no ads, no algorithms, and no
              content discovery. We also don't segment your users, track users,
              or harvest or sell personal data. You simply upload the content
              you want to share and give the link to people you know.
            </div>
            <div>
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
      >
        <q-card>
          <q-card-section>
            The Fotrino Films frontend is open source and there is a link to the
            source code in the footer. I will likely eventually make the backend
            available as open source as well. I may choose to leave certain
            parts of the platform as proprietary, for instance, any integration
            with a billing provider.
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
            videos is for someone to be given the link.
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
      >
        <q-card>
          <q-card-section>
            The
            <q-btn
              flat
              dense
              icon="facebook"
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
            Instagram, and Microsoft Live.
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
            development and not yet available.
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-separator />
      <q-expansion-item
        group="faq"
        label="Terminology"
        header-class="text-bold"
      >
        <q-card>
          <q-card-section>
            <ul>
              <li>
                The top level of Fotrino Films is a <strong>collection</strong>.
                A <strong>collection</strong> contains <strong>movies</strong>.
              </li>
              <li>
                A <strong>movie</strong> contains <strong>chapters</strong>. A
                <strong>movie</strong> has a poster, a title, and a sub-title.
              </li>
              <li>
                A <strong>chapter</strong> is a playable video or audio file. It
                has a preview, a title, and a description.
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
