<template>
  <div v-if="profile?.id" class="q-pa-md">
    <q-item class="q-pb-md">
        <q-item-section side>
            <q-icon name="fas fa-cloud-arrow-up" size="xl" />
        </q-item-section>
        <q-item-section>
            <q-item-label class="text-h4">Upload Media</q-item-label>
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
      :vertical="$q.screen.lt.md"
    >
      <q-step
        :name="1"
        title="Channel"
        icon="fas fa-video"
        :done="step > 1"
      >
        <div class="row">
          <div class="col-xs-12 col-md-6 q-pa-sm">
            <q-select outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" label="Channel"
              v-model="payload.uuid"
              :options="channels.map(({ uuid, title }) => ({ value: uuid, label: title })).concat({ value: 0, label: 'New...' })"
              class="q-pb-lg"
              />
            <q-avatar size="150px" class="q-pl-lg">
              <q-skeleton v-if ="!payload.uuid || (payload.uuid && payload.uuid.value === 0 && payload.coverType === 'new' && !coverFile)" style="width: 250px; height: 250px;" />
              <q-img v-if="payload.uuid && payload.uuid.value !== 0" :src="channels.find(ch => ch.uuid === payload.uuid.value).cover" style="width: 250px" :ratio="1 / 1" fit="cover" />
              <q-img v-if="payload.uuid && payload.uuid.value === 0" :src="payload.coverType === 'profile' ? profile.profile_pic : coverThumb" style="width: 250px" :ratio="1 / 1" fit="cover" />
            </q-avatar>
          </div>
          <div class="col-xs-12 col-md-6 q-pa-sm">
            <span v-if="payload.uuid?.value === 0">
              <q-input outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
                v-model="payload.title" label="Channel Title"
              />
                <q-radio v-model="payload.coverType" val="profile" label="Profile Photo" color="accent" /><br />
                <q-radio v-model="payload.coverType" val="new" label="Upload Photo" color="accent" class="q-pb-md" /><br />
                <q-file v-if="payload.coverType === 'new'" label = "Channel Cover (Image)" appendoutlined v-model="coverFile" accept="image/*" color="accent" @update:model-value="(file) => handleFile(file, 'cover')">
                  <template v-slot:prepend>
                    <q-icon name="image" @click.stop.prevent />
                  </template>
                  <template v-slot:append>
                    <q-icon name="close" @click.stop.prevent="coverFile = null" class="cursor-pointer" />
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
        <div class="row">
          <div class="col-xs-12 col-md-6 q-pa-sm">
            <q-select outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" label="Project"
              v-model="payload.project.id"
              :options="projects.map(({ id, title }) => ({ value: id, label: title })).concat({ value: 0, label: 'New...' })"
              class="q-pb-md"
            />
            <div style="width: 250px">
              <ProjectPoster :project = "project" />
            </div>
          </div>
          <div class="col-xs-12 col-md-6 q-pa-sm">
            <span v-if="payload.project.id?.value === 0">
              <q-input outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
                v-model="payload.project.title" label="Project Title"
              />
              <q-input outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
                v-model="payload.project.subtitle" label="Project SubTitle"
              />
                <q-radio v-model="payload.project.posterType" val="default" label="Default" color="accent" /><br />
                <q-radio v-model="payload.project.posterType" val="new" label="Upload Photo" color="accent" />
                <q-file v-if="payload.project.posterType === 'new'" label = "Profile Poster (Image)" outlined v-model="posterFile" accept="image/*" class="q-py-md" color="accent" @update:model-value="(file) => handleFile(file, 'poster')">
                  <template v-slot:prepend>
                    <q-icon name="image" @click.stop.prevent />
                  </template>
                  <template v-slot:append>
                    <q-icon name="close" @click.stop.prevent="posterFile = null" class="cursor-pointer" />
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
        <div class="row">
          <div class="col-xs-12 col-md-6 q-pa-sm">
            <q-input outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
              v-model="payload.project.media.title" label="Title"
            />
            <q-input outlined autogrow :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
              v-model="payload.project.media.description" label="Description - p, br, strong, and i tags allowed"
            />
            <q-checkbox outlined v-model="payload.project.media.main" label="Featured" class="q-pb-md" />
            <div class="row">
              <div style="width: 250px">
                <MediaPreview
                  :media="media"
                />
              </div>
              <div class="q-pa-md flex items-center">
                <q-btn v-if="payload.project.media.previewType === 'frame' && mediaFile" icon="fas fa-arrows-rotate" flat size="xl" @click="counter++" />
              </div>
            </div>
          </div>
          <div class="col-xs-12 col-md-6 q-pa-sm">
            <q-file label = "Media (Video)" outlined v-model="mediaFile" accept="video/*" max-file-size="5368709120" class="q-pb-md" color="accent" @update:model-value="(file) => handleFile(file, 'media')">
              <template v-slot:prepend>
                <q-icon name="movie" @click.stop.prevent />
              </template>
              <template v-slot:append>
                <q-icon name="close" @click.stop.prevent="mediaFile = null" class="cursor-pointer" />
              </template>
            </q-file>
            <q-radio v-model="payload.project.media.previewType" val="frame" label="Video Frame" color="accent" /><br />
            <q-radio v-model="payload.project.media.previewType" val="new" label="Upload Photo" color="accent" />
            <q-file v-if="payload.project.media.previewType === 'new'" label = "Media Preview (Image)" outlined v-model="previewFile" accept="image/*" class="q-pb-md" color="accent" @update:model-value="(file) => handleFile(file, 'preview')">
              <template v-slot:prepend>
                <q-icon name="image" @click.stop.prevent />
              </template>
              <template v-slot:append>
                <q-icon name="close" @click.stop.prevent="previewFile = null" class="cursor-pointer" />
              </template>
            </q-file>
          </div>
        </div>
      </q-step>

      <q-step
        :name="4"
        title="Upload"
        icon="fas fa-cloud-arrow-up"
        active-icon="fa fa-gears"
        :done="step > 4"
      >
      <div class="text-center">
          <q-circular-progress
            :value="progress"
            size="50px"
            color="accent"
            class="q-ma-xl"
            show-value
          /><br />
          {{ statusText }}
        </div>
      </q-step>

      <q-step
        :name="5"
        title="Processing"
        icon="fa fa-gears"
        active-icon="fa fa-gears"
      >
        <div class="q-pa-sm">
          Your media is now processing and will be available immediately when it is done (you'll get an email to let you know when). You can safely close this window.
        </div>
      </q-step>

      <template v-slot:navigation>
        <q-stepper-navigation>
          <q-btn v-if="step < 3" icon="fas fa-arrow-right" flat @click="$refs.stepper.next()" label="Next" :disabled="!next" />
          <q-btn v-if="step === 3"
            icon="fas fa-cloud-arrow-up" flat label="Upload"
            :disabled="!next"
            @click="$refs.stepper.next(); factoryUpload()" >
          </q-btn>
          <q-btn v-if="step === 4" loading disabled flat label="Uploading">
            <template v-slot:loading>
              <q-spinner-hourglass />
            </template>
          </q-btn>
        </q-stepper-navigation>
      </template>
    </q-stepper>
  </div>
  <div v-else>
    <NothingText text="You must be logged in to see this page" />
  </div>
</template>

<script>
import { defineAsyncComponent, ref } from 'vue'
import axios from 'axios'
import { Notify } from 'quasar'

import imageCompression from 'browser-image-compression'

export default {
  name: 'UploadMedia',

  components: {
    ProjectPoster: defineAsyncComponent(() =>
      import('@components/channel/ProjectPoster.vue')
    ),
    MediaPreview: defineAsyncComponent(() =>
      import('@components/channel/MediaPreview.vue')
    ),
    NothingText: defineAsyncComponent(() =>
      import('@components/shared/NothingText.vue')
    )
  },

  created: function() {
    this.$store.cache.dispatch('channel/getChannels').catch(error => { console.log(error) })
  },

  data() {
    return {
      step: ref(1),

      projects: [],

      payload: ref({
        uuid: null,
        coverType: 'profile',
        project: {
          id: null,
          posterType: 'default',
          media: {
            main: true,
            previewType: 'frame'
          }
        }
      }),

      coverFile: ref(null),
      coverThumb: ref(null),
      posterFile: ref(null),
      posterThumb: ref(null),
      previewFile: ref(null),
      previewThumb: ref(null),
      previewThumbRandom: ref(null),
      mediaFile: ref(null),

      counter: 0,

      uploadFiles: [],

      progress: -1,
      statusText: ref(null)
    }
  },

  watch: {
    step(s) {
      if (s === 2 && this.payload.uuid.value !== 0) {
        this.$store.cache
          .dispatch('channel/getChannel', this.payload.uuid.value)
          .then(ch => {
            this.projects = ch.projects
          })
      }
    },
    coverFile(file) {
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.coverThumb = e.target.result
        }
        reader.readAsDataURL(file)
      } else {
        this.coverThumb = null
      }
    },
    posterFile(file) {
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.posterThumb = e.target.result
        }
        reader.readAsDataURL(file)
      } else {
        this.posterThumb = null
      }
    },
    previewFile(file) {
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.previewThumb = e.target.result
        }
        reader.readAsDataURL(file)
      } else {
        this.previewThumb = null
      }
    },
    mediaFile(file) {
      if (file) {
        this.payload.project.media.filename = file.name
      } else {
        this.payload.project.media.filename = null
      }
    },
    async previewThumbRandom(url) {
      if (url) {
        try {
          const response = await fetch(url)
          const blob = await response.blob()
          const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' })
          this.handleFile(file, 'preview')
        } catch (err) {
          console.error('Error converting URL to file:', err)
        }
      }
    },
    async previewTypeAndMediaFile(value) {
      if (value.previewType === 'frame' && value.mediaFile) {
        this.previewThumbRandom = await this.getRandomFrame()
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
    project: {
      get() {
        if (!this.payload.project.id || (this.payload.project.id.value === 0 && this.payload.project.posterType === 'new' && !this.posterFile)) {
          return {
            title: this.payload.project.title,
            subtitle: this.payload.project.subtitle,
            poster: null,
            media: []
          }
        } else if (this.payload.project.id && this.payload.project.id.value !== 0) {
          return this.projects.find(p => p.id === this.payload.project.id.value)
        } else if (this.payload.project.id && this.payload.project.id.value === 0 && this.payload.project.posterType === 'default') {
          return {
            title: this.payload.project.title,
            subtitle: this.payload.project.subtitle,
            poster: '/images/poster.png',
            media: []
          }
        } else if (this.payload.project.id && this.payload.project.id.value === 0 && this.payload.project.posterType === 'new') {
          return {
            title: this.payload.project.title,
            subtitle: this.payload.project.subtitle,
            poster: this.posterThumb,
            media: []
          }
        }
        return {}
      }
    },
    media: {
      get() {
        if (this.mediaFile && this.payload.project.media.previewType === 'frame') {
          return {
            title: this.payload.project.media.title,
            description: this.payload.project.media.description,
            main: this.payload.project.media.main,
            preview: this.previewThumbRandom
          }
        } else if (this.previewFile && this.payload.project.media.previewType === 'new') {
          return {
            title: this.payload.project.media.title,
            description: this.payload.project.media.description,
            main: this.payload.project.media.main,
            preview: this.previewThumb
          }
        }
        return {
          title: this.payload.project.media.title,
          description: this.payload.project.media.description,
          main: this.payload.project.media.main
        }
      }
    },
    next: {
      get() {
        switch (this.step) {
          case 1:
            return this.payload.uuid?.value || (this.payload.title && (this.coverFile || this.payload.coverType === 'profile'))
          case 2:
            return this.payload.project.id?.value || (this.payload.project.title && (this.posterFile || this.payload.project.posterType === 'default'))
          case 3:
            return this.payload.project.media.title && this.mediaFile && ((this.payload.project.media.previewType === 'new' && this.previewFile) || (this.payload.project.media.previewType === 'frame' && this.previewThumbRandom))
          default:
            return false
        }
      }
    },
    previewTypeAndMediaFile() {
      return {
        previewType: this.payload.project.media.previewType,
        mediaFile: this.mediaFile,
        counter: this.counter
      }
    }
  },

  methods: {
    factoryUpload() {
      this.progress = 0
      return this.$store.dispatch('channel/postUpload', this.payload).then(async upload => {
        let counter = 1
        const total = upload.length
        let media = null
        for (const u of upload) {
          this.progress = 0
          const file = this.uploadFiles.find(f => f.resourceType === u.resourceType).file
          this.statusText = `Uploading file (${u.resourceType}) ${counter} of ${total}. Do not navigate away from this page!`
          try {
            await axios.put(u.url, file, {
              headers: {
                'Content-Type': file.type
              },
              onUploadProgress: this.onUploadProgress
            })
          } catch (error) {
            console.error(`Error uploading ${u.resourceType}:`, error)
          }
          if (u.resourceType === 'media') {
            media = u.reference
          }
          counter++
        }
        this.$store.dispatch('channel/confirmUpload', media)
        this.$refs.stepper.next()
        return Promise.resolve()
      }).catch(err => {
        console.log(err)
        return Promise.reject(err)
      })
    },
    onUploadProgress(progressEvent) {
      this.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    },
    async handleFile(file, resourceType) {
      if (!file) return
      if (['cover', 'poster', 'preview'].includes(resourceType)) {
        try {
          const options = {
            fileType: 'image/jpeg',
            maxWidthOrHeight: 720,
            useWebWorker: true
          }
          const compressedFile = await imageCompression(file, options)
          const index = this.uploadFiles.findIndex(r => r.resourceType === resourceType)
          if (index !== -1) {
            this.uploadFiles[index].file = compressedFile
          } else {
            this.uploadFiles.push({ resourceType: resourceType, file: compressedFile })
          }
        } catch (error) {
          console.error('Error processing file:', error)
        }
      } else if (resourceType === 'media') {
        const index = this.uploadFiles.findIndex(r => r.resourceType === resourceType)
        if (index !== -1) {
          this.uploadFiles[index].file = file
        } else {
          this.uploadFiles.push({ resourceType: resourceType, file: file })
        }
      }
    },
    async getRandomFrame() {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      video.src = URL.createObjectURL(this.mediaFile)
      video.muted = true
      video.playsInline = true

      // hack for iOS
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise.then(_ => {
          video.pause()
        })
      }
      //
      return new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.currentTime = Math.random() * video.duration
        }
        video.onseeked = () => {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0)
          canvas.toBlob(blob => {
            try {
              const url = URL.createObjectURL(blob)
              resolve(url)
            } catch (e) {
              this.payload.project.media.previewType = 'new'
              Notify.create({
                type: 'negative',
                timeout: 0,
                message: 'Error extracting frames from video.',
                icon: 'fas fa-triangle-exclamation',
                multiLine: false,
                actions: [
                  {
                    label: 'Dismiss',
                    color: 'white'
                  }
                ]
              })
            }
          }, 'image/jpeg')
        }
        video.onerror = (e) => {
          reject(e)
        }
      })
    }
  }
}
</script>
