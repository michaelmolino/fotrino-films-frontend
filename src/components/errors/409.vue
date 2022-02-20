<template>
  <div class="fullscreen bg-warning text-black text-center flex flex-center">
    <div>
      <div style="font-size: 30vh">409</div>
      <div class="text-h2" style="opacity: 0.4">Conflict</div>
      <div class="q-py-md text-justify" style="font-size: large">
        This error usually means that you are trying to login using an email
        address that we recognise, but using a different identity provider. For
        example, this can happen if you first logged in with Facebook and are
        now trying to log in with Google. Please try logging in again using the
        same identity provider you used when you created your account.
      </div>
      <q-btn icon="videocam" label="Home" flat no-caps size="lg" to="/" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'Error-409'
}
</script>
