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
            {value: 'movies', slot: 'movie'},
            {value: 'main', slot: 'main'},
            {value: 'all', slot: 'all'}
        ]"
        >
        <template v-slot:movie>
            <div class="row items-center no-wrap">
            <div class="text-center">
                Movie Groups &nbsp;
            </div>
            <q-avatar color="accent" text-color="white" size="sm" square>{{ movieCount }}</q-avatar>
            </div>
        </template>
        <template v-slot:main>
            <div class="row items-center no-wrap">
            <div class="text-center">
                Featured Media &nbsp;
            </div>
            <q-avatar color="accent" text-color="white" size="sm" square>{{ mainCount }}</q-avatar>
            </div>
        </template>
        <template v-slot:all>
            <div class="row items-center no-wrap">
            <div class="text-center">
                All Media &nbsp;
            </div>
            <q-avatar color="accent" text-color="white" size="sm" square>{{ allCount }}</q-avatar>
            </div>
        </template>
        </q-btn-toggle>
</template>

<script>

export default {
  name: 'ViewToggle',

  props: {
    selectedView: String,
    movieCount: Number,
    mainCount: Number,
    allCount: Number
  }

}
</script>
