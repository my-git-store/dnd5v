<script setup lang="ts">
import { CBtn, CLoaderBlock } from '@/ui/components'
defineProps<{ loading: boolean; error: string | null }>()
const emit = defineEmits<{ retry: [] }>()
</script>
<template>
  <div v-if="loading" class="load-state" role="status" aria-label="Загрузка персонажа"><CLoaderBlock /></div>
  <div v-else-if="error" class="load-state error-state" role="alert"><p>{{ error }}</p><CBtn color-type="primary" @click="emit('retry')">Повторить</CBtn></div>
</template>
