<template>
  <router-view />
</template>
<script>
export default {
  name: 'App',
  created: function () {
    this.$q.dark.set(false)
  }
}
</script>
