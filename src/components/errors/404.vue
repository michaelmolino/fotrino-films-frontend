<template>
  <div class="fullscreen bg-warning text-black text-center flex flex-center">
    <div>
      <div style="font-size: 30vh">404</div>
      <div class="text-h2" style="opacity: 0.4">Not Found</div>
      <q-btn
        class="q-py-md"
        icon="videocam"
        label="Home"
        flat
        no-caps
        size="lg"
        to="/"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'Error-404'
}
</script>
