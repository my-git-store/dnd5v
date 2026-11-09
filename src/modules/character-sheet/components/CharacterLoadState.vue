<script setup lang="ts">
defineProps<{ loading: boolean; error: string | null }>();
const emit = defineEmits<{ retry: [] }>();
</script>
<template>
  <div v-if="loading" class="load-state" role="status" aria-label="Загрузка персонажа">
    <div class="load-state-spinner"><NSpin size="large" /></div>
  </div>
  <div v-else-if="error" class="load-state error-state" role="alert">
    <p>{{ error }}</p>
    <NButton type="primary" @click="emit('retry')">Повторить</NButton>
  </div>
</template>
