<template>
    <div class="q-py-md"><q-icon :name="icon || 'fas fa-circle-info'" class="q-px-sm" />{{ text || 'Nothing to see here.' }}</div>
</template>

<script>
export default {
  name: 'NothingText',

  props: {
    icon: String,
    text: String
  }
}
</script>
