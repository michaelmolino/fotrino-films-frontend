<template>
  <div style="max-width: 720px">
    <div class="q-pa-xl text-h3 text-center text-uppercase">Hello, World!</div>
    <div class="q-pl-xl text-body1 text-left">
      This website is private and by invitation only. You probably got here by
      accident. If you're looking for something specific, then make sure you
      clicked the correct link.
      <p />
      Problems? creative@michaelmolino.com
    </div>
    <div
      class="q-pl-xl q-pt-md text-body text-left"
      v-for="collection in history"
      :key="collection.uuid"
    >
      <q-btn flat :label="collection.name" :to="collection.uuid" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  components: {},
  data () {
    return {
      history: null
    }
  },
  created: function () {
    // let ls = localStorage.getItem('Collections')
    // if (ls) {
    //   ls = ls.replace(/'/g, '"')
    //   ls = Array.from(JSON.parse(ls))
    // } else {
    //   ls = []
    // }
    // this.history = []
    // for (const i in ls) {
    //   console.log(ls[i])
    //   this.$axios.get('/api/' + ls[i] + '/movies').then((response) => {
    //     this.collection = response.data
    //     this.history.push({ uuid: ls[i], name: response.data.title })
    //   })
    // }
    document.title = 'fotrino-films'
    document
      .querySelector('meta[property="og:title"]')
      .setAttribute('content', 'fotrino-films')
    document
      .querySelector('meta[property="og:image"]')
      .setAttribute('content', null)
  }
}
</script>
