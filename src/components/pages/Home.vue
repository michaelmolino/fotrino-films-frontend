<template>
  <div class="q-pa-md absolute-center">
    <div class="text-h4 text-right">
      <div>
        <span :class="$q.dark.isActive ? 'text-white' : 'text-secondary'">
          Fotrino
        </span>
        <span class="text-accent">Films</span>
      </div>
      <div>
        <span :class="$q.dark.isActive ? 'text-white' : 'text-secondary'">
          The
        </span>
        <span class="text-accent">Transparent</span>
        <span :class="$q.dark.isActive ? 'text-white' : 'text-secondary'">
          Video Host
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home-Page'
}
</script>
