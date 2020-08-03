<template>
  <div class="absolute-center" style="max-width: 1023px">
    <q-carousel
      v-model="slide"
      transition-prev="slide-right"
      transition-next="slide-left"
      swipeable
      animated
      control-color="white"
      navigation
      arrows
      infinite
      padding
      :autoplay="3500"
      :class="$q.dark.isActive ? 'bg-accent' : 'bg-secondary text-white'"
    >
      <q-carousel-slide name="free">
        <div class="text-h4 text-center">
          <div>
            <q-icon name="sentiment_satisfied_alt" />
          </div>
          <div>
            Free
          </div>
        </div>
        <div class="text-center">
          <div class="q-py-md">
            This is the best place to get started; you can upload a single video
            (or audio file) up to one minute in length. Some additional product
            restrictions may apply.
          </div>
          <div class="text-italic">
            Fotrino Films is not yet available. This pricing is tentative and
            subject to change.
          </div>
        </div>
      </q-carousel-slide>
      <q-carousel-slide name="friends">
        <div class="text-h4 text-center">
          <div>
            <q-icon name="favorite" />
          </div>
          <div>
            Friends &amp; Family
          </div>
        </div>
        <div class="text-center">
          <div class="q-py-md">
            If you're lucky enough to know someone with a paid account, you can
            get invited to a Friends &amp; Family account. This is totally free
            and let's you upload up to 10 minutes of video (or audio)! Each
            individual video is limited to 3 minutes. Some additional product
            restrictions may apply.
          </div>
          <div class="text-italic">
            Fotrino Films is not yet available. This pricing is tentative and
            subject to change.
          </div>
        </div>
      </q-carousel-slide>
      <q-carousel-slide name="paid">
        <div class="text-h4 text-center">
          <div>
            <q-icon name="sell" />
          </div>
          <div>
            Paid
          </div>
        </div>
        <div class="text-center">
          <div class="q-py-md">
            Best for most people! Organise your photos across unlimited
            collections and movies and upload up to <b>100 hours</b> of video (or
            audio). You can also invite up to 3 people for a free Friends &amp;
            Family account.
          </div>
          <div class="q-pb-md">
            28 day free trial
          </div>
          <div class="q-pb-md">
            $/£/€ 50 per year
          </div>
          <div class="text-italic">
            Fotrino Films is not yet available. This pricing is tentative and
            subject to change.
          </div>
        </div>
      </q-carousel-slide>
    </q-carousel>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'Pricing',
  data () {
    return {
      slide: ref('free')
    }
  }
}
</script>
