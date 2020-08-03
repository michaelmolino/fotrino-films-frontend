<template>
  <div class="q-pa-xl row" style="text-align: center;">
    <div class="q-pa-sm col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
      <Movie
        shortName="evanora"
        title="Eleonora &amp; Eva"
        subTitle="2019-10-31"
        :movies="evanora"
        color="yellow-8"
      />
    </div>
    <div class="q-pa-sm col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
      <Movie
        shortName="wedding"
        title="Laurina &amp; Michael's Wedding"
        subTitle="2014-08-02"
        :movies="wedding"
        color="pink-7"
      />
    </div>
    <div class="q-pa-sm col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
      <Movie
        shortName="langer"
        title="Langer"
        subTitle="2009-12-25"
        :movies="langer"
        color="blue-10"
      />
    </div>
    <div class="q-pa-sm col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
      <Movie
        shortName="savattieri"
        title="Savattieri &amp; Famularo"
        subTitle="2008-12-25"
        :movies="savattieri"
        color="brown-7"
      />
    </div>
    <div class="q-pa-sm col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
      <Movie
        shortName="molino"
        title="Molino &amp; Liberatore"
        subTitle="2008-09-24"
        :movies="molino"
        color="red-10"
      />
    </div>
  </div>
</template>

<script>
import Movie from '../components/Movie.vue'

export default {
  name: 'Index',
  components: {
    Movie
  },
  data () {
    return {
      evanora: {
        movies: [
          {
            id: 1,
            name: "Eleonora's First Year",
            thumb: 'images/evanora/ch1.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/b3cfca27fb3068734f48b8cc995914ce.mp4',
            type: 'video/mp4'
          },
          {
            id: 2,
            name: 'Eleonora Volume 2 (2018)',
            thumb: 'images/evanora/ch2.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/3084c0020c9e739a6b8d4d5bda331af0.mp4',
            type: 'video/mp4',
            featured: true
          },
          {
            id: 3,
            name: "Eva's First Year",
            thumb: 'images/evanora/ch3.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/ff6cb67e2b28e886f177bfa3a46d5a34.mp4',
            type: 'video/mp4'
          },
          {
            id: 4,
            name: "Eleonora's Ballet & Tap Recital 2020",
            thumb: 'images/evanora/ch4.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/c0c24df5eac8c52eb313f9556512b807.mp4',
            type: 'video/mp4'
          },
          {
            id: 5,
            name: 'Over the Rainbow (Eleonora Spotlight)',
            thumb: 'images/evanora/ch5.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/af4795ab0578905c80c4a34f071992b5.mp4',
            type: 'video/mp4'
          },
          {
            id: 6,
            name: 'Zero to Hero (Eleonora Spotlight)',
            thumb: 'images/evanora/ch6.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/5bd55874384dd6f92118e3e1baeb51b7.mp4',
            type: 'video/mp4'
          }
        ]
      },
      wedding: {
        movies: [
          {
            id: 1,
            name: 'The Wedding',
            thumb: 'images/wedding/ch1.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/2cdef3429b6d07fc62a4502f5eba8815.m4v',
            type: 'video/mp4',
            featured: true
          },
          {
            id: 2,
            name: 'First Dance',
            thumb: 'images/wedding/ch2.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/a3b7059eb52d4cea78d1a615b38a6ef1.mp4',
            type: 'video/mp4'
          },
          {
            id: 3,
            name: 'Baby Montage',
            thumb: 'images/wedding/ch3.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/d50659a208d5ab4ae8bded23d41a6c67.mp4',
            type: 'video/mp4'
          },
          {
            id: 4,
            name: 'Travel Montage',
            thumb: 'images/wedding/ch4.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/c271e3487f6bccb8cd3e2d62025ec2cc.mp4',
            type: 'video/mp4'
          },
          {
            id: 5,
            name: 'Bride/Father Dance',
            thumb: 'images/wedding/ch5.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/5e6725282c6723901be276294d68b72f.mp4',
            type: 'video/mp4'
          },
          {
            id: 6,
            name: 'Bride/Mother Dance',
            thumb: 'images/wedding/ch6.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/41e2d2de5f65a2d2cb64a9d52db5c531.mp4',
            type: 'video/mp4'
          },
          {
            id: 7,
            name: 'Groom/Mother Dance',
            thumb: 'images/wedding/ch7.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/433e7cc4af3bae8ba0f12127de02bf34.mp4',
            type: 'video/mp4'
          },
          {
            id: 8,
            name: 'Best Man Speech',
            thumb: 'images/wedding/ch8.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/433e7cc4af3bae8ba0f12127de02bf34.mp4',
            type: 'video/mp4'
          },
          {
            id: 9,
            name: 'Maid of Honour Speech',
            thumb: 'images/wedding/ch9.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/02d219e9e93afd2442a0ec5ffce9c954.mp4',
            type: 'video/mp4'
          }
        ]
      },
      langer: {
        movies: [
          {
            id: 1,
            name: 'A Langer Story',
            thumb: 'images/langer/ch1.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/0592cc6cc51dbb2222163ce5cfe38c47.m4v',
            type: 'video/mp4'
          }
        ]
      },
      savattieri: {
        movies: [
          {
            id: 1,
            name: 'Our Story - Savattieri & Famularo',
            thumb: 'images/savattieri/ch1.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/accc273d06b59f513af723be9368a2b4.m4v',
            type: 'video/mp4'
          }
        ]
      },
      molino: {
        movies: [
          {
            id: 1,
            name: 'La Storia - Molino & Liberatore',
            thumb: 'images/molino/ch1.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/1f928a207922b8cc873d69d071f36d0d.m4v',
            type: 'video/mp4'
          },
          {
            id: 2,
            name: "Marco's First Year",
            thumb: 'images/molino/ch2.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/387fc62c948b5c80f26b53383a31c6d2.m4v',
            type: 'video/mp4'
          },
          {
            id: 3,
            name: "Matteo's First Year",
            thumb: 'images/molino/ch3.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/310fcbb3c6bc4ae0e88e81acc6d0fe0a.m4v',
            type: 'video/mp4'
          },
          {
            id: 4,
            name: "Michael's Skydiving Supercut",
            thumb: 'images/molino/ch4.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/55bc260565a66c66d3acda76da6a6c42.m4v',
            type: 'video/mp4'
          },
          {
            id: 5,
            name: 'Eftegan - Who Will Save Your Soul',
            thumb: 'images/molino/ch5.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/ec3036a3ad2d07f28c8be9d457a1c3f6.m4v',
            type: 'video/mp4'
          },
          {
            id: 6,
            name: 'Eftegan - Real World',
            thumb: 'images/molino/ch6.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/0899a3e01004c68439f6e46bbdb967e2.mp4',
            type: 'video/mp4'
          },
          {
            id: 7,
            name: 'Michelle - Posession',
            thumb: 'images/molino/ch7.png',
            src:
              'https://s3.wasabisys.com/savattierimolino/movies/a8a3a76333ce202a52e5bd6c04cf2f16.mp4',
            type: 'video/mp4'
          }
        ]
      }
    }
  },
  created () {
    this.$q.dark.set(true)
  }
}
</script>
