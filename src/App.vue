<template>
  <div id="q-app">
    <router-view />
  </div>
</template>
<script>
export default {
  name: 'App',
  created: function () {
    this.$q.dark.set(false)
  }
}
</script>
