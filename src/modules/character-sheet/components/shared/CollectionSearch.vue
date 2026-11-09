<script setup lang="ts">
defineProps<{ label: string; query: string }>();
const emit = defineEmits<{ "update:query": [value: string] }>();
</script>

<template>
  <div class="collection-search">
    <NFormItem :label="label"
      ><NInput :value="query" @update:value="emit('update:query', String($event ?? ''))"
    /></NFormItem>
    <NButton :disabled="!query" @click="emit('update:query', '')">Сбросить</NButton>
  </div>
</template>
