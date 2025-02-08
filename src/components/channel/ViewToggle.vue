<template>
    <q-btn-toggle
        :v-model="selectedView"
        class="q-py-md"
        no-caps
        rounded
        unelevated
        toggle-color="primary"
        color="white"
        text-color="primary"
        :options="[
            {value: 'projects', slot: 'project'},
            {value: 'main', slot: 'main'},
            {value: 'all', slot: 'all'}
        ]"
        >
        <template v-slot:project>
            <div class="row items-center no-wrap">
            <div class="text-center">
                Projects
            </div>
            <q-avatar color="accent" text-color="white" size="sm" square class="q-ml-sm">{{ projectCount }}</q-avatar>
            </div>
        </template>
        <template v-slot:main>
            <div class="row items-center no-wrap">
            <div class="text-center">
                Featured Media
            </div>
            <q-avatar color="accent" text-color="white" size="sm" square class="q-ml-sm">{{ mainCount }}</q-avatar>
            </div>
        </template>
        <template v-slot:all>
            <div class="row items-center no-wrap">
            <div class="text-center">
                All Media
            </div>
            <q-avatar color="accent" text-color="white" size="sm" square class="q-ml-sm">{{ allCount }}</q-avatar>
            </div>
        </template>
        </q-btn-toggle>
</template>

<script>

export default {
  name: 'ViewToggle',

  props: {
    selectedView: String,
    projectCount: Number,
    mainCount: Number,
    allCount: Number
  }

}
</script>
