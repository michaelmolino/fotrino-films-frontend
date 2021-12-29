<template>
  <q-breadcrumbs class="q-ml-md q-mt-lg q-mb-xs text-h6">
    <template v-slot:separator>
      <q-icon size="1.5em" name="chevron_right" color="primary" />
    </template>
    <q-breadcrumbs-el
      v-for="location in breadcrumbs"
      :key="location.id"
      :label="location.label"
      :to="location.to"
    />
  </q-breadcrumbs>
</template>

<script>
export default {
  name: 'BreadCrumbs',
  props: {
    breadcrumbs: Array
  }
}
</script>
