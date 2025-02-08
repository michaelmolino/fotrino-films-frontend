<template>
  <div v-if="profile?.id">
    <div v-if="!$q.platform.is.mobile && !$q.platform.is.desktop">
      Unsupported platform.
    </div>
    <div v-if="$q.platform.is.mobile">
      Mobile upload is not supported. This is a longer term goal.
    </div>
    <div v-if="$q.platform.is.desktop">
      <q-item class="q-pa-md">
          <q-item-section side>
              <q-icon name="fas fa-cloud-arrow-up" size="xl" />
          </q-item-section>
          <q-item-section>
              <q-item-label class="text-h4">Upload Media</q-item-label>
              <q-item-label>Uploading media is an advanced operation; you should be comfortable using the terminal.</q-item-label>
          </q-item-section>
      </q-item>
      <q-stepper
        v-model="step"
        ref="stepper"
        flat
        bordered
        active-color="info"
        :inactive-color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
        done-color="positive"
      >
        <q-step
          :name="1"
          title="Channel"
          icon="fas fa-video"
          :done="step > 1"
        >
          <div class="q-pb-md">
            <strong>Note</strong>: This process is currently intended for advanced users but will be made more user-friendly in the future.
          </div>
          <q-expansion-item
            expand-separator
            :icon="$q.platform.is.mac ? 'fab fa-apple' : $q.platform.is.win ? 'fab fa-windows' : 'fab fa-linux'"
            label="Dependencies"
            caption="Click to read before continuing."
          >
            <q-card>
              <q-card-section>
                <QCodeBlock
                  :theme="$q.dark.isActive ? 'nightOwl' : 'github'"
                  :code="$q.platform.is.mac ? codeMac : $q.platform.is.win ? codeWin : codeLinux"
                  language="bash"
                  numbered
                  showHeader
                  style="width: 100%;"
                />
              </q-card-section>
            </q-card>
          </q-expansion-item>
          <div class="q-py-md">
            A channel represents the highest level of organization for your media. If you intend to upload all of your videos in one location then you will only ever need a single channel. If you create multiple channels they will remain independent of one another; media from one channel will not be accessible or discoverable from another.
            For more help, see <q-btn flat icon="fas fa-circle-question" label="Terminology" to="/help?item=terminology"/>.
          </div>
          <div class="row">
            <div class="q-pa-md" style="width: 50%;">
              <q-select outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" label="Channel"
                v-model="modelChannel" :options="channels.map(({ uuid, title }) => ({ value: uuid, label: title })).concat({ value: 0, label: 'New...' })"
              />
            </div>
            <div class="q-pa-md" style="width: 50%;">
              <span v-if="modelChannel?.value === 0">
                <q-input outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
                  v-model="modelChannelNew.title" label="Channel Title"
                />
              </span>
            </div>
          </div>
        </q-step>

        <q-step
          :name="2"
          title="Project"
          icon="fas fa-film"
          :done="step > 2"
        >
          <div>
            Projects are the next organizational level for your media. Each channel can include multiple projects, with each project containing at least one media file.
          </div>
          <div class="row">
            <div class="q-pa-md" style="width: 50%;">
              <q-select outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" label="Project"
                v-model="modelProject" :options="projects.map(({ id, title }) => ({ value: id, label: title })).concat({ value: 0, label: 'New...' })"
              />
            </div>
            <div class="q-pa-md" style="width: 50%;">
              <span v-if="modelProject?.value === 0">
                <q-input outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
                  v-model="modelProjectNew.title" label="Project Title"
                />
                <q-input outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
                  v-model="modelProjectNew.subtitle" label="Project SubTitle"
                />
              </span>
            </div>
          </div>
        </q-step>

        <q-step
          :name="3"
          title="Media"
          icon="fas fa-file-video"
          :done="step > 3"
        >
          <div>
            Media can be either video or audio. Completing this form will create a <span class="inline-code">pending</span> record of the media on our servers. Once you click <span class="inline-code">Finish</span> you will receive instructions on how to upload your media from your desktop computer.
          </div>
          <div class="row">
            <div class="q-pa-md" style="width: 50%;">
              <q-input outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
                v-model="modelMediaNew.title" label="Title"
              />
              <q-input outlined autogrow :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
                v-model="modelMediaNew.description" label="Description - p, br, strong, and i tags allowed"
              />
              <q-checkbox outlined v-model="modelMediaNew.main" label="Featured" />
            </div>
          </div>
        </q-step>

        <q-step
          :name="4"
          title="Upload"
          caption="via Terminal"
          icon="fas fa-terminal"
          active-icon="fas fa-terminal"
        >
          <div class="q-pa-sm">Create a folder for your media such as <span class="inline-code">mkdir -p ~/fotrino/Media</span>.</div>
          <div class="q-pa-sm">
            Add the following media files to your new folder.
            <q-list style="width: 100%; max-width: 720px;" dense bordered class="q-my-md">
              <q-item>
                <q-item-section class="text-weight-bold text-center">Description</q-item-section>
                <q-item-section class="text-weight-bold text-center">Aspect Ratio</q-item-section>
                <q-item-section class="text-weight-bold text-center">Filename</q-item-section>
              </q-item>
              <q-item v-if="modelChannel.value === 0">
                <q-item-section>Channel Cover</q-item-section>
                <q-item-section>Square</q-item-section>
                <q-item-section><span class="inline-code">Channel.jpg</span></q-item-section>
              </q-item>
              <q-item v-if="modelProject.value === 0">
                <q-item-section>Project Poster</q-item-section>
                <q-item-section>2:3 (portrait)</q-item-section>
                <q-item-section><span class="inline-code">Project.jpg</span></q-item-section>
              </q-item>
              <q-item>
                <q-item-section>Media File</q-item-section>
                <q-item-section>16:9 (landscape)</q-item-section>
                <q-item-section><span class="inline-code">Media.(mp4|mov|mp3)</span></q-item-section>
              </q-item>
              <q-item>
                <q-item-section>Media Preview</q-item-section>
                <q-item-section>16:9 (landscape)</q-item-section>
                <q-item-section><span class="inline-code">Preview.(jpg|png)</span></q-item-section>
              </q-item>
            </q-list>
          </div>
          <div class="q-pa-sm">Run the upload script.</div>
          <QCodeBlock
              :theme="$q.dark.isActive ? 'nightOwl' : 'github'"
              code="~/Workspace/fotrino-films-uploader/fotrino-upload.sh ~/fotrino/Media"
              language="bash"
              numbered
              style="width: 100%;"
          />
          <div class="q-pa-sm">When prompted, copy/past the below JSON. This contains secrets that can be used to access your account - DO NOT SHARE WITH ANYONE.</div>
        <QCodeBlock :theme="$q.dark.isActive ? 'nightOwl' : 'github'" language="json" :code="secret" showHeader/>
      </q-step>

        <template v-slot:navigation>
          <q-stepper-navigation>
            <!-- <q-btn flat @click="$refs.stepper.previous()" label="Back" :disabled="step==1 ? true : false" /> -->
            <q-btn v-if="step < 4" flat @click="$refs.stepper.next()" :label="step <3 ? 'Next' : 'Finish'" :disabled="(step==4 ? true : false) || !next" />
          </q-stepper-navigation>
        </template>
      </q-stepper>
    </div>
  </div>
  <div v-else>
    <NothingText />
  </div>
</template>

<script>
import { defineAsyncComponent, ref } from 'vue'
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

  created: function() {
    this.$store.cache.dispatch('channel/getChannels').catch(error => { console.log(error) })
  },

  data() {
    return {
      step: ref(1),
      modelChannel: ref(null),
      modelChannelNew: ref({ title: null }),
      modelProject: ref(null),
      modelProjectNew: ref({ title: null, subtitle: null }),
      projects: [],
      modelMediaNew: ref({ title: null, description: null, main: true }),
      secret: '',
      codeMac: [
        '# If you don\'t already have Brew installed, uncomment the following line. Requires sudo.',
        '# /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
        'brew install coreutils gnu-tar git python ffmpeg graphicsmagick exiftool mediainfo jq curl',
        'git clone https://github.com/vincentbernat/video2hls.git ~/Workspace/video2hls # Credit to Vincent Bernat',
        'git clone https://github.com/michaelmolino/fotrino-films-uploader.git ~/Workspace/fotrino-films-uploader # This is still under development'
      ].join('\n'),
      codeWin: [
        '# I haven\'t tried this on Windows, but you can try using Chocolatey from PowerShell.',
        'Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))',
        'choco install coreutils gnuwin32-gtar git python ffmpeg graphicsmagick exiftool mediainfo jq curl',
        'git clone https://github.com/vincentbernat/video2hls.git ~/Workspace/video2hls # Credit to Vincent Bernat',
        'git clone https://github.com/michaelmolino/fotrino-films-uploader.git ~/Workspace/fotrino-films-uploader # This is still under development'
      ].join('\n'),
      codeLinux: [
        '# Ubuntu',
        'sudo apt update && sudo apt install git python ffmpeg graphicsmagick exiftool mediainfo jq curl',
        '# Fedora, CentOS, RHEL',
        '# sudo dnf install git python ffmpeg graphicsmagick exiftool mediainfo jq curl',
        '# Arch',
        '# sudo pacman -S git python ffmpeg graphicsmagick exiftool mediainfo jq curl',
        'git clone https://github.com/vincentbernat/video2hls.git ~/Workspace/video2hls # Credit to Vincent Bernat',
        'git clone https://github.com/michaelmolino/fotrino-films-uploader.git ~/Workspace/fotrino-films-uploader # This is still under development'
      ].join('\n')
    }
  },

  watch: {
    modelChannel(c) {
      if (c && c.value !== 0) {
        this.$store.cache
          .dispatch('channel/getChannel', c.value)
          .then(_channel => {
            this.projects = _channel.projects
          })
          .catch(() => {
            this.modelChannel = null
          })
      } else {
        this.projects = []
      }
    },
    step(s) {
      if (s === 4) {
        this.$store.dispatch('channel/postUpload', this.payload).then(_response => {
          this.secret = JSON.stringify(_response)
        })
          .catch(err => {
            console.log(err)
          })
      }
    }
  },

  computed: {
    profile: {
      get() {
        return this.$store.state.account.profile
      }
    },
    channels: {
      get() {
        return this.$store.state.channel.channels
      }
    },
    payload: {
      get() {
        const obj = {}
        if (this.modelChannel.value !== 0) {
          obj.uuid = this.modelChannel.value
        } else {
          obj.title = this.modelChannelNew.title
        }
        obj.project = {}
        if (this.modelProject.value !== 0) {
          obj.project.id = this.modelProject.value
        } else {
          obj.project.title = this.modelProjectNew.title
          obj.project.subtitle = this.modelProjectNew.subtitle
        }
        obj.project.media = {}
        obj.project.media.title = this.modelMediaNew.title
        obj.project.media.description = this.modelMediaNew.description
        obj.project.media.main = this.modelMediaNew.main
        return obj
      }
    },
    next: {
      get() {
        switch (this.step) {
          case 1:
            return this.modelChannel?.value || this.modelChannelNew.title
          case 2:
            return this.modelProject?.value || this.modelProjectNew.title
          case 3:
            return this.modelMediaNew.title
          case 4:
            return false
          default:
            return false
        }
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
              icon: 'far fa-clipboard',
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
