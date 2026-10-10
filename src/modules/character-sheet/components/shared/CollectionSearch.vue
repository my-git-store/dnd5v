<script setup lang="ts">
import { CBtn, CInput } from '@/ui/components'

defineProps<{ label: string; query: string }>()
const emit = defineEmits<{ 'update:query': [value: string] }>()
</script>

<template>
  <div class="collection-search">
    <CInput :label="label" type="search" :model-value="query" @update:model-value="emit('update:query', String($event ?? ''))" />
    <CBtn :disabled="!query" @click="emit('update:query', '')">Сбросить</CBtn>
  </div>
</template>
