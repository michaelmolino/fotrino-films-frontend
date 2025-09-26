<template>
  <q-layout view="hHh lpR fFf">
    <FotrinoHeader />
    <q-page-container>
      <router-view />
    </q-page-container>
    <FotrinoFooter />
  </q-layout>
</template>

<script>
import FotrinoHeader from '@components/shared/FotrinoHeader.vue'
import FotrinoFooter from '@components/shared/FotrinoFooter.vue'

export default {
  name: 'MainLayout',
  components: { FotrinoHeader, FotrinoFooter }
}
</script>
