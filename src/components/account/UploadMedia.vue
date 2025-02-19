<template>
  <div v-if="profile?.id" class="q-pa-md">
    <div v-if="!$q.platform.is.mobile && !$q.platform.is.desktop">
      Unsupported platform.
    </div>
    <div v-if="$q.platform.is.mobile">
      Mobile upload is not supported. This is a longer term goal.
    </div>
    <div v-if="$q.platform.is.desktop">
      <q-item>
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
            label="Install Dependencies"
            caption="Click to read before continuing."
          >
            <q-card>
              <q-card-section>
                <QCodeBlock
                  :theme="$q.dark.isActive ? 'nightOwl' : 'github'"
                  :code="$q.platform.is.mac ? codeMac.concat(codeCommon).join('\n') : $q.platform.is.win ? codeWin.concat(this.codeCommon).join('\n') : codeLinux.concat(this.codeCommon).join('\n')"
                  language="bash"
                  numbered
                  showHeader
                  style="width: 100%;"
                />
              </q-card-section>
            </q-card>
          </q-expansion-item>
          <div class="q-py-md">
            A channel serves as the highest level of organization for your media. Each channel operates independently; media within one channel is neither accessible nor discoverable from another.
            For more help, see <q-btn flat icon="fas fa-circle-question" label="Terminology" to="/help?item=terminology"/>.
          </div>
          <div class="row">
            <div class="q-pa-md" style="width: 50%;">
              <q-select outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" label="Channel"
                v-model="modelChannel" :options="channels.map(({ uuid, title }) => ({ value: uuid, label: title })).concat({ value: 0, label: 'New...' })"
                class="q-pb-md"
                />
              <q-skeleton v-if ="!modelChannel" style="width: 250px; height: 250px;" />
              <q-img v-if="modelChannel && modelChannel.value !== 0" :src="channels.find(ch => ch.uuid === modelChannel.value).cover" style="width: 250px" :ratio="1 / 1" fit="cover" />
              <q-img v-if="modelChannel && modelChannel.value === 0 && coverImgChoice === 'profile'" :src="profile.profile_pic" style="width: 250px" :ratio="1 / 1" fit="cover" />
              <q-skeleton v-if ="modelChannel && modelChannel.value === 0 && coverImgChoice === 'new' && !fileCover" style="width: 250px; height: 250px;" />
              <q-img v-if="modelChannel && modelChannel.value === 0 && coverImgChoice === 'new' && fileCover" :src="fileCoverPreview" style="width: 250px" :ratio="1 / 1" fit="cover" />
            </div>
            <div class="q-pa-md" style="width: 50%;">
              <span v-if="modelChannel?.value === 0">
                <q-input outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
                  v-model="modelChannelNew.title" label="Channel Title"
                />
                  <q-radio v-model="coverImgChoice" val="profile" label="Profile Photo" color="accent" /><br />
                  <q-radio v-model="coverImgChoice" val="new" label="Upload Photo" color="accent" /><br />
                  <q-file v-if="coverImgChoice === 'new'" outlined v-model="fileCover" accept="image/*" class="q-py-md" color="accent" @update:model-value="(file) => handleFile(file, 'cover')">
                    <template v-slot:prepend>
                      <q-icon name="image" @click.stop.prevent />
                    </template>
                    <template v-slot:append>
                      <q-icon name="close" @click.stop.prevent="fileCover = null" class="cursor-pointer" />
                    </template>
                  </q-file>
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
            Projects are the next level of organization for your media. Each channel can contain multiple projects.
          </div>
          <div class="row">
            <div class="q-pa-md" style="width: 50%;">
              <q-select outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" label="Project"
                v-model="modelProject" :options="projects.map(({ id, title }) => ({ value: id, label: title })).concat({ value: 0, label: 'New...' })"
                class="q-pb-md"
              />
              <q-skeleton v-if ="!modelProject" style="width: 250px; height: 375px;" />
              <q-img v-if="modelProject && modelProject.value !== 0" :src="projects.find(p => p.id === modelProject.value).poster" style="width: 250px" :ratio="2 / 3" fit="cover" />
              <q-img v-if="modelProject && modelProject.value === 0 && posterImgChoice === 'default'" src="/images/poster.png" style="width: 250px" :ratio="2 / 3" fit="cover" />
              <q-skeleton v-if ="modelProject && modelProject.value === 0 && posterImgChoice === 'new' && !filePoster" style="width: 250px; height: 375px;" />
              <q-img v-if="modelProject && modelProject.value === 0 && posterImgChoice === 'new' && filePoster" :src="filePosterPreview" style="width: 250px" :ratio="2 / 3" fit="cover" />
            </div>
            <div class="q-pa-md" style="width: 50%;">
              <span v-if="modelProject?.value === 0">
                <q-input outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
                  v-model="modelProjectNew.title" label="Project Title"
                />
                <q-input outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
                  v-model="modelProjectNew.subtitle" label="Project SubTitle"
                />
                  <q-radio v-model="posterImgChoice" val="default" label="Default" color="accent" /><br />
                  <q-radio v-model="posterImgChoice" val="new" label="Upload Photo" color="accent" />
                  <q-file v-if="posterImgChoice === 'new'" outlined v-model="filePoster" accept="image/*" class="q-py-md" color="accent" @update:model-value="(file) => handleFile(file, 'poster')">
                    <template v-slot:prepend>
                      <q-icon name="image" @click.stop.prevent />
                    </template>
                    <template v-slot:append>
                      <q-icon name="close" @click.stop.prevent="filePoster = null" class="cursor-pointer" />
                    </template>
                  </q-file>
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
            Completing this form will create a <span class="inline-code">pending</span> record of the media on our servers. Once you click <span class="inline-code">Finish</span> you will receive instructions on how to upload your media.
          </div>
          <div class="row">
            <div class="q-pa-md" style="width: 50%;">
              <q-input outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
                v-model="modelMediaNew.title" label="Title"
              />
              <q-input outlined autogrow :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
                v-model="modelMediaNew.description" label="Description - p, br, strong, and i tags allowed"
              />
              <q-skeleton v-if ="!filePreview" style="width: 250px; height: 141px;" />
              <q-img v-if="filePreview" :src="filePreviewPreview" style="width: 250px" :ratio="16 / 9" fit="cover" class="q-pa-md" />
            </div>
            <div style="width: 50%;">
              <q-file outlined v-model="filePreview" accept="image/*" class="q-py-md" color="accent" @update:model-value="(file) => handleFile(file, 'preview')">
                <template v-slot:prepend>
                  <q-icon name="image" @click.stop.prevent />
                </template>
                <template v-slot:append>
                  <q-icon name="close" @click.stop.prevent="filePreview = null" class="cursor-pointer" />
                </template>
              </q-file>
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
          <div class="q-pa-sm">Run the upload script.</div>
          <QCodeBlock
              :theme="$q.dark.isActive ? 'nightOwl' : 'github'"
              :code="script"
              language="bash"
              numbered
              style="width: 100%;"
          />
          <div class="q-pa-sm">When prompted, copy/past the below JSON. This contains secrets that can be used to access your account - DO NOT SHARE WITH ANYONE.</div>
        <QCodeBlock :theme="$q.dark.isActive ? 'nightOwl' : 'github'" language="json" :code="secret" showHeader/>
      </q-step>

        <template v-slot:navigation>
          <q-stepper-navigation>
            <q-btn v-if="step < 4" flat @click="$refs.stepper.next()" :label="step <3 ? 'Next' : 'Finish'" :disabled="(step==4 ? true : false) || !next" />
          </q-stepper-navigation>
        </template>
      </q-stepper>
    </div>
  </div>
  <div v-else>
    <NothingText text="You must be logged in to see this page" />
  </div>
</template>

<script>
import { defineAsyncComponent, ref } from 'vue'
import { CodeBlock } from 'vuejs-code-block'
import axios from 'axios'

import imageCompression from 'browser-image-compression'

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

      fileCover: ref(null),
      fileCoverPreview: ref(null),
      filePoster: ref(null),
      filePosterPreview: ref(null),
      filePreview: ref(null),
      filePreviewPreview: ref(null),

      coverImgChoice: ref('profile'),
      posterImgChoice: ref('default'),
      previewImgChoice: ref('default'),

      uploadFiles: [
        { type: 'cover', file: null, hash: null },
        { type: 'poster', file: null, hash: null },
        { type: 'preview', file: null, hash: null }
      ],

      secret: '',
      codeCommon: [
        'git clone https://github.com/vincentbernat/video2hls.git ~/Workspace/video2hls # Credit to Vincent Bernat',
        'git clone https://github.com/michaelmolino/fotrino-films-uploader.git ~/Workspace/fotrino-films-uploader'
      ],
      codeMac: [
        '# If you don\'t already have Brew installed, uncomment the following line. Requires sudo.',
        '# /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
        'brew install coreutils gnu-tar git python ffmpeg jq curl'
      ],
      codeWin: [
        '# I haven\'t tried this on Windows, but you can try using Chocolatey from PowerShell.',
        'Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))',
        'choco install coreutils gnuwin32-gtar git python ffmpeg jq curl'
      ].join('\n'),
      codeLinux: [
        '# Ubuntu',
        'sudo apt update && sudo apt install git python ffmpeg jq curl',
        '# Fedora, CentOS, RHEL',
        '# sudo dnf install git python ffmpeg jq curl',
        '# Arch',
        '# sudo pacman -S git python ffmpeg jq curl'
      ].join('\n'),
      script: [
        'cd ~/Workspace/fotrino-films-uploader/',
        './fotrino-upload.sh /path/to/your/media.{mp4,mov,webm}'
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
        this.$store.dispatch('channel/postUpload', this.payload).then(async _response => {
          this.secret = JSON.stringify(
            {
              userToken: _response.userToken,
              uploadToken: _response.uploadToken
            }
          )
          const uploadUrls = _response.upload_Urls
          // Show Spinner
          for (const [type, url] of Object.entries(uploadUrls)) {
            const file = this.uploadFiles.find(f => f.type === type).file
            try {
              await axios.put(url, file, {
                headers: {
                  'Content-Type': file.type
                }
              })
            } catch (error) {
              console.error(`Error uploading ${type}:`, error)
            }
          }
          // Hide Spinner
        })
          .catch(err => {
            console.log(err)
          })
      }
    },
    fileCover(newFile) {
      if (newFile) {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.fileCoverPreview = e.target.result
        }
        reader.readAsDataURL(newFile)
      } else {
        this.fileCoverPreview = null
      }
    },
    filePoster(newFile) {
      if (newFile) {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.filePosterPreview = e.target.result
        }
        reader.readAsDataURL(newFile)
      } else {
        this.filePosterPreview = null
      }
    },
    filePreview(newFile) {
      if (newFile) {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.filePreviewPreview = e.target.result
        }
        reader.readAsDataURL(newFile)
      } else {
        this.filePreviewPreview = null
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
          if (this.coverImgChoice === 'new') {
            obj.coverType = 'object'
            obj.coverObject = 'covers/' + this.uploadFiles.find(f => f.type === 'cover').hash + '.jpg'
          } else {
            obj.coverType = 'url'
            obj.coverUrl = this.profile.profile_pic
          }
        }
        obj.project = {}
        if (this.modelProject.value !== 0) {
          obj.project.id = this.modelProject.value
        } else {
          obj.project.title = this.modelProjectNew.title
          obj.project.subtitle = this.modelProjectNew.subtitle
          if (this.posterImgChoice === 'new') {
            obj.project.posterType = 'object'
            obj.project.posterObject = 'posters/' + this.uploadFiles.find(f => f.type === 'poster').hash + '.jpg'
          } else {
            obj.project.posterType = 'url'
            obj.project.posterUrl = '/images/poster.png'
          }
        }
        obj.project.media = {}
        obj.project.media.title = this.modelMediaNew.title
        obj.project.media.description = this.modelMediaNew.description
        obj.project.media.main = this.modelMediaNew.main
        obj.project.media.previewObject = 'previews/' + this.uploadFiles.find(f => f.type === 'preview').hash + '.jpg'
        return obj
      }
    },
    next: {
      get() {
        switch (this.step) {
          case 1:
            return this.modelChannel?.value || (this.modelChannelNew.title && (this.fileCover || this.coverImgChoice === 'profile'))
          case 2:
            return this.modelProject?.value || (this.modelProjectNew.title && (this.filePoster || this.posterImgChoice === 'default'))
          case 3:
            return this.modelMediaNew.title && this.filePreview
          case 4:
            return false
          default:
            return false
        }
      }
    }
  },

  methods: {
    async handleFile(file, resourceType) {
      if (!file) return

      try {
        const options = {
          fileType: 'image/jpeg',
          maxWidthOrHeight: 720,
          useWebWorker: true
        }
        const compressedFile = await imageCompression(file, options)
        this.uploadFiles.find(f => f.type === resourceType).file = compressedFile

        const arrayBuffer = await compressedFile.arrayBuffer()
        const hash = await this.computeMD5(arrayBuffer)
        this.uploadFiles.find(f => f.type === resourceType).hash = hash
      } catch (error) {
        console.error('Error processing file:', error)
      }
    },

    async computeMD5(buffer) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
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
