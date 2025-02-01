<template>
    <span>
        <div v-if="profile?.id" class="q-pa-lg">
            <div v-if="!forceWShow && $q.platform.is.mobile">
                <q-icon name="fas fa-mobile-screen-button" class="q-px-sm" size="sm" /> Mobile upload is not supported and is a longer term goal. Please login from a desktop browser. You can still see the Apple Mac instructions if you really want to.<p />
                <q-btn flat icon="fas fa-exclamation-triangle" size="md" label="Show me!" @click="forceShow = true" />
            </div>
            <div v-if="!forceShow && ($q.platform.is.win || $q.platform.is.linux)" class="q-py-sm">
                <q-icon :name="$q.platform.is.win ? 'fab fa-windows' : 'fab fa-linux'" class="q-px-sm" size="sm" />
                {{ $q.platform.is.win ? 'Windows' : 'Linux' }} is not yet supported, but will be soon.
                Advanced users can adapt the steps from the Mac instructions.
                Would you like to display them?<p />
                <q-btn flat icon="fas fa-exclamation-triangle" size="md" label="Show me!" @click="forceShow = true" />
            </div>
            <div v-if="!$q.platform.is.linux && !$q.platform.is.win && !$q.platform.is.mac && !$q.platform.is.mobile" class="q-py-sm">
                <q-icon name="fas fa-bug" /> Unknown platform. Upload is not supported.
            </div>

            <div v-if="$q.platform.is.mac || forceShow">
                <q-item>
                    <q-item-section side>
                        <q-icon name="fab fa-apple" size="xl" />
                        <q-icon name="fas fa-exclamation-triangle" size="lg" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label class="text-h4">Instructions for Apple Mac</q-item-label>
                        <q-item-label>Uploading media is an advanced operation; you should be comfortable using the terminal and understand what each step does.</q-item-label>
                    </q-item-section>
                </q-item>
                <div class="row q-py-sm">
                  <QCodeBlock
                      :theme="$q.dark.isActive ? 'nightOwl' : 'github'"
                      :code="code1"
                      language="bash"
                      numbered
                      showHeader
                      file-name="Install Dependencies"
                      style="width: 100%;"
                  />
                </div>
                <div class="q-pa-sm">Create a folder for your project such as <span class="inline-code">mkdir -p ~/fotrino/Collection</span>.</div>
                <div class="q-pa-sm">
                    Add the following media files to your new folder. The naming is important; you'll be able to set the display names later. This will create a new collection. Support to add a new chapter to an existing movie or a new movie to an existing collection will be added later.
                    <q-list style="width: 100%; max-width: 480px;" dense bordered class="q-my-md">
                        <q-item>
                            <q-item-section class="text-weight-bold text-center">Description</q-item-section>
                            <q-item-section class="text-weight-bold text-center">Aspect Ratio</q-item-section>
                            <q-item-section class="text-weight-bold text-center">Filename</q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section>Collection Cover</q-item-section>
                            <q-item-section>Square</q-item-section>
                            <q-item-section><span class="inline-code">Collection.jpg</span></q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section>Movie Poster</q-item-section>
                            <q-item-section>2:3 (portrait)</q-item-section>
                            <q-item-section><span class="inline-code">Movie.jpg</span></q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section>Media File 1</q-item-section>
                            <q-item-section>16:9 (landscape)</q-item-section>
                            <q-item-section><span class="inline-code">Media1.mp4</span></q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section>Media Preview 1</q-item-section>
                            <q-item-section>16:9 (landscape)</q-item-section>
                            <q-item-section><span class="inline-code">Media1.jpg</span></q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section>Media File 2 (...)</q-item-section>
                            <q-item-section>16:9 (landscape)</q-item-section>
                            <q-item-section><span class="inline-code">Media2.mp4</span></q-item-section>
                        </q-item>
                        <q-item>
                            <q-item-section>Media Preview 2 (...)</q-item-section>
                            <q-item-section>16:9 (landscape)</q-item-section>
                            <q-item-section><span class="inline-code">Media2.jpg</span></q-item-section>
                        </q-item>
                    </q-list>
                </div>
                <div class="q-pa-sm">Add a file to your folder called <span class="inline-code">Collection.json</span> with the following contents and customise as appropriate.</div>
                    <QCodeBlock
                        :theme="$q.dark.isActive ? 'nightOwl' : 'github'"
                        :code="code2"
                        language="json"
                        numbered
                        showHeader
                        file-name="Collection Descriptor"
                        style="width: 100%;"
                    />
                    <QCodeBlock
                        :theme="$q.dark.isActive ? 'nightOwl' : 'github'"
                        code="~/Workspace/fotrino-films-uploader/fotrino-upload.sh ~/fotrino/Collection"
                        language="bash"
                        numbered
                        showHeader
                        file-name="Media Prepare / Upload"
                        style="width: 100%;"
                    />
                    <div class="q-pa-sm">
                      The first time you run the above script, you'll need to provide an API token. Please keep it secret. It can be used to access your account.
                    </div>
                    <div class="q-pa-sm">
                      <q-btn flat icon="fas fa-key" size="sm" label="Copy secret token to clipboard!" @click="getToken()" />
                    </div>
            </div>
        </div>
        <NothingText v-else />
    </span>
  </template>

<script>
import { defineAsyncComponent } from 'vue'
import { Notify, copyToClipboard } from 'quasar'
import { CodeBlock } from 'vuejs-code-block'

export default {
  name: 'UploadMedia',

  components: {
    NothingText: defineAsyncComponent(() =>
      import('@components/shared/NothingText.vue')
    ),
    QCodeBlock: CodeBlock
  },

  data() {
    return {
      forceShow: false,
      code1: `xcode-select --install
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" # Requires sudo
brew install coreutils python ffmpeg graphicsmagick gnu-tar git exiftool curl mediainfo
git clone https://github.com/vincentbernat/video2hls.git ~/Workspace/video2hls # Credit to Vincent Bernat
git clone https://github.com/michaelmolino/fotrino-films-uploader.git ~/Workspace/fotrino-films-uploader # This is still under development`,
      code2: `{
  "title": "My New Collection",
  "created": "2025-01-01T12:00:00",
  "movies": [
    {
      "title": "My Movie Title",
      "subtitle": "There can be multiple media files (chapters) within a movie",
      "created": "2025-01-01T12:00:00",
      "chapters": [
        {
          "title": "My Media Title",
          "description_unsafe": "You can use some HTML tags here - p, br, strong, i.",
          "type": "application/vnd.apple.mpegurl",
          "main": true,
          "created": "2025-01-01T12:00:00"
        },
        {
          "title": "Another Media Title",
          "description_unsafe": "Add or delete from this array as appropriate.",
          "type": "application/vnd.apple.mpegurl",
          "main": true,
          "created": "2025-01-01T12:00:00"
        }
      ]
    }
  ]
}`
    }
  },

  computed: {
    profile: {
      get() {
        return this.$store.state.account.profile
      }
    }
  },

  methods: {
    getToken() {
      this.$store.cache.dispatch('account/getToken').then(_token => {
        copyToClipboard(_token)
          .then(() => {
            Notify.create({
              message: 'Secret token copied to clipboard!',
              color: 'accent',
              icon: 'content_paste',
              timeout: 0,
              actions: [{ label: 'Clear Clipboard', color: 'white', handler: () => { copyToClipboard('Secret token cleared from clipboard!') } }]
            })
          })
      })
    }
  }
}
</script>

<style>
.inline-code {
    display: inline-block;
    padding: 4px 6px;
    font-size: 16px;
    line-height: 16px;
    border-radius: 4px;
    font-family: inherit;
    color: #E01E5A;
    vertical-align: baseline;
    border: 1px solid currentColor;
}
</style>
