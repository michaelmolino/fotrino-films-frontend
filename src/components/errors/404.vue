<template>
  <div class="fullscreen bg-warning text-black text-center flex flex-center">
    <div>
      <div class="text-h1">404</div>
      <div class="text-h2">Not Found</div>
      <q-btn
        class="q-py-md"
        icon="fas fa-house"
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
