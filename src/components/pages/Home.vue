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
      <div class="text-caption text-center q-py-md">
        <q-btn flat to="/9944fa03-8a73-4e52-84bc-e8a514bd1271/Sample-Channel" align="left" no-wrap>
          <q-avatar icon="far fa-circle-play" />
          <div class="q-pl-md ellipsis">Sample Channel</div>
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home-Page'
}
</script>
